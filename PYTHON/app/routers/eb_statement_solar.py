from app.utils.auth_utils import get_current_user
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, Response
from typing import Optional, List
import os
import shutil
import calendar
import re
from uuid import uuid4
from app.schemas.eb_solar_schema import (
    EBSolarUploadResponse,
    EBSolarReadResponse,
    EBSolarRecord,
    EBSolarListResponse,
    EBSolarSaveRequest
)
from app.database import get_connection, DB_NAME_WINDMILL
from app.routers.eb_statement_upload import extract_eb_statement_data
import csv
import io

router = APIRouter(prefix="/eb-solar", tags=["EB Statement Solar"]) 

# Use same uploads/eb_statements folder (creates subfolder 'solar')
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "eb_statements", "solar")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _normalize_month_value(month_value):
    if month_value is None:
        return None

    if isinstance(month_value, int):
        if 1 <= month_value <= 12:
            return calendar.month_name[month_value]
        return str(month_value)

    if isinstance(month_value, str):
        normalized = month_value.strip()
        if normalized.isdigit():
            num = int(normalized)
            if 1 <= num <= 12:
                return calendar.month_name[num]
            return normalized

        normalized_title = normalized.capitalize()
        if normalized_title in calendar.month_name:
            return normalized_title

        if normalized_title in calendar.month_abbr:
            idx = list(calendar.month_abbr).index(normalized_title)
            if idx > 0:
                return calendar.month_name[idx]
        return normalized

    return str(month_value)


@router.post("/upload", response_model=EBSolarUploadResponse)
async def upload_eb_statement_solar(
    solar_id: str = Form(...),
    month: str = Form(...),
    year: Optional[int] = Form(None),
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

        # Persist reported year for filtering if provided
        if year is not None:
            cursor.execute(
                "SELECT id FROM solar.eb_statement_solar WHERE pdf_file_path LIKE %s AND solar_id=%s AND month=%s ORDER BY created_at DESC LIMIT 1",
                (f"%{unique_name}%", solar_id, month),
            )
            row = cursor.fetchone()
            if row:
                header_id = row[0]
                try:
                    cursor.execute("UPDATE solar.eb_statement_solar SET year=%s WHERE id=%s", (year, header_id))
                    conn.commit()
                except Exception as year_update_exc:
                    print("Failed to update year on EB solar upload:", year_update_exc)

    finally:
        cursor.close()
        conn.close()

    return {"message": "EB Statement (solar) uploaded and stored in DB", "filename": unique_name}


@router.get("/windmills")
async def get_solar_windmill_numbers():
    """Return available solar windmill numbers from masters.master_windmill."""
    conn = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT id, windmill_number FROM masters.master_windmill "
            "WHERE LOWER(`type`)=LOWER(%s) "
            "ORDER BY windmill_number",
            ("Solar",),
        )
        rows = cursor.fetchall()
        data = [
            {"id": row[0], "solar_number": row[1]}
            for row in rows
        ]
        return {"status": "success", "data": data}
    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# Search / list endpoint for EB solar statements
