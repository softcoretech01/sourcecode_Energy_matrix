from app.utils.auth_utils import get_current_user
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import Optional, Any
import os
import shutil
from uuid import uuid4
from app.schemas.eb_statement_schema import EBStatementUploadResponse, EBStatementSaveRequest
from app.utils.validation import validate_windmill
from app.database import get_connection, DB_NAME_WINDMILL
import pdfplumber
import re

router = APIRouter(prefix="/eb", tags=["EB Statements"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "eb_statements")

os.makedirs(UPLOAD_DIR, exist_ok=True)

def extract_eb_statement_data(pdf_path, expected_windmill_no):
    data = {
        "company_name": None,
        "windmill_number": None,
        "slots": {"C1": "0", "C2": "0", "C4": "0", "C5": "0"},
        "banking_slots": {"C1": "0", "C2": "0", "C4": "0", "C5": "0"},
        "banking_units": "0",
        "charges": []
    }

    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            full_text += (page.extract_text() or "") + "\n"

        # 1. Company Name (Handles "Generation Date" being on the same line)
        m_company = re.search(r"Company Name\s+(.+?)(?=\s+Generation Date|$)", full_text, re.IGNORECASE)
        if m_company:
            data["company_name"] = m_company.group(1).strip()

        # 2. Windmill/Service No
        m_wm = re.search(r"Service Number/isRec\s+([\d]+)", full_text, re.IGNORECASE)
        if not m_wm:
            m_wm = re.search(r"Service Number\s*[:]*\s*([\d]+)", full_text, re.IGNORECASE)
        
        if m_wm:
            data["windmill_number"] = m_wm.group(1).strip()
        else:
            m_alt = re.search(r"(\d{12})", full_text)
            if m_alt:
                data["windmill_number"] = m_alt.group(1)

        # 3. Net Units (Slot-wise) - Target the "Net Units" summary line
        # Using a more flexible regex to handle spacing and optional colons
        m_nets = re.search(r"Net Units\s+C1[:\s]+([\d.]+)\s+C2[:\s]+([\d.]+)\s+C3[:\s]+([\d.]+)\s+C4[:\s]+([\d.]+)\s+C5[:\s]+([\d.]+)", full_text, re.IGNORECASE)
        if m_nets:
            data["slots"]["C1"] = m_nets.group(1)
            data["slots"]["C2"] = m_nets.group(2)
            # C3 is intentionally ignored as per request
            data["slots"]["C4"] = m_nets.group(4)
            data["slots"]["C5"] = m_nets.group(5)
        else:
            # Fallback: Try to find slot values anywhere if the specific line format differs
            for slot in ["C1", "C2", "C4", "C5"]:
                pat = rf"{slot}[:\s]+([\d.]+)"
                # Search for the one specifically under "Net Units" context if possible, 
                # but if the line regex failed, we search the whole text for the last occurence 
                # which is usually the summary.
                matches = re.findall(pat, full_text, re.IGNORECASE)
                if matches:
                    data["slots"][slot] = matches[-1]

        # 4. Banking Units (Slot-wise & Total)
        m_bank_slots = re.search(r"Banking Units\s+C1[:\s]+([\d.]+)\s+C2[:\s]+([\d.]+)\s+C3[:\s]+([\d.]+)\s+C4[:\s]+([\d.]+)\s+C5[:\s]+([\d.]+)", full_text, re.IGNORECASE)
        if m_bank_slots:
            data["banking_slots"]["C1"] = m_bank_slots.group(1)
            data["banking_slots"]["C2"] = m_bank_slots.group(2)
            # C3 captured but we'll remove it from display
            data["banking_slots"]["C4"] = m_bank_slots.group(4)
            data["banking_slots"]["C5"] = m_bank_slots.group(5)

        m_bank_total = re.search(r"Total\s*Banking\s*Units\s*[:\s]+([\d,.]+)", full_text, re.IGNORECASE)
        if m_bank_total:
            data["banking_units"] = m_bank_total.group(1).replace(",", "")

        # 5. Applicable Charges Table
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2: continue
                # Look for table with "Charge Code" / "Charge Description" / "Total Charges"
                header_row = [str(c or "").lower() for c in table[0]]
                if "charge description" in header_row and "total charges" in header_row:
                    idx_desc = header_row.index("charge description")
                    idx_total = header_row.index("total charges")
                    idx_code = header_row.index("charge code") if "charge code" in header_row else None

                    for row in table[1:]:
                        if not row or len(row) <= max(idx_desc, idx_total):
                            continue

                        desc = str(row[idx_desc] or "").strip()
                        amount = str(row[idx_total] or "").strip().replace(",", "")
                        code = None
                        if idx_code is not None and len(row) > idx_code:
                            code = str(row[idx_code] or "").strip()

                        # Only add if it looks like a valid charge (has a name and a numeric amount)
                        # Supports decimals in amount
                        if desc and amount.replace(".", "").isdigit():
                            charge_item = {
                                "name": desc,
                                "amount": amount,
                            }
                            if code:
                                charge_item["code"] = code
                            data["charges"].append(charge_item)


    # Validation
    if data["windmill_number"] and expected_windmill_no:
        pdf_wm = re.sub(r"\D", "", str(data["windmill_number"]))
        expected_wm = re.sub(r"\D", "", str(expected_windmill_no))
        # Sometimes PDF has a slash or prefix, we compare only digits
        if pdf_wm != expected_wm:
            # We check if one contains the other (e.g. 12 digits vs 10 digits)
            if pdf_wm not in expected_wm and expected_wm not in pdf_wm:
                raise Exception(f"Windmill No mismatch! PDF has {data['windmill_number']}, but you selected {expected_windmill_no}")
    
    return data


@router.post("/upload", response_model=EBStatementUploadResponse)
async def upload_eb_statement(
    windmill_id: int = Form(...),
    year: int = Form(...),
    month: str = Form(...),
    file: UploadFile = File(...)
):

    filename = getattr(file, "filename", "") or ""
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()

    try:
        # Validate windmill
        validate_windmill(cursor, windmill_id)

        # Get Windmill Number for validation before saving
        cursor.execute("SELECT windmill_number FROM masters.master_windmill WHERE id=%s", (windmill_id,))
        wm_row = cursor.fetchone()
        expected_wm_no = wm_row[0] if wm_row else ""

        # Create unique filename
        unique_name = f"{windmill_id}_{month}_{uuid4().hex}.pdf"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        # Save PDF
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Parse PDF Data
        try:
            parsed_data = extract_eb_statement_data(file_path, expected_wm_no)
        except Exception as pe:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=400, detail=str(pe))

        # Call Stored Procedure
        cursor.callproc(
            "sp_insert_eb_statement",
            (
                windmill_id,
                year,
                month,
                file_path
            )
        )

        conn.commit()

        return {
            "message": "EB Statement uploaded successfully",
            "filename": unique_name,
            "parsed_data": parsed_data,
            "header_id": cursor.lastrowid # This might not be accurate if SP doesn't return it easily, but let's check
        }

    except Exception as e:
        print(f"Error in upload_eb_statement: {e}")
        if not isinstance(e, HTTPException):
            raise HTTPException(status_code=500, detail=str(e))
        raise e
    finally:
        cursor.close()
        conn.close()
    
