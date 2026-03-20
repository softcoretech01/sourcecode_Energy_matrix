from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_connection
import pymysql
from app.utils.auth_utils import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LogoutRequest(BaseModel):
    token: str = None


@router.post("/login")
def login(data: LoginRequest):

    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute(
        "SELECT id, name, email, password FROM users WHERE name=%s",
        (data.username,)
    )

    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username")

    if data.password != user["password"]:
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_access_token(user["id"], user["name"])

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }


@router.post("/logout")
def logout(data: LogoutRequest = None):
    """
    Logout endpoint - with stateless JWT tokens, logout is primarily 
    handled on the frontend by removing the token. This endpoint exists 
    for any cleanup operations that might be needed.
    """
    return {
        "message": "Logout successful"
    }
