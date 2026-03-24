from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# ===============================
# CREATE WINDMILL
# ===============================
class WindmillCreate(BaseModel):
    type: Optional[str] = "Windmill"

    windmill_number: str
    windmill_name: Optional[str] = None

    edc_circle_id: Optional[int] = None
    kva_id: int
    windmill_capacity: Optional[float] = None
    transmission_loss: Optional[float] = None
    capacity_id: Optional[int] = None

    ae_name: Optional[str] = None
    ae_number: Optional[str] = None
    status: Optional[str] = "Active"

    operator_name: Optional[str] = None
    operator_number: Optional[str] = None
    contact_number: Optional[str] = None

    amc_type: Optional[str] = None
    amc_head: Optional[str] = None
    amc_head_contact: Optional[str] = None
    amc_from_date: Optional[date] = None
    amc_to_date: Optional[date] = None

    insurance_policy_number: Optional[str] = None
    insurance_person_name: Optional[str] = None
    insurance_person_phone: Optional[str] = None
    insurance_from_date: Optional[date] = None
    insurance_to_date: Optional[date] = None

    minimum_level_generation: Optional[float] = None
    units_expiring: Optional[str] = None

    portal_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

    is_submitted: Optional[int] = 0


# ===============================
# RESPONSE MODEL
# ===============================
class WindmillResponse(BaseModel):

    id: int
    type: Optional[str]

    windmill_number: str
    windmill_name: Optional[str]

    edc_circle_id: Optional[int]
    edc_name: Optional[str]

    kva_id: Optional[int]
    windmill_capacity: Optional[float]
    capacity_id: Optional[int]
    transmission_loss: Optional[float]

    ae_number: Optional[str]

    status: Optional[str]

    operator_name: Optional[str]
    operator_number: Optional[str]
    contact_number: Optional[str]

    ae_name: Optional[str]

    amc_type: Optional[str]
    amc_head: Optional[str]
    amc_head_contact: Optional[str]
    amc_from_date: Optional[date]
    amc_to_date: Optional[date]

    insurance_policy_number: Optional[str]
    insurance_person_name: Optional[str]
    insurance_person_phone: Optional[str]
    insurance_from_date: Optional[date]
    insurance_to_date: Optional[date]

    minimum_level_generation: Optional[float]
    units_expiring: Optional[float]

    portal_url: Optional[str]
    username: Optional[str]

    is_submitted: Optional[int]

    created_by: Optional[str]
    created_at: Optional[datetime]

    modified_by: Optional[str]
    modified_at: Optional[datetime]


# ===============================
# MESSAGE RESPONSE
# ===============================
class WindmillMessage(BaseModel):
    message: str
    # when a windmill is created we may return the new record's id so
    # the frontend can immediately upload documents against it.
    id: Optional[int] = None