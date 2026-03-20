import pymysql
import pandas as pd
from app.database import get_connection


def export_consumption_excel(year=None, month=None):
    db = get_connection()
    cursor = db.cursor(pymysql.cursors.DictCursor)

    query = """
        SELECT id,charge_code,charge_name,description,charge_date,
        is_submitted,created_by,modified_by,created_at,updated_at
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

    df = pd.DataFrame(rows)
    file_path = "consumption_export.xlsx"
    df.to_excel(file_path, index=False)

    return file_path