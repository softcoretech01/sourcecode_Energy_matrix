import pymysql
from fastapi import APIRouter, Depends
from app.database import get_connection as get_db
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/investors", tags=["Investors"])


@router.post("/create")
def create_investor(data: dict, user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor()

    is_submitted = data.get("is_submitted", 0)
    try:
        is_submitted = int(is_submitted)
    except (TypeError, ValueError):
        is_submitted = 0

    cursor.callproc(
        "sp_insert_investor",
        (
            data.get("investor_name", ""),
            data.get("share_quantity", 0),
            user["id"],
            1,
            is_submitted,
        )
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Investor created successfully"}


@router.get("/list")
def get_investors(user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.callproc("sp_get_investors")

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data


@router.get("/{id}")
def get_investor_by_id(id: int, user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.callproc("sp_get_investor_by_id", (id,))

    data = cursor.fetchone()

    cursor.close()
    conn.close()

    return data


@router.put("/update/{id}")
def update_investor(id: int, data: dict, user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor()

    status = data.get("status", 1)
    try:
        status = int(status)
    except (TypeError, ValueError):
        status = 1

    cursor.callproc(
        "sp_update_investor",
        (
            id,
            data["investor_name"],
            data["share_quantity"],
            status,
            user["id"]
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Investor updated successfully"}


@router.put("/submit/{id}")
def submit_investor(id: int, user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor()

    cursor.callproc("sp_submit_investor", (id, user["id"]))

    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Investor submitted"}