from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..models import Account, Conference, EBXAssignment, User, Opportunity
from ..schemas import (
    EBXPriorityResponse, EBXPriorityItem, EBXAssignmentOut,
    EBXAssignmentCreate, ConferenceOut, UserOut
)
from .accounts import _account_to_detail, _get_specialist

router = APIRouter()


def _conf_out(c: Conference) -> ConferenceOut:
    return ConferenceOut(
        id=c.id, name=c.name, city=c.city, state=c.state,
        start_date=c.start_date, end_date=c.end_date,
        ebx_slots=c.ebx_slots, description=c.description,
    )


@router.get("/priorities/{conference_id}", response_model=EBXPriorityResponse)
def get_ebx_priorities(conference_id: str, db: Session = Depends(get_db)):
    conf = db.query(Conference).filter(Conference.id == conference_id).first()
    if not conf:
        raise HTTPException(status_code=404, detail="Conference not found")

    assigned_account_ids = {
        a.account_id for a in db.query(EBXAssignment).filter(
            EBXAssignment.conference_id == conference_id
        ).all()
    }

    accounts = db.query(Account).options(
        joinedload(Account.opportunities),
        joinedload(Account.contacts),
    ).all()

    scored = []
    for account in accounts:
        opps = account.opportunities
        if not opps:
            continue
        top_opp = max(opps, key=lambda o: o.priority_score)
        scored.append((account, top_opp, top_opp.priority_score))

    scored.sort(key=lambda x: x[2], reverse=True)

    items: List[EBXPriorityItem] = []
    for rank, (account, top_opp, score) in enumerate(scored, 1):
        detail = _account_to_detail(account, db)
        specialist = _get_specialist(db, account.product_interest)
        specialist_out = UserOut(
            id=specialist.id, name=specialist.name, email=specialist.email,
            title=specialist.title, specialty=specialist.specialty,
        ) if specialist else None

        from ..schemas import OpportunityOut
        top_opp_out = OpportunityOut(
            id=top_opp.id, name=top_opp.name, amount=top_opp.amount,
            close_date=top_opp.close_date, probability=top_opp.probability,
            stage=top_opp.stage, priority_score=top_opp.priority_score,
            account_id=top_opp.account_id,
            account_name=account.name,
            owner_id=top_opp.owner_id,
            owner_name=top_opp.owner.name if top_opp.owner else None,
            owner_specialty=top_opp.owner.specialty if top_opp.owner else None,
        )

        items.append(EBXPriorityItem(
            rank=rank,
            account=detail,
            top_opportunity=top_opp_out,
            recommended_specialist=specialist_out,
            priority_score=score,
            is_assigned=account.id in assigned_account_ids,
        ))

    return EBXPriorityResponse(
        conference=_conf_out(conf),
        items=items,
        available_slots=conf.ebx_slots,
        assigned_count=len(assigned_account_ids),
    )


@router.get("/assignments/{conference_id}", response_model=List[EBXAssignmentOut])
def get_assignments(conference_id: str, db: Session = Depends(get_db)):
    assignments = db.query(EBXAssignment).options(
        joinedload(EBXAssignment.account),
        joinedload(EBXAssignment.opportunity),
        joinedload(EBXAssignment.assigned_user),
    ).filter(EBXAssignment.conference_id == conference_id).all()

    return [
        EBXAssignmentOut(
            id=a.id, conference_id=a.conference_id,
            account_id=a.account_id, opportunity_id=a.opportunity_id,
            assigned_user_id=a.assigned_user_id, status=a.status, notes=a.notes,
            account_name=a.account.name if a.account else None,
            opportunity_name=a.opportunity.name if a.opportunity else None,
            assigned_user_name=a.assigned_user.name if a.assigned_user else None,
        )
        for a in assignments
    ]


@router.post("/assignments", response_model=EBXAssignmentOut)
def create_assignment(body: EBXAssignmentCreate, db: Session = Depends(get_db)):
    existing = db.query(EBXAssignment).filter(
        EBXAssignment.conference_id == body.conference_id,
        EBXAssignment.account_id == body.account_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account already assigned to this conference")

    conf = db.query(Conference).filter(Conference.id == body.conference_id).first()
    current_count = db.query(EBXAssignment).filter(
        EBXAssignment.conference_id == body.conference_id
    ).count()
    if current_count >= conf.ebx_slots:
        raise HTTPException(status_code=400, detail="No available EBX slots for this conference")

    assignment = EBXAssignment(
        conference_id=body.conference_id,
        account_id=body.account_id,
        opportunity_id=body.opportunity_id,
        assigned_user_id=body.assigned_user_id,
        notes=body.notes,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    account = db.query(Account).filter(Account.id == body.account_id).first()
    opp = db.query(Opportunity).filter(Opportunity.id == body.opportunity_id).first() if body.opportunity_id else None
    user = db.query(User).filter(User.id == body.assigned_user_id).first() if body.assigned_user_id else None

    return EBXAssignmentOut(
        id=assignment.id, conference_id=assignment.conference_id,
        account_id=assignment.account_id, opportunity_id=assignment.opportunity_id,
        assigned_user_id=assignment.assigned_user_id, status=assignment.status,
        notes=assignment.notes,
        account_name=account.name if account else None,
        opportunity_name=opp.name if opp else None,
        assigned_user_name=user.name if user else None,
    )


@router.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: str, db: Session = Depends(get_db)):
    a = db.query(EBXAssignment).filter(EBXAssignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(a)
    db.commit()
    return {"deleted": assignment_id}
