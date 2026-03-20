import pymysql
import pandas as pd
from app.database import get_connection


def export_transmission_excel(year=None, month=None):
    db = get_connection()
    cursor = db.cursor(pymysql.cursors.DictCursor)

    query = """
        SELECT id,kva,from_date,loss_units,loss_percentage,
        is_submitted,created_by,modified_by,created_at,updated_at
        FROM transmission_loss WHERE 1=1
    """

    values = []

    if year:
        query += " AND YEAR(from_date)=%s"
        values.append(year)

    if month:
        query += " AND MONTH(from_date)=%s"
        values.append(month)

    cursor.execute(query, values)
    rows = cursor.fetchall()

    df = pd.DataFrame(rows)
    file_path = "transmission_export.xlsx"
    df.to_excel(file_path, index=False)

    return file_path