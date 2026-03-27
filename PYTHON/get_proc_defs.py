import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def get_proc_def(db_name, proc, out_file):
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database=db_name)
        cursor = conn.cursor()
        cursor.execute(f"SHOW CREATE PROCEDURE {proc}")
        res = cursor.fetchone()
        if res:
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(res[2])
            print(f"Saved {proc} to {out_file}")
        conn.close()
    except Exception as e:
        print(f"Error for {db_name}.{proc}: {e}")

get_proc_def("windmill", "insert_eb_bill_detail", "D:/sourcecode_Energy_matrix/PYTHON/insert_eb_bill_detail.sql")
get_proc_def("windmill", "insert_eb_bill_adjustment_charge", "D:/sourcecode_Energy_matrix/PYTHON/insert_eb_bill_adjustment_charge.sql")
