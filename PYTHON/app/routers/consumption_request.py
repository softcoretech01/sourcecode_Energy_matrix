from fastapi import APIRouter, Depends
from typing import List, Optional
import pymysql
from app.database import get_connection as get_db
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/consumption-request", tags=["Consumption Request"])

@router.get("/dropdown-data")
def get_customer_dropdown_data(user=Depends(get_current_user)):
    """
    Fetches the dropdown data from masters.master_customers 
    and masters.customer_service using the stored procedure.
    """
    db = get_db()
    cursor = db.cursor(pymysql.cursors.DictCursor)
    try:
        cursor.execute("CALL windmill.GetConsumptionDropdownData()")
        return cursor.fetchall()
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        db.close()


@router.post("/save")
def save_consumption_request(data: dict, user=Depends(get_current_user)):
    """
    Saves or updates the customer consumption request data in the windmill database table.
    Expects a JSON payload containing 'year', 'month' and a list of 'requests' rows.
    """
    year = data.get('year')
    month = data.get('month')
    day = data.get('day', 1) # Defaulting to 1 if not provided, but expecting it from frontend
    requests = data.get('requests', [])

    if not year or not month or not requests:
        return {"error": "Missing year, month, or requests data"}

    db = get_db()
    cursor = db.cursor()
    
    try:
        for req in requests:
            customer_id = req.get('customer_id')
            service_id = req.get('service_id')
            c1 = req.get('c1', 0)
            c2 = req.get('c2', 0)
            c4 = req.get('c4', 0)
            c5 = req.get('c5', 0)
            total = req.get('total', 0)

            # Check if record already exists for this customer, service, year, month (ignoring day for the check)
            cursor.execute("""
                SELECT id FROM windmill.customer_consumption_requests 
                WHERE customer_id=%s AND service_id=%s AND billing_year=%s AND billing_month=%s
            """, (customer_id, service_id, year, month))
            
            existing = cursor.fetchone()

            if existing:
                # Update (overwrite the billing_day with the newly provided one)
                cursor.execute("""
                    UPDATE windmill.customer_consumption_requests
                    SET c1=%s, c2=%s, c4=%s, c5=%s, total=%s, billing_day=%s, modified_by=%s
                    WHERE id=%s
                """, (c1, c2, c4, c5, total, day, user['id'], existing[0]))
            else:
                # Insert
                cursor.execute("""
                    INSERT INTO windmill.customer_consumption_requests
                    (customer_id, service_id, c1, c2, c4, c5, total, billing_year, billing_month, billing_day, created_by)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (customer_id, service_id, c1, c2, c4, c5, total, year, month, day, user['id']))

        db.commit()
        return {"message": "Consumption requests saved successfully"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        cursor.close()
        db.close()


@router.get("/list")
def list_consumption_requests(year: int, month: int, user=Depends(get_current_user)):
    """
    Fetches the saved consumption requests for a specific year and month.
    Joins with master tables to return human-readable names.
    """
    db = get_db()
    cursor = db.cursor(pymysql.cursors.DictCursor)
    try:
        query = """
            SELECT 
                mc.id AS customer_id,
                mc.customer_name,
                cs.id AS service_id,
                cs.service_number AS sc_number,
                COALESCE(cc.c1, 0) AS c1,
                COALESCE(cc.c2, 0) AS c2,
                COALESCE(cc.c4, 0) AS c4,
                COALESCE(cc.c5, 0) AS c5,
                COALESCE(cc.total, 0) AS total,
                cc.id AS request_id
            FROM masters.master_customers mc
            INNER JOIN masters.customer_service cs ON mc.id = cs.customer_id
            LEFT JOIN windmill.customer_consumption_requests cc ON mc.id = cc.customer_id 
                AND cs.id = cc.service_id 
                AND cc.billing_year = %s 
                AND cc.billing_month = %s
            ORDER BY mc.customer_name, cs.service_number
        """
        cursor.execute(query, (year, month))
        return cursor.fetchall()
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        db.close()
