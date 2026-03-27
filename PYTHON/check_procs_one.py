import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def check_proc(db_name, proc):
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database=db_name)
        cursor = conn.cursor()
        cursor.execute(f"SHOW PROCEDURE STATUS WHERE Db = '{db_name}' AND Name = '{proc}'")
        res = cursor.fetchone()
        print(f"{db_name}.{proc}: {'YES' if res else 'NO'}")
        conn.close()
    except Exception as e:
        print(f"{db_name}.{proc}: ERROR {e}")

procs = [
    ("masters", "get_eb_bill_customers"),
    ("masters", "get_eb_bill_service_number"),
    ("windmill", "get_eb_bill_list"),
    ("windmill", "get_eb_bill_header"),
    ("windmill", "get_eb_bill_details"),
    ("windmill", "get_eb_bill_adjustment_charges"),
    ("windmill", "upsert_eb_bill_header"),
    ("windmill", "clear_eb_bill_details"),
    ("windmill", "insert_eb_bill_detail"),
    ("windmill", "insert_eb_bill_adjustment_charge")
]

for db, proc in procs:
    check_proc(db, proc)
