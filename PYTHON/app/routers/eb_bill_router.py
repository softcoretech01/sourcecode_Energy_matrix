from app.utils.auth_utils import get_current_user
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.database import DB_NAME, DB_NAME_WINDMILL, get_connection
import pdfplumber
import re
import tempfile
import os
from app.schemas.eb_bill_schema import EBBillResponse
from app.utils.validation import validate_customer, validate_service_number
router = APIRouter(
    prefix="/eb-bill",
    tags=["EB Bill"]
)

# ✅ UNIVERSAL OA extractor (table + fallback text parsing)
def extract_abstract_rows(pdf):

    windmill_map = {}
    columns = []
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

            # 🔵 NEW: MERGE STACKED HEADER ROWS (first 3 rows)
            merged = []
            for col_idx in range(len(table[0])):
                parts = []
                for r in table[:3]:
                    if col_idx < len(r) and r[col_idx]:
                        parts.append(str(r[col_idx]).strip())
                merged.append(" ".join(parts))

            first_row = [re.sub(r"\s+", " ", c) for c in merged]
            row_text = " ".join(first_row).upper()

            # Detect main OA header
            if not columns and ("C001" in row_text or "C002" in row_text):

                new_cols = []
                for cell in first_row[1:]:
                    if "C00" in cell:
                        # strip any trailing numeric values that may have been merged in
                        cleaned = re.sub(r"\s*\d[\d,\.]*$", "", cell).strip()
                        new_cols.append(cleaned)

                # ensure first column header = CHARGES
                if not columns:
                    columns.append("CHARGES")

                columns.extend(new_cols)
                data_rows = table[3:]  # skip stacked header rows

            # Detect DSM/WHLC continuation table
            elif columns and ("DSM" in row_text or "WHLC" in row_text):

                new_cols = []
                for cell in first_row[1:]:
                    cell = re.sub(r"\s+", " ", cell)
                    # remove trailing numbers from continuation headers as well
                    cell = re.sub(r"\s*\d[\d,\.]*$", "", cell).strip()
                    if cell and cell not in columns:
                        new_cols.append(cell)

                columns.extend(new_cols)
                data_rows = table[1:]

            else:
                data_rows = table

            # Extract rows from table
            for row in data_rows:

                if not row or not row[0]:
                    continue

                windmill = str(row[0]).strip()
                if not windmill.isdigit():
                    continue

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
async def get_windmills(user: dict = Depends(get_current_user)):

    
    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()

    try:
        cursor.callproc("get_eb_bill_list")

        rows = cursor.fetchall()

        data = []

        for row in rows:
            data.append({
                "bill_month": row[0],
                "customer_id": row[1],
                "customer_name": row[2]
            })

        return {
            "status": "success",
            "data": data
        }

    finally:
        cursor.close()
        conn.close()
        
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
        # Call stored procedure
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
        
                
@router.post("/read-pdf", response_model=EBBillResponse)
async def read_pdf(
    customer_id: int = Form(...),
    service_number_id: int = Form(...),
    year: int = Form(...),
    month: int = Form(...),
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF allowed")

    # DB lookup & Validation
    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()
    
    try:
        validate_customer(cursor, customer_id)
        validate_service_number(cursor, service_number_id)

        cursor.execute("CALL sp_get_all_windmill_numbers()")
        db_rows = cursor.fetchall()
        db_numbers = {re.sub(r"\D", "", str(r[0])) for r in db_rows}
    finally:
        cursor.close()
        conn.close()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        full_text = ""

        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                txt = page.extract_text()
                if txt:
                    full_text += "\n" + txt

            oa_rows, columns = extract_abstract_rows(pdf)

        # ----------- HEADER EXTRACTION -----------

        customer_name = None
        service_number = None
        self_tax = None

        lines = [l.strip() for l in full_text.split("\n") if l.strip()]

        for i, line in enumerate(lines):

            if line.lower().startswith("to:"):
                val = line.split(":", 1)[1].strip()
                val = re.split(r"service\s*no", val, flags=re.IGNORECASE)[0].strip()
                customer_name = val

            if "service" in line.lower() and "no" in line.lower():
                m = re.search(r"([0-9]{8,15})", line)
                if m:
                    service_number = m.group(1)

            if "self generation tax" in line.lower():
                m = re.search(r"([0-9,]+\.\d+)", line)
                if m:
                    self_tax = m.group(1).replace(",", "")
                else:
                    if i + 1 < len(lines):
                        m = re.search(r"([0-9,]+\.\d+)", lines[i+1])
                        if m:
                            self_tax = m.group(1).replace(",", "")

        # ----------- DB lookup -----------




        # db_numbers already fetched in validation block above
        matched_rows = []

        for r in oa_rows:
            pdf_id = re.sub(r"\D", "", str(r["windmill"]))
            if pdf_id in db_numbers:
                matched_rows.append(r)




        return {
            "customer_name": customer_name,
            "service_number": service_number,
            "self_generation_tax": self_tax,
            "columns": columns,
            "matched_rows": matched_rows
        }

    finally:
        os.remove(tmp_path)
        
        
        
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