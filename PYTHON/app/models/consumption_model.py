import pymysql
from app.database import get_connection, DB_NAME_WINDMILL


def get_consumption_dropdown(db=None) -> list:
    """
    Fetch distinct customers (active + posted) for the consumption request dropdown.
    Uses SP: GetConsumptionDropdownData
    """
    owns_conn = db is None
    if owns_conn:
        db = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = db.cursor(pymysql.cursors.DictCursor)
    try:
        cursor.callproc("GetConsumptionDropdownData")
        return list(cursor.fetchall())
    finally:
        cursor.close()
        if owns_conn:
            db.close()


def get_consumption_list(year: int, month: int, db=None) -> list:
    """
    Fetch consumption request list for a given year/month.
    Uses SP: sp_get_consumption_requests
    """
    owns_conn = db is None
    if owns_conn:
        db = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = db.cursor(pymysql.cursors.DictCursor)
    try:
        cursor.callproc("sp_get_consumption_requests", (year, month))
        return list(cursor.fetchall())
    finally:
        cursor.close()
        if owns_conn:
            db.close()


def save_consumption_request(
    customer_id: int,
    service_id: int,
    c1: float,
    c2: float,
    c4: float,
    c5: float,
    total: float,
    year: int,
    month: int,
    day: int,
    user_id: int,
    db=None
) -> None:
    """
    Upsert a single consumption request row.
    Uses SP: sp_save_consumption_request
    """
    owns_conn = db is None
    if owns_conn:
        db = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = db.cursor()
    try:
        cursor.callproc(
            "sp_save_consumption_request",
            (customer_id, service_id, c1, c2, c4, c5, total, year, month, day, user_id)
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        cursor.close()
        if owns_conn:
            db.close()


def export_consumption_excel(year=None, month=None):
    """Legacy Excel export — kept for backward compatibility."""
    import pandas as pd
    db = get_connection(db_name=DB_NAME_WINDMILL)
    cursor = db.cursor(pymysql.cursors.DictCursor)
    query = """
        SELECT id, charge_code, charge_name, description, charge_date,
               is_submitted, created_by, modified_by, created_at, updated_at
        FROM consumption_charges WHERE 1=1
    """
    values = []
    if year:
        query += " AND YEAR(charge_date)=%s"
        values.append(year)
    if month:
        query += " AND MONTH(charge_date)=%s"
        values.append(month)
    cursor.execute(query, values)
    rows = cursor.fetchall()
    cursor.close()
    db.close()
    df = pd.DataFrame(rows)
    file_path = "consumption_export.xlsx"
    df.to_excel(file_path, index=False)
    return file_path