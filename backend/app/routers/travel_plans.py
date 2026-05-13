from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import date
from ..database import get_db
from ..models import TravelPlan, TravelPlanAccount, Account
from ..schemas import TravelPlanOut, TravelPlanCreate, AccountDetailOut, OpportunityOut, UserOut

router = APIRouter()


def _plan_to_out(plan: TravelPlan) -> TravelPlanOut:
    accounts = []
    for pa in plan.plan_accounts:
        a = pa.account
        if not a:
            continue
        opps = a.opportunities
        top_score = max((o.priority_score for o in opps), default=0)
        total_pipeline = sum(o.amount for o in opps)
        owner_out = None
        if a.owner:
            owner_out = UserOut(
                id=a.owner.id, name=a.owner.name, email=a.owner.email,
                title=a.owner.title, specialty=a.owner.specialty,
                slack_handle=a.owner.slack_handle,
            )
        opp_outs = [
            OpportunityOut(
                id=o.id, name=o.name, amount=o.amount, close_date=o.close_date,
                probability=o.probability, stage=o.stage,
                priority_score=o.priority_score,
                account_id=o.account_id, account_name=a.name,
                owner_id=o.owner_id,
                owner_name=o.owner.name if o.owner else None,
                owner_specialty=o.owner.specialty if o.owner else None,
            )
            for o in sorted(opps, key=lambda x: x.priority_score, reverse=True)
        ]
        accounts.append(AccountDetailOut(
            id=a.id, name=a.name,
            billing_city=a.billing_city, billing_state=a.billing_state,
            industry=a.industry, annual_revenue=a.annual_revenue or 0,
            account_type=a.account_type or "Prospect",
            product_interest=a.product_interest, website=a.website,
            top_score=top_score, total_pipeline=total_pipeline,
            open_opportunity_count=len(opps),
            owner=owner_out,
            opportunities=opp_outs,
            contacts=[],
        ))
    return TravelPlanOut(
        id=plan.id, city=plan.city, state=plan.state,
        travel_start=plan.travel_start, travel_end=plan.travel_end,
        created_at=plan.created_at,
        account_count=len(accounts),
        accounts=accounts,
    )


@router.get("/", response_model=List[TravelPlanOut])
def list_travel_plans(db: Session = Depends(get_db)):
    plans = db.query(TravelPlan).options(
        joinedload(TravelPlan.plan_accounts).joinedload(TravelPlanAccount.account).joinedload(Account.opportunities),
        joinedload(TravelPlan.plan_accounts).joinedload(TravelPlanAccount.account).joinedload(Account.owner),
    ).order_by(TravelPlan.travel_start).all()
    return [_plan_to_out(p) for p in plans]


@router.post("/", response_model=TravelPlanOut)
def create_travel_plan(body: TravelPlanCreate, db: Session = Depends(get_db)):
    plan = TravelPlan(
        city=body.city, state=body.state,
        travel_start=body.travel_start, travel_end=body.travel_end,
    )
    db.add(plan)
    db.flush()
    for account_id in body.account_ids:
        db.add(TravelPlanAccount(plan_id=plan.id, account_id=account_id))
    db.commit()
    db.refresh(plan)

    plan = db.query(TravelPlan).options(
        joinedload(TravelPlan.plan_accounts).joinedload(TravelPlanAccount.account).joinedload(Account.opportunities),
        joinedload(TravelPlan.plan_accounts).joinedload(TravelPlanAccount.account).joinedload(Account.owner),
    ).filter(TravelPlan.id == plan.id).first()
    return _plan_to_out(plan)


@router.delete("/{plan_id}")
def delete_travel_plan(plan_id: str, db: Session = Depends(get_db)):
    plan = db.query(TravelPlan).filter(TravelPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Travel plan not found")
    db.delete(plan)
    db.commit()
    return {"deleted": plan_id}
