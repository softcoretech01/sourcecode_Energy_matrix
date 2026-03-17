from app.utils.auth_utils import get_current_user
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, Response
from typing import Optional, List
import os
import shutil
from uuid import uuid4
from app.schemas.eb_solar_schema import (
    EBSolarUploadResponse,
    EBSolarReadResponse,
    EBSolarRecord,
    EBSolarListResponse,
)
from app.database import get_connection
import csv
import io

router = APIRouter(prefix="/eb-solar", tags=["EB Statement Solar"]) 

# Use same uploads/eb_statements folder (creates subfolder 'solar')
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "eb_statements", "solar")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=EBSolarUploadResponse)
async def upload_eb_statement_solar(
    solar_id: str = Form(...),
    month: str = Form(...),
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    unique_name = f"{solar_id}_{month}_{uuid4().hex}.pdf"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Store file path in DB
    conn = get_connection(db_name="solar")
    cursor = conn.cursor()
    try:
        cursor.execute(
            "CALL solar.sp_insert_eb_statement_solar(%s,%s,%s)",
            (solar_id, month, unique_name)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()

    return {"message": "EB Statement (solar) uploaded and stored in DB", "filename": unique_name}


# --------------------------------------------------
# Search / list endpoint for EB solar statements
# --------------------------------------------------
@router.get("/search", response_model=EBSolarListResponse)
def search_eb_solar(
    solar_id: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Search using stored procedures instead of inline SQL."""
    conn = get_connection(db_name="solar")
    cursor = conn.cursor()
    try:
        # count total rows
        cursor.execute(
            "CALL solar.sp_count_eb_statement_solar(%s,%s,%s,%s,%s)",
            (solar_id, year, month, status, keyword),
        )
        total = cursor.fetchone()[0]
        # advance past any extra resultset
        try:
            cursor.nextset()
        except Exception:
            pass

        # fetch the page of data
        cursor.execute(
            "CALL solar.sp_search_eb_statement_solar(%s,%s,%s,%s,%s,%s,%s)",
            (solar_id, year, month, status, keyword, limit, offset),
        )
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        items = [dict(zip(columns, row)) for row in rows]
        return {"total": total, "items": items}
    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# Export endpoint (Excel/CSV) for EB solar statements
# --------------------------------------------------
@router.get("/export")
def export_eb_solar(
    solar_id: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
):
    """Export rows via stored procedure.
    Note: no pagination applied.
    """
    conn = get_connection(db_name="solar")
    cursor = conn.cursor()
    try:
        cursor.execute(
            "CALL solar.sp_export_eb_statement_solar(%s,%s,%s,%s,%s)",
            (solar_id, year, month, status, keyword),
        )
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
    finally:
        cursor.close()
        conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(columns)
    for row in rows:
        writer.writerow(row)
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=eb_solar_export.csv"},
    )


@router.post("/read-pdf", response_model=EBSolarReadResponse)
async def read_eb_statement_solar_pdf(
    solar_id: str = Form(None),
    month: str = Form(None),
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    unique_name = f"{solar_id or 'file'}_{month or 'm'}_{uuid4().hex}.pdf"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # insert a record in the database so the "new" upload is stored
    try:
        conn = get_connection(db_name="solar")
        cursor = conn.cursor()
        from datetime import datetime
        year = datetime.now().year
        status = "Saved"
        # use stored procedure instead of inline INSERT
        cursor.execute(
            "CALL solar.sp_insert_eb_statement_solar(%s,%s,%s,%s,%s)",
            (solar_id, month, unique_name, status, year),
        )
        conn.commit()
    except Exception as exc:
        print("Failed to insert EB solar record via sp:", exc)
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

    # parse PDF text using pdfplumber if available
    full_text = None
    try:
        import pdfplumber
        full_text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                txt = page.extract_text()
                if txt:
                    full_text += "\n" + txt
    except Exception:
        full_text = None

    return {"message": "EB Statement (solar) uploaded and read", "filename": unique_name, "parsed": {"full_text": full_text}}
