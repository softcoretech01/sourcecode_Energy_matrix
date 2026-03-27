import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def run_sql(db_name, label, sql, args=None, is_select=False):
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database=db_name)
        cursor = conn.cursor()
        print(f"[{db_name}] {label}...")
        cursor.execute(sql, args)
        if is_select:
            res = cursor.fetchone()
            conn.close()
            return res[0] if res else None
        else:
            conn.commit()
            last_id = cursor.lastrowid
            conn.close()
            return last_id
    except Exception as e:
        print(f"[{db_name}] {label} ERROR: {e}")
        return None

# 2. Masters
cust_id = run_sql("masters", "GetCust", "SELECT id FROM master_customers WHERE customer_name='Test Customer'", is_select=True)
if not cust_id:
    cust_id = run_sql("masters", "InsertCust", "INSERT INTO master_customers (customer_name, status, created_at, created_by, is_submitted) VALUES ('Test Customer', '1', NOW(), 1, 1)")

sc_id = run_sql("masters", "GetSC", "SELECT id FROM customer_service WHERE customer_id=%s AND service_number=9876543210", (cust_id,), is_select=True)
if not sc_id:
    sc_id = run_sql("masters", "InsertSC", "INSERT INTO customer_service (customer_id, service_number, status, created_at, created_by, is_submitted) VALUES (%s, 9876543210, '1', NOW(), 1, 1)", (cust_id,))

# 3. Windmill
header_id = run_sql("windmill", "GetHeader", "SELECT id FROM eb_bill WHERE customer_id=%s AND sc_id=%s AND bill_year=2024 AND bill_month=3", (cust_id, sc_id), is_select=True)
if not header_id:
    header_id = run_sql("windmill", "InsertHeader", "INSERT INTO eb_bill (customer_id, sc_id, bill_year, bill_month, created_at, created_by, is_submitted, pdf_file_path, modified_at, modified_by) VALUES (%s, %s, 2024, 3, NOW(), 1, 1, '', NOW(), 1)", (cust_id, sc_id))

if header_id:
    # eb_bill_details
    run_sql("windmill", "DelDetails", "DELETE FROM eb_bill_details WHERE eb_bill_header_id=%s", (header_id,))
    run_sql("windmill", "InsertDetails", "INSERT INTO eb_bill_details (eb_bill_header_id, customer_id, customer_service_id, self_generation_tax, created_by, is_submitted, created_at, modified_at, modified_by) VALUES (%s, %s, %s, 1500.50, 1, 1, NOW(), NOW(), 1)", (header_id, cust_id, sc_id))
    
    run_sql("windmill", "DelAdj", "DELETE FROM eb_bill_adjustment_charges WHERE eb_bill_header_id=%s", (header_id,))
    run_sql("windmill", "InsertAdj", "INSERT INTO eb_bill_adjustment_charges (eb_bill_header_id, energy_number, c001, c002, wheeling_charges, created_by, is_submitted, created_at, modified_at, modified_by) VALUES (%s, 'WM_TEST_001', 100.00, 200.00, 50.00, 1, 1, NOW(), NOW(), 1)", (header_id,))
    
    print(f"\nFINISH! Header ID: {header_id}")
else:
    print(f"\nFAILED to get header_id. Cust: {cust_id}, SC: {sc_id}")
