import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def check(db_name):
    conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database=db_name)
    cursor = conn.cursor()
    cursor.execute("SHOW PROCEDURE STATUS WHERE Db = %s", (db_name,))
    for p in cursor.fetchall():
        if "consumption" in p[1]:
            print(f"P: {db_name}.{p[1]}")
    cursor.execute("SHOW TABLES")
    for t in cursor.fetchall():
        if "consumption" in t[0]:
            print(f"T: {db_name}.{t[0]}")
    conn.close()

check("masters")
check("windmill")
