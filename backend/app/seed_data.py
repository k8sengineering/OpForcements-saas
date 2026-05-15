from datetime import date
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm import Session
from .models import Account, Opportunity, Contact, User, Conference, ConferenceAttendee

INTEREST_TO_OWNER = {
    "Kubernetes Platform": "U001",
    "Networking": "U002",
    "Storage": "U003",
    "Security": "U004",
    "AI/ML": "U005",
    "Cloud Infrastructure": "U006",
}

USERS = [
    {"id": "U001", "name": "Bruce Jacobs", "email": "brucejacobs89@gmail.com",
     "title": "K8s Platform Specialist", "specialty": "Kubernetes Platform",
     "slack": "bruce.jacobs"},
    {"id": "U002", "name": "Sarah Chen", "email": "sarah.chen@company.com",
     "title": "Network Architect", "specialty": "Networking",
     "slack": "sarah.chen"},
    {"id": "U003", "name": "Mike Torres", "email": "mike.torres@company.com",
     "title": "Storage Solutions Specialist", "specialty": "Storage",
     "slack": "mike.torres"},
    {"id": "U004", "name": "Emily Park", "email": "emily.park@company.com",
     "title": "Security Specialist", "specialty": "Security",
     "slack": "emily.park"},
    {"id": "U005", "name": "David Kim", "email": "david.kim@company.com",
     "title": "AI/ML Solutions Architect", "specialty": "AI/ML",
     "slack": "david.kim"},
    {"id": "U006", "name": "Lisa Rodriguez", "email": "lisa.rodriguez@company.com",
     "title": "Cloud Infrastructure Architect", "specialty": "Cloud Infrastructure",
     "slack": "lisa.rodriguez"},
]

