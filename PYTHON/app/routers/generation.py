from app.utils.auth_utils import get_current_user
from app.database import get_db, SessionLocalWindmill, get_connection
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import date, datetime
from typing import Optional, List
from app.models.windmill_models import DailyGeneration
from pydantic import BaseModel
from enum import Enum
router = APIRouter(
    prefix="/daily-generation",
    tags=["Daily Generation"]
)

class RegionEnum(str, Enum):
    TAMIL_NADU = 'Tamil Nadu'
    KARNATAKA = 'Karnataka'

class DailyGenerationCreate(BaseModel):
    region: RegionEnum
    transaction_date: Optional[date] = None
    windmill_number: str
    units: float
    expected_resume_date: Optional[date] = None
    remarks: Optional[str] = None
    created_by: str

class DailyGenerationResponse(BaseModel):
    id: int
    region: str
    transaction_date: Optional[date] = None
    windmill_number: str
    units: float
    status: str
    expected_resume_date: Optional[date]
    remarks: Optional[str]
    is_submitted: int
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class DailyGenerationUpdate(BaseModel):
    region: RegionEnum
    transaction_date: Optional[date] = None
    windmill_number: str
    units: float
    expected_resume_date: Optional[date] = None
    remarks: Optional[str] = None
    status: str
    modified_by: str


      


@router.get("/", response_model=List[DailyGenerationResponse])
def get_generation(
    from_date: date | None = None,
    to_date: date | None = None,
    keyword: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(DailyGeneration)

    if from_date and to_date:
        query = query.filter(
            func.date(DailyGeneration.created_at) >= from_date,
            func.date(DailyGeneration.created_at) <= to_date
        )

    if keyword:
        query = query.filter(
            DailyGeneration.windmill_number.ilike(f"%{keyword}%")
        )

    return query.all()



@router.post("/save", response_model=DailyGenerationResponse)
def save_daily_generation(
    payload: DailyGenerationCreate,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            CALL sp_daily_generation_save(
                :region,
                :transaction_date,
                :windmill_number,
                :units,
                :expected_resume_date,
                :remarks,
                :created_by
            )
        """),
        payload.model_dump()
    )

    row = result.mappings().first()
    db.commit()
    return row



@router.post("/post", response_model=DailyGenerationResponse)
def post_daily_generation(
    payload: DailyGenerationCreate,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            CALL sp_daily_generation_post(
                :region,
                :transaction_date,
                :windmill_number,
                :units,
                :expected_resume_date,
                :remarks,
                :created_by
            )
        """),
        payload.model_dump()
    )

    row = result.mappings().first()
    db.commit()
    return row




@router.put("/update/{id}", response_model=DailyGenerationResponse)
def update_daily_generation(
    id: int,
    payload: DailyGenerationUpdate,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            CALL sp_daily_generation_update(
                :id,
                :region,
                :transaction_date,
                :windmill_number,
                :units,
                :expected_resume_date,
                :remarks,
                :status,
                :modified_by
            )
        """),
        {
            "id": id,
            **payload.model_dump()
        }
    )

    row = result.mappings().first()
    db.commit()
    return row



@router.get("/windmill-list")
def get_windmill_list(user: dict = Depends(get_current_user)):
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Get windmills where type = 'windmill' only from master_windmill table
        cursor.execute("SELECT id, windmill_number FROM master_windmill WHERE type = 'windmill' ORDER BY windmill_number")
        
        rows = cursor.fetchall()
        
        windmills = []
        for row in rows:
            windmills.append({
                "id": row[0],
                "windmill_number": row[1]
            })
        
        return windmills
    
    finally:
        cursor.close()
        conn.close()



@router.delete("/delete/{id}")
def delete_generation(id: int, db: Session = Depends(get_db)):
    db.execute(
        text("CALL sp_daily_generation_delete(:p_id)"),
        {"p_id": id}
    )
    db.commit()

    return {"message": "Record deleted successfully"}



@router.get("/{id}")
def get_generation_by_id(id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    try:
        result = db.execute(
            text("CALL sp_get_generation_by_id(:p_id)"),
            {"p_id": id}
        )

        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Record not found")

        # Convert row to dictionary
        data = dict(row._mapping)

        return {
            "success": True,
            "data": data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
