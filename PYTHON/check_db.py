import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME_WINDMILL = os.getenv("DB_NAME_WINDMILL", "windmill")
DB_NAME = os.getenv("DB_NAME", "masters")

def check_db(db_name):
    print(f"\n--- Checking database: {db_name} ---")
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=db_name
        )
        cursor = conn.cursor()
        
        print("Tables:")
        cursor.execute("SHOW TABLES")
        for table in cursor.fetchall():
            print(f"  - {table[0]}")
            
        print("Procedures:")
        cursor.execute("SHOW PROCEDURE STATUS WHERE Db = %s", (db_name,))
        for proc in cursor.fetchall():
            print(f"  - {proc[1]}")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error checking {db_name}: {e}")

check_db(DB_NAME)
check_db(DB_NAME_WINDMILL)