# --------------------------------------------------
@router.get("/", response_model=EBSolarListResponse)
def list_eb_solar(
    solar_id: Optional[str] = Query(None),
    solar_number: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Legacy/compatibility root route for EB solar listing (keeps frontend using /eb-solar until updated)."""
    return search_eb_solar(
        solar_id=solar_id,
        solar_number=solar_number,
        year=year,
        month=month,
        status=status,
        keyword=keyword,
        limit=limit,
        offset=offset,
    )


@router.get("/search", response_model=EBSolarListResponse)
def search_eb_solar(
    solar_id: Optional[str] = Query(None),
    solar_number: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Search using stored procedures (target) with fallback to direct query.
    This is EB Statement Solar logic and should be isolated from windmill EB statements.
    """
    conn = get_connection(db_name="solar")
    cursor = conn.cursor()

    def _normalize_month_value(month_value):
        if month_value is None:
            return None

        if isinstance(month_value, int):
            if 1 <= month_value <= 12:
                return calendar.month_name[month_value]
            return str(month_value)

        if isinstance(month_value, str):
            normalized = month_value.strip()
            if normalized.isdigit():
                num = int(normalized)
                if 1 <= num <= 12:
                    return calendar.month_name[num]
                return normalized

            normalized_title = normalized.capitalize()
            if normalized_title in calendar.month_name:
                return normalized_title
            # Accept abbreviated month names (Jan, Feb, ...)
            if normalized_title in calendar.month_abbr:
                idx = list(calendar.month_abbr).index(normalized_title)
                if idx > 0:
                    return calendar.month_name[idx]
            return normalized

        return str(month_value)

    def fallback_query():
        # Detect if a year column exists on solar.eb_statement_solar (for historical/year filtering)
        year_column_exists = False
        try:
            cursor.execute("SHOW COLUMNS FROM solar.eb_statement_solar LIKE 'year'")
            year_column_exists = cursor.fetchone() is not None
        except Exception:
            year_column_exists = False

        conditions = []
        params = []

        if solar_id:
            conditions.append("solar.eb_statement_solar.solar_id = %s")
            params.append(solar_id)

        if solar_number:
            conditions.append("masters.master_windmill.windmill_number = %s")
            params.append(solar_number)

        if year is not None:
            try:
                year_int = int(year)
                if year_column_exists:
                    conditions.append("(solar.eb_statement_solar.year = %s OR YEAR(solar.eb_statement_solar.created_at) = %s)")
                    params.extend([year_int, year_int])
                else:
                    conditions.append("YEAR(solar.eb_statement_solar.created_at) = %s")
                    params.append(year_int)
            except (ValueError, TypeError):
                pass

        if month is not None:
            try:
                month_int = int(month)
            except (ValueError, TypeError):
                month_int = None

            if month_int and 1 <= month_int <= 12:
                month_name = calendar.month_name[month_int]
                conditions.append("(solar.eb_statement_solar.month = %s OR solar.eb_statement_solar.month = %s)")
                params.extend([month_int, month_name])
            else:
                conditions.append("solar.eb_statement_solar.month = %s")
                params.append(month)

        if status:
            status_text = status.lower() if isinstance(status, str) else ""
            conditions.append("solar.eb_statement_solar.is_submitted = %s")
            params.append(1 if status_text in ["posted", "submitted", "saved"] else 0)

        if keyword:
            conditions.append("(masters.master_windmill.windmill_number LIKE %s OR solar.eb_statement_solar.pdf_file_path LIKE %s)")
            kw = f"%{keyword}%"
            params.extend([kw, kw])

        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""

        # Year column may not exist in older schema; use safe fallback.
        cursor.execute("SHOW COLUMNS FROM eb_statement_solar LIKE 'year'")
        year_column_exists = cursor.fetchone() is not None
        year_select = "eb_statement_solar.year" if year_column_exists else "NULL AS year"

        count_sql = f"SELECT COUNT(*) FROM eb_statement_solar LEFT JOIN masters.master_windmill ON eb_statement_solar.solar_id = masters.master_windmill.id{where_clause}"
        cursor.execute(count_sql, tuple(params))
        count_row = cursor.fetchone()
        total = int(count_row[0]) if count_row and len(count_row) > 0 else 0

        query_sql = f"SELECT DISTINCT eb_statement_solar.id, masters.master_windmill.windmill_number AS solar_number, eb_statement_solar.solar_id, eb_statement_solar.month, {year_select}, eb_statement_solar.pdf_file_path, eb_statement_solar.is_submitted, eb_statement_solar.created_at FROM eb_statement_solar LEFT JOIN masters.master_windmill ON eb_statement_solar.solar_id = masters.master_windmill.id{where_clause} ORDER BY eb_statement_solar.created_at DESC LIMIT %s OFFSET %s"
        cursor.execute(query_sql, tuple(params + [limit, offset]))
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        items = [dict(zip(columns, row)) for row in rows]

        for item in items:
            item["month"] = _normalize_month_value(item.get("month"))
            if "year" not in item or item.get("year") is None:
                created_at = item.get("created_at")
                if created_at is not None:
                    try:
                        item["year"] = int(created_at.year)
                    except Exception:
                        item["year"] = None
        return {"total": total, "items": items}

    try:
        # Run direct SQL query; avoid stored procedure dependency that may fail in some DB setups.
        return fallback_query()
    except Exception as exc:
        import traceback
        traceback_str = traceback.format_exc()
        print("EB solar search error:\n", traceback_str)
        raise HTTPException(status_code=500, detail="EB solar search error: " + str(exc))
    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# All entries endpoint for EB solar statements (unfiltered)
# --------------------------------------------------
@router.get("/all", response_model=EBSolarListResponse)
def get_all_eb_solar(
    limit: int = Query(1000, ge=1, le=10000),
    offset: int = Query(0, ge=0),
):
    conn = get_connection(db_name="solar")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM eb_statement_solar")
        count_row = cursor.fetchone()
        total = int(count_row[0]) if count_row and len(count_row) > 0 else 0

        cursor.execute("SHOW COLUMNS FROM eb_statement_solar LIKE 'year'")
        year_column_exists = cursor.fetchone() is not None
        year_select = "s.year" if year_column_exists else "NULL AS year"

        cursor.execute(
            "SELECT DISTINCT s.id, m.windmill_number AS solar_number, s.solar_id, s.month, " + year_select + ", s.pdf_file_path, s.is_submitted, s.created_at "
            "FROM eb_statement_solar AS s "
            "LEFT JOIN masters.master_windmill AS m ON s.solar_id = m.id "
            "ORDER BY s.created_at DESC LIMIT %s OFFSET %s",
            (limit, offset),
        )
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        items = [dict(zip(columns, row)) for row in rows]

        for item in items:
            item["month"] = _normalize_month_value(item.get("month"))
            if "year" not in item or item.get("year") is None:
                created_at = item.get("created_at")
                if created_at is not None:
                    try:
                        item["year"] = int(created_at.year)
                    except Exception:
                        item["year"] = None

        return {"total": total, "items": items}
    except Exception as exc:
        import traceback
        traceback_str = traceback.format_exc()
        print("EB solar all error:\n", traceback_str)
        raise HTTPException(status_code=500, detail="EB solar all error: " + str(exc))
    finally:
        cursor.close()
        conn.close()


@router.get("/details/{eb_header_id}")
async def get_eb_statement_solar_details(eb_header_id: int):
    conn = get_connection(db_name="solar")
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, company_name, solar_id, slots, net_unit FROM solar.eb_statement_solar_details WHERE eb_header_id=%s",
            (eb_header_id,),
        )
        detail_rows = cursor.fetchall()
        details = [
            {
                "id": row[0],
                "company_name": row[1],
                "solar_id": row[2],
                "slot": row[3],
                "net_unit": float(row[4]) if row[4] is not None else None,
            }
            for row in detail_rows
        ]

        cursor.execute(
            """
            SELECT c.id, c.charge_id, c.total_charge, m.charge_description, m.charge_code
            FROM solar.eb_statement_solar_applicable_charges c
            LEFT JOIN masters.master_consumption_chargers m ON c.charge_id = m.id
            WHERE c.eb_header_id=%s
            """,
            (eb_header_id,),
        )
        charge_rows = cursor.fetchall()
        charges = [
            {
                "id": row[0],
                "charge_id": row[1],
                "charge_description": row[3],
                "charge_code": row[4],
                "total_charge": float(row[2]) if row[2] is not None else None,
            }
            for row in charge_rows
        ]

        return {
            "status": "success",
            "details": details,
            "charges": charges,
        }
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
    year: Optional[int] = Form(None),
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
    header_id = None
    try:
        conn = get_connection(db_name="solar")
        cursor = conn.cursor()
        status = "Saved"

        # GET expected_windmill_no from master_windmill by id or number
        expected_wm = ""
        if solar_id:
            try:
                # Determine if solar_id is numeric id or actual windmill number
                if str(solar_id).isdigit():
                    cursor.execute("SELECT windmill_number FROM masters.master_windmill WHERE id=%s", (int(solar_id),))
                else:
                    cursor.execute("SELECT windmill_number FROM masters.master_windmill WHERE windmill_number=%s", (solar_id,))
                row = cursor.fetchone()
                expected_wm = row[0] if row else ""
            except Exception:
                expected_wm = ""

        # Use current year fallback if none provided
        sel_year = year if year is not None else __import__('datetime').datetime.now().year

        try:
            cursor.execute(
                "CALL solar.sp_insert_eb_statement_solar(%s,%s,%s)",
                (int(solar_id) if solar_id and str(solar_id).isdigit() else solar_id, month, unique_name),
            )
            conn.commit()
        except Exception as sp_exc:
            # Fall back to direct insert when stored procedure signature does not match or fails.
            print("Warning: sp_insert_eb_statement_solar failed, falling back to direct insert:", sp_exc)
            try:
                cursor.execute(
                    "INSERT INTO solar.eb_statement_solar (solar_id, month, pdf_file_path, is_submitted, created_by) VALUES (%s, %s, %s, %s, %s)",
                    (int(solar_id) if solar_id and str(solar_id).isdigit() else solar_id, month, unique_name, 0, 1),
                )
                conn.commit()
            except Exception as direct_exc:
                print("Failed to insert solar.eb_statement_solar directly:", direct_exc)

        cursor.execute(
            "SELECT id FROM solar.eb_statement_solar WHERE pdf_file_path LIKE %s AND solar_id=%s AND month=%s ORDER BY created_at DESC LIMIT 1",
            (f"%{unique_name}%", solar_id, month),
        )
        row = cursor.fetchone()
        header_id = row[0] if row else None

        if header_id is None:
            # fallback if no exact path match (stored path may differ slightly)
            cursor.execute(
                "SELECT id FROM solar.eb_statement_solar WHERE solar_id=%s AND month=%s ORDER BY created_at DESC LIMIT 1",
                (solar_id, month),
            )
            row = cursor.fetchone()
            header_id = row[0] if row else None

        if header_id is None:
            cursor.execute("SELECT id FROM solar.eb_statement_solar ORDER BY created_at DESC LIMIT 1")
            row = cursor.fetchone()
            header_id = row[0] if row else None

        # Persist year if provided by the upload request, to support search by year filters
        if header_id is not None and sel_year is not None:
            try:
                cursor.execute("UPDATE solar.eb_statement_solar SET year=%s WHERE id=%s", (sel_year, header_id))
                conn.commit()
            except Exception as year_exc:
                print("Warning: failed to update year for eb_statement_solar header", year_exc)
    except Exception as exc:
        print("Failed to insert EB solar record via sp:", exc)
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

    # parse using shared extractor from windmill EB statement module (validate service number vs solar number)
    try:
        parsed_data = extract_eb_statement_data(file_path, expected_wm)
    except Exception as parse_err:
        # clean up uploaded file if validation failed
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as cleanup_err:
            print("Failed to remove invalid PDF file after parse error:", cleanup_err)

        # Do not keep DB row in case parse and validation fails
        try:
            if header_id is not None:
                conn = get_connection(db_name="solar")
                cur = conn.cursor()
                cur.execute("DELETE FROM solar.eb_statement_solar WHERE id=%s", (header_id,))
                conn.commit()
                cur.close()
                conn.close()
        except Exception as db_cleanup_err:
            print("Failed to remove DB header after parse error:", db_cleanup_err)

        raise HTTPException(status_code=400, detail=f"Invalid solar EB PDF: {str(parse_err)}")

    warning_msg = None
    if isinstance(parsed_data, dict):
        warning_msg = parsed_data.get("warning")

    return {
        "message": "EB Statement (solar) uploaded and read",
        "filename": unique_name,
        "parsed": parsed_data,
        "header_id": header_id,
        "warning": warning_msg,
    }


