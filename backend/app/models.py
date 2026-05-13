import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from .database import Base


def new_id():
    return str(uuid.uuid4())


class Account(Base):
    __tablename__ = "accounts"
    id = Column(String, primary_key=True, default=new_id)
    name = Column(String, nullable=False)
    billing_city = Column(String)
    billing_state = Column(String)
    billing_country = Column(String, default="US")
    industry = Column(String)
    annual_revenue = Column(Float, default=0)
    account_type = Column(String, default="Prospect")
    website = Column(String)
    product_interest = Column(String)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", foreign_keys=[owner_id])
    opportunities = relationship("Opportunity", back_populates="account", cascade="all, delete-orphan")
    contacts = relationship("Contact", back_populates="account", cascade="all, delete-orphan")
    ebx_assignments = relationship("EBXAssignment", back_populates="account")


class Opportunity(Base):
    __tablename__ = "opportunities"
    id = Column(String, primary_key=True, default=new_id)
    account_id = Column(String, ForeignKey("accounts.id"))
    name = Column(String, nullable=False)
    amount = Column(Float, default=0)
    close_date = Column(Date)
    probability = Column(Float, default=0)
    stage = Column(String)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    account = relationship("Account", back_populates="opportunities")
    owner = relationship("User", back_populates="opportunities")

    @property
    def priority_score(self):
        return round((self.probability / 100.0) * self.amount, 2)


class Contact(Base):
    __tablename__ = "contacts"
    id = Column(String, primary_key=True, default=new_id)
    account_id = Column(String, ForeignKey("accounts.id"))
    first_name = Column(String)
    last_name = Column(String)
    title = Column(String)
    email = Column(String)
    phone = Column(String)
    is_executive = Column(Integer, default=0)

    account = relationship("Account", back_populates="contacts")


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=new_id)
    name = Column(String)
    email = Column(String)
    title = Column(String)
    specialty = Column(String)
    slack_handle = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    role = Column(String, default="user")        # user | admin | super_admin
    is_active = Column(Integer, default=1)

    opportunities = relationship("Opportunity", back_populates="owner")
    ebx_assignments = relationship("EBXAssignment", back_populates="assigned_user")


class Conference(Base):
    __tablename__ = "conferences"
    id = Column(String, primary_key=True, default=new_id)
    name = Column(String)
    city = Column(String)
    state = Column(String)
    country = Column(String, default="US")
    start_date = Column(Date)
    end_date = Column(Date)
    ebx_slots = Column(Integer, default=10)
    description = Column(Text)

    ebx_assignments = relationship("EBXAssignment", back_populates="conference", cascade="all, delete-orphan")
    attendees = relationship("ConferenceAttendee", back_populates="conference", cascade="all, delete-orphan")


class TravelPlan(Base):
    __tablename__ = "travel_plans"
    id = Column(String, primary_key=True, default=new_id)
    city = Column(String)
    state = Column(String)
    travel_start = Column(Date)
    travel_end = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

    plan_accounts = relationship("TravelPlanAccount", back_populates="plan", cascade="all, delete-orphan")


class TravelPlanAccount(Base):
    __tablename__ = "travel_plan_accounts"
    id = Column(String, primary_key=True, default=new_id)
    plan_id = Column(String, ForeignKey("travel_plans.id"))
    account_id = Column(String, ForeignKey("accounts.id"))

    plan = relationship("TravelPlan", back_populates="plan_accounts")
    account = relationship("Account")


class EBXAssignment(Base):
    __tablename__ = "ebx_assignments"
    id = Column(String, primary_key=True, default=new_id)
    conference_id = Column(String, ForeignKey("conferences.id"))
    account_id = Column(String, ForeignKey("accounts.id"))
    opportunity_id = Column(String, ForeignKey("opportunities.id"), nullable=True)
    assigned_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="Planned")
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    conference = relationship("Conference", back_populates="ebx_assignments")
    account = relationship("Account", back_populates="ebx_assignments")
    opportunity = relationship("Opportunity")
    assigned_user = relationship("User", back_populates="ebx_assignments")


class ConferenceAttendee(Base):
    __tablename__ = "conference_attendees"
    id = Column(String, primary_key=True, default=new_id)
    conference_id = Column(String, ForeignKey("conferences.id"))
    user_id = Column(String, ForeignKey("users.id"))
    role = Column(String, default="Attendee")
    hotel_name = Column(String, nullable=True)
    hotel_address = Column(String, nullable=True)
    check_in = Column(Date, nullable=True)
    check_out = Column(Date, nullable=True)
    flight_in = Column(String, nullable=True)
    flight_out = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    conference = relationship("Conference", back_populates="attendees")
    user = relationship("User")
