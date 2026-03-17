
from app.utils.auth_utils import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_connection
import pymysql
from app.schemas.customer_share_schema import (
    CustomerShareCreate,
    CustomerShareUpdate
)
from app.utils.validation import validate_customer

router = APIRouter(
    prefix="/customer-shares",
    tags=["Customer Shares"]
)

# =====================================================
# ADD CUSTOMER SHARE
# =====================================================

def _get_total_customer_shares(conn) -> float:
    """Return the latest configured total customer shares.

    This is used to compute share_percentage.
    """
    # Use a dict cursor so we can reference columns by name.
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    cursor.execute("CALL sp_get_total_shares()")
    result = cursor.fetchone()
    cursor.close()

    if result and "total_customer_shares" in result:
        return float(result["total_customer_shares"] or 0)
    return 0.0


@router.post("/")
async def add_customer_share(data: CustomerShareCreate, user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor()

    validate_customer(cursor, data.customer_id)

    cursor.execute("CALL sp_add_customer_share(%s,%s,%s,%s)",(
        data.customer_id,
        data.share_quantity,
        data.is_submitted,
        1
    ))

    inserted_id = cursor.lastrowid

    # Compute and persist share_percentage based on total customer shares
    total_customer_shares = _get_total_customer_shares(conn)
    if total_customer_shares > 0 and inserted_id:
        share_percentage = round((data.share_quantity / total_customer_shares) * 100, 2)
        cursor.execute(
            "UPDATE share_holdings_master SET share_percentage=%s WHERE id=%s",
            (share_percentage, inserted_id),
        )

    conn.commit()

    cursor.close()
    conn.close()

    return {"message":"Customer share saved"}


# =====================================================
# GET CUSTOMER SHARES BY TOTAL
# =====================================================

@router.get("/")
async def get_customer_shares(user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL sp_get_customer_shares_by_total()")
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return rows


@router.get("/customers")
async def get_customer_list(user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL get_customer_list()")
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return rows

# =====================================================
# GET TOTAL INVESTOR SHARES
# =====================================================
@router.get("/total-investor-shares")
async def get_total_investor_shares(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL sp_get_total_investor_shares()")

    result = cursor.fetchone()

    cursor.close()
    conn.close()

    return result

# =====================================================
# GET ONE CUSTOMER SHARE
# =====================================================

@router.get("/{id}")
async def get_customer_share(id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL sp_get_customer_share_by_id(%s)", (id,))

    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Customer share not found")

    return row


# =====================================================
# UPDATE CUSTOMER SHARE
# =====================================================

@router.put("/{id}")
async def update_customer_share(id: int, data: CustomerShareUpdate, user: dict = Depends(get_current_user)):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("CALL sp_update_customer_share(%s,%s,%s,%s)",(
        data.share_quantity,
        data.is_submitted,
        1,
        id
    ))

    # Recompute share_percentage with the latest total customer shares
    total_customer_shares = _get_total_customer_shares(conn)
    if total_customer_shares > 0:
        share_percentage = round((data.share_quantity / total_customer_shares) * 100, 2)
        cursor.execute(
            "UPDATE share_holdings_master SET share_percentage=%s WHERE id=%s",
            (share_percentage, id),
        )

    conn.commit()

    cursor.close()
    conn.close()

    return {"message":"Customer share updated"}

# =====================================================
# DELETE CUSTOMER SHARE
# =====================================================

@router.delete("/{id}")
async def delete_customer_share(id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("CALL sp_delete_customer_share(%s)", (id,))
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Customer share deleted"}