ACCOUNTS = [
    # San Francisco, CA
    {"id": "A001", "name": "CloudNative Corp", "city": "San Francisco", "state": "CA",
     "industry": "Technology", "revenue": 50_000_000, "interest": "Kubernetes Platform",
     "type": "Customer", "website": "https://cloudnative.example.com"},
    {"id": "A002", "name": "PaymentSecure Inc", "city": "San Francisco", "state": "CA",
     "industry": "Financial Services", "revenue": 400_000_000, "interest": "Security",
     "type": "Customer", "website": "https://paymentsecure.example.com"},
    {"id": "A003", "name": "AI Dynamics", "city": "San Francisco", "state": "CA",
     "industry": "Technology", "revenue": 85_000_000, "interest": "AI/ML",
     "type": "Prospect", "website": "https://aidynamics.example.com"},
    # New York, NY
    {"id": "A004", "name": "SecureShield Inc", "city": "New York", "state": "NY",
     "industry": "Financial Services", "revenue": 200_000_000, "interest": "Security",
     "type": "Customer", "website": "https://secureshield.example.com"},
    {"id": "A005", "name": "FinTech Solutions", "city": "New York", "state": "NY",
     "industry": "Financial Services", "revenue": 500_000_000, "interest": "Networking",
     "type": "Customer", "website": "https://fintech.example.com"},
    {"id": "A006", "name": "MediaCloud NY", "city": "New York", "state": "NY",
     "industry": "Media", "revenue": 120_000_000, "interest": "Kubernetes Platform",
     "type": "Prospect", "website": "https://mediacloud.example.com"},
    # Seattle, WA
    {"id": "A007", "name": "StreamlineTech", "city": "Seattle", "state": "WA",
     "industry": "Technology", "revenue": 120_000_000, "interest": "Kubernetes Platform",
     "type": "Customer", "website": "https://streamlinetech.example.com"},
    {"id": "A008", "name": "DevOps Galaxy", "city": "Seattle", "state": "WA",
     "industry": "Technology", "revenue": 55_000_000, "interest": "Kubernetes Platform",
     "type": "Prospect", "website": "https://devopsgalaxy.example.com"},
    # Austin, TX
    {"id": "A009", "name": "DataFlow Analytics", "city": "Austin", "state": "TX",
     "industry": "Technology", "revenue": 30_000_000, "interest": "AI/ML",
     "type": "Prospect", "website": "https://dataflow.example.com"},
    {"id": "A010", "name": "GrowthAPI Solutions", "city": "Austin", "state": "TX",
     "industry": "Technology", "revenue": 25_000_000, "interest": "Networking",
     "type": "Prospect", "website": "https://growthapi.example.com"},
    # Boston, MA
    {"id": "A011", "name": "HealthBridge Systems", "city": "Boston", "state": "MA",
     "industry": "Healthcare", "revenue": 80_000_000, "interest": "Cloud Infrastructure",
     "type": "Customer", "website": "https://healthbridge.example.com"},
    {"id": "A012", "name": "BioData Labs", "city": "Boston", "state": "MA",
     "industry": "Healthcare", "revenue": 40_000_000, "interest": "AI/ML",
     "type": "Prospect", "website": "https://biodata.example.com"},
    # Chicago, IL
    {"id": "A013", "name": "RetailEdge Pro", "city": "Chicago", "state": "IL",
     "industry": "Retail", "revenue": 45_000_000, "interest": "Storage",
     "type": "Customer", "website": "https://retailedge.example.com"},
    {"id": "A014", "name": "LogisticsPrime", "city": "Chicago", "state": "IL",
     "industry": "Logistics", "revenue": 180_000_000, "interest": "Networking",
     "type": "Customer", "website": "https://logisticsprime.example.com"},
    # Denver, CO
    {"id": "A015", "name": "EduCloud Platform", "city": "Denver", "state": "CO",
     "industry": "Education", "revenue": 15_000_000, "interest": "Cloud Infrastructure",
     "type": "Prospect", "website": "https://educloud.example.com"},
    {"id": "A016", "name": "NetworkPlex", "city": "Denver", "state": "CO",
     "industry": "Telecommunications", "revenue": 70_000_000, "interest": "Networking",
     "type": "Customer", "website": "https://networkplex.example.com"},
    # Atlanta, GA
    {"id": "A017", "name": "TelecomCloud", "city": "Atlanta", "state": "GA",
     "industry": "Telecommunications", "revenue": 1_000_000_000, "interest": "Networking",
     "type": "Customer", "website": "https://telecomcloud.example.com"},
    {"id": "A018", "name": "SouthTech Systems", "city": "Atlanta", "state": "GA",
     "industry": "Technology", "revenue": 35_000_000, "interest": "Kubernetes Platform",
     "type": "Prospect", "website": "https://southtech.example.com"},
    # Houston, TX
    {"id": "A019", "name": "EnergyTech Inc", "city": "Houston", "state": "TX",
     "industry": "Energy", "revenue": 600_000_000, "interest": "Cloud Infrastructure",
     "type": "Customer", "website": "https://energytech.example.com"},
    # Dallas, TX
    {"id": "A020", "name": "SportsTech Pro", "city": "Dallas", "state": "TX",
     "industry": "Media", "revenue": 35_000_000, "interest": "AI/ML",
     "type": "Prospect", "website": "https://sportstech.example.com"},
    {"id": "A021", "name": "EnterpriseIT Dallas", "city": "Dallas", "state": "TX",
     "industry": "Technology", "revenue": 150_000_000, "interest": "Storage",
     "type": "Customer", "website": "https://enterpriseit.example.com"},
    # Washington, DC
    {"id": "A022", "name": "GovCloud Services", "city": "Washington", "state": "DC",
     "industry": "Government", "revenue": 800_000_000, "interest": "Kubernetes Platform",
     "type": "Customer", "website": "https://govcloud.example.com"},
    # San Jose, CA
    {"id": "A023", "name": "AutoDrive Inc", "city": "San Jose", "state": "CA",
     "industry": "Automotive", "revenue": 250_000_000, "interest": "Kubernetes Platform",
     "type": "Prospect", "website": "https://autodrive.example.com"},
    {"id": "A024", "name": "CyberDefense Corp", "city": "San Jose", "state": "CA",
     "industry": "Technology", "revenue": 75_000_000, "interest": "Security",
     "type": "Customer", "website": "https://cyberdefense.example.com"},
    # Phoenix, AZ
    {"id": "A025", "name": "StorageFirst", "city": "Phoenix", "state": "AZ",
     "industry": "Technology", "revenue": 20_000_000, "interest": "Storage",
     "type": "Prospect", "website": "https://storagefirst.example.com"},
    # Detroit, MI
    {"id": "A026", "name": "ManufacturePro", "city": "Detroit", "state": "MI",
     "industry": "Manufacturing", "revenue": 300_000_000, "interest": "Storage",
     "type": "Customer", "website": "https://manufacturepro.example.com"},
    # Miami, FL
    {"id": "A027", "name": "TravelNow Systems", "city": "Miami", "state": "FL",
     "industry": "Travel", "revenue": 60_000_000, "interest": "Cloud Infrastructure",
     "type": "Prospect", "website": "https://travelnow.example.com"},
]

