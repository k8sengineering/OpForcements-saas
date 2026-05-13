from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from ..database import get_db
from ..models import Account, User
from ..schemas import AccountOut, AccountDetailOut, OpportunityOut, ContactOut, UserOut

router = APIRouter()

SPECIALTY_MAP = {
    "Kubernetes Platform": "U001",
    "Networking": "U002",
    "Storage": "U003",
    "Security": "U004",
    "AI/ML": "U005",
    "Cloud Infrastructure": "U006",
}


def _user_out(u: User) -> UserOut:
    return UserOut(
        id=u.id, name=u.name, email=u.email,
        title=u.title, specialty=u.specialty,
        slack_handle=u.slack_handle,
    )


def _get_specialist(db: Session, product_interest: Optional[str]) -> Optional[User]:
    if not product_interest:
        return None
    uid = SPECIALTY_MAP.get(product_interest)
    if not uid:
        return None
    return db.query(User).filter(User.id == uid).first()


def _account_to_detail(account: Account, db: Session) -> AccountDetailOut:
    opps = sorted(account.opportunities, key=lambda o: o.priority_score, reverse=True)
    top_score = opps[0].priority_score if opps else 0
    total_pipeline = sum(o.amount for o in opps)

    specialist = _get_specialist(db, account.product_interest)
    owner_out = _user_out(account.owner) if account.owner else None

    return AccountDetailOut(
        id=account.id,
        name=account.name,
        billing_city=account.billing_city,
        billing_state=account.billing_state,
        industry=account.industry,
        annual_revenue=account.annual_revenue or 0,
        account_type=account.account_type or "Prospect",
        product_interest=account.product_interest,
        website=account.website,
        top_score=top_score,
        total_pipeline=total_pipeline,
        open_opportunity_count=len(opps),
        owner=owner_out,
        opportunities=[
            OpportunityOut(
                id=o.id, name=o.name, amount=o.amount, close_date=o.close_date,
                probability=o.probability, stage=o.stage,
                priority_score=o.priority_score, account_id=o.account_id,
                account_name=account.name,
                owner_id=o.owner_id,
                owner_name=o.owner.name if o.owner else None,
                owner_specialty=o.owner.specialty if o.owner else None,
            ) for o in opps
        ],
        contacts=[
            ContactOut(
                id=c.id, first_name=c.first_name, last_name=c.last_name,
                title=c.title, email=c.email, phone=c.phone,
                is_executive=c.is_executive,
            ) for c in account.contacts
        ],
        recommended_specialist=_user_out(specialist) if specialist else None,
    )


def _base_query(db: Session):
    return db.query(Account).options(
        joinedload(Account.owner),
        joinedload(Account.opportunities).joinedload(type(None)),
        joinedload(Account.contacts),
    )


@router.get("/", response_model=List[AccountOut])
def list_accounts(
    city: Optional[str] = None,
    state: Optional[str] = None,
    industry: Optional[str] = None,
    product_interest: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = _base_query(db)
    if city:
        q = q.filter(Account.billing_city.ilike(f"%{city}%"))
    if state:
        q = q.filter(Account.billing_state.ilike(f"%{state}%"))
    if industry:
        q = q.filter(Account.industry.ilike(f"%{industry}%"))
    if product_interest:
        q = q.filter(Account.product_interest.ilike(f"%{product_interest}%"))

    results = []
    for a in q.all():
        opps = a.opportunities
        top_score = max((o.priority_score for o in opps), default=0)
        total_pipeline = sum(o.amount for o in opps)
        results.append(AccountOut(
            id=a.id, name=a.name,
            billing_city=a.billing_city, billing_state=a.billing_state,
            industry=a.industry, annual_revenue=a.annual_revenue or 0,
            account_type=a.account_type or "Prospect",
            product_interest=a.product_interest, website=a.website,
            top_score=top_score, total_pipeline=total_pipeline,
            open_opportunity_count=len(opps),
            owner=_user_out(a.owner) if a.owner else None,
        ))
    results.sort(key=lambda x: x.top_score, reverse=True)
    return results


@router.get("/{account_id}", response_model=AccountDetailOut)
def get_account(account_id: str, db: Session = Depends(get_db)):
    account = _base_query(db).filter(Account.id == account_id).first()
    return _account_to_detail(account, db)
