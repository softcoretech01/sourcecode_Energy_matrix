import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def check_db(db_name):
    print(f"\n--- Database: {db_name} ---")
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database=db_name)
        cursor = conn.cursor()
        
        cursor.execute("SHOW PROCEDURE STATUS WHERE Db = %s", (db_name,))
        procs = [p[1] for p in cursor.fetchall()]
        print("Procedures:")
        for p in procs:
            if "consumption" in p:
                print(f"  P: {p}")
                
        cursor.execute("SHOW TABLES")
        tables = [t[0] for t in cursor.fetchall()]
        print("Tables/Views:")
        for t in tables:
            if "consumption" in t:
                print(f"  T: {t}")
                
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

check_db("masters")
check_db("windmill")