OPPORTUNITIES = [
    {"id": "O001", "account_id": "A001", "owner_id": "U001",
     "name": "CloudNative Corp - K8s Platform Expansion", "amount": 480_000,
     "probability": 75, "stage": "Proposal/Price Quote", "close_date": date(2026, 7, 31)},
    {"id": "O002", "account_id": "A001", "owner_id": "U001",
     "name": "CloudNative Corp - Multi-cluster Management", "amount": 220_000,
     "probability": 60, "stage": "Negotiation/Review", "close_date": date(2026, 6, 30)},
    {"id": "O003", "account_id": "A002", "owner_id": "U004",
     "name": "PaymentSecure - Runtime Security Suite", "amount": 1_200_000,
     "probability": 80, "stage": "Negotiation/Review", "close_date": date(2026, 6, 15)},
    {"id": "O004", "account_id": "A002", "owner_id": "U004",
     "name": "PaymentSecure - Compliance Automation", "amount": 350_000,
     "probability": 65, "stage": "Proposal/Price Quote", "close_date": date(2026, 8, 31)},
    {"id": "O005", "account_id": "A003", "owner_id": "U005",
     "name": "AI Dynamics - GPU Cluster Orchestration", "amount": 750_000,
     "probability": 55, "stage": "Value Proposition", "close_date": date(2026, 9, 30)},
    {"id": "O006", "account_id": "A004", "owner_id": "U004",
     "name": "SecureShield - Zero Trust Platform", "amount": 2_100_000,
     "probability": 70, "stage": "Proposal/Price Quote", "close_date": date(2026, 7, 15)},
    {"id": "O007", "account_id": "A004", "owner_id": "U004",
     "name": "SecureShield - Threat Detection Add-on", "amount": 400_000,
     "probability": 85, "stage": "Negotiation/Review", "close_date": date(2026, 6, 30)},
    {"id": "O008", "account_id": "A005", "owner_id": "U002",
     "name": "FinTech Solutions - SD-WAN Deployment", "amount": 1_800_000,
     "probability": 60, "stage": "Needs Analysis", "close_date": date(2026, 10, 31)},
    {"id": "O009", "account_id": "A005", "owner_id": "U002",
     "name": "FinTech Solutions - Network Observability", "amount": 500_000,
     "probability": 50, "stage": "Value Proposition", "close_date": date(2026, 11, 30)},
    {"id": "O010", "account_id": "A006", "owner_id": "U001",
     "name": "MediaCloud NY - Streaming Platform Migration", "amount": 650_000,
     "probability": 45, "stage": "Qualification", "close_date": date(2026, 12, 31)},
    {"id": "O011", "account_id": "A007", "owner_id": "U001",
     "name": "StreamlineTech - Enterprise K8s License", "amount": 950_000,
     "probability": 85, "stage": "Negotiation/Review", "close_date": date(2026, 6, 15)},
    {"id": "O012", "account_id": "A007", "owner_id": "U006",
     "name": "StreamlineTech - DR & HA Cluster", "amount": 320_000,
     "probability": 70, "stage": "Proposal/Price Quote", "close_date": date(2026, 8, 31)},
    {"id": "O013", "account_id": "A008", "owner_id": "U001",
     "name": "DevOps Galaxy - Platform Engineering Suite", "amount": 420_000,
     "probability": 65, "stage": "Value Proposition", "close_date": date(2026, 9, 15)},
    {"id": "O014", "account_id": "A009", "owner_id": "U005",
     "name": "DataFlow Analytics - MLOps Platform", "amount": 280_000,
     "probability": 55, "stage": "Needs Analysis", "close_date": date(2026, 10, 31)},
    {"id": "O015", "account_id": "A010", "owner_id": "U002",
     "name": "GrowthAPI - API Gateway + Networking", "amount": 180_000,
     "probability": 40, "stage": "Qualification", "close_date": date(2026, 11, 30)},
    {"id": "O016", "account_id": "A011", "owner_id": "U006",
     "name": "HealthBridge - HIPAA Cloud Migration", "amount": 1_100_000,
     "probability": 75, "stage": "Proposal/Price Quote", "close_date": date(2026, 7, 31)},
    {"id": "O017", "account_id": "A011", "owner_id": "U006",
     "name": "HealthBridge - Disaster Recovery", "amount": 250_000,
     "probability": 80, "stage": "Negotiation/Review", "close_date": date(2026, 6, 30)},
    {"id": "O018", "account_id": "A012", "owner_id": "U005",
     "name": "BioData Labs - Genomics ML Pipeline", "amount": 390_000,
     "probability": 50, "stage": "Value Proposition", "close_date": date(2026, 9, 30)},
    {"id": "O019", "account_id": "A013", "owner_id": "U003",
     "name": "RetailEdge - Distributed Storage Tier", "amount": 340_000,
     "probability": 60, "stage": "Proposal/Price Quote", "close_date": date(2026, 8, 15)},
    {"id": "O020", "account_id": "A014", "owner_id": "U002",
     "name": "LogisticsPrime - Fleet Network Optimization", "amount": 870_000,
     "probability": 70, "stage": "Needs Analysis", "close_date": date(2026, 10, 15)},
    {"id": "O021", "account_id": "A015", "owner_id": "U006",
     "name": "EduCloud - SaaS Infrastructure", "amount": 120_000,
     "probability": 45, "stage": "Qualification", "close_date": date(2026, 12, 31)},
    {"id": "O022", "account_id": "A016", "owner_id": "U002",
     "name": "NetworkPlex - Core Network Upgrade", "amount": 560_000,
     "probability": 65, "stage": "Value Proposition", "close_date": date(2026, 9, 30)},
    {"id": "O023", "account_id": "A017", "owner_id": "U002",
     "name": "TelecomCloud - 5G Core Network Platform", "amount": 3_500_000,
     "probability": 55, "stage": "Needs Analysis", "close_date": date(2026, 12, 15)},
    {"id": "O024", "account_id": "A017", "owner_id": "U001",
     "name": "TelecomCloud - Edge K8s Rollout", "amount": 2_200_000,
     "probability": 45, "stage": "Value Proposition", "close_date": date(2027, 3, 31)},
    {"id": "O025", "account_id": "A018", "owner_id": "U001",
     "name": "SouthTech - Developer Platform", "amount": 190_000,
     "probability": 35, "stage": "Qualification", "close_date": date(2026, 11, 30)},
    {"id": "O026", "account_id": "A019", "owner_id": "U006",
     "name": "EnergyTech - Industrial Cloud Platform", "amount": 2_800_000,
     "probability": 65, "stage": "Proposal/Price Quote", "close_date": date(2026, 8, 31)},
    {"id": "O027", "account_id": "A019", "owner_id": "U006",
     "name": "EnergyTech - SCADA Cloud Integration", "amount": 900_000,
     "probability": 50, "stage": "Needs Analysis", "close_date": date(2026, 11, 30)},
    {"id": "O028", "account_id": "A020", "owner_id": "U005",
     "name": "SportsTech - Real-time Analytics Platform", "amount": 310_000,
     "probability": 55, "stage": "Value Proposition", "close_date": date(2026, 10, 31)},
    {"id": "O029", "account_id": "A021", "owner_id": "U003",
     "name": "EnterpriseIT - Petabyte Storage Expansion", "amount": 1_400_000,
     "probability": 70, "stage": "Proposal/Price Quote", "close_date": date(2026, 7, 31)},
    {"id": "O030", "account_id": "A021", "owner_id": "U003",
     "name": "EnterpriseIT - Backup & Archive Solution", "amount": 380_000,
     "probability": 80, "stage": "Negotiation/Review", "close_date": date(2026, 6, 30)},
    {"id": "O031", "account_id": "A022", "owner_id": "U001",
     "name": "GovCloud - FedRAMP K8s Platform", "amount": 4_200_000,
     "probability": 60, "stage": "Proposal/Price Quote", "close_date": date(2026, 9, 30)},
    {"id": "O032", "account_id": "A022", "owner_id": "U004",
     "name": "GovCloud - Zero Trust Security Layer", "amount": 1_600_000,
     "probability": 55, "stage": "Needs Analysis", "close_date": date(2026, 12, 31)},
    {"id": "O033", "account_id": "A023", "owner_id": "U001",
     "name": "AutoDrive - Vehicle OS Platform Infra", "amount": 1_900_000,
     "probability": 40, "stage": "Value Proposition", "close_date": date(2026, 12, 31)},
    {"id": "O034", "account_id": "A024", "owner_id": "U004",
     "name": "CyberDefense - SOC Automation Suite", "amount": 680_000,
     "probability": 75, "stage": "Proposal/Price Quote", "close_date": date(2026, 7, 15)},
    {"id": "O035", "account_id": "A025", "owner_id": "U003",
     "name": "StorageFirst - Flash Array Deployment", "amount": 160_000,
     "probability": 60, "stage": "Needs Analysis", "close_date": date(2026, 10, 31)},
    {"id": "O036", "account_id": "A026", "owner_id": "U003",
     "name": "ManufacturePro - Factory Storage Platform", "amount": 1_750_000,
     "probability": 65, "stage": "Proposal/Price Quote", "close_date": date(2026, 8, 31)},
    {"id": "O037", "account_id": "A026", "owner_id": "U003",
     "name": "ManufacturePro - IoT Data Pipeline Storage", "amount": 450_000,
     "probability": 55, "stage": "Value Proposition", "close_date": date(2026, 10, 31)},
    {"id": "O038", "account_id": "A027", "owner_id": "U006",
     "name": "TravelNow - Cloud-native Booking Platform", "amount": 420_000,
     "probability": 50, "stage": "Qualification", "close_date": date(2026, 11, 30)},
]

