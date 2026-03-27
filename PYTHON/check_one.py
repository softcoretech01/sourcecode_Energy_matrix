import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def check_one(db_name, table):
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database=db_name)
        cursor = conn.cursor()
        cursor.execute(f"SHOW TABLES LIKE '{table}'")
        res = cursor.fetchone()
        print(f"{db_name}.{table}: {'YES' if res else 'NO'}")
        conn.close()
    except Exception as e:
        print(f"{db_name}.{table}: ERROR {e}")

check_one("masters", "master_customers")
check_one("masters", "customer_service")
check_one("masters", "master_windmill")
check_one("windmill", "eb_bill")
check_one("windmill", "eb_bill_details")
check_one("windmill", "eb_bill_adjustment_charges")
