import pymysql
import os
from dotenv import load_dotenv

def apply_sp():
    load_dotenv()
    try:
        conn = pymysql.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME')
        )
        cursor = conn.cursor()
        
        # Read the SQL file
        with open('sp_get_active_posted_windmills.sql', 'r') as f:
            lines = f.readlines()
            # Combine lines and handle DELIMITER
            sql = "".join(lines)
            # Remove DELIMITER keywords which are for MySQL client, not library
            # Need to execute DROP and CREATE separately
            
            # Simple approach: Split by '//' since I used that as delimiter
            parts = sql.split('//')
            for part in parts:
                cleaned = part.replace('DELIMITER //', '').replace('DELIMITER ;', '').strip()
                if cleaned:
                    cursor.execute(cleaned)
        
        conn.commit()
        print("Successfully applied sp_get_active_posted_windmills_for_allotment")
        
    except Exception as e:
        print(f"Error applying SP: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    apply_sp()