@router.get("/list")
async def get_eb_statement_list(
    windmill_number: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[str] = None,
    keyword: Optional[str] = None
):
    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()

    try:
        # Standardize "all" to None for SP
        p_wm = None if not windmill_number or windmill_number == "all" else windmill_number
        p_yr = None if not year or year == "all" else year # handled by type hint too
        p_mo = None if not month or month == "all" else month
        p_kw = None if not keyword else keyword

        cursor.callproc("get_eb_statement_list", (p_wm, p_yr, p_mo, p_kw))
        result = cursor.fetchall()

        data = []
        for row in result:
            data.append({
                "id": row[0],
                "month": row[1],
                "year": row[2],
                "windmill_number": row[3],
                "pdf": row[4],
                "is_submitted": row[5]
            })

        return {
            "status": "success",
            "data": data
        }

    finally:
        cursor.close()
        conn.close()


@router.get("/read-metadata")
async def read_eb_statement_metadata(filename: str, user: dict = Depends(get_current_user)):
    # Validate filename to prevent path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        # Extract windmill_id from filename (format: {windmill_id}_{month}_{uuid}.pdf)
        parts = filename.split("_")
        windmill_id = int(parts[0])

        conn = get_connection(db_name=DB_NAME_WINDMILL)
        cursor = conn.cursor()
        cursor.execute("SELECT windmill_number FROM masters.master_windmill WHERE id=%s", (windmill_id,))
        wm_row = cursor.fetchone()
        expected_wm_no = wm_row[0] if wm_row else ""

        # Get header ID from db
        cursor.execute("SELECT id FROM windmill.eb_statements WHERE pdf_file_path LIKE %s", (f"%{filename}%",))
        h_row = cursor.fetchone()
        header_id = h_row[0] if h_row else None

        parsed_data = extract_eb_statement_data(file_path, expected_wm_no)
        return {
            "status": "success",
            "data": parsed_data,
            "header_id": header_id
        }
    except Exception as e:
        print(f"Error in read_eb_statement_metadata: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/windmills")
