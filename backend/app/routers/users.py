from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User
from ..schemas import UserOut

router = APIRouter()


@router.get("/", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    return [
        UserOut(id=u.id, name=u.name, email=u.email,
                title=u.title, specialty=u.specialty)
        for u in db.query(User).all()
    ]