@router.get("/read-metadata")
async def read_eb_statement_solar_metadata(filename: str):
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    conn = get_connection(db_name="solar")
    cursor = conn.cursor()
    try:
        parts = filename.split("_")
        solar_id_val = None
        try:
            solar_id_val = int(parts[0])
        except Exception:
            solar_id_val = None

        cursor.execute("SELECT id FROM solar.eb_statement_solar WHERE pdf_file_path LIKE %s ORDER BY created_at DESC LIMIT 1", (f"%{filename}%",))
        row = cursor.fetchone()
        header_id = row[0] if row else None

        # Try by solar_id if header is not found
        if header_id is None and solar_id_val is not None:
            cursor.execute("SELECT id FROM solar.eb_statement_solar WHERE solar_id=%s ORDER BY created_at DESC LIMIT 1", (solar_id_val,))
            row = cursor.fetchone()
            header_id = row[0] if row else None

        # Prepare windmill number context
        master_wm = ""
        if header_id is not None:
            cursor.execute("SELECT solar_id FROM solar.eb_statement_solar WHERE id=%s", (header_id,))
            row = cursor.fetchone()
            solar_id_from_header = row[0] if row else None
            if solar_id_from_header is not None:
                cursor.execute("SELECT windmill_number FROM masters.master_windmill WHERE id=%s", (solar_id_from_header,))
                row2 = cursor.fetchone()
                master_wm = row2[0] if row2 else ""

        if not master_wm and solar_id_val is not None:
            cursor.execute("SELECT windmill_number FROM masters.master_windmill WHERE id=%s", (solar_id_val,))
            row2 = cursor.fetchone()
            master_wm = row2[0] if row2 else ""

        parsed_data = None
        warning_text = None
        try:
            from app.routers.eb_statement_upload import extract_eb_statement_data
            parsed_data = extract_eb_statement_data(file_path, master_wm)
            if isinstance(parsed_data, dict):
                warning_text = parsed_data.get("warning") if "warning" in parsed_data else None
        except Exception as parse_exc:
            print("Failed to parse EB statement metadata (read-metadata):", parse_exc)

        return {
            "status": "success",
            "header_id": header_id,
            "parsed": parsed_data,
            "warning": warning_text,
        }
    finally:
        cursor.close()
        conn.close()


