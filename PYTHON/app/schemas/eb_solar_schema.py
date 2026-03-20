from pydantic import BaseModel
from typing import Optional, Dict, Any, List


# ===============================
# UPLOAD RESPONSE
# ===============================
class EBSolarUploadResponse(BaseModel):
    message: str
    filename: str


# ===============================
# PARSED PDF DATA
# ===============================
class SolarParsedData(BaseModel):
    full_text: Optional[str]


# ===============================
# READ PDF RESPONSE
# ===============================
class SolarChargeItem(BaseModel):
    name: str
    amount: float
    code: Optional[str] = None

class EBSolarSaveRequest(BaseModel):
    eb_header_id: Optional[int] = None
    company_name: str
    solar_id: int
    slots: Dict[str, Any]
    banking_slots: Optional[Dict[str, Any]] = None
    banking_units: Optional[float] = 0.0
    charges: List[SolarChargeItem]

class EBSolarReadResponse(BaseModel):
    message: str
    filename: str
    parsed: Dict[str, Any]
    header_id: Optional[int] = None
    warning: Optional[str] = None


# ===============================
# SEARCH / LIST RESPONSE MODELS
# ===============================
from typing import Optional, Dict, Any, List, Union

class EBSolarRecord(BaseModel):
    id: Optional[int] = None
    reading_date: Optional[str] = None
    solar_id: Optional[Union[int, str]] = None
    solar_number: Optional[Union[int, str]] = None
    pdf_file_path: Optional[str] = None
    exported_kwh: Optional[float] = None
    consumed_kwh: Optional[float] = None
    unit_value_export: Optional[float] = None
    net_payable: Optional[float] = None
    is_submitted: Optional[int] = None
    status: Optional[str] = None
    year: Optional[int] = None
    month: Optional[str] = None


class EBSolarListResponse(BaseModel):
    total: int
    items: List[EBSolarRecord]