from fastapi import APIRouter, Depends
from ..auth import require_admin
from ..models import User
import os

router = APIRouter()

# Tenant registry — in production this would come from a database
TENANTS = [
    {
        "id": "novatech",
        "name": "NovaTech Systems",
        "industry": "Cloud-Native Software",
        "hq": "San Francisco, CA",
        "namespace": "opforcements-novatech",
        "admin_email": "admin@novatech.io",
        "portal_port": 3001,
        "color": "blue",
        "description": "Cloud-native DevOps and platform engineering tools",
    },
    {
        "id": "meridian",
        "name": "Meridian Financial Group",
        "industry": "Financial Services",
        "hq": "New York, NY",
        "namespace": "opforcements-meridian",
        "admin_email": "admin@meridian-fg.com",
        "portal_port": 3002,
        "color": "green",
        "description": "Enterprise technology sales for banking and fintech",
    },
    {
        "id": "apex",
        "name": "Apex Healthcare Solutions",
        "industry": "Healthcare Technology",
        "hq": "Chicago, IL",
        "namespace": "opforcements-apex",
        "admin_email": "admin@apexhealth.tech",
        "portal_port": 3003,
        "color": "purple",
        "description": "Healthcare IT sales — HIPAA, AI/ML, and medical infrastructure",
    },
]


@router.get("/tenants")
def list_tenants(user: User = Depends(require_admin)):
    return TENANTS
