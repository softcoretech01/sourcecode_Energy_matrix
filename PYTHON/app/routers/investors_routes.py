import pymysql
from fastapi import APIRouter, Depends
from app.database import get_connection as get_db
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/investors", tags=["Investors"])


@router.post("/create")
def create_investor(data: dict, user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor()

    status = data.get("status", 1)
    try:
        status = int(status)
    except (TypeError, ValueError):
        status = 1

    cursor.execute(
        """
        INSERT INTO master_investors (
            investor_name,
            share_quantity,
            created_by,
            created_at,
            status,
            is_submitted
        ) VALUES (%s, %s, %s, NOW(), %s, 0)
        """,
        (
            data.get("investor_name", ""),
            data.get("share_quantity", 0),
            user["id"],
            status,
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

    cursor.execute("SELECT * FROM master_investors ORDER BY id DESC")

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data


@router.get("/{id}")
def get_investor_by_id(id: int, user=Depends(get_current_user)):

    conn = get_db()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute(
        "SELECT * FROM master_investors WHERE id=%s",
        (id,)
    )

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

    cursor.execute(
        """
        UPDATE master_investors
        SET investor_name=%s,
            share_quantity=%s,
            status=%s,
            modified_by=%s,
            modified_at=NOW()
        WHERE id=%s
        """,
        (
            data["investor_name"],
            data["share_quantity"],
            status,
            user["id"],
            id
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

    cursor.execute(
        """
        UPDATE master_investors
        SET is_submitted=1,
            modified_by=%s,
            modified_at=NOW()
        WHERE id=%s
        """,
        (user["id"], id)
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Investor submitted"}