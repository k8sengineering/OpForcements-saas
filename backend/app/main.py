from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, SessionLocal
from . import models
from .seed_data import ensure_schema, seed_database
from .auth import get_current_user
from .routers import opportunities, accounts, travel, ebx, users, conferences, stats, travel_plans, conference_attendees
from .routers import auth as auth_router
from .routers import admin as admin_router
import os

ensure_schema(engine)

TENANT_ID = os.getenv("TENANT_ID", "default")
TENANT_NAME = os.getenv("TENANT_NAME", "OpForcements")

app = FastAPI(title=f"OpForcements API — {TENANT_NAME}", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth router is public (login endpoint)
app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])

# All other routers require a valid JWT
protected = {"dependencies": [Depends(get_current_user)]}

app.include_router(opportunities.router, prefix="/api/opportunities", tags=["opportunities"], **protected)
app.include_router(accounts.router, prefix="/api/accounts", tags=["accounts"], **protected)
app.include_router(travel.router, prefix="/api/travel", tags=["travel"], **protected)
app.include_router(travel_plans.router, prefix="/api/travel-plans", tags=["travel-plans"], **protected)
app.include_router(ebx.router, prefix="/api/ebx", tags=["ebx"], **protected)
app.include_router(users.router, prefix="/api/users", tags=["users"], **protected)
app.include_router(conferences.router, prefix="/api/conferences", tags=["conferences"], **protected)
app.include_router(stats.router, prefix="/api/stats", tags=["stats"], **protected)
app.include_router(conference_attendees.router, prefix="/api/conference-attendees", tags=["conference-attendees"], **protected)
app.include_router(admin_router.router, prefix="/api/admin", tags=["admin"], **protected)


@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        seed_database(db, TENANT_ID)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok", "tenant": TENANT_ID}
