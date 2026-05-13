from datetime import date
from .auth import hash_password

TENANT_NAME = "OpForcements Admin"

USERS = [
    {"id": "U001", "name": "Platform Admin", "email": "admin@opforcements.io",
     "title": "Platform Administrator", "specialty": "Kubernetes Platform",
     "slack_handle": "platform-admin", "role": "super_admin",
     "password_hash": hash_password("Admin2024!")},
]

ACCOUNTS = []
CONTACTS = []
OPPORTUNITIES = []
CONFERENCES = []

TENANTS = [
    {
        "id": "novatech",
        "name": "NovaTech Systems",
        "industry": "Cloud-Native Software",
        "hq": "San Francisco, CA",
        "namespace": "opforcements-novatech",
        "login_email": "admin@novatech.io",
        "portal_port": 3001,
        "admin_email": "admin@novatech.io",
        "color": "blue",
        "description": "Cloud-native DevOps and platform engineering tools",
    },
    {
        "id": "meridian",
        "name": "Meridian Financial Group",
        "industry": "Financial Services",
        "hq": "New York, NY",
        "namespace": "opforcements-meridian",
        "login_email": "admin@meridian-fg.com",
        "portal_port": 3002,
        "admin_email": "admin@meridian-fg.com",
        "color": "green",
        "description": "Enterprise technology sales for banking and fintech",
    },
    {
        "id": "apex",
        "name": "Apex Healthcare Solutions",
        "industry": "Healthcare Technology",
        "hq": "Chicago, IL",
        "namespace": "opforcements-apex",
        "login_email": "admin@apexhealth.tech",
        "portal_port": 3003,
        "admin_email": "admin@apexhealth.tech",
        "color": "purple",
        "description": "Healthcare IT sales — HIPAA, AI/ML, and medical infrastructure",
    },
]
