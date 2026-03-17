import pymysql
from fastapi import APIRouter, Depends
from app.database import get_connection as get_db
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/consumption", tags=["Consumption"])

@router.post("/create")
def create_consumption(data: dict, user=Depends(get_current_user)):

    db=get_db()
    cursor=db.cursor()

    cursor.execute("""
        INSERT INTO consumption_charges
        (state,units_consumed,created_by)
        VALUES (%s,%s,%s)
    """,(data["state"],data["units_consumed"],user["id"]))

    db.commit()

    return {"message":"Consumption created"}


@router.get("/list")
def list_consumption(user=Depends(get_current_user)):

    db=get_db()
    cursor=db.cursor(pymysql.cursors.DictCursor)

    cursor.execute("SELECT * FROM consumption_charges")

    return cursor.fetchall()


@router.get("/{id}")
def get_consumption(id:int,user=Depends(get_current_user)):

    db=get_db()
    cursor=db.cursor(pymysql.cursors.DictCursor)

    cursor.execute("SELECT * FROM consumption_charges WHERE id=%s",(id,))

    return cursor.fetchone()


@router.put("/update/{id}")
def update_consumption(id:int,data:dict,user=Depends(get_current_user)):

    db=get_db()
    cursor=db.cursor()

    cursor.execute("""
        UPDATE consumption_charges
        SET state=%s,
            units_consumed=%s,
            modified_by=%s
        WHERE id=%s
    """,(data["state"],data["units_consumed"],user["id"],id))

    db.commit()

    return {"message":"Consumption updated"}


@router.put("/post/{id}")
def post_consumption(id:int,user=Depends(get_current_user)):

    db=get_db()
    cursor=db.cursor()

    cursor.execute("""
        UPDATE consumption_charges
        SET is_submitted=1,
            modified_by=%s
        WHERE id=%s
    """,(user["id"],id))

    db.commit()

    return {"message":"Consumption submitted"}