CONTACTS = [
    {"account_id": "A001", "first": "Rachel", "last": "Stone", "title": "CTO", "is_exec": 1,
     "email": "rstone@cloudnative.example.com", "phone": "415-555-0101"},
    {"account_id": "A001", "first": "James", "last": "Park", "title": "VP Engineering", "is_exec": 1,
     "email": "jpark@cloudnative.example.com", "phone": "415-555-0102"},
    {"account_id": "A002", "first": "Monica", "last": "Rivera", "title": "CISO", "is_exec": 1,
     "email": "mrivera@paymentsecure.example.com", "phone": "415-555-0201"},
    {"account_id": "A002", "first": "Tom", "last": "Nguyen", "title": "Director of Security", "is_exec": 0,
     "email": "tnguyen@paymentsecure.example.com", "phone": "415-555-0202"},
    {"account_id": "A003", "first": "Priya", "last": "Kapoor", "title": "CEO", "is_exec": 1,
     "email": "pkapoor@aidynamics.example.com", "phone": "415-555-0301"},
    {"account_id": "A004", "first": "William", "last": "Black", "title": "CISO", "is_exec": 1,
     "email": "wblack@secureshield.example.com", "phone": "212-555-0401"},
    {"account_id": "A004", "first": "Anna", "last": "Walsh", "title": "VP IT", "is_exec": 1,
     "email": "awalsh@secureshield.example.com", "phone": "212-555-0402"},
    {"account_id": "A005", "first": "Derek", "last": "Hampton", "title": "CTO", "is_exec": 1,
     "email": "dhampton@fintech.example.com", "phone": "212-555-0501"},
    {"account_id": "A005", "first": "Karen", "last": "Liu", "title": "Network Director", "is_exec": 0,
     "email": "kliu@fintech.example.com", "phone": "212-555-0502"},
    {"account_id": "A006", "first": "Carlos", "last": "Mendez", "title": "VP Technology", "is_exec": 1,
     "email": "cmendez@mediacloud.example.com", "phone": "212-555-0601"},
    {"account_id": "A007", "first": "Jessica", "last": "Taylor", "title": "CTO", "is_exec": 1,
     "email": "jtaylor@streamlinetech.example.com", "phone": "206-555-0701"},
    {"account_id": "A007", "first": "Brian", "last": "Foster", "title": "Platform Engineering Lead", "is_exec": 0,
     "email": "bfoster@streamlinetech.example.com", "phone": "206-555-0702"},
    {"account_id": "A008", "first": "Nathan", "last": "Cole", "title": "Head of Platform", "is_exec": 0,
     "email": "ncole@devopsgalaxy.example.com", "phone": "206-555-0801"},
    {"account_id": "A009", "first": "Aisha", "last": "Johnson", "title": "Chief Data Officer", "is_exec": 1,
     "email": "ajohnson@dataflow.example.com", "phone": "512-555-0901"},
    {"account_id": "A010", "first": "Ethan", "last": "Brooks", "title": "CTO", "is_exec": 1,
     "email": "ebrooks@growthapi.example.com", "phone": "512-555-1001"},
    {"account_id": "A011", "first": "Dr. Susan", "last": "Miller", "title": "CIO", "is_exec": 1,
     "email": "smiller@healthbridge.example.com", "phone": "617-555-1101"},
    {"account_id": "A011", "first": "Ryan", "last": "West", "title": "Cloud Architect", "is_exec": 0,
     "email": "rwest@healthbridge.example.com", "phone": "617-555-1102"},
    {"account_id": "A012", "first": "Dr. Kevin", "last": "Chang", "title": "VP Research Computing", "is_exec": 1,
     "email": "kchang@biodata.example.com", "phone": "617-555-1201"},
    {"account_id": "A013", "first": "Sandra", "last": "Green", "title": "CTO", "is_exec": 1,
     "email": "sgreen@retailedge.example.com", "phone": "312-555-1301"},
    {"account_id": "A014", "first": "Marcus", "last": "Reed", "title": "VP Technology", "is_exec": 1,
     "email": "mreed@logisticsprime.example.com", "phone": "312-555-1401"},
    {"account_id": "A014", "first": "Tina", "last": "Patel", "title": "Network Manager", "is_exec": 0,
     "email": "tpatel@logisticsprime.example.com", "phone": "312-555-1402"},
    {"account_id": "A016", "first": "George", "last": "Baker", "title": "CTO", "is_exec": 1,
     "email": "gbaker@networkplex.example.com", "phone": "303-555-1601"},
    {"account_id": "A017", "first": "Diana", "last": "Spencer", "title": "EVP Technology", "is_exec": 1,
     "email": "dspencer@telecomcloud.example.com", "phone": "404-555-1701"},
    {"account_id": "A017", "first": "Robert", "last": "Kim", "title": "VP Network Engineering", "is_exec": 1,
     "email": "rkim@telecomcloud.example.com", "phone": "404-555-1702"},
    {"account_id": "A019", "first": "Steven", "last": "Hayes", "title": "CTO", "is_exec": 1,
     "email": "shayes@energytech.example.com", "phone": "713-555-1901"},
    {"account_id": "A019", "first": "Laura", "last": "Collins", "title": "Cloud Director", "is_exec": 0,
     "email": "lcollins@energytech.example.com", "phone": "713-555-1902"},
    {"account_id": "A021", "first": "Paul", "last": "Mitchell", "title": "VP Infrastructure", "is_exec": 1,
     "email": "pmitchell@enterpriseit.example.com", "phone": "214-555-2101"},
    {"account_id": "A022", "first": "Janet", "last": "Warren", "title": "CIO", "is_exec": 1,
     "email": "jwarren@govcloud.example.com", "phone": "202-555-2201"},
    {"account_id": "A022", "first": "Michael", "last": "Grant", "title": "Deputy CTO", "is_exec": 1,
     "email": "mgrant@govcloud.example.com", "phone": "202-555-2202"},
    {"account_id": "A023", "first": "Elena", "last": "Vasquez", "title": "VP Software Platform", "is_exec": 1,
     "email": "evasquez@autodrive.example.com", "phone": "408-555-2301"},
    {"account_id": "A024", "first": "Dominic", "last": "Cross", "title": "CEO", "is_exec": 1,
     "email": "dcross@cyberdefense.example.com", "phone": "408-555-2401"},
    {"account_id": "A026", "first": "Frank", "last": "Wilson", "title": "CIO", "is_exec": 1,
     "email": "fwilson@manufacturepro.example.com", "phone": "313-555-2601"},
    {"account_id": "A026", "first": "Claire", "last": "Novak", "title": "IT Director", "is_exec": 0,
     "email": "cnovak@manufacturepro.example.com", "phone": "313-555-2602"},
]

