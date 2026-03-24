from app.utils.auth_utils import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_connection
import pymysql
from app.schemas.total_shares_schema import (
    TotalSharesCreate,
    TotalSharesUpdate,
    TotalSharesResponse,
    TotalSharesMessage
)

router = APIRouter(
    prefix="/total-shares",
    tags=["Total Shares"]
)

# =====================================================
# CREATE TOTAL SHARES
# =====================================================

@router.post("/", response_model=TotalSharesMessage)
async def create_total(data: TotalSharesCreate, user: dict = Depends(get_current_user)):

    total_company = int(data.total_company_shares)
    investor = int(data.investor_shares)

    if investor > total_company:
        raise HTTPException(status_code=400, detail="Investor shares cannot exceed total shares")

    customer_shares = total_company - investor

    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    # Ensure only one configuration row is used (id=1), no new rows (id=2+) are created.
    cursor.execute("SELECT id FROM configuration WHERE id = 1")
    existing = cursor.fetchone()

    if existing:
        cursor.execute(
            "CALL sp_update_total_share(%s,%s,%s,%s,%s,%s)",
            (
                1,
                total_company,
                investor,
                customer_shares,
                data.is_submitted,
                user["id"]
            )
        )
        conn.commit()
        cursor.close()
        conn.close()
        return {
            "message": "Total shares updated",
            "id": 1,
            "customer_shares": customer_shares
        }

    # Upsert using stored procedure; see sp_upsert_total_shares.
    cursor.callproc(
        "sp_upsert_total_shares",
        (
            total_company,
            investor,
            customer_shares,
            data.is_submitted,
            user["id"]
        )
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "message": "Total shares created/updated",
        "id": 1,
        "customer_shares": customer_shares
    }

# =====================================================
# GET ALL TOTAL SHARES
# =====================================================

@router.get("/", response_model=list[TotalSharesResponse])
async def get_totals(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL sp_get_total_shares()")
    rows = cursor.fetchall()

    cursor.close()
    conn.close()
    return rows


@router.get("/{id}")
async def get_total_shares_by_id(id: int):

    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("CALL sp_get_total_shares_by_id(%s)", (id,))
    row = cursor.fetchone()

    cursor.close()
    conn.close()

    return row




@router.put("/{id}", response_model=TotalSharesMessage)
async def update_total(id: int, data: TotalSharesUpdate, user: dict = Depends(get_current_user)):
    # enforce id=1 for all updates to avoid any other record being modified
    id = 1

    total_company = int(data.total_company_shares)
    investor = int(data.investor_shares)

    if investor > total_company:
        raise HTTPException(status_code=400, detail="Investor shares cannot exceed total shares")

    customer_shares = total_company - investor

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("CALL sp_update_total_share(%s,%s,%s,%s,%s,%s)", (
        id,
        total_company,
        investor,
        customer_shares,
        data.is_submitted,
        user["id"]
    ))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "message": "Total shares updated",
        "customer_shares": customer_shares
    }

