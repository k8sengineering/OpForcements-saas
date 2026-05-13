from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..auth import verify_password, create_access_token, get_current_user
from ..schemas import LoginRequest, TokenResponse
import os

router = APIRouter()

TENANT_ID = os.getenv("TENANT_ID", "default")
TENANT_NAME = os.getenv("TENANT_NAME", "OpForcements")


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email, User.is_active == 1).first()
    if not user or not verify_password(body.password, user.password_hash or ""):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "tenant_id": TENANT_ID,
        "tenant_name": TENANT_NAME,
    })
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_name=user.name,
        user_email=user.email,
        user_role=user.role,
        tenant_id=TENANT_ID,
        tenant_name=TENANT_NAME,
    )


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "tenant_id": TENANT_ID,
        "tenant_name": TENANT_NAME,
    }