async def get_windmills(user: dict = Depends(get_current_user)):

    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()

    try:
        # Filter by type = 'windmill' to show only windmill type records
        cursor.execute("SELECT id, windmill_number FROM masters.master_windmill WHERE type = 'windmill' ORDER BY windmill_number")

        rows = cursor.fetchall()

        data = []

        for row in rows:
            data.append({
                "id": row[0],
                "windmill_number": row[1]
            })

        return {
            "status": "success",
            "data": data
        }

    finally:
        cursor.close()
        conn.close()
        
@router.delete("/delete/{id}")
async def delete_eb_statement(id: int, user: dict = Depends(get_current_user)):

    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()

    try:
        # get pdf path before deleting
        cursor.execute(
            "SELECT pdf_file_path FROM windmill.eb_statements WHERE id=%s",
            (id,)
        )

        row = cursor.fetchone()
        if not row:
            print(f"Delete failed: Record {id} not found in windmill.eb_statements")
            return {"status": "error", "message": "Record not found"}

        pdf_path = row[0]

        # call stored procedure
        print(f"Calling delete_eb_statement for id={id}")
        cursor.callproc("delete_eb_statement", (id,))
        conn.commit()

        # delete file from folder
        if pdf_path and os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
                print(f"Deleted file: {pdf_path}")
            except Exception as fe:
                print(f"Warning: Could not delete physical file {pdf_path}: {fe}")

        return {
            "status": "success",
            "message": "EB Statement deleted successfully"
        }
    except Exception as e:
        print(f"Error in delete_eb_statement: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        cursor.close()
        conn.close()

@router.get("/{id}")
async def get_eb_statement(id: int, user: dict = Depends(get_current_user)):
    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, month, windmill_id, pdf_file_path, is_submitted FROM windmill.eb_statements WHERE id=%s",
            (id,)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="EB Statement not found")
        
        return {
            "status": "success",
            "data": {
                "id": row[0],
                "month": row[1],
                "windmill_id": row[2],
                "pdf": row[3],
                "is_submitted": row[4]
            }
        }
    finally:
        cursor.close()
        conn.close()