@router.post("/save-details")
async def save_eb_statement_solar_details(
    payload: EBSolarSaveRequest,
    user: dict = Depends(get_current_user)
):
    conn = get_connection(db_name="solar")
    cursor = conn.cursor()
    user_id = user.get("id")

    try:
        eb_header_id = payload.eb_header_id
        if not eb_header_id or eb_header_id <= 0:
            # fallback to latest EB solar header by solar_id
            cursor.execute(
                "SELECT id FROM solar.eb_statement_solar WHERE solar_id=%s ORDER BY created_at DESC LIMIT 1",
                (payload.solar_id,),
            )
            row = cursor.fetchone()
            if row:
                eb_header_id = row[0]
            else:
                raise HTTPException(status_code=400, detail="No EB Statement header found for solar_id")

        cursor.execute("DELETE FROM solar.eb_statement_solar_details WHERE eb_header_id=%s", (eb_header_id,))
        cursor.execute("DELETE FROM solar.eb_statement_solar_applicable_charges WHERE eb_header_id=%s", (eb_header_id,))

        for slot_key, net_val_str in payload.slots.items():
            slot_id = int(slot_key.replace("C", "")) if slot_key.startswith("C") and slot_key[1:].isdigit() else None
            net_val = float(net_val_str or 0)

            cursor.execute(
                """
                INSERT INTO solar.eb_statement_solar_details
                (eb_header_id, company_name, solar_id, slots, net_unit, created_by)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    eb_header_id,
                    payload.company_name,
                    payload.solar_id,
                    slot_id,
                    net_val,
                    user_id,
                ),
            )

        for charge in payload.charges:
            charge_id = None
            energy_type_value = "solar"
            valid_charge_types = ("variable", "solar")
            charge_name_norm = "" if not charge.name else " ".join(str(charge.name).strip().lower().split())
            charge_code_norm = "" if not charge.code else str(charge.code).strip().lower()

            def normalize_for_compare(text: str) -> str:
                return re.sub(r"[^a-z0-9]+", "", str(text or "").lower())

            normalized_charge_name = normalize_for_compare(charge_name_norm)

            # 1) Preferred: exact match on master charge_description
            if charge_name_norm:
                try:
                    cursor.execute(
                        """
                        SELECT id, charge_description FROM masters.master_consumption_chargers
                        WHERE TRIM(LOWER(charge_description)) = %s
                          AND TRIM(LOWER(energy_type)) = %s
                          AND TRIM(LOWER(`type`)) IN (%s, %s)
                        ORDER BY id LIMIT 1
                        """,
                        (charge_name_norm, energy_type_value, valid_charge_types[0], valid_charge_types[1]),
                    )
                    res = cursor.fetchone()
                    if res:
                        charge_id = res[0]
                        mapped_desc = res[1]
                        print(f"Exact mapped solar charge '{charge.name}' -> id={charge_id}, desc='{mapped_desc}'")
                except Exception as ce:
                    print(f"Warning: Could not map charge description '{charge.name}' exactly: {ce}")

            # 2) Normalized exact match ignoring spaces/punctuation
            if not charge_id and normalized_charge_name:
                try:
                    cursor.execute(
                        """
                        SELECT id, charge_description FROM masters.master_consumption_chargers
                        WHERE TRIM(LOWER(energy_type)) = %s
                          AND TRIM(LOWER(`type`)) IN (%s, %s)
                        """,
                        (energy_type_value, valid_charge_types[0], valid_charge_types[1]),
                    )
                    for mid, mdesc in cursor.fetchall():
                        if normalize_for_compare(mdesc) == normalized_charge_name:
                            charge_id = mid
                            mapped_desc = mdesc
                            print(f"Normalized exact mapped solar charge '{charge.name}' -> id={charge_id}, desc='{mapped_desc}'")
                            break
                except Exception as ce:
                    print(f"Warning: Could not map charge description '{charge.name}' by normalized exact: {ce}")

            # 3) Fallback: match using provider-complete phrase
            if not charge_id and charge_name_norm:
                try:
                    cursor.execute(
                        """
                        SELECT id, charge_description FROM masters.master_consumption_chargers
                        WHERE TRIM(LOWER(charge_description)) LIKE %s
                          AND TRIM(LOWER(energy_type)) = %s
                          AND TRIM(LOWER(`type`)) IN (%s, %s)
                        ORDER BY CHAR_LENGTH(charge_description) DESC, id LIMIT 1
                        """,
                        (f"%{charge_name_norm}%", energy_type_value, valid_charge_types[0], valid_charge_types[1]),
                    )
                    res = cursor.fetchone()
                    if res:
                        charge_id = res[0]
                        mapped_desc = res[1]
                        print(f"Partial mapped solar charge '{charge.name}' -> id={charge_id}, desc='{mapped_desc}'")
                except Exception as ce:
                    print(f"Warning: Could not map charge description '{charge.name}' partially: {ce}")

            # 4) code based mapping by exact code
            if not charge_id and charge_code_norm:
                try:
                    cursor.execute(
                        """
                        SELECT id, charge_description FROM masters.master_consumption_chargers
                        WHERE TRIM(LOWER(charge_code)) = %s
                          AND TRIM(LOWER(energy_type)) = %s
                          AND TRIM(LOWER(`type`)) IN (%s, %s)
                        LIMIT 1
                        """,
                        (charge_code_norm, energy_type_value, valid_charge_types[0], valid_charge_types[1]),
                    )
                    res = cursor.fetchone()
                    if res:
                        charge_id = res[0]
                        mapped_desc = res[1]
                        print(f"Mapped solar charge code '{charge.code}' -> id={charge_id}, desc='{mapped_desc}'")
                except Exception as ce:
                    print(f"Warning: Could not map charge code '{charge.code}': {ce}")

            # 5) fallback token based matching as last resort
            if not charge_id and charge_name_norm:
                tokens = [t for t in re.sub(r"[^a-z0-9 ]", "", charge_name_norm).split() if len(t) > 2]
                for token in tokens:
                    try:
                        cursor.execute(
                            """
                            SELECT id, charge_description FROM masters.master_consumption_chargers
                            WHERE TRIM(LOWER(charge_description)) LIKE %s
                              AND TRIM(LOWER(energy_type)) = %s
                              AND TRIM(LOWER(`type`)) IN (%s, %s)
                            ORDER BY CHAR_LENGTH(charge_description) DESC, id LIMIT 1
                            """,
                            (f"%{token}%", energy_type_value, valid_charge_types[0], valid_charge_types[1]),
                        )
                        res = cursor.fetchone()
                        if res:
                            charge_id = res[0]
                            mapped_desc = res[1]
                            print(f"Token mapped solar charge '{charge.name}' token '{token}' -> id={charge_id}, desc='{mapped_desc}'")
                            break
                    except Exception as ce:
                        print(f"Warning: Could not map token '{token}' for charge '{charge.name}': {ce}")

            if charge_id is None:
                print(f"Warning: charge_id not mapped for '{charge.name}' (code={charge.code})")
            if charge_id is None:
                print(f"Warning: charge_id not mapped for '{charge.name}' (code={charge.code})")

            if not charge_id and charge_code_norm:
                try:
                    cursor.execute(
                        """
                        SELECT id FROM masters.master_consumption_chargers
                        WHERE TRIM(LOWER(charge_code)) = %s
                        AND TRIM(LOWER(energy_type)) = %s
                        AND TRIM(LOWER(`type`)) IN (%s, %s)
                        LIMIT 1
                        """,
                        (charge_code_norm, energy_type_value, valid_charge_types[0], valid_charge_types[1]),
                    )
                    res = cursor.fetchone()
                    if res:
                        charge_id = res[0]
                except Exception as ce:
                    print(f"Warning: Could not map charge code '{charge.code}': {ce}")

            if not charge_id and charge_name_norm:
                try:
                    cursor.execute(
                        """
                        SELECT id, charge_description FROM masters.master_consumption_chargers
                        WHERE (TRIM(LOWER(charge_description)) LIKE %s OR TRIM(LOWER(charge_code)) LIKE %s)
                        AND TRIM(LOWER(energy_type)) = %s
                        AND TRIM(LOWER(`type`)) IN (%s, %s)
                        LIMIT 1
                        """,
                        (f"%{charge_name_norm}%", f"%{charge_name_norm}%", energy_type_value, valid_charge_types[0], valid_charge_types[1]),
                    )
                    res = cursor.fetchone()
                    if res:
                        charge_id = res[0]
                except Exception as ce:
                    print(f"Warning: Could not map charge '{charge.name}': {ce}")

            # 4) Fallback: token based matching on description from master table
            if not charge_id and charge_name_norm:
                tokens = [t for t in charge_name_norm.split() if len(t) > 2]
                for token in tokens:
                    try:
                        cursor.execute(
                            """
                            SELECT id, charge_description FROM masters.master_consumption_chargers
                            WHERE TRIM(LOWER(charge_description)) LIKE %s
                            AND TRIM(LOWER(energy_type)) = %s
                            AND TRIM(LOWER(`type`)) IN (%s, %s)
                            ORDER BY id LIMIT 1
                            """,
                            (f"%{token}%", energy_type_value, valid_charge_types[0], valid_charge_types[1]),
                        )
                        res = cursor.fetchone()
                        if res:
                            charge_id = res[0]
                            mapped_desc = res[1]
                            print(f"Token mapped solar charge '{charge.name}' token '{token}' -> id={charge_id}, desc='{mapped_desc}'")
                            break
                    except Exception as ce:
                        print(f"Warning: Could not map token '{token}' for charge '{charge.name}': {ce}")

            if charge_id is None:
                print(f"Warning: charge_id not mapped for '{charge.name}' (code={charge.code})")

            cursor.execute(
                """
                INSERT INTO solar.eb_statement_solar_applicable_charges
                (eb_header_id, charge_id, total_charge, created_by)
                VALUES (%s, %s, %s, %s)
                """,
                (eb_header_id, charge_id, float(charge.amount), user_id),
            )

        conn.commit()
        return {"status": "success", "message": "Solar EB statement details saved successfully"}
    except Exception as e:
        conn.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()