ATTENDEES = [
    # KubeCon NA 2026 — Atlanta
    {"conf_id": "CONF001", "user_id": "U001", "role": "K8s Platform Specialist",
     "hotel": "Marriott Marquis Atlanta", "hotel_addr": "265 Peachtree Center Ave, Atlanta, GA 30303",
     "check_in": date(2026, 11, 9), "check_out": date(2026, 11, 15),
     "flight_in": "DL 421 · Nov 9 · ATL arrives 3:45 PM",
     "flight_out": "DL 420 · Nov 15 · Departs ATL 11:00 AM"},
    {"conf_id": "CONF001", "user_id": "U002", "role": "Networking Specialist",
     "hotel": "Marriott Marquis Atlanta", "hotel_addr": "265 Peachtree Center Ave, Atlanta, GA 30303",
     "check_in": date(2026, 11, 10), "check_out": date(2026, 11, 14),
     "flight_in": "AA 1205 · Nov 10 · ATL arrives 9:00 AM",
     "flight_out": "AA 1208 · Nov 14 · Departs ATL 6:00 PM"},
    {"conf_id": "CONF001", "user_id": "U004", "role": "Security Lead",
     "hotel": "Westin Peachtree Plaza", "hotel_addr": "210 Peachtree St NW, Atlanta, GA 30303",
     "check_in": date(2026, 11, 9), "check_out": date(2026, 11, 14),
     "flight_in": "UA 882 · Nov 9 · ATL arrives 2:00 PM",
     "flight_out": "UA 885 · Nov 14 · Departs ATL 7:30 PM"},
    {"conf_id": "CONF001", "user_id": "U005", "role": "AI/ML Specialist",
     "hotel": "Westin Peachtree Plaza", "hotel_addr": "210 Peachtree St NW, Atlanta, GA 30303",
     "check_in": date(2026, 11, 10), "check_out": date(2026, 11, 14),
     "flight_in": "DL 550 · Nov 10 · ATL arrives 11:00 AM",
     "flight_out": "DL 553 · Nov 14 · Departs ATL 5:00 PM"},
    {"conf_id": "CONF001", "user_id": "U006", "role": "Cloud Infrastructure Architect",
     "hotel": "Omni Atlanta at CNN Center", "hotel_addr": "100 CNN Center, Atlanta, GA 30303",
     "check_in": date(2026, 11, 10), "check_out": date(2026, 11, 15),
     "flight_in": "SW 234 · Nov 10 · ATL arrives 10:30 AM",
     "flight_out": "SW 237 · Nov 15 · Departs ATL 2:00 PM"},
    {"conf_id": "CONF001", "user_id": "U003", "role": "Storage Solutions Specialist",
     "hotel": "Omni Atlanta at CNN Center", "hotel_addr": "100 CNN Center, Atlanta, GA 30303",
     "check_in": date(2026, 11, 11), "check_out": date(2026, 11, 14),
     "flight_in": "AA 987 · Nov 11 · ATL arrives 1:00 PM",
     "flight_out": "AA 990 · Nov 14 · Departs ATL 4:00 PM"},
    # CloudWorld 2026 — Las Vegas
    {"conf_id": "CONF002", "user_id": "U001", "role": "K8s Platform Specialist",
     "hotel": "The Venetian Resort Las Vegas", "hotel_addr": "3355 Las Vegas Blvd S, Las Vegas, NV 89109",
     "check_in": date(2026, 9, 21), "check_out": date(2026, 9, 26),
     "flight_in": "AA 431 · Sep 21 · LAS arrives 1:00 PM",
     "flight_out": "AA 434 · Sep 26 · Departs LAS 3:30 PM"},
    {"conf_id": "CONF002", "user_id": "U002", "role": "Networking Specialist",
     "hotel": "MGM Grand Las Vegas", "hotel_addr": "3799 Las Vegas Blvd S, Las Vegas, NV 89109",
     "check_in": date(2026, 9, 22), "check_out": date(2026, 9, 25),
     "flight_in": "DL 891 · Sep 22 · LAS arrives 9:00 AM",
     "flight_out": "DL 894 · Sep 25 · Departs LAS 8:00 PM"},
    {"conf_id": "CONF002", "user_id": "U005", "role": "AI/ML Demo Lead",
     "hotel": "The Venetian Resort Las Vegas", "hotel_addr": "3355 Las Vegas Blvd S, Las Vegas, NV 89109",
     "check_in": date(2026, 9, 21), "check_out": date(2026, 9, 26),
     "flight_in": "UA 712 · Sep 21 · LAS arrives 2:30 PM",
     "flight_out": "UA 715 · Sep 26 · Departs LAS 4:00 PM"},
    {"conf_id": "CONF002", "user_id": "U006", "role": "Cloud Infrastructure Architect",
     "hotel": "MGM Grand Las Vegas", "hotel_addr": "3799 Las Vegas Blvd S, Las Vegas, NV 89109",
     "check_in": date(2026, 9, 22), "check_out": date(2026, 9, 25),
     "flight_in": "SW 511 · Sep 22 · LAS arrives 11:00 AM",
     "flight_out": "SW 514 · Sep 25 · Departs LAS 6:30 PM"},
    # DockerCon 2026 — San Francisco
    {"conf_id": "CONF003", "user_id": "U001", "role": "K8s Presenter",
     "hotel": "Hotel Nikko San Francisco", "hotel_addr": "222 Mason St, San Francisco, CA 94102",
     "check_in": date(2026, 7, 13), "check_out": date(2026, 7, 17),
     "flight_in": "DL 201 · Jul 13 · SFO arrives 11:00 AM",
     "flight_out": "DL 204 · Jul 17 · Departs SFO 4:00 PM"},
    {"conf_id": "CONF003", "user_id": "U006", "role": "Cloud Infrastructure Lead",
     "hotel": "Hotel Nikko San Francisco", "hotel_addr": "222 Mason St, San Francisco, CA 94102",
     "check_in": date(2026, 7, 14), "check_out": date(2026, 7, 16),
     "flight_in": "AA 887 · Jul 14 · SFO arrives 8:00 AM",
     "flight_out": "AA 890 · Jul 16 · Departs SFO 7:00 PM"},
    {"conf_id": "CONF003", "user_id": "U002", "role": "Networking Specialist",
     "hotel": "Hilton San Francisco Union Square", "hotel_addr": "333 O'Farrell St, San Francisco, CA 94102",
     "check_in": date(2026, 7, 14), "check_out": date(2026, 7, 16),
     "flight_in": "UA 345 · Jul 14 · SFO arrives 10:00 AM",
     "flight_out": "UA 348 · Jul 16 · Departs SFO 5:00 PM"},
]

