import pymysql
import os

conn = pymysql.connect(host="localhost", user="root", password="bhava3017", database="masters")
cursor = conn.cursor()

procs = ['sp_add_customer_se', 'sp_update_customer_se', 'sp_get_customer_se']
out = ""
for p in procs:
    cursor.execute(f"SHOW CREATE PROCEDURE {p};")
    res = cursor.fetchone()
    if res:
        out += f"PROCEDURE {p}:\n"
        out += res[2] + "\n\n"

with open("d:/sourcecode_Energy_matrix/PYTHON/sp_defs.txt", "w", encoding="utf-8") as f:
    f.write(out)

cursor.close()
conn.close()
