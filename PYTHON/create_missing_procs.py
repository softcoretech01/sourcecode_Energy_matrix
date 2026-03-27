import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def create_missing_procs():
    print("Creating missing check procedures in masters database...")
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database="masters")
        cursor = conn.cursor()
        
        # 1. check_customer_exists
        cursor.execute("DROP PROCEDURE IF EXISTS check_customer_exists")
        cursor.execute("""
            CREATE PROCEDURE check_customer_exists(IN p_customer_id INT)
            BEGIN
                SELECT id FROM master_customers WHERE id = p_customer_id LIMIT 1;
            END
        """)
        print("Created check_customer_exists")
        
        # 2. check_service_number_exists
        cursor.execute("DROP PROCEDURE IF EXISTS check_service_number_exists")
        cursor.execute("""
            CREATE PROCEDURE check_service_number_exists(IN p_service_id INT)
            BEGIN
                SELECT id FROM customer_service WHERE id = p_service_id LIMIT 1;
            END
        """)
        print("Created check_service_number_exists")
        
        # 3. check_windmill_exists
        cursor.execute("DROP PROCEDURE IF EXISTS check_windmill_exists")
        cursor.execute("""
            CREATE PROCEDURE check_windmill_exists(IN p_windmill_id INT)
            BEGIN
                SELECT id FROM master_windmill WHERE id = p_windmill_id LIMIT 1;
            END
        """)
        print("Created check_windmill_exists")
        
        conn.commit()
        conn.close()
        print("\nAll procedures created successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_missing_procs()
