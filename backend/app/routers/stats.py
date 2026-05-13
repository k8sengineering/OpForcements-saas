from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from ..database import get_db
from ..models import Opportunity, Account, Conference, EBXAssignment, TravelPlan, TravelPlanAccount
from ..schemas import DashboardStats, OpportunityOut, TravelPlanOut, AccountDetailOut, UserOut

router = APIRouter()


def _plan_to_out(plan: TravelPlan) -> TravelPlanOut:
    accounts = []
    for pa in plan.plan_accounts:
        a = pa.account
        if not a:
            continue
        opps = a.opportunities or []
        top_score = max((o.priority_score for o in opps), default=0)
        total_pipeline = sum(o.amount for o in opps)
        owner_out = UserOut(
            id=a.owner.id, name=a.owner.name, email=a.owner.email,
            title=a.owner.title, specialty=a.owner.specialty,
            slack_handle=a.owner.slack_handle,
        ) if a.owner else None
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


@router.get("/", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    from datetime import date
    all_opps = db.query(Opportunity).options(
        joinedload(Opportunity.account),
        joinedload(Opportunity.owner),
    ).all()

    total_pipeline = sum(o.amount for o in all_opps)
    total_accounts = db.query(Account).count()
    upcoming_conferences = db.query(Conference).filter(
        Conference.start_date >= date.today()
    ).count()

    sorted_opps = sorted(all_opps, key=lambda o: o.priority_score, reverse=True)
    top_opps = [
        OpportunityOut(
            id=o.id, name=o.name, amount=o.amount, close_date=o.close_date,
            probability=o.probability, stage=o.stage,
            priority_score=o.priority_score, account_id=o.account_id,
            account_name=o.account.name if o.account else None,
            owner_id=o.owner_id,
            owner_name=o.owner.name if o.owner else None,
            owner_specialty=o.owner.specialty if o.owner else None,
        )
        for o in sorted_opps[:10]
    ]

    city_pipeline: dict = {}
    for o in all_opps:
        city = o.account.billing_city if o.account else "Unknown"
        city_pipeline[city] = city_pipeline.get(city, 0) + o.amount

    pipeline_by_city = sorted(
        [{"city": k, "pipeline": round(v)} for k, v in city_pipeline.items()],
        key=lambda x: x["pipeline"], reverse=True
    )[:10]

    stage_pipeline: dict = {}
    for o in all_opps:
        stage_pipeline[o.stage] = stage_pipeline.get(o.stage, 0) + o.amount

    pipeline_by_stage = sorted(
        [{"stage": k, "pipeline": round(v)} for k, v in stage_pipeline.items()],
        key=lambda x: x["pipeline"], reverse=True
    )

    # Pipeline by conference (sum of opps for each conference's assigned accounts)
    all_conferences = db.query(Conference).order_by(Conference.start_date).all()
    pipeline_by_conference = []
    for conf in all_conferences:
        assigned_account_ids = (
            db.query(EBXAssignment.account_id)
            .filter(EBXAssignment.conference_id == conf.id)
            .distinct()
            .subquery()
        )
        total = db.query(func.sum(Opportunity.amount)).filter(
            Opportunity.account_id.in_(assigned_account_ids)
        ).scalar() or 0
        if total > 0:
            pipeline_by_conference.append({
                "conference": conf.name,
                "pipeline": round(total),
            })
    pipeline_by_conference.sort(key=lambda x: x["pipeline"], reverse=True)

    # EBX summary per conference
    conferences = db.query(Conference).filter(
        Conference.start_date >= date.today()
    ).order_by(Conference.start_date).all()

    ebx_by_conference = []
    for conf in conferences:
        assigned = db.query(EBXAssignment).filter(
            EBXAssignment.conference_id == conf.id
        ).count()
        ebx_by_conference.append({
            "conference_id": conf.id,
            "conference_name": conf.name,
            "city": conf.city,
            "start_date": str(conf.start_date),
            "assigned": assigned,
            "slots": conf.ebx_slots,
        })

    # Upcoming travel plans
    upcoming_plans = db.query(TravelPlan).options(
        joinedload(TravelPlan.plan_accounts)
            .joinedload(TravelPlanAccount.account)
            .joinedload(Account.opportunities)
            .joinedload(Opportunity.owner),
        joinedload(TravelPlan.plan_accounts)
            .joinedload(TravelPlanAccount.account)
            .joinedload(Account.owner),
    ).filter(
        TravelPlan.travel_end >= date.today()
    ).order_by(TravelPlan.travel_start).limit(5).all()

    return DashboardStats(
        total_open_opportunities=len(all_opps),
        total_pipeline_value=total_pipeline,
        total_accounts=total_accounts,
        upcoming_conferences=upcoming_conferences,
        top_opportunities=top_opps,
        pipeline_by_city=pipeline_by_city,
        pipeline_by_stage=pipeline_by_stage,
        pipeline_by_conference=pipeline_by_conference,
        ebx_by_conference=ebx_by_conference,
        upcoming_travel_plans=[_plan_to_out(p) for p in upcoming_plans],
    )
