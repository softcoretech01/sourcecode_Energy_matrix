from fastapi import HTTPException

import pymysql
from fastapi import APIRouter, Depends
from app.database import get_connection as get_db
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/transmission", tags=["Transmission"])


@router.post("/create")
def create_transmission(data: dict, user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.callproc(
            "sp_add_transmission_loss",
            (
                data["kva"],
                data["loss_percentage"],
                data["valid_from"], 
                data["remarks"],
                data["is_submitted"],
                user["id"]
            )
        )

        cursor.callproc("sp_update_avg_transmission_loss")

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Transmission created"}


@router.get("/dropdown")
def get_transmission_dropdown(user: dict = Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.callproc("sp_get_kva_dropdown")
    data = cursor.fetchall() 

    return data


@router.get("/list")
def list_transmission(user: dict = Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.callproc("sp_get_transmission_loss")
    data = cursor.fetchall() 

    return data

@router.get("/avg-loss")
def get_avg_loss(user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.callproc("sp_get_avg_transmission_loss")
    data = cursor.fetchone()

    return {"avg_loss": data["average_transmission_loss_percent"] if data else 0}


@router.get("/{id}")
def get_transmission(id: int, user: dict = Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.callproc("sp_get_transmission_loss_by_id", (id,))
    data = cursor.fetchall() 

    return data


@router.put("/update/{id}")
def update_transmission(id: int, data: dict, user=Depends(get_current_user)):

    print("DATA RECEIVED:", data)  # 👈 ADD THIS

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.callproc(
            "sp_update_transmission_loss",
            (
                id,
                data.get("kva"),
                data.get("loss_percentage"),
                data.get("valid_from"),   # safer
                data.get("remarks"),
                data.get("is_submitted"),
                user["id"]
            )
        )

        # status is not available on old stored proc in this code path;
        # call SP for status update.
        if data.get("status") is not None:
            cursor.callproc(
                "sp_update_transmission_loss_status",
                (
                    id,
                    int(data.get("status")),
                    user["id"]
                )
            )

        cursor.callproc("sp_update_avg_transmission_loss")

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("ERROR:", e)  # 👈 SEE REAL ERROR
        raise HTTPException(status_code=500, detail=str(e))

    return { "Updated successfully"}


@router.delete("/delete/{id}")
def delete_transmission_loss(id: int, user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.callproc("sp_delete_transmission_loss", (id,))
        
        # ✅ update avg
        cursor.callproc("sp_update_avg_transmission_loss")

        conn.commit()
    except pymysql.MySQLError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Delete failed: {e}")
    finally:
        cursor.close()
        conn.close()

    return { "Transmission loss record deleted successfully"}



