from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Conference
from ..schemas import ConferenceOut

router = APIRouter()


@router.get("/", response_model=List[ConferenceOut])
def list_conferences(db: Session = Depends(get_db)):
    return [
        ConferenceOut(
            id=c.id, name=c.name, city=c.city, state=c.state,
            start_date=c.start_date, end_date=c.end_date,
            ebx_slots=c.ebx_slots, description=c.description,
        )
        for c in db.query(Conference).order_by(Conference.start_date).all()
    ]
