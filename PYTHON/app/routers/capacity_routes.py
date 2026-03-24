import pymysql
from fastapi import APIRouter, Depends
from app.database import get_connection as get_db
from app.utils.auth_utils import get_current_user
from pydantic import BaseModel

class CapacityCreate(BaseModel):
    capacity: float
    is_submitted: int


class CapacityUpdate(BaseModel):
    capacity: float
    status: int


router = APIRouter(prefix="/capacity", tags=["Capacity"])


@router.post("/create")
def create_capacity(data: CapacityCreate, user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor()

    cursor.callproc(
        "sp_create_capacity",
        (
            data.capacity,
            1,
            data.is_submitted,
            user["id"]
        )
    )

    # Fetch the LAST_INSERT_ID returned from procedure
    result = cursor.fetchone()
    new_id = result[0] if result else None

    # Ensure capacity value is stored exactly as provided
    if new_id is not None:
        cursor.execute("UPDATE master_capacity SET capacity=%s WHERE id=%s", (str(data.capacity), new_id))

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "message": "Capacity created successfully",
        "id": new_id
    }



@router.get("/dropdown")
def get_capacity_dropdown(user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL sp_get_capacity_dropdown()")

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data


@router.get("/list")
def get_capacity(user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("SELECT * FROM master_capacity")

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data


@router.get("/{id}")
def get_capacity_by_id(id: int, user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute(
        "SELECT * FROM master_capacity WHERE id=%s",
        (id,)
    )

    data = cursor.fetchone()

    cursor.close()
    conn.close()

    return data


@router.put("/update/{id}")
def update_capacity(id: int, data: dict, user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor()

    cursor.callproc(
        "sp_update_capacity",
        (
            id,
            data["capacity"],
            data["status"],
            data["is_submitted"],
            user["id"]
        )
    )

    # Ensure the capacity is stored exactly as provided
    cursor.execute("UPDATE master_capacity SET capacity=%s WHERE id=%s", (str(data["capacity"]), id))

    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Capacity updated successfully"}




   
@router.delete("/delete/{id}")
def delete_capacity(id: int, user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor()

    cursor.callproc("sp_delete_capacity", (id,))

    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Capacity deleted successfully"}