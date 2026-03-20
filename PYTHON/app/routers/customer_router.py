from app.utils.auth_utils import get_current_user
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from app.database import get_connection
from app.schemas.customer_schema import CustomerCreate, CustomerUpdate, AgreedUnitsRequest
from app.utils.validation import validate_customer
import pymysql
import os
from uuid import uuid4
import pandas as pd

router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# =====================================================
# 🔵 CREATE CUSTOMER 
# =====================================================
@router.post("/")
async def add_customer(data: CustomerCreate, user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("CALL sp_add_customer(%s,%s,%s,%s,%s,%s,%s,%s,%s)", (
        data.customer_name,
        data.city,
        data.phone_no,
        data.email,
        data.address,
        data.gst_number,
        data.status,
        user["id"],
        data.is_submitted
    ))

    # retrieve newly inserted id
    cursor.execute("SELECT LAST_INSERT_ID() AS id")
    new_id_row = cursor.fetchone()
    new_id = new_id_row[0] if new_id_row else None

    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Customer created successfully", "id": new_id}

@router.get("/")
async def get_customers(user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL sp_get_customers()")

    rows = cursor.fetchall()
    print("[DEBUG] /api/customers response:", rows)  # Log the response

    cursor.close()
    conn.close()

    return rows

# -----------------------------------------------------
# 🟢 EXPORT CUSTOMERS EXCEL
# -----------------------------------------------------
@router.get("/export")
async def export_customers_excel(
    customer_name: str | None = Query(None),
    se_number: str | None = Query(None),
    user: dict = Depends(get_current_user),
):
    """Returns an Excel file containing customer records.
    Filters match the same criteria used in the UI dropdowns.
    """
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    # reuse existing stored procedure to fetch all rows
    cursor.execute("CALL sp_get_customers()")
    rows = cursor.fetchall()

    # apply optional filters on python side for simplicity
    if customer_name is not None:
        rows = [r for r in rows if r.get("customer_name") == customer_name]
    if se_number is not None:
        rows = [r for r in rows if r.get("se_number") == se_number]

    # produce dataframe containing only the columns shown on the UI
    # omit audit fields, state/action columns etc. (status removed per request)
    output_rows = []
    for r in rows:
        output_rows.append({
            "Customer Name": r.get("customer_name"),
            "City": r.get("city"),
            "Phone No": r.get("phone_no"),
            "Email": r.get("email"),
            "SC Number": r.get("se_number"),
        })
    df = pd.DataFrame(output_rows)
    file_path = "customer_export.xlsx"
    df.to_excel(file_path, index=False)

    cursor.close()
    conn.close()

    return FileResponse(
        path=file_path,
        filename="customers.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )

@router.get("/{customer_id}")
async def get_customer(customer_id: int, user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL sp_get_customer_by_id(%s)",(customer_id,))

    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Customer not found")

    return row

@router.put("/{customer_id}")
async def update_customer(customer_id: int, data: CustomerUpdate, user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor()

    validate_customer(cursor, customer_id)

    # if attempting to post (is_submitted=1) ensure all required child records exist
    if data.is_submitted == 1:
        # check service numbers
        cursor.execute("SELECT id FROM customer_service WHERE customer_id=%s LIMIT 1", (customer_id,))
        if cursor.fetchone() is None:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=400, detail="Cannot post customer – at least one service number is required")
        # check contacts
        cursor.execute("SELECT id FROM customer_contact WHERE customer_id=%s LIMIT 1", (customer_id,))
        if cursor.fetchone() is None:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=400, detail="Cannot post customer – at least one contact is required")
        # check agreed units
        cursor.execute("SELECT id FROM customer_agreed WHERE customer_id=%s LIMIT 1", (customer_id,))
        if cursor.fetchone() is None:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=400, detail="Cannot post customer – agreed units must be specified")

    cursor.execute("CALL sp_update_customer(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", (
        data.customer_name,
        data.city,
        data.phone_no,
        data.email,
        data.address,
        data.gst_number,
        data.status,
        data.is_submitted,
        user["id"],
        customer_id
    ))

    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Customer updated successfully"}

@router.delete("/{customer_id}")
async def delete_customer(customer_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    validate_customer(cursor, customer_id)
    cursor.execute("CALL sp_delete_customer(%s)", (customer_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Customer deleted successfully"}


# =====================================================
# 🔵 SE NUMBER APIs
# =====================================================

@router.post("/{customer_id}/se")
async def add_se_number(customer_id: int, data: dict, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    validate_customer(cursor, customer_id)

    # Ensure service number is unique for this customer only
    cursor.execute(
        "SELECT id FROM customer_service WHERE customer_id=%s AND service_number=%s",
        (customer_id, data["se_number"])
    )
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="This Service Number is already added for this customer.")

    cursor.execute("CALL sp_add_customer_se(%s,%s,%s,%s,%s,%s,%s,%s)", (
        customer_id,
        data["se_number"],
        data.get("kva"),
        data.get("edc_circle"),
        data.get("status", 1),
        data.get("remarks"),
        data.get("is_submitted", 0),
        user["id"]
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "SE Number added successfully"}


@router.get("/{customer_id}/se")
async def get_customer_se(customer_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    cursor.execute("CALL sp_get_customer_se(%s)", (customer_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


@router.delete("/{customer_id}/se/{se_id}")
async def delete_customer_se(customer_id: int, se_id: int, user: dict = Depends(get_current_user)):
    """
    Permanently delete a service number row for a customer.
    """
    conn = get_connection()
    cursor = conn.cursor()

    validate_customer(cursor, customer_id)

    cursor.execute(
        "DELETE FROM customer_service WHERE id=%s AND customer_id=%s",
        (se_id, customer_id),
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "SE Number deleted successfully"}


@router.put("/{customer_id}/se/{se_id}")
async def update_customer_se(customer_id: int, se_id: int, data: dict, user: dict = Depends(get_current_user)):
    """
    Update an existing service number row for a customer.
    """
    conn = get_connection()
    cursor = conn.cursor()
    validate_customer(cursor, customer_id)

    # Ensure row belongs to the customer
    cursor.execute(
        "SELECT id FROM customer_service WHERE id=%s AND customer_id=%s",
        (se_id, customer_id),
    )
    if cursor.fetchone() is None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Service Number not found for this customer")

    # Prevent duplicate service number within the same customer when updating
    cursor.execute(
        "SELECT id FROM customer_service WHERE customer_id=%s AND service_number=%s AND id<>%s",
        (customer_id, data.get("se_number"), se_id),
    )
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="This Service Number is already added for this customer.")

    cursor.execute(
        """
        UPDATE customer_service
        SET service_number=%s,
            kva_id=%s,
            edc_circle_id=%s,
            status=%s,
            remarks=%s,
            is_submitted=%s,
            modified_by=%s,
            modified_at=NOW()
        WHERE id=%s AND customer_id=%s
        """,
        (
            data.get("se_number"),
            data.get("kva"),
            data.get("edc_circle"),
            data.get("status", 1),
            data.get("remarks"),
            data.get("is_submitted", 0),
            user["id"],
            se_id,
            customer_id,
        ),
    )

    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "SE Number updated successfully"}

# =====================================================
# 🔵 CONTACT API
# =====================================================
@router.get("/{customer_id}/contact")
async def get_customer_contact(customer_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    cursor.execute("SELECT * FROM customer_contact WHERE customer_id=%s ORDER BY id DESC", (customer_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

@router.post("/{customer_id}/contact")
async def add_customer_contact(customer_id: int, data: dict, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    validate_customer(cursor, customer_id)

    cursor.execute("CALL sp_add_customer_contact(%s,%s,%s,%s,%s)", (
        customer_id,
        data["contact_person_name"],
        data["phone_number"],
        data.get("is_submitted", 0),
        user["id"]
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Contact added successfully"}


@router.put("/{customer_id}/contact/{contact_id}")
async def update_customer_contact(
    customer_id: int,
    contact_id: int,
    data: dict,
    user: dict = Depends(get_current_user),
):
    """
    Update an existing contact row for a customer.
    """
    conn = get_connection()
    cursor = conn.cursor()

    validate_customer(cursor, customer_id)

    cursor.execute(
        "SELECT id FROM customer_contact WHERE id=%s AND customer_id=%s",
        (contact_id, customer_id),
    )
    if cursor.fetchone() is None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Contact not found for this customer")

    cursor.execute(
        """
        UPDATE customer_contact
        SET contact_person=%s,
            phone=%s,
            is_submitted=%s,
            modified_by=%s,
            modified_at=NOW()
        WHERE id=%s AND customer_id=%s
        """,
        (
            data.get("contact_person_name"),
            data.get("phone_number"),
            data.get("is_submitted", 0),
            user["id"],
            contact_id,
            customer_id,
        ),
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Contact updated successfully"}


# =====================================================
# 🔵 FILE UPLOAD API (UPDATED WITH 5 DOCS)
# =====================================================

@router.get("/{customer_id}/uploads")
async def get_customer_uploads(customer_id: int, user: dict = Depends(get_current_user)):
    """Return the latest uploaded document file names for this customer."""
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    validate_customer(cursor, customer_id)
    cursor.execute(
        """SELECT upload_ppa, upload_share_transfer_form_certificate, upload_share_certificate,
                  pledge_agreement, share_holding_agreement
           FROM customer_uploads
           WHERE customer_id = %s
           ORDER BY id DESC
           LIMIT 1""",
        (customer_id,),
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if not row:
        return {
            "upload_ppa": None,
            "upload_share_transfer_form_certificate": None,
            "upload_share_certificate": None,
            "pledge_agreement": None,
            "share_holding_agreement": None,
        }
    return row


@router.post("/{customer_id}/uploads")
async def upload_customer_docs(
    customer_id: int,
    user: dict = Depends(get_current_user),
    ppa_upload: UploadFile | None = File(None),
    share_transfer_upload: UploadFile | None = File(None),
    share_certificate_upload: UploadFile | None = File(None),
    pledge_upload: UploadFile | None = File(None),
    share_holding_upload: UploadFile | None = File(None),
):
    conn = get_connection()
    cursor = conn.cursor()

    validate_customer(cursor, customer_id)

    # If client uploads only some documents, keep the latest saved names for others.
    prev = {
        "upload_ppa": None,
        "upload_share_transfer_form_certificate": None,
        "upload_share_certificate": None,
        "pledge_agreement": None,
        "share_holding_agreement": None,
    }
    prev_cur = conn.cursor(pymysql.cursors.DictCursor)
    try:
        prev_cur.execute(
            """SELECT upload_ppa, upload_share_transfer_form_certificate, upload_share_certificate,
                      pledge_agreement, share_holding_agreement
               FROM customer_uploads
               WHERE customer_id = %s
               ORDER BY id DESC
               LIMIT 1""",
            (customer_id,),
        )
        row = prev_cur.fetchone()
        if row:
            prev.update(row)
    finally:
        prev_cur.close()

    async def save_file(file: UploadFile | None):
        if not file:
            return None, None

        ext = file.filename.split(".")[-1]
        unique_name = f"{uuid4().hex}.{ext}"
        path = os.path.join(UPLOAD_DIR, unique_name)

        with open(path, "wb") as buffer:
            buffer.write(await file.read())

        return file.filename, path

    try:
        ppa_name, ppa_path = await save_file(ppa_upload)
        st_name, st_path = await save_file(share_transfer_upload)
        sc_name, sc_path = await save_file(share_certificate_upload)
        pledge_name, pledge_path = await save_file(pledge_upload)
        sh_name, sh_path = await save_file(share_holding_upload)

        # Carry forward previous filenames when not re-uploaded
        if ppa_name is None:
            ppa_name = prev.get("upload_ppa")
        if st_name is None:
            st_name = prev.get("upload_share_transfer_form_certificate")
        if sc_name is None:
            sc_name = prev.get("upload_share_certificate")
        if pledge_name is None:
            pledge_name = prev.get("pledge_agreement")
        if sh_name is None:
            sh_name = prev.get("share_holding_agreement")

        # if a row already exists for this customer, update it instead of inserting a new one
        prev_id = None
        prev_cur = conn.cursor(pymysql.cursors.DictCursor)
        try:
            prev_cur.execute(
                "SELECT id FROM customer_uploads WHERE customer_id = %s ORDER BY id DESC LIMIT 1",
                (customer_id,)
            )
            row = prev_cur.fetchone()
            if row:
                prev_id = row['id']
        finally:
            prev_cur.close()

        if prev_id:
            cursor.execute(
                "UPDATE customer_uploads SET upload_ppa=%s, upload_share_transfer_form_certificate=%s, upload_share_certificate=%s, pledge_agreement=%s, share_holding_agreement=%s, modified_by=%s, modified_at=NOW() WHERE id=%s",
                (ppa_name, st_name, sc_name, pledge_name, sh_name, user["id"], prev_id)
            )
        else:
            cursor.execute("CALL sp_add_customer_uploads(%s,%s,%s,%s,%s,%s,%s)", (
                customer_id,
                ppa_name, st_name, sc_name, pledge_name, sh_name,
                user["id"]
            ))

        conn.commit()
        return {"message": "Files uploaded successfully"}

    finally:
        cursor.close()
        conn.close()


# =====================================================
# 🔵 AGREED UNITS API
# =====================================================

@router.get("/{customer_id}/agreed-units")
async def get_customer_agreed_units(customer_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    validate_customer(cursor, customer_id)
    
    cursor.execute(
        "SELECT month,c1_units,c2_units,c4_units,c5_units,total_agreement_number FROM customer_agreed WHERE customer_id = %s",
        (customer_id,)
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    # build complete 12‑month allocation regardless of what exists in DB
    months = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    rowmap = {r["month"]: r for r in rows} if rows else {}

    total_agreed = ""
    if rows and rows[0].get("total_agreement_number") is not None:
        total_agreed = str(rows[0]["total_agreement_number"])

    allocation = []
    for m in months:
        r = rowmap.get(m)
        allocation.append({
            "month": m,
            "c1": str(r["c1_units"]) if r and r["c1_units"] is not None else "",
            "c2": str(r["c2_units"]) if r and r["c2_units"] is not None else "",
            "c4": str(r["c4_units"]) if r and r["c4_units"] is not None else "",
            "c5": str(r["c5_units"]) if r and r["c5_units"] is not None else ""
        })

    return {"total_agreed_units": total_agreed, "unit_allocation": allocation}


@router.post("/{customer_id}/agreed-units")
async def save_customer_agreed_units(
    customer_id: int,
    data: AgreedUnitsRequest,
    user: dict = Depends(get_current_user)
):
    conn = get_connection()
    cursor = conn.cursor()
    validate_customer(cursor, customer_id)

    try:
        # Delete old rows
        cursor.execute("DELETE FROM customer_agreed WHERE customer_id = %s", (customer_id,))
        
        total_agreed = None
        if data.total_agreed_units:
            try:
                # Handle cases where it might be a float string like "5000.0"
                total_agreed = int(float(data.total_agreed_units))
            except (ValueError, TypeError):
                total_agreed = None
        
        grand_total = 0
        # first accumulate grand total
        for row in data.unit_allocation:
            c1 = float(row.c1) if row.c1 else 0.0
            c2 = float(row.c2) if row.c2 else 0.0
            c4 = float(row.c4) if row.c4 else 0.0
            c5 = float(row.c5) if row.c5 else 0.0
            grand_total += int(c1 + c2 + c4 + c5)

        # Insert new rows; grand_total will be the same for every row
        for row in data.unit_allocation:
            c1 = float(row.c1) if row.c1 else None
            c2 = float(row.c2) if row.c2 else None
            c4 = float(row.c4) if row.c4 else None
            c5 = float(row.c5) if row.c5 else None
            monthly_total = int((c1 or 0) + (c2 or 0) + (c4 or 0) + (c5 or 0))

            cursor.execute(
                """INSERT INTO customer_agreed 
                   (customer_id, total_agreement_number, month, c1_units, c2_units, c4_units, c5_units, monthly_total, grand_total, created_by, created_at, is_submitted) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s)""",
                (customer_id, total_agreed, row.month, c1, c2, c4, c5, monthly_total, grand_total, user["id"], 1)
            )

        conn.commit()
        return {"message": "Agreed units saved successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
