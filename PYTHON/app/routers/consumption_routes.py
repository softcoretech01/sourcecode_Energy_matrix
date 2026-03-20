from datetime import date
from typing import Optional
from pydantic import BaseModel
import pymysql
from fastapi import APIRouter, Depends
from app.database import get_connection as get_db
from app.utils.auth_utils import get_current_user
from fastapi import HTTPException


class ConsumptionCreate(BaseModel):
    energy_type: str
    charge_code: str
    charge_name: str
    cost: float
    uom: str
    type: str
    charge_description: Optional[str]
    valid_upto: Optional[date]
    discount_charges: Optional[float]
    is_submitted: int   # 0 = Save, 1 = Post


router = APIRouter(prefix="/consumption", tags=["Consumption"])

@router.post("/add")
def add_consumption(data: ConsumptionCreate, user=Depends(get_current_user)):
    connection = get_db()
    cursor = connection.cursor()

    try:
        cursor.callproc("sp_add_consumption", [
            0,  # p_id (not used for insert)
            data.energy_type,
            data.charge_code,
            data.charge_name,
            data.cost,
            data.uom,
            data.type,
            data.charge_description,
            data.valid_upto,
            data.discount_charges,
            data.is_submitted,
            user["id"]
        ])

        connection.commit()

        return {
           
            "is_submitted": data.is_submitted
        }

    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        connection.close()


@router.get("/list")
def list_consumption(user=Depends(get_current_user)):

    db = get_db()
    cursor = db.cursor(pymysql.cursors.DictCursor)

    cursor.callproc("sp_get_consumption")

    return cursor.fetchall()


@router.get("/{id}")
def get_consumption(id: int, user=Depends(get_current_user)):

    db = get_db()
    cursor = db.cursor(pymysql.cursors.DictCursor)

    cursor.callproc("sp_get_consumption_by_id", (id,))

    return cursor.fetchone()


@router.put("/update/{id}")
def update_consumption(id: int, data: ConsumptionCreate, user=Depends(get_current_user)):
    connection = get_db()
    cursor = connection.cursor()

    try:
        cursor.callproc("sp_update_consumption", [
            id,
            data.energy_type,
            data.charge_code,
            data.charge_name,
            data.cost,
            data.uom,
            data.type,
            data.charge_description,
            data.valid_upto,
            data.discount_charges,
            data.is_submitted,
            user["id"]
        ])

        connection.commit()

        return {
            "message": "Consumption updated successfully",
            "is_submitted": data.is_submitted
        }

    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        connection.close()



@router.delete("/delete/{id}")
def delete_consumption(id: int, user=Depends(get_current_user)):

    db = get_db()
    cursor = db.cursor()

    try:
        cursor.callproc("sp_delete_consumption", (id,))
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        db.close()

    return { "Consumption deleted successfully"}