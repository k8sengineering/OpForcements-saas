from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from ..database import get_db
from ..models import Opportunity
from ..schemas import OpportunityOut

router = APIRouter()


def _to_out(opp: Opportunity) -> OpportunityOut:
    return OpportunityOut(
        id=opp.id,
        name=opp.name,
        amount=opp.amount,
        close_date=opp.close_date,
        probability=opp.probability,
        stage=opp.stage,
        priority_score=opp.priority_score,
        account_id=opp.account_id,
        account_name=opp.account.name if opp.account else None,
        owner_id=opp.owner_id,
        owner_name=opp.owner.name if opp.owner else None,
        owner_specialty=opp.owner.specialty if opp.owner else None,
    )


@router.get("/", response_model=List[OpportunityOut])
def list_opportunities(
    stage: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    min_probability: Optional[float] = None,
    city: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    q = db.query(Opportunity).options(
        joinedload(Opportunity.account),
        joinedload(Opportunity.owner),
    )
    if stage:
        q = q.filter(Opportunity.stage == stage)
    if min_amount is not None:
        q = q.filter(Opportunity.amount >= min_amount)
    if max_amount is not None:
        q = q.filter(Opportunity.amount <= max_amount)
    if min_probability is not None:
        q = q.filter(Opportunity.probability >= min_probability)
    if city:
        from ..models import Account
        q = q.join(Account).filter(Account.billing_city.ilike(f"%{city}%"))

    opps = q.offset(offset).limit(limit).all()
    result = [_to_out(o) for o in opps]
    result.sort(key=lambda x: x.priority_score, reverse=True)
    return result


@router.get("/{opp_id}", response_model=OpportunityOut)
def get_opportunity(opp_id: str, db: Session = Depends(get_db)):
    opp = db.query(Opportunity).options(
        joinedload(Opportunity.account),
        joinedload(Opportunity.owner),
    ).filter(Opportunity.id == opp_id).first()
    return _to_out(opp)
