from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    user_email: str
    user_role: str
    tenant_id: str
    tenant_name: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    title: str
    specialty: str
    slack_handle: Optional[str] = None

    model_config = {"from_attributes": True}


class ContactOut(BaseModel):
    id: str
    first_name: str
    last_name: str
    title: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    is_executive: int

    model_config = {"from_attributes": True}


class OpportunityOut(BaseModel):
    id: str
    name: str
    amount: float
    close_date: Optional[date]
    probability: float
    stage: str
    priority_score: float
    account_id: str
    account_name: Optional[str] = None
    owner_id: Optional[str]
    owner_name: Optional[str] = None
    owner_specialty: Optional[str] = None

    model_config = {"from_attributes": True}


class AccountOut(BaseModel):
    id: str
    name: str
    billing_city: Optional[str]
    billing_state: Optional[str]
    industry: Optional[str]
    annual_revenue: float
    account_type: str
    product_interest: Optional[str]
    website: Optional[str]
    top_score: float = 0
    total_pipeline: float = 0
    open_opportunity_count: int = 0
    owner: Optional[UserOut] = None

    model_config = {"from_attributes": True}


class AccountDetailOut(AccountOut):
    opportunities: List[OpportunityOut] = []
    contacts: List[ContactOut] = []
    recommended_specialist: Optional[UserOut] = None


class ConferenceOut(BaseModel):
    id: str
    name: str
    city: str
    state: str
    start_date: Optional[date]
    end_date: Optional[date]
    ebx_slots: int
    description: Optional[str]

    model_config = {"from_attributes": True}


class EBXAssignmentOut(BaseModel):
    id: str
    conference_id: str
    account_id: str
    opportunity_id: Optional[str]
    assigned_user_id: Optional[str]
    status: str
    notes: Optional[str]
    account_name: Optional[str] = None
    opportunity_name: Optional[str] = None
    assigned_user_name: Optional[str] = None

    model_config = {"from_attributes": True}


class EBXAssignmentCreate(BaseModel):
    conference_id: str
    account_id: str
    opportunity_id: Optional[str] = None
    assigned_user_id: Optional[str] = None
    notes: Optional[str] = None


class EBXPriorityItem(BaseModel):
    rank: int
    account: AccountDetailOut
    top_opportunity: Optional[OpportunityOut]
    recommended_specialist: Optional[UserOut]
    priority_score: float
    is_assigned: bool = False


class EBXPriorityResponse(BaseModel):
    conference: ConferenceOut
    items: List[EBXPriorityItem]
    available_slots: int
    assigned_count: int


class TravelSuggestionResponse(BaseModel):
    city: str
    state: str
    total_accounts: int
    total_pipeline: float
    accounts: List[AccountDetailOut]
    regional_pipeline: List[dict] = []
    regional_total: float = 0


# Travel Plans
class TravelPlanAccountOut(BaseModel):
    id: str
    account: AccountOut

    model_config = {"from_attributes": True}


class TravelPlanOut(BaseModel):
    id: str
    city: str
    state: str
    travel_start: date
    travel_end: date
    created_at: datetime
    account_count: int = 0
    accounts: List[AccountDetailOut] = []

    model_config = {"from_attributes": True}


class TravelPlanCreate(BaseModel):
    city: str
    state: str
    travel_start: date
    travel_end: date
    account_ids: List[str] = []


class ConferenceAttendeeOut(BaseModel):
    id: str
    conference_id: str
    user: UserOut
    role: str
    hotel_name: Optional[str] = None
    hotel_address: Optional[str] = None
    check_in: Optional[date] = None
    check_out: Optional[date] = None
    flight_in: Optional[str] = None
    flight_out: Optional[str] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class ConferenceAttendeeCreate(BaseModel):
    conference_id: str
    user_id: str
    role: str = "Attendee"
    hotel_name: Optional[str] = None
    hotel_address: Optional[str] = None
    check_in: Optional[date] = None
    check_out: Optional[date] = None
    flight_in: Optional[str] = None
    flight_out: Optional[str] = None
    notes: Optional[str] = None


class DashboardStats(BaseModel):
    total_open_opportunities: int
    total_pipeline_value: float
    total_accounts: int
    upcoming_conferences: int
    top_opportunities: List[OpportunityOut]
    pipeline_by_city: List[dict]
    pipeline_by_stage: List[dict]
    pipeline_by_conference: List[dict] = []
    ebx_by_conference: List[dict]
    upcoming_travel_plans: List[TravelPlanOut]
