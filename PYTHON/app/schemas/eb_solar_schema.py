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
class EBSolarReadResponse(BaseModel):
    message: str
    filename: str
    parsed: Dict[str, Any]


# ===============================
# SEARCH / LIST RESPONSE MODELS
# ===============================
class EBSolarRecord(BaseModel):
    id: Optional[int]
    reading_date: Optional[str]
    solar_id: Optional[str]
    exported_kwh: Optional[float]
    consumed_kwh: Optional[float]
    unit_value_export: Optional[float]
    net_payable: Optional[float]
    status: Optional[str]
    year: Optional[int]
    month: Optional[int]


class EBSolarListResponse(BaseModel):
    total: int
    items: List[EBSolarRecord]