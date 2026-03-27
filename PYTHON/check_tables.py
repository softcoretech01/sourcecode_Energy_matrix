import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def check_tables_and_columns():
    dbs = {
        "masters": ["master_customers", "customer_service", "master_windmill"],
        "windmill": ["eb_bill", "eb_bill_details", "eb_bill_adjustment_charges"]
    }
    
    for db_name, tables in dbs.items():
        print(f"\nDB: {db_name}")
        try:
            conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database=db_name)
            cursor = conn.cursor()
            for table in tables:
                cursor.execute(f"SHOW TABLES LIKE '{table}'")
                exists = cursor.fetchone()
                if exists:
                    print(f"  [OK] Table: {table}")
                    # cursor.execute(f"DESCRIBE {table}")
                    # for col in cursor.fetchall():
                    #     print(f"    - {col[0]} ({col[1]})")
                else:
                    print(f"  [MISSING] Table: {table}")
            conn.close()
        except Exception as e:
            print(f"  [ERROR] {e}")

check_tables_and_columns()
