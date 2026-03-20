from datetime import datetime, timedelta

from app.utils.auth_utils import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_connection
import pymysql
from app.schemas.email_schema import (
    EmailMasterCreate,
    EmailMasterUpdate,
    EmailMasterResponse,
    EmailMasterMessage
)
router = APIRouter(
    prefix="/email-master",
    tags=["Email"]
)


# =====================================================
# ADD EMAIL CONFIG
# =====================================================

@router.post("/")
async def add_email(data: EmailMasterCreate, user: dict = Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("CALL sp_add_email(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", (
            data.email_id,
            data.email_category,
            data.email_time,
            data.occurrences,
            data.email_cc,
            data.email_to,
            data.email_subject,
            data.email_content,
            data.is_submitted,
            1
        ))

        conn.commit()
        return {"message": "Email configuration saved successfully"}

    except Exception as e:
        print("DATABASE ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# GET ALL EMAIL CONFIGS
# =====================================================

@router.get("/", response_model=list[EmailMasterResponse])
async def get_emails(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL sp_get_emails()")
    rows = cursor.fetchall()
    cursor.nextset()

    from datetime import time

    for row in rows:
        if row.get("email_time"):
            seconds = row["email_time"].seconds
            row["email_time"] = str(time(
                seconds // 3600,
                (seconds % 3600) // 60,
                seconds % 60
            ))

    cursor.close()
    conn.close()

    return rows


# =====================================================
# GET SINGLE EMAIL CONFIG
# =====================================================

@router.get("/{email_id}", response_model=EmailMasterResponse)
async def get_email(email_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL sp_get_email_by_id(%s)", (email_id,))
    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Email config not found")

    # 🔧 FIX: convert timedelta to time
    if isinstance(row["email_time"], timedelta):
        row["email_time"] = (datetime.min + row["email_time"]).time()

    return row


# =====================================================
# UPDATE EMAIL CONFIG
# =====================================================

@router.put("/{email_id}", response_model=EmailMasterMessage)
async def update_email(email_id: int, data: EmailMasterUpdate, user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor()

    # 🔧 Fix time format
    email_time = data.email_time
    if isinstance(email_time, str) and len(email_time) == 5:
        email_time = email_time + ":00"

    cursor.execute("CALL sp_update_email(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", (
        email_id,
        data.email_id,
        data.email_category,
        email_time,
        data.occurrences,
        data.email_cc,
        data.email_to,
        data.email_subject,
        data.email_content,
        data.is_submitted,
        1
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Email configuration updated successfully"}


# =====================================================
# DELETE EMAIL CONFIG
# =====================================================

@router.delete("/{email_id}", response_model=EmailMasterMessage)
async def delete_email(email_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("CALL sp_delete_email(%s)", (email_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Email configuration deleted successfully"}
