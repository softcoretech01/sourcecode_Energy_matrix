import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def run(db, sql):
    print(f"Running on {db}: {sql}")
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database=db)
        cursor = conn.cursor()
        cursor.execute(sql)
        conn.commit()
        conn.close()
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")

run("windmill", "DROP TABLE IF EXISTS eb_bill_details")
run("windmill", "DROP TABLE IF EXISTS eb_bill_adjustment_charges")

run("windmill", """
CREATE TABLE eb_bill_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    eb_bill_header_id INT NOT NULL,
    customer_id INT NOT NULL,
    customer_service_id INT NOT NULL,
    self_generation_tax DECIMAL(12,2),
    created_by INT,
    created_at DATETIME,
    modified_by INT,
    modified_at DATETIME,
    is_submitted TINYINT
)
""")

run("windmill", """
CREATE TABLE eb_bill_adjustment_charges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    eb_bill_header_id INT NOT NULL,
    energy_number VARCHAR(50) NOT NULL,
    c001 DECIMAL(12,2),
    c002 DECIMAL(12,2),
    c003 DECIMAL(12,2),
    c004 DECIMAL(12,2),
    c005 DECIMAL(12,2),
    c006 DECIMAL(12,2),
    c007 DECIMAL(12,2),
    c008 DECIMAL(12,2),
    c010 DECIMAL(12,2),
    wheeling_charges DECIMAL(12,2),
    created_by INT,
    created_at DATETIME,
    modified_by INT,
    modified_at DATETIME,
    is_submitted TINYINT
)
""")
