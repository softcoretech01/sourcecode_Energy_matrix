from fastapi import HTTPException

def validate_fk(cursor, table: str, column: str, id_val, entity_name: str):
    """Generic helper to validate if a foreign key exists in the database."""
    query = f"SELECT 1 FROM {table} WHERE {column} = %s"
    cursor.execute(query, (id_val,))
    if not cursor.fetchone():
        raise HTTPException(status_code=400, detail=f"Invalid {entity_name}: ID {id_val} does not exist.")

def validate_customer(cursor, customer_id: int):
    validate_fk(cursor, "master_customers", "id", customer_id, "Customer")

def validate_service_number(cursor, service_number_id: int):
    validate_fk(cursor, "customer_service", "id", service_number_id, "Service Number")

def validate_windmill(cursor, windmill_id):
    """Validate windmill existence using the masters database.
    The `master_windmill` table resides in the `masters` database, so we open a separate
    connection to that database for the check, regardless of the cursor passed in.
    """
    from app.database import get_connection
    # Open a connection to the masters DB
    conn_master = get_connection()
    cur_master = conn_master.cursor()
    try:
        validate_fk(cur_master, "master_windmill", "id", windmill_id, "Windmill")
    finally:
        cur_master.close()
        conn_master.close()
