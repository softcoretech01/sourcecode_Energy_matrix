import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def list_all(db_name):
    print(f"\n--- {db_name} ---")
    try:
        conn = pymysql.connect(host=os.getenv('DB_HOST','localhost'), user=os.getenv('DB_USER','root'), password=os.getenv('DB_PASSWORD',''), database=db_name)
        cursor = conn.cursor()
        cursor.execute("SHOW PROCEDURE STATUS WHERE Db=%s", (db_name,))
        for p in cursor.fetchall():
            print(f"P: {p[1]}")
        cursor.execute("SHOW TABLES")
        for t in cursor.fetchall():
            print(f"T: {t[0]}")
        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")

list_all("solar")
