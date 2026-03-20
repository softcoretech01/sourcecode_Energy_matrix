from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ===============================
# CREATE CUSTOMER MODEL
# ===============================
class CustomerCreate(BaseModel):
    customer_name: str
    city: str
    phone_no: str
    email: EmailStr
    address: str
    gst_number: str
    status: Optional[int] = 1
    is_submitted: Optional[int] = 0


# ===============================
# UPDATE CUSTOMER MODEL
# ===============================
class CustomerUpdate(BaseModel):
    customer_name: str
    city: str
    phone_no: str
    email: EmailStr
    address: str
    gst_number: str
    status: Optional[int]
    is_submitted: Optional[int]


# ===============================
# RESPONSE MODEL
# ===============================
class CustomerResponse(BaseModel):
    id: int
    customer_name: str
    city: str
    phone_no: str
    email: str
    address: str
    gst_number: str
    status: int
    created_by: Optional[int]
    created_at: Optional[datetime]
    modified_by: Optional[int]
    modified_at: Optional[datetime]
    is_submitted: Optional[int]

# ===============================
# AGREED UNITS
# ===============================
class AgreedUnitsRow(BaseModel):
    month: str
    c1: Optional[str | int | float] = ""
    c2: Optional[str | int | float] = ""
    c4: Optional[str | int | float] = ""
    c5: Optional[str | int | float] = ""

class AgreedUnitsRequest(BaseModel):
    total_agreed_units: Optional[str | int | float] = ""
    unit_allocation: List[AgreedUnitsRow]