@router.put("/update/{id}")
async def update_eb_statement(
    id: int,
    windmill_id: int = Form(...),
    month: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()
    try:
        # Get existing file path
        cursor.execute("SELECT pdf_file_path FROM windmill.eb_statements WHERE id=%s", (id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="EB Statement not found")
        
        old_pdf_path = row[0]
        new_pdf_path = old_pdf_path

        if file:
            filename = getattr(file, "filename", "") or ""
            if not filename.lower().endswith(".pdf"):
                raise HTTPException(status_code=400, detail="Only PDF files allowed")
            
            # Create unique filename
            unique_name = f"{windmill_id}_{month}_{uuid4().hex}.pdf"
            new_pdf_path = os.path.join(UPLOAD_DIR, unique_name)

            # Save New PDF
            with open(new_pdf_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Delete old PDF
            if old_pdf_path and os.path.exists(old_pdf_path):
                try:
                    os.remove(old_pdf_path)
                    print(f"Deleted old file: {old_pdf_path}")
                except Exception as fe:
                    print(f"Warning: Could not delete old file {old_pdf_path}: {fe}")
        
        # Update Record
        cursor.execute(
            "UPDATE windmill.eb_statements SET windmill_id=%s, month=%s, pdf_file_path=%s, modified_at=NOW() WHERE id=%s",
            (windmill_id, month, new_pdf_path, id)
        )
        conn.commit()

        return {"status": "success", "message": "EB Statement updated successfully"}
    except Exception as e:
        print(f"Error in update_eb_statement: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.post("/save-details")
async def save_eb_statement_details(
    payload: EBStatementSaveRequest,
    user: dict = Depends(get_current_user)
):
    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()
    user_id = user.get("id")
    
    try:
        # 0. Delete existing records for this header to allow update/overwrite
        print(f"Cleaning existing records for eb_header_id {payload.eb_header_id}")
        cursor.execute("DELETE FROM windmill.eb_statements_details WHERE eb_header_id=%s", (payload.eb_header_id,))
        cursor.execute("DELETE FROM windmill.eb_statements_applicable_charges WHERE eb_header_id=%s", (payload.eb_header_id,))
        cursor.execute("DELETE FROM windmill.eb_statements_total_banking_units WHERE eb_header_id=%s", (payload.eb_header_id,))

        # 1. Insert into eb_statements_details for EACH slot (Net + Banking per slot)
        for slot_key, net_val_str in payload.slots.items():
            # Extract number from "C1", "C2", etc.
            slot_num_str = slot_key.replace("C", "")
            slot_id = int(slot_num_str) if slot_num_str.isdigit() else None
            
            net_val = float(net_val_str) if net_val_str else 0
            # Map corresponding banking slot value
            banking_val_str = payload.banking_slots.get(slot_key, "0")
            banking_val = float(banking_val_str) if banking_val_str else 0

            cursor.execute(
                """
                INSERT INTO windmill.eb_statements_details 
                (eb_header_id, company_name, windmill_id, slots, net_unit, banking_units, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    payload.eb_header_id,
                    payload.company_name,
                    payload.windmill_id,
                    slot_id,
                    net_val,
                    banking_val,
                    user_id
                )
            )

        # 2. Insert into eb_statements_total_banking_units
        cursor.execute(
            """
            INSERT INTO windmill.eb_statements_total_banking_units
            (eb_header_id, total_banking_units, created_by)
            VALUES (%s, %s, %s)
            """,
            (payload.eb_header_id, payload.banking_units, user_id)
        )

        # 3. Insert into eb_statements_applicable_charges
        for charge in payload.charges:
            charge_id = None
            # The master table stores energy_type as 'Windmill' and type as 'Variable' for windmill charges.
            # We'll match loosely on energy_type and allow both 'variable' and 'windmill' values for type.
            energy_type_value = "windmill"
            valid_charge_types = ("variable", "windmill")

            # Normalize the charge fields to improve matching (trim + lower + collapse whitespace)
            charge_name_norm = None
            if charge.name:
                charge_name_norm = " ".join(str(charge.name).strip().lower().split())

            charge_code_norm = None
            if getattr(charge, "code", None):
                charge_code_norm = str(charge.code).strip().lower()

            # 1) Preferred: Match using the charge description (charge_description column)
            if charge_name_norm:
                try:
                    cursor.execute(
                        "SELECT id FROM masters.master_consumption_chargers "
                        "WHERE TRIM(LOWER(charge_description)) LIKE %s "
                        "AND TRIM(LOWER(energy_type)) = %s "
                        "AND TRIM(LOWER(`type`)) IN (%s, %s) "
                        "LIMIT 1",
                        (f"%{charge_name_norm}%", energy_type_value, valid_charge_types[0], valid_charge_types[1])
                    )
                    res = cursor.fetchone()
                    if res:
                        charge_id = res[0]
                except Exception as ce:
                    print(f"Warning: Could not map charge description '{charge.name}': {ce}")

            # 2) Secondary: use code lookup if provided
            if not charge_id and charge_code_norm:
                try:
                    cursor.execute(
                        "SELECT id FROM masters.master_consumption_chargers "
                        "WHERE TRIM(LOWER(charge_code)) = %s "
                        "AND TRIM(LOWER(energy_type)) = %s "
                        "AND TRIM(LOWER(`type`)) IN (%s, %s) "
                        "LIMIT 1",
                        (charge_code_norm, energy_type_value, valid_charge_types[0], valid_charge_types[1])
                    )
                    res = cursor.fetchone()
                    if res:
                        charge_id = res[0]
                except Exception as ce:
                    print(f"Warning: Could not map charge code '{charge.code}': {ce}")

            # 3) Fallback: match on charge name/code if still missing
            if not charge_id:
                try:
                    cursor.execute(
                        "SELECT id FROM masters.master_consumption_chargers "
                        "WHERE (TRIM(LOWER(charge_name)) LIKE %s OR TRIM(LOWER(charge_code)) LIKE %s) "
                        "AND TRIM(LOWER(energy_type)) = %s "
                        "AND TRIM(LOWER(`type`)) IN (%s, %s) "
                        "LIMIT 1",
                        (
                            f"%{charge_name_norm}%", 
                            f"%{charge_name_norm}%", 
                            energy_type_value, 
                            valid_charge_types[0], 
                            valid_charge_types[1]
                        )
                    )
                    res = cursor.fetchone()
                    if res:
                        charge_id = res[0]
                except Exception as ce:
                    print(f"Warning: Could not map charge '{charge.name}': {ce}")

            if charge_id is None:
                print(f"Warning: charge_id not mapped for '{charge.name}' (code={getattr(charge, 'code', None)})")

            cursor.execute(
                """
                INSERT INTO windmill.eb_statements_applicable_charges 
                (eb_header_id, charge_id, total_charge, created_by)
                VALUES (%s, %s, %s, %s)
                """,
                (payload.eb_header_id, charge_id, charge.amount, user_id)
            )

        conn.commit()
        print(f"Successfully saved EB statement details for header {payload.eb_header_id}")
        return {"status": "success", "message": "Details saved successfully"}

    except Exception as e:
        conn.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in save_eb_statement_details: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()