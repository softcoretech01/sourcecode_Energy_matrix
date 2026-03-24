from app.utils.auth_utils import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_connection
import pymysql
from app.schemas.edc_circle_schema import (
    EDCCircleCreate,
    EDCCircleUpdate,
    EDCCircleResponse,
    EDCCircleMessage
)

router = APIRouter(
    prefix="/edc-circle",
    tags=["EDC"]
)

# =====================================================
# ADD EDC
# =====================================================

@router.post("/", response_model=EDCCircleMessage)
async def add_edc(data: EDCCircleCreate, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("CALL sp_add_edc_circle(%s,%s,%s,%s)", (
        data.edc_name,
        1,
        data.is_submitted,
        1
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "EDC Circle created successfully"}


# =====================================================
# GET ALL EDC FOR DROPDOWN
# =====================================================

@router.get("/dropdown")
async def get_edc_dropdown(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL sp_get_edc_circle_dropdown()")
    rows = cursor.fetchall()

    cursor.close()
    conn.close()
    return rows


# =====================================================
# GET ALL EDC
# =====================================================

@router.get("/", response_model=list[EDCCircleResponse])
async def get_edc_list(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL sp_get_edc_circles()")
    rows = cursor.fetchall()

    cursor.close()
    conn.close()
    return rows


# =====================================================
# GET SINGLE EDC
# =====================================================

@router.get("/{edc_id}", response_model=EDCCircleResponse)
async def get_edc(edc_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL sp_get_edc_circle_by_id(%s)", (edc_id,))
    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="EDC not found")

    return row


# =====================================================
# UPDATE EDC
# =====================================================

@router.put("/{edc_id}", response_model=EDCCircleMessage)
async def update_edc(edc_id: int, data: EDCCircleUpdate, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("CALL sp_update_edc_circle(%s,%s,%s,%s,%s)", (
        edc_id,
        data.edc_name,
        data.status,
        data.is_submitted,
        1
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "EDC Circle updated successfully"}


# =====================================================
# DELETE EDC
# =====================================================

@router.delete("/{edc_id}", response_model=EDCCircleMessage)
async def delete_edc(edc_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("CALL sp_delete_edc_circle(%s)", (edc_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "EDC Circle deleted successfully"}
