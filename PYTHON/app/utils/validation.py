from fastapi import HTTPException

def validate_customer(cursor, customer_id: int):
    cursor.callproc("check_customer_exists", [customer_id])
    if not cursor.fetchone():
        raise HTTPException(status_code=400, detail=f"Invalid Customer: ID {customer_id} does not exist.")
    # Consume result
    while cursor.nextset():
        pass

def validate_service_number(cursor, service_number_id: int):
    cursor.callproc("check_service_number_exists", [service_number_id])
    if not cursor.fetchone():
        raise HTTPException(status_code=400, detail=f"Invalid Service Number: ID {service_number_id} does not exist.")
    while cursor.nextset():
        pass

def validate_windmill(cursor, windmill_id):
    """Validate windmill existence using the masters database."""
    from app.database import get_connection
    conn_master = get_connection()
    cur_master = conn_master.cursor()
    try:
        cur_master.callproc("check_windmill_exists", [windmill_id])
        if not cur_master.fetchone():
            raise HTTPException(status_code=400, detail=f"Invalid Windmill: ID {windmill_id} does not exist.")
        while cur_master.nextset():
            pass
    finally:
        cur_master.close()
        conn_master.close()
