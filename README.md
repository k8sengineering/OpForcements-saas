# OpForcements

Executive Briefing Planner — connects to your CRM (PostgreSQL sample data, swap to Salesforce API later) to prioritize executive briefings at conferences and suggest customer meetings when traveling.

## Features

| Feature | Description |
|---|---|
| **EBX Prioritizer** | Ranks all accounts by `probability × ARR` (expected value). Assign accounts to EBX slots for any conference with one click. |
| **Travel Planner** | Enter a city → see every customer there, ranked by pipeline priority, with executive contacts and open opportunities. |
| **Opportunity Dashboard** | Full opportunity list with filters (stage, city, probability, amount). Pipeline charts by city and stage. |
| **Specialist Routing** | Each account is matched to the right internal specialist based on product interest (K8s, Networking, Storage, Security, AI/ML, Cloud). |

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  React/Nginx │────▶│  FastAPI backend │────▶│  PostgreSQL  │
│  (frontend) │     │   (Python)       │     │  (CRM data)  │
└─────────────┘     └─────────────────┘     └──────────────┘
      :80                  :8000                  :5432
```

All three run as Kubernetes Deployments (PostgreSQL as a StatefulSet), in the `opforcements` namespace.

## Quick start — Docker Compose (local dev)

```bash
cd ebx-planner
docker compose up --build
```

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

The database is seeded automatically with 27 sample accounts, 38 opportunities, and 3 conferences on first startup.

## Minikube deployment

### Install prerequisites (one-time)

**minikube** (Windows — run in an admin terminal):
```powershell
winget install Kubernetes.minikube
winget install Kubernetes.kubectl
```

Or download manually:
- minikube: https://minikube.sigs.k8s.io/docs/start/
- kubectl: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/

Docker Desktop is already installed on this machine.

### Deploy with the script

```powershell
cd C:\Users\bruce\ebx-planner
.\deploy-minikube.ps1
```

The script will:
1. Start minikube with the Docker driver (4 GB RAM, 2 CPUs)
2. Enable the nginx Ingress addon
3. Build both Docker images directly inside minikube (no registry push needed)
4. Apply all K8s manifests to the `opforcements` namespace
5. Wait for PostgreSQL, backend, and frontend to be ready
6. Open port-forwards and launch the browser

### Manual deploy (step by step)

```powershell
# Start cluster
minikube start --driver=docker --memory=4096 --cpus=2
minikube addons enable ingress

# Build images inside minikube's Docker daemon
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
docker build -t opforcements/backend:latest .\backend
docker build -t opforcements/frontend:latest .\frontend

# Deploy
kubectl apply -f k8s\namespace.yaml
kubectl apply -f k8s\postgres\
kubectl apply -f k8s\backend\
kubectl apply -f k8s\frontend\
kubectl apply -f k8s\ingress.yaml

# Check status
kubectl get pods -n ebx-planner

# Access (no admin needed)
kubectl port-forward svc/frontend-service 3000:80 -n ebx-planner &
kubectl port-forward svc/backend-service 8000:8000 -n ebx-planner &
# Open http://localhost:3000
```

### Access options

| Method | Command | URL | Admin? |
|--------|---------|-----|--------|
| port-forward (simplest) | `kubectl port-forward svc/frontend-service 3000:80 -n opforcements` | http://localhost:3000 | No |
| minikube tunnel (Ingress) | `minikube tunnel` + add hosts entry | http://ebx-planner.local | Yes |

### Useful commands

```powershell
kubectl get pods -n ebx-planner          # pod status
kubectl get svc -n ebx-planner           # services
kubectl logs -l app=backend -n ebx-planner -f   # backend logs
kubectl logs -l app=frontend -n ebx-planner -f  # frontend logs
minikube dashboard                        # K8s dashboard in browser
minikube stop                             # stop the cluster
```

### Secrets

`k8s/postgres/secret.yaml` contains plaintext credentials for convenience in dev. For production, use External Secrets Operator, Vault, or Sealed Secrets and **never** commit credentials to git.

## Connecting to real Salesforce

Replace `backend/app/seed_data.py` and the SQLAlchemy models with calls to the Salesforce REST API using [simple-salesforce](https://github.com/simple-salesforce/simple-salesforce):

```python
from simple_salesforce import Salesforce

sf = Salesforce(
    username=os.getenv("SF_USERNAME"),
    password=os.getenv("SF_PASSWORD"),
    security_token=os.getenv("SF_TOKEN"),
)

opps = sf.query_all(
    "SELECT Id, Name, AccountId, Amount, Probability, StageName, CloseDate "
    "FROM Opportunity WHERE IsClosed=false ORDER BY Amount DESC"
)
```

Add `simple-salesforce` to `requirements.txt` and update the router queries to call the SF API instead of the local database.

## Priority Score

```
priority_score = (probability / 100) × amount
```

This is the expected deal value. It normalizes a 90%-likely $500K deal against a 30%-likely $2M deal — the former scores $450K, the latter $600K.

## Team Specialists

| Specialty | Owner |
|---|---|
| Kubernetes Platform | Bruce Jacobs |
| Networking | Sarah Chen |
| Storage | Mike Torres |
| Security | Emily Park |
| AI/ML | David Kim |
| Cloud Infrastructure | Lisa Rodriguez |

## Project structure

```
opforcements/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, startup seeding
│   │   ├── models.py        # SQLAlchemy ORM
│   │   ├── schemas.py       # Pydantic response models
│   │   ├── database.py      # DB connection
│   │   ├── seed_data.py     # Sample accounts, opps, contacts
│   │   └── routers/         # opportunities, accounts, travel, ebx, stats
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.js    # Axios API calls
│   │   ├── components/      # Sidebar, StatCard, OpportunityCard, AccountCard
│   │   └── pages/           # Dashboard, EBXPlanner, TravelPlanner, Opportunities
│   ├── nginx.conf
│   └── Dockerfile
├── k8s/
│   ├── namespace.yaml
│   ├── postgres/            # StatefulSet, Service, Secret, PVC
│   ├── backend/             # Deployment, Service, ConfigMap
│   ├── frontend/            # Deployment, Service
│   └── ingress.yaml
└── docker-compose.yml
```