CONFERENCES = [
    {"id": "CONF001", "name": "KubeCon NA 2026", "city": "Atlanta", "state": "GA",
     "start_date": date(2026, 11, 10), "end_date": date(2026, 11, 14), "ebx_slots": 20,
     "description": "The flagship Kubernetes conference. EBX sessions held at the Marriott Marquis."},
    {"id": "CONF002", "name": "CloudWorld 2026", "city": "Las Vegas", "state": "NV",
     "start_date": date(2026, 9, 22), "end_date": date(2026, 9, 25), "ebx_slots": 15,
     "description": "Oracle CloudWorld — major cloud and platform announcements."},
    {"id": "CONF003", "name": "DockerCon 2026", "city": "San Francisco", "state": "CA",
     "start_date": date(2026, 7, 14), "end_date": date(2026, 7, 16), "ebx_slots": 10,
     "description": "Container and developer platform focus. EBX at Fort Mason."},
]


def ensure_schema(engine):
    from .models import Base
    insp = sa_inspect(engine)
    needs_reset = False
    if insp.has_table("users"):
        cols = {c["name"] for c in insp.get_columns("users")}
        if "password_hash" not in cols or "role" not in cols:
            needs_reset = True
    if insp.has_table("accounts"):
        cols = {c["name"] for c in insp.get_columns("accounts")}
        if "owner_id" not in cols:
            needs_reset = True
    if needs_reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def _seed_tenant(db: Session, module):
    """Seed from a tenant data module (seed_novatech, seed_meridian, etc.)."""
    for u in module.USERS:
        db.add(User(
            id=u["id"], name=u["name"], email=u["email"],
            title=u["title"], specialty=u["specialty"],
            slack_handle=u.get("slack_handle"),
            password_hash=u.get("password_hash"),
            role=u.get("role", "user"),
        ))
    for a in module.ACCOUNTS:
        db.add(Account(
            id=a["id"], name=a["name"],
            billing_city=a["billing_city"], billing_state=a["billing_state"],
            industry=a["industry"], annual_revenue=a["annual_revenue"],
            product_interest=a["product_interest"], account_type=a["account_type"],
            owner_id=a.get("owner_id"),
        ))
    for o in module.OPPORTUNITIES:
        db.add(Opportunity(
            id=o["id"], account_id=o["account_id"], owner_id=o["owner_id"],
            name=o["name"], amount=o["amount"], probability=o["probability"],
            stage=o["stage"], close_date=o["close_date"],
        ))
    for c in module.CONTACTS:
        db.add(Contact(
            id=c["id"], account_id=c["account_id"],
            first_name=c["first_name"], last_name=c["last_name"],
            title=c["title"], email=c["email"],
            is_executive=c["is_executive"],
        ))
    for conf in module.CONFERENCES:
        db.add(Conference(
            id=conf["id"], name=conf["name"], city=conf["city"], state=conf["state"],
            start_date=conf["start_date"], end_date=conf["end_date"],
            ebx_slots=conf["ebx_slots"], description=conf["description"],
        ))
    db.commit()
    for a in getattr(module, "ATTENDEES", []):
        db.add(ConferenceAttendee(
            conference_id=a["conf_id"], user_id=a["user_id"], role=a["role"],
            hotel_name=a["hotel"], hotel_address=a["hotel_addr"],
            check_in=a["check_in"], check_out=a["check_out"],
            flight_in=a["flight_in"], flight_out=a["flight_out"],
        ))
    db.commit()


