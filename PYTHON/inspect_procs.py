import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def check_db(db_name):
    print(f"\n=== Checking Database: {db_name} ===")
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database=db_name)
        cursor = conn.cursor()
        
        cursor.execute("SHOW PROCEDURE STATUS WHERE Db = '" + db_name + "'")
        procs = [row[1] for row in cursor.fetchall()]
        print(f"Procedures: {procs}")
        
        if "get_eb_bill_customers" in procs:
            cursor.execute("SHOW CREATE PROCEDURE get_eb_bill_customers")
            print(f"\nDefinition of get_eb_bill_customers in {db_name}:")
            print(cursor.fetchone()[2])
        else:
            print("get_eb_bill_customers NOT FOUND")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

check_db("masters")
check_db("windmill")
