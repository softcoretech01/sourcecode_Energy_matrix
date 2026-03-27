import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def insert_windmills():
    data = [
        ("Windmill", "039224391798", "WIND-039224391798"),
        ("Windmill", "039214391145", "WIND-039214391145"),
        ("Windmill", "039214391188", "WIND-039214391188"),
        ("Windmill", "039224391344", "WIND-039224391344"),
        ("Windmill", "039214391189", "WIND-039214391189"),
        ("Windmill", "039224391342", "WIND-039224391342"),
        ("Windmill", "039224391421", "WIND-039224391421"),
        ("Windmill", "039224320165", "WIND-039224320165"),
        ("Solar",    "059514500104", "SOLAR-059514500104")
    ]
    
    try:
        conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, database="masters")
        cursor = conn.cursor()
        
        print("Inserting windmill and solar numbers into masters.master_windmill...")
        
        for m_type, m_number, m_name in data:
            # Check if exists
            cursor.execute("SELECT id FROM master_windmill WHERE windmill_number = %s", (m_number,))
            if cursor.fetchone():
                print(f"Skipping {m_number} (already exists)")
                continue
                
            cursor.execute("""
                INSERT INTO master_windmill (type, windmill_number, windmill_name, status, created_at, created_by, is_submitted)
                VALUES (%s, %s, %s, 'Active', NOW(), 1, 1)
            """, (m_type, m_number, m_name))
            print(f"Inserted: {m_type} {m_number}")
            
        conn.commit()
        conn.close()
        print("\nAll numbers processed successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    insert_windmills()