def _seed_legacy(db: Session):
    """Seed the original OpForcements data (default / legacy tenant)."""
    for u in USERS:
        db.add(User(id=u["id"], name=u["name"], email=u["email"],
                    title=u["title"], specialty=u["specialty"],
                    slack_handle=u["slack"]))
    for a in ACCOUNTS:
        db.add(Account(id=a["id"], name=a["name"],
                       billing_city=a["city"], billing_state=a["state"],
                       industry=a["industry"], annual_revenue=a["revenue"],
                       product_interest=a["interest"], account_type=a["type"],
                       website=a["website"],
                       owner_id=INTEREST_TO_OWNER.get(a["interest"])))
    for o in OPPORTUNITIES:
        db.add(Opportunity(id=o["id"], account_id=o["account_id"],
                           owner_id=o["owner_id"], name=o["name"],
                           amount=o["amount"], probability=o["probability"],
                           stage=o["stage"], close_date=o["close_date"]))
    for c in CONTACTS:
        db.add(Contact(account_id=c["account_id"], first_name=c["first"],
                       last_name=c["last"], title=c["title"],
                       email=c["email"], phone=c["phone"],
                       is_executive=c["is_exec"]))
    for conf in CONFERENCES:
        db.add(Conference(id=conf["id"], name=conf["name"],
                          city=conf["city"], state=conf["state"],
                          start_date=conf["start_date"], end_date=conf["end_date"],
                          ebx_slots=conf["ebx_slots"], description=conf["description"]))
    db.commit()
    for a in ATTENDEES:
        db.add(ConferenceAttendee(
            conference_id=a["conf_id"], user_id=a["user_id"], role=a["role"],
            hotel_name=a["hotel"], hotel_address=a["hotel_addr"],
            check_in=a["check_in"], check_out=a["check_out"],
            flight_in=a["flight_in"], flight_out=a["flight_out"],
        ))
    db.commit()


def seed_database(db: Session, tenant_id: str = "default"):
    if db.query(User).count() > 0:
        return

    if tenant_id == "novatech":
        from . import seed_novatech as m
        _seed_tenant(db, m)
    elif tenant_id == "meridian":
        from . import seed_meridian as m
        _seed_tenant(db, m)
    elif tenant_id == "apex":
        from . import seed_apex as m
        _seed_tenant(db, m)
    elif tenant_id == "admin":
        from . import seed_admin as m
        _seed_tenant_admin(db, m)
    else:
        _seed_legacy(db)


def _seed_tenant_admin(db: Session, module):
    for u in module.USERS:
        db.add(User(
            id=u["id"], name=u["name"], email=u["email"],
            title=u["title"], specialty=u["specialty"],
            slack_handle=u.get("slack_handle"),
            password_hash=u.get("password_hash"),
            role=u.get("role", "user"),
        ))
    db.commit()
