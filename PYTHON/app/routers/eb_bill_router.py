import os
from typing import List, Dict, Any, Optional
from uuid import uuid4
import shutil
from app.utils.auth_utils import get_current_user
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.database import DB_NAME, DB_NAME_WINDMILL, get_connection
import pdfplumber
import re
import tempfile
from app.schemas.eb_bill_schema import EBBillResponse, BulkSaveRequest
from app.utils.validation import validate_customer, validate_service_number

router = APIRouter(
    prefix="/eb-bill",
    tags=["EB Bill"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "eb_bills")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ✅ UNIVERSAL OA extractor (table + fallback text parsing)
def extract_abstract_rows(pdf):

    windmill_map: dict[str, list[str]] = {}
    columns: list[str] = []
    inside_abstract = False

    for page in pdf.pages:

        text = page.extract_text() or ""
        lines = text.split("\n")

        # Start Abstract section
        if "Abstract for OA Adjustment Charges" in text:
            inside_abstract = True

        # Stop at LT section
        if inside_abstract and "LT Side Metering" in text:
            break

        if not inside_abstract:
            continue

        # -----------------------
        # 1️⃣ Try table extraction first
        # -----------------------
        tables = page.extract_tables() or []

        for table in tables:

            if not table:
                continue

            # 🔵 MERGE STACKED HEADER ROWS (first 3 rows)
            merged = []
            for col_idx in range(len(table[0])):
                parts = []
                for r in table[:3]:
                    if col_idx < len(r) and r[col_idx]:
                        parts.append(str(r[col_idx]).strip())
                merged.append(" ".join(parts))

            first_row = [re.sub(r"\s+", " ", c) for c in merged]
            row_text = " ".join(first_row).upper()

            # Track whether this table is a continuation block
            is_continuation = False
            continuation_offset = 0   # index into existing[] where new cols start
            n_new_cols = 0

            # Detect main OA header
            if not columns and ("C001" in row_text or "C002" in row_text):

                new_cols = []
                for cell in first_row[1:]:
                    if "C00" in cell:
                        cleaned = re.sub(r"\s*\d[\d,\.]*$", "", cell).strip()
                        new_cols.append(cleaned)

                if not columns:
                    columns.append("CHARGES")

                columns.extend(new_cols)
                data_rows = table[3:]  # skip stacked header rows

            # Detect DSM/WHLC continuation table
            elif columns and ("DSM" in row_text or "WHLC" in row_text):

                new_cols = []
                for cell in first_row[1:]:
                    cell = re.sub(r"\s+", " ", cell)
                    cell = re.sub(r"\s*\d[\d,\.]*$", "", cell).strip()
                    if cell and cell not in columns:
                        new_cols.append(cell)

                if new_cols:
                    # First time: brand-new continuation columns
                    orig_len = len(columns)
                    columns.extend(new_cols)
                    for k in windmill_map:
                        windmill_map[k].extend(["0.00"] * len(new_cols))
                    is_continuation = True
                    continuation_offset = orig_len - 1
                    n_new_cols = len(new_cols)
                else:
                    # Repeated continuation table (same header, different batch of windmills)
                    # Identify which known columns appear in this table's header
                    cont_col_names = []
                    for cell in first_row[1:]:
                        cell = re.sub(r"\s+", " ", cell)
                        cell = re.sub(r"\s*\d[\d,\.]*$", "", cell).strip()
                        if cell and cell in columns:
                            cont_col_names.append(cell)
                    if cont_col_names:
                        # existing[i] == columns[i+1], so offset = col_index - 1
                        first_col_pos = columns.index(cont_col_names[0])
                        is_continuation = True
                        continuation_offset = first_col_pos - 1
                        n_new_cols = len(cont_col_names)

                data_rows = table[1:]

            else:
                data_rows = table

            # Extract rows from table
            for row in data_rows:

                if not row or not row[0]:
                    continue

                # Extract numeric part from windmill cell
                windmill_raw = str(row[0]).strip()
                windmill = re.sub(r"\D", "", windmill_raw)
                if not windmill or not windmill.isdigit():
                    continue

                if is_continuation:
                    # ✅ FIXED: map continuation row values to the correct tail positions
                    # row[j+1] → existing[continuation_offset + j]
                    if windmill in windmill_map:
                        existing = windmill_map[windmill]
                        for j in range(n_new_cols):
                            row_idx = j + 1
                            target_idx = continuation_offset + j
                            val = "0.00"
                            if row_idx < len(row) and row[row_idx] is not None:
                                v = str(row[row_idx]).replace(",", "").strip()
                                if re.match(r"^-?\d+(\.\d+)?$", v):
                                    val = v
                            if target_idx < len(existing) and existing[target_idx] == "0.00":
                                existing[target_idx] = val
                    else:
                        # Windmill appears only in continuation table — initialise full row
                        full_vals = ["0.00"] * (len(columns) - 1)
                        for j in range(n_new_cols):
                            row_idx = j + 1
                            target_idx = continuation_offset + j
                            if row_idx < len(row) and row[row_idx] is not None:
                                v = str(row[row_idx]).replace(",", "").strip()
                                if re.match(r"^-?\d+(\.\d+)?$", v):
                                    if target_idx < len(full_vals):
                                        full_vals[target_idx] = v
                        windmill_map[windmill] = full_vals
                else:
                    # Normal main-table row: values map 1-to-1 with columns[1:]
                    values = []
                    for i in range(1, len(columns)):
                        if i < len(row) and row[i] is not None:
                            val = str(row[i]).replace(",", "").strip()
                            if re.match(r"^-?\d+(\.\d+)?$", val):
                                values.append(val)
                            else:
                                values.append("0.00")
                        else:
                            values.append("0.00")

                    if windmill in windmill_map:
                        existing = windmill_map[windmill]
                        for idx, v in enumerate(values):
                            if idx < len(existing):
                                if existing[idx] == "0.00":
                                    existing[idx] = v
                            else:
                                existing.append(v)
                    else:
                        windmill_map[windmill] = values

        # -----------------------
        # 2️⃣ FALLBACK: text parsing
        # -----------------------
        if inside_abstract and not columns:

            for idx, line in enumerate(lines):

                parts = line.strip().split()
                if not parts:
                    continue

                if re.fullmatch(r"\d{10,12}", parts[0]):

                    windmill = parts[0]

                    nums = []
                    nums.extend(re.findall(r"\d+\.\d+", line))

                    if not nums and idx + 1 < len(lines):
                        nums.extend(re.findall(r"\d+\.\d+", lines[idx+1]))

                    if nums:
                        windmill_map[windmill] = nums

                        if not columns:
                            columns = ["CHARGES"] + [f"Charge_{i+1}" for i in range(len(nums))]

    # final cleanup: ensure no column header retains stray numeric values
    columns = [re.sub(r"\s*\d[\d,\.]*$", "", c).strip() for c in columns]

    rows = [{"windmill": k, "charges": v} for k, v in windmill_map.items()]
    return rows, columns


@router.get("/list")
async def get_eb_bill_list(
    customer_id: Optional[int] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    user: dict = Depends(get_current_user)
):
    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()
    try:
        cursor.callproc("get_eb_bill_list", [customer_id, year, month])
        rows = cursor.fetchall()

        data = []
        for row in rows:
            data.append({
                "id": row[0],
                "bill_month": row[1],
                "customer_id": row[2],
                "customer_name": row[3]
            })
        return {"status": "success", "data": data}
    finally:
        cursor.close()
        conn.close()


@router.get("/view/{id}")
async def view_eb_bill(id: int, user: dict = Depends(get_current_user)):
    print(f"DEBUG: View request for EB Bill ID: {id}")
    try:
        conn = get_connection(db_name=DB_NAME_WINDMILL)
        cursor = conn.cursor()
        try:
            # 1. Fetch main header info
            cursor.callproc("get_eb_bill_header", [id])
            header = cursor.fetchone()
            if not header:
                print(f"DEBUG: EB Bill {id} not found")
                raise HTTPException(status_code=404, detail="EB Bill not found")

            # Consume results to allow next SP call
            while cursor.nextset():
                pass

            # 2. Fetch self generation tax from details
            cursor.callproc("get_eb_bill_details", [id])
            details = cursor.fetchone()
            tax = str(details[3]) if details else "0.00"

            while cursor.nextset():
                pass

            # 3. Fetch adjustment charges
            cursor.callproc("get_eb_bill_adjustment_charges", [id])
            charge_rows = cursor.fetchall()

            # Build matched_rows
            columns = ["CHARGES", "C001- AMR Meter Reading Charges", "C002- O&M Charges", "C003- Transmission Charges", 
                    "C004- System Operation Charges", "C005- RKvah Penalty", "C006", "C007", "C008", "C010", "Wheeling Charges"]
            
            matched_rows = []
            for row in charge_rows:
                charges = [
                    "0.00", 
                    str(row[3]), str(row[4]), str(row[5]), str(row[6]), str(row[7]),
                    str(row[8]), str(row[9]), str(row[10]), str(row[11]), str(row[12])
                ]
                matched_rows.append({
                    "windmill": row[2],
                    "charges": charges
                })

            return {
                "header_id": header[0],
                "customer_id": header[5],
                "service_number_id": header[6],
                "customer_name": header[3],
                "service_number": header[4],
                "self_generation_tax": tax,
                "columns": columns,
                "matched_rows": matched_rows
            }
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        import traceback
        print(f"ERROR: View EB Bill failed: {str(e)}")
        traceback.print_exc()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
        
@router.get("/customers")
async def get_customers(user: dict = Depends(get_current_user)):
    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()

    try:
        cursor.callproc("get_eb_bill_customers")
        rows = cursor.fetchall()

        data = [
            {
                "id": row[0],
                "customer_name": row[1]
            }
            for row in rows
        ]

        return {"status": "success", "data": data}

    finally:
        cursor.close()
        conn.close()

@router.get("/service-numbers/{customer_id}")
async def get_service_numbers(customer_id: int, user: dict = Depends(get_current_user)):

    from app.database import get_connection

    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()

    try:
        cursor.callproc("get_eb_bill_service_number", [customer_id])
        rows = cursor.fetchall()

        data = []

        for row in rows:
            data.append({
                "id": row[0],
                "service_number": row[1]
            })

        return {
            "status": "success",
            "data": data
        }

    finally:
        cursor.close()
        conn.close()


@router.post("/seed")
async def seed_eb_bill_master_data(user: dict = Depends(get_current_user)):
    """Seed minimal master data for customer + service number when SQL access is problematic."""
    print("Seeding EB Bill master data...")
    # Allow seeding even if auth header is missing as part of initial setup.
    if user is None:
        user = {"id": 0, "username": "seed"}

    conn = get_connection(db_name=DB_NAME)
    cursor = conn.cursor()

    try:
        # ensure customer exists in masters.master_customers
        customer_name = "Texmo"
        cursor.execute(
            "SELECT id FROM masters.master_customers WHERE customer_name=%s AND status='1' LIMIT 1",
            (customer_name,)
        )
        existing = cursor.fetchone()

        if existing:
            customer_id = existing[0]
            print(f"Found existing customer: {customer_name} (ID: {customer_id})")
        else:
            cursor.execute(
                "INSERT INTO masters.master_customers (customer_name, status, created_at, created_by, modified_at, modified_by) VALUES (%s, '1', NOW(), %s, NOW(), %s)",
                (customer_name, user.get("id", 0), user.get("id", 0))
            )
            customer_id = cursor.lastrowid
            print(f"Created new customer: {customer_name} (ID: {customer_id})")

        # ensure service entry exists in masters.customer_service
        service_number = "SE1001"
        cursor.execute(
            "SELECT id FROM masters.customer_service WHERE customer_id=%s AND service_number=%s AND status='1' LIMIT 1",
            (customer_id, service_number)
        )
        existing_service = cursor.fetchone()

        if existing_service:
            service_id = existing_service[0]
            print(f"Found existing service number: {service_number} (ID: {service_id})")
        else:
            cursor.execute(
                "INSERT INTO masters.customer_service (customer_id, service_number, status, created_at, created_by, modified_at, modified_by) VALUES (%s, %s, '1', NOW(), %s, NOW(), %s)",
                (customer_id, service_number, user.get("id", 0), user.get("id", 0))
            )
            service_id = cursor.lastrowid
            print(f"Created new service number: {service_number} (ID: {service_id})")

        conn.commit()
        print("Seed successful.")

        return {
            "status": "success",
            "data": {
                "customer_id": customer_id,
                "customer_name": customer_name,
                "service_id": service_id,
                "service_number": service_number
            }
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Seed failed: {e}")

    finally:
        cursor.close()
        conn.close()
        

@router.post("/details")
async def create_eb_bill_detail(
    eb_bill_header_id: int,
    customer_id: int,
    customer_service_id: int,
    self_generation_tax: float,
    user: dict = Depends(get_current_user)
):
    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()

    try:
        cursor.callproc(
            "insert_eb_bill_detail",
            [
                eb_bill_header_id,
                customer_id,
                customer_service_id,
                self_generation_tax,
                user.get("id"),
                user.get("id")
            ]
        )
        conn.commit()

        new_id = cursor.fetchone()[0] if cursor.rowcount != -1 else None

        return {"status": "success", "inserted_id": new_id}

    finally:
        cursor.close()
        conn.close()


@router.post("/adjustment-charges")
async def create_eb_bill_adjustment_charge(
    eb_bill_header_id: int,
    energy_number: str,
    c001: float = 0,
    c002: float = 0,
    c003: float = 0,
    c004: float = 0,
    c005: float = 0,
    c006: float = 0,
    c007: float = 0,
    c008: float = 0,
    c010: float = 0,
    wheeling_charges: float = 0,
    user: dict = Depends(get_current_user)
):
    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()

    try:
        cursor.callproc(
            "insert_eb_bill_adjustment_charge",
            [
                eb_bill_header_id,
                energy_number,
                c001,
                c002,
                c003,
                c004,
                c005,
                c006,
                c007,
                c008,
                c010,
                wheeling_charges,
                user.get("id"),
                user.get("id")
            ]
        )
        conn.commit()

        new_id = cursor.fetchone()[0] if cursor.rowcount != -1 else None

        return {"status": "success", "inserted_id": new_id}

    finally:
        cursor.close()
        conn.close()


@router.post("/save-all")
async def save_all_eb_bill_details(
    payload: BulkSaveRequest,
    user: dict = Depends(get_current_user)
):
    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()

    try:
        header_id = payload.header_id
        columns = payload.columns
        rows = payload.matched_rows
        cust_id = payload.customer_id
        sc_id = payload.service_number_id
        tax = 0.0
        try:
            tax = float(str(payload.self_generation_tax).replace(",", "").strip()) if payload.self_generation_tax else 0.0
        except:
            pass

        # 1. Clear existing adjustment charges and details for this header to prevent duplicates
        cursor.callproc("clear_eb_bill_details", [header_id])
        # Clear result
        while cursor.nextset():
            pass

        # 2. Insert into eb_bill_details
        if cust_id and sc_id:
            cursor.callproc(
                "insert_eb_bill_detail",
                [
                    header_id,
                    cust_id,
                    sc_id,
                    tax,
                    user.get("id"),
                    user.get("id")
                ]
            )
            # Clear result
            cursor.fetchall()
            while cursor.nextset():
                pass

        # 2. Map columns to parameter names
        # columns example: ["CHARGES", "C001- AMR", "C002- O&M", ...]
        # We look for "C001", "C002", etc. in the column name string
        col_to_param = {}
        for i, col_name in enumerate(columns):
            found_param = None
            col_upper = col_name.upper()
            if "C001" in col_upper: found_param = "c001"
            elif "C002" in col_upper: found_param = "c002"
            elif "C003" in col_upper: found_param = "c003"
            elif "C004" in col_upper: found_param = "c004"
            elif "C005" in col_upper: found_param = "c005"
            elif "C006" in col_upper: found_param = "c006"
            elif "C007" in col_upper: found_param = "c007"
            elif "C008" in col_upper: found_param = "c008"
            elif "C010" in col_upper: found_param = "c010"
            elif "WHEELING" in col_upper: found_param = "wheeling_charges"
            
            if found_param:
                col_to_param[i] = found_param

        # 3. Insert each row
        for row in rows:
            params = {
                "eb_bill_header_id": header_id,
                "energy_number": row.windmill,
                "c001": 0, "c002": 0, "c003": 0, "c004": 0, "c005": 0,
                "c006": 0, "c007": 0, "c008": 0, "c010": 0, "wheeling_charges": 0
            }

            for i, val in enumerate(row.charges):
                param_name = col_to_param.get(i)
                if param_name:
                    try:
                        # Clean numeric value (remove commas)
                        clean_val = str(val).replace(",", "").strip()
                        params[param_name] = float(clean_val) if clean_val else 0
                    except:
                        params[param_name] = 0

            cursor.callproc(
                "insert_eb_bill_adjustment_charge",
                [
                    params["eb_bill_header_id"],
                    params["energy_number"],
                    params["c001"],
                    params["c002"],
                    params["c003"],
                    params["c004"],
                    params["c005"],
                    params["c006"],
                    params["c007"],
                    params["c008"],
                    params["c010"],
                    params["wheeling_charges"],
                    user.get("id"),
                    user.get("id")
                ]
            )
            # Fetch result to clear the buffer for next call
            cursor.fetchall()
            while cursor.nextset():
                pass

        conn.commit()
        return {"status": "success", "message": "All details saved successfully"}

    except Exception as e:
        conn.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.post("/read-pdf", response_model=EBBillResponse)
async def read_pdf(
    customer_id: int = Form(...),
    service_number_id: int = Form(...),
    year: int = Form(...),
    month: int = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF allowed")

        # DB lookup & Validation
        conn = get_connection(db_name=DB_NAME_WINDMILL)
        cursor = conn.cursor()
        
        try:
            validate_customer(cursor, customer_id)
            validate_service_number(cursor, service_number_id)

            # Fetch DB expected values for validation
            cursor.execute("SELECT customer_name FROM masters.master_customers WHERE id=%s", (customer_id,))
            exp_cust_row = cursor.fetchone()
            exp_cust = exp_cust_row[0] if exp_cust_row else ""
            while cursor.nextset(): pass

            cursor.execute("SELECT service_number FROM masters.customer_service WHERE id=%s", (service_number_id,))
            exp_se_row = cursor.fetchone()
            exp_se = exp_se_row[0] if exp_se_row else ""
            while cursor.nextset(): pass

            # Save file to temporary storage for parsing before passing validation
            unique_name = f"{customer_id}_{year}_{month}_{uuid4().hex}.pdf"
            file_path = os.path.join(UPLOAD_DIR, unique_name)
            
            await file.seek(0)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Get active numbers for parsing
            cursor.callproc("get_active_windmill_numbers")
            db_rows = cursor.fetchall()
            db_numbers = {re.sub(r"\D", "", str(r[0])) for r in db_rows}
            while cursor.nextset(): pass

            text_parts = []
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    txt = page.extract_text()
                    if txt:
                        text_parts.append(str(txt))
                full_text = "\n".join(text_parts)
                oa_rows, columns = extract_abstract_rows(pdf)

            # ----------- HEADER EXTRACTION -----------
            customer_name_extracted = None
            service_number_extracted = None
            self_tax = None

            lines = [l.strip() for l in full_text.split("\n") if l.strip()]

            for i, line in enumerate(lines):
                if line.lower().startswith("to:"):
                    val = line.split(":", 1)[1].strip()
                    val = re.split(r"service\s*no", val, flags=re.IGNORECASE)[0].strip()
                    customer_name_extracted = val

                if "service" in line.lower() and "no" in line.lower():
                    m = re.search(r"([0-9]{8,15})", line)
                    if m:
                        service_number_extracted = m.group(1)

                if "self generation tax" in line.lower():
                    m = re.search(r"([0-9,]+\.\d+)", line)
                    if m:
                        self_tax = m.group(1).replace(",", "")
                    else:
                        if i + 1 < len(lines):
                            m = re.search(r"([0-9,]+\.\d+)", lines[i+1])
                            if m:
                                self_tax = m.group(1).replace(",", "")

            # ----------- VALIDATION AGAINST FILTERS -----------
            def norm(s): return re.sub(r"[^a-z0-9]", "", str(s).lower()) if s else ""
            
            if exp_cust and customer_name_extracted:
                if norm(exp_cust) not in norm(customer_name_extracted) and norm(customer_name_extracted) not in norm(exp_cust):
                    if os.path.exists(file_path): os.remove(file_path)
                    raise HTTPException(status_code=400, detail=f"Mismatch: Selected Customer ({exp_cust}) does not match PDF ({customer_name_extracted})")
            
            if exp_se and service_number_extracted:
                if norm(exp_se) != norm(service_number_extracted):
                    if os.path.exists(file_path): os.remove(file_path)
                    raise HTTPException(status_code=400, detail=f"Mismatch: Selected SE Number ({exp_se}) does not match PDF ({service_number_extracted})")
                    
            month_names = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
            if 1 <= month <= 12:
                short_month = month_names[month-1]
                # the pdf sometimes uses full month or short month. 
                if short_month not in full_text.lower():
                    if os.path.exists(file_path): os.remove(file_path)
                    raise HTTPException(status_code=400, detail=f"Mismatch: PDF does not appear to be for Month '{short_month.capitalize()}'")
            if str(year) not in full_text:
                if os.path.exists(file_path): os.remove(file_path)
                raise HTTPException(status_code=400, detail=f"Mismatch: PDF does not appear to be for Year '{year}'")

            # ----------- HEADER UPSERT (Since Validation Passed) -----------
            cursor.callproc("upsert_eb_bill_header", [customer_id, service_number_id, year, month, file_path, user.get("id", 0)])
            upsert_result = cursor.fetchone()
            header_id = upsert_result[0]
            old_path = upsert_result[1]

            if old_path and os.path.exists(old_path) and old_path != file_path:
                try: os.remove(old_path)
                except: pass

            conn.commit()
            while cursor.nextset(): pass

            matched_rows = []
            for r in oa_rows:
                pdf_id = re.sub(r"\D", "", str(r["windmill"]))
                if pdf_id in db_numbers:
                    matched_rows.append(r)

            return {
                "header_id": header_id,
                "customer_name": customer_name_extracted,
                "service_number": service_number_extracted,
                "self_generation_tax": self_tax,
                "columns": columns,
                "matched_rows": matched_rows
            }

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        import traceback
        print(f"READ-PDF ERROR: {str(e)}")
        traceback.print_exc()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
        
        
        
@router.delete("/delete/{id}")
async def delete_eb_bill(id: int, user: dict = Depends(get_current_user)):

    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()
    try:
        cursor.callproc("delete_eb_bill", [id])

        conn.commit()

        return {
            "status": "success",
            "message": "EB Bill deleted successfully"
        }

    finally:
        cursor.close()
        conn.close()