from pydantic import BaseModel
from typing import List, Optional


# ===============================
# WINDMILL CHARGE ROW
# ===============================
class WindmillCharge(BaseModel):
    windmill: str
    charges: List[str]


# ===============================
# EB BILL RESPONSE MODEL
# ===============================
class EBBillResponse(BaseModel):
    header_id: int
    customer_name: Optional[str]
    service_number: Optional[str]
    self_generation_tax: Optional[str]
    columns: List[str]
    matched_rows: List[WindmillCharge]

# ===============================
# BULK SAVE REQUEST MODEL
# ===============================
class BulkSaveRequest(BaseModel):
    header_id: int
    customer_id: int
    service_number_id: int
    self_generation_tax: Optional[str] = None
    columns: List[str]
    matched_rows: List[WindmillCharge]