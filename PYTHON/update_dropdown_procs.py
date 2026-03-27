import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

host = os.getenv('DB_HOST', 'localhost')
user = os.getenv('DB_USER', 'root')
pwd = os.getenv('DB_PASSWORD', '')

def update_proc(db, name, body):
    try:
        conn = pymysql.connect(host=host, user=user, password=pwd, database=db)
        c = conn.cursor()
        c.execute(f"DROP PROCEDURE IF EXISTS {name}")
        c.execute(body)
        conn.commit()
        conn.close()
        print(f"✅ Updated {db}.{name}")
    except Exception as e:
        print(f"❌ Failed to update {db}.{name}: {e}")

# Procedures configuration
procs = [
    ('masters', 'sp_get_windmill_list_dropdown', '''
        CREATE PROCEDURE sp_get_windmill_list_dropdown()
        BEGIN
            SELECT id, windmill_number 
            FROM master_windmill 
            WHERE status = "Active" AND is_submitted = 1 
            ORDER BY windmill_number;
        END
    '''),
    ('windmill', 'get_active_windmill_numbers', '''
        CREATE PROCEDURE get_active_windmill_numbers()
        BEGIN
            SELECT id, windmill_number 
            FROM masters.master_windmill 
            WHERE status = "Active" AND is_submitted = 1 
            ORDER BY windmill_number;
        END
    '''),
    ('masters', 'sp_get_customer_dropdown', '''
        CREATE PROCEDURE sp_get_customer_dropdown()
        BEGIN
            SELECT id, customer_name 
            FROM master_customers 
            WHERE status = "Active" AND is_submitted = 1 
            ORDER BY customer_name;
        END
    '''),
    ('windmill', 'get_eb_bill_customers', '''
        CREATE PROCEDURE get_eb_bill_customers()
        BEGIN
            SELECT DISTINCT mc.id, mc.customer_name 
            FROM masters.master_customers mc
            WHERE mc.status = "Active" AND mc.is_submitted = 1
            ORDER BY mc.customer_name;
        END
    '''),
    ('windmill', 'get_eb_bill_service_number', '''
        CREATE PROCEDURE get_eb_bill_service_number(IN cust_id INT)
        BEGIN
            SELECT id, service_number 
            FROM masters.customer_service 
            WHERE customer_id = cust_id AND status = "Active"
            ORDER BY service_number;
        END
    '''),
    ('windmill', 'GetConsumptionDropdownData', '''
        CREATE PROCEDURE GetConsumptionDropdownData()
        BEGIN
            SELECT mc.id AS customer_id, mc.customer_name, cs.id AS service_id, cs.service_number
            FROM masters.master_customers mc
            JOIN masters.customer_service cs ON mc.id = cs.customer_id
            WHERE mc.is_submitted = 1 AND mc.status = "Active" AND cs.status = "Active"
            ORDER BY mc.customer_name;
        END
    ''')
]

for db, name, body in procs:
    update_proc(db, name, body)
