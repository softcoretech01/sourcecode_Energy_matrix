from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ===============================
# CREATE EDC CIRCLE
# ===============================
class EDCCircleCreate(BaseModel):
    edc_name: str
    status: Optional[str] = "1"
    is_submitted: Optional[int] = 0


# ===============================
# UPDATE EDC CIRCLE
# ===============================
class EDCCircleUpdate(BaseModel):
    edc_name: str
    status: Optional[str] = "1"
    is_submitted: Optional[int] = 0


# ===============================
# RESPONSE MODEL
# ===============================
class EDCCircleResponse(BaseModel):
    id: int
    edc_name: str
    status: Optional[str]
    is_submitted: Optional[int]
    created_by: Optional[int]
    created_at: Optional[datetime]
    modified_by: Optional[int]
    modified_at: Optional[datetime]


# ===============================
# GENERIC MESSAGE RESPONSE
# ===============================
class EDCCircleMessage(BaseModel):
    message: str