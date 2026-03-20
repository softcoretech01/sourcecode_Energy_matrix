from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ===============================
# CREATE CUSTOMER SHARE
# ===============================
class CustomerShareCreate(BaseModel):
    customer_id: int
    share_quantity: int
    status: Optional[int] = 1
    is_submitted: Optional[int] = 0


# ===============================
# UPDATE CUSTOMER SHARE
# ===============================
class CustomerShareUpdate(BaseModel):
    share_quantity: int
    status: Optional[int] = 1
    is_submitted: Optional[int] = 0


# ===============================
# RESPONSE MODEL
# ===============================
class CustomerShareResponse(BaseModel):
    id: int
    customer_id: int
    share_quantity: int
    status: int
    is_submitted: int
    created_by: Optional[int]
    created_at: Optional[datetime]
    modified_by: Optional[int]
    modified_at: Optional[datetime]