from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from ..database import get_db
from ..models import Account
from ..schemas import TravelSuggestionResponse
from .accounts import _account_to_detail

router = APIRouter()


@router.get("/", response_model=TravelSuggestionResponse)
def travel_suggestions(
    city: str = Query(..., description="City to visit"),
    state: Optional[str] = Query(None, description="State abbreviation"),
    db: Session = Depends(get_db),
):
    q = db.query(Account).options(
        joinedload(Account.opportunities),
        joinedload(Account.contacts),
    ).filter(Account.billing_city.ilike(f"%{city}%"))

    if state:
        q = q.filter(Account.billing_state.ilike(f"%{state}%"))

    accounts = q.all()
    detailed = [_account_to_detail(a, db) for a in accounts]
    detailed.sort(key=lambda a: a.top_score, reverse=True)

    total_pipeline = sum(a.total_pipeline for a in detailed)

    # Regional pipeline: all accounts in the state, grouped by city
    regional_pipeline = []
    regional_total = 0.0
    if state:
        state_accounts = (
            db.query(Account)
            .options(joinedload(Account.opportunities))
            .filter(Account.billing_state.ilike(f"%{state}%"))
            .all()
        )
        city_map: dict = {}
        for acc in state_accounts:
            c = acc.billing_city or "Unknown"
            city_map[c] = city_map.get(c, 0) + sum(o.amount for o in acc.opportunities)
        regional_total = sum(city_map.values())
        regional_pipeline = sorted(
            [{"city": k, "pipeline": round(v)} for k, v in city_map.items() if v > 0],
            key=lambda x: x["pipeline"],
            reverse=True,
        )

    return TravelSuggestionResponse(
        city=city,
        state=state or "",
        total_accounts=len(detailed),
        total_pipeline=total_pipeline,
        accounts=detailed,
        regional_pipeline=regional_pipeline,
        regional_total=regional_total,
    )
