import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

conn = pymysql.connect(host=os.getenv('DB_HOST','localhost'), user=os.getenv('DB_USER','root'), password=os.getenv('DB_PASSWORD',''), database='masters')
c = conn.cursor()
c.execute("SHOW TABLES")
tables = [t[0] for t in c.fetchall()]
c.execute("SHOW PROCEDURE STATUS WHERE Db='masters'")
procs = [p[1] for p in c.fetchall()]

with open("D:/sourcecode_Energy_matrix/PYTHON/masters_list.txt", "w", encoding="utf-8") as f:
    f.write("TABLES:\n")
    for t in tables: f.write(t + "\n")
    f.write("\nPROCEDURES:\n")
    for p in procs: f.write(p + "\n")

conn.close()
