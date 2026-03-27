import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME_WINDMILL = os.getenv("DB_NAME_WINDMILL", "windmill")
DB_NAME = os.getenv("DB_NAME", "masters")

def list_stuff(db_name):
    print(f"\n--- {db_name} ---")
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database=db_name)
        cursor = conn.cursor()
        
        cursor.execute("SHOW TABLES")
        tables = [t[0] for t in cursor.fetchall()]
        print(f"Tables ({len(tables)}):")
        for t in tables:
            print(f"  {t}")
            
        cursor.execute("SHOW PROCEDURE STATUS WHERE Db = %s", (db_name,))
        procs = [p[1] for p in cursor.fetchall()]
        print(f"Procedures ({len(procs)}):")
        for p in procs:
            print(f"  {p}")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

list_stuff(DB_NAME)
list_stuff(DB_NAME_WINDMILL)
