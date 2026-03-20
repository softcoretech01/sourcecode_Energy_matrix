from pydantic import BaseModel
from typing import Optional, Any, List


# ===============================
# EB STATEMENT UPLOAD RESPONSE
# ===============================
class EBStatementUploadResponse(BaseModel):
    message: str
    filename: str
    parsed_data: Optional[Any] = None
    header_id: Optional[int] = None

class ChargeItem(BaseModel):
    name: str
    amount: float
    code: Optional[str] = None

class EBStatementSaveRequest(BaseModel):
    eb_header_id: int
    company_name: str
    windmill_id: int
    slots: dict
    banking_slots: dict
    banking_units: float
    charges: List[ChargeItem]