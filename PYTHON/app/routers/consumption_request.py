from fastapi import APIRouter, Depends
from app.utils.auth_utils import get_current_user
from app.models.consumption_model import (
    get_consumption_dropdown,
    get_consumption_list,
    save_consumption_request,
)

router = APIRouter(prefix="/consumption-request", tags=["Consumption Request"])


@router.get("/dropdown-data")
def get_customer_dropdown_data(user=Depends(get_current_user)):
    """
    Returns distinct active+posted customers for the consumption request dropdown.
    Delegates to model → SP: GetConsumptionDropdownData
    """
    try:
        return get_consumption_dropdown()
    except Exception as e:
        return {"error": str(e)}


@router.get("/list")
def list_consumption_requests(year: int, month: int, user=Depends(get_current_user)):
    """
    Fetches saved consumption requests for a specific year and month.
    Delegates to model → SP: sp_get_consumption_requests
    """
    try:
        return get_consumption_list(year, month)
    except Exception as e:
        return {"error": str(e)}


@router.post("/save")
def save_consumption_request_endpoint(data: dict, user=Depends(get_current_user)):
    """
    Saves or updates customer consumption request rows.
    Delegates each row to model → SP: sp_save_consumption_request
    """
    year = data.get("year")
    month = data.get("month")
    day = data.get("day", 1)
    requests = data.get("requests", [])

    if not year or not month or not requests:
        return {"error": "Missing year, month, or requests data"}

    try:
        for req in requests:
            save_consumption_request(
                customer_id=req.get("customer_id"),
                service_id=req.get("service_id"),
                c1=float(req.get("c1") or 0),
                c2=float(req.get("c2") or 0),
                c4=float(req.get("c4") or 0),
                c5=float(req.get("c5") or 0),
                total=float(req.get("total") or 0),
                year=year,
                month=month,
                day=day,
                user_id=user["id"],
            )
        return {"message": "Consumption requests saved successfully"}
    except Exception as e:
        return {"error": str(e)}
