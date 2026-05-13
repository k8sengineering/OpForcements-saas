from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..models import ConferenceAttendee, User
from ..schemas import ConferenceAttendeeOut, ConferenceAttendeeCreate, UserOut

router = APIRouter()


def _to_out(a: ConferenceAttendee) -> ConferenceAttendeeOut:
    return ConferenceAttendeeOut(
        id=a.id,
        conference_id=a.conference_id,
        user=UserOut(
            id=a.user.id, name=a.user.name, email=a.user.email,
            title=a.user.title, specialty=a.user.specialty,
            slack_handle=a.user.slack_handle,
        ),
        role=a.role,
        hotel_name=a.hotel_name,
        hotel_address=a.hotel_address,
        check_in=a.check_in,
        check_out=a.check_out,
        flight_in=a.flight_in,
        flight_out=a.flight_out,
        notes=a.notes,
    )


@router.get("/{conference_id}", response_model=List[ConferenceAttendeeOut])
def get_attendees(conference_id: str, db: Session = Depends(get_db)):
    attendees = db.query(ConferenceAttendee).options(
        joinedload(ConferenceAttendee.user)
    ).filter(ConferenceAttendee.conference_id == conference_id).all()
    return [_to_out(a) for a in attendees]


@router.post("/", response_model=ConferenceAttendeeOut)
def create_attendee(body: ConferenceAttendeeCreate, db: Session = Depends(get_db)):
    existing = db.query(ConferenceAttendee).filter(
        ConferenceAttendee.conference_id == body.conference_id,
        ConferenceAttendee.user_id == body.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this conference")

    a = ConferenceAttendee(
        conference_id=body.conference_id,
        user_id=body.user_id,
        role=body.role,
        hotel_name=body.hotel_name,
        hotel_address=body.hotel_address,
        check_in=body.check_in,
        check_out=body.check_out,
        flight_in=body.flight_in,
        flight_out=body.flight_out,
        notes=body.notes,
    )
    db.add(a)
    db.commit()
    db.refresh(a)

    a = db.query(ConferenceAttendee).options(
        joinedload(ConferenceAttendee.user)
    ).filter(ConferenceAttendee.id == a.id).first()
    return _to_out(a)


@router.put("/{attendee_id}", response_model=ConferenceAttendeeOut)
def update_attendee(attendee_id: str, body: ConferenceAttendeeCreate, db: Session = Depends(get_db)):
    a = db.query(ConferenceAttendee).filter(ConferenceAttendee.id == attendee_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Attendee not found")
    for field in ["role", "hotel_name", "hotel_address", "check_in", "check_out",
                  "flight_in", "flight_out", "notes"]:
        val = getattr(body, field, None)
        if val is not None:
            setattr(a, field, val)
    db.commit()
    db.refresh(a)
    a = db.query(ConferenceAttendee).options(
        joinedload(ConferenceAttendee.user)
    ).filter(ConferenceAttendee.id == a.id).first()
    return _to_out(a)


@router.delete("/{attendee_id}")
def delete_attendee(attendee_id: str, db: Session = Depends(get_db)):
    a = db.query(ConferenceAttendee).filter(ConferenceAttendee.id == attendee_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Attendee not found")
    db.delete(a)
    db.commit()
    return {"deleted": attendee_id}
