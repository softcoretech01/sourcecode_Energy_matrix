import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def get_proc_def(db_name, proc):
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database=db_name)
        cursor = conn.cursor()
        cursor.execute(f"SHOW CREATE PROCEDURE {proc}")
        res = cursor.fetchone()
        if res:
            print(f"\n--- {db_name}.{proc} ---")
            print(res[2])
        conn.close()
    except Exception as e:
        print(f"Error for {db_name}.{proc}: {e}")

procs = ["insert_eb_bill_detail", "insert_eb_bill_adjustment_charge"]
for p in procs:
    get_proc_def("windmill", p)
