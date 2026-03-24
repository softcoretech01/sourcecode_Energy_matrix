from pydantic import BaseModel
from typing import Optional
from datetime import time, datetime

# ===============================
# CREATE EMAIL CONFIG
# ===============================
class EmailMasterCreate(BaseModel):
    email_id: str
    email_category: Optional[str] = None
    email_time: Optional[time] = None
    occurrences: Optional[int] = None
    email_cc: Optional[str] = None
    email_to: Optional[str] = None
    email_subject: Optional[str] = None
    email_content: Optional[str] = None
    status: Optional[int] = 1
    is_submitted: Optional[int] = 0

# ===============================
# UPDATE EMAIL CONFIG
# ===============================
class EmailMasterUpdate(BaseModel):
    email_id: str
    email_category: Optional[str] = None
    email_time: Optional[time] = None
    occurrences: Optional[int] = None
    email_cc: Optional[str] = None
    email_to: Optional[str] = None
    email_subject: Optional[str] = None
    email_content: Optional[str] = None
    status: Optional[int] = None
    is_submitted: Optional[int] = 0

# ===============================
# RESPONSE MODEL
# ===============================
class EmailMasterResponse(BaseModel):
    id: int
    email_id: str
    email_category: Optional[str]
    email_time: Optional[time]
    occurrences: Optional[int]
    email_cc: Optional[str]
    email_to: Optional[str]
    email_subject: Optional[str]
    email_content: Optional[str]
    status: Optional[int]
    is_submitted: Optional[int]
    created_by: Optional[int]
    created_at: Optional[datetime]
    modified_by: Optional[int]
    modified_at: Optional[datetime]

# ===============================
# MESSAGE RESPONSE
# ===============================
class EmailMasterMessage(BaseModel):
    message: str