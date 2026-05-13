#Requires -Version 5.1
<#
.SYNOPSIS
  Build and deploy a single OpForcements tenant to minikube.

.PARAMETER Tenant
  Tenant name: novatech | meridian | apex | admin

.PARAMETER PortForward
  If set, starts port-forward after deployment.

.EXAMPLE
  .\deploy-tenant.ps1 -Tenant novatech
  .\deploy-tenant.ps1 -Tenant meridian -PortForward
#>
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("novatech","meridian","apex","admin")]
    [string]$Tenant,

    [switch]$PortForward
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ROOT = $PSScriptRoot

$TENANT_PORTS = @{
    novatech = 3001
    meridian = 3002
    apex     = 3003
    admin    = 3000
}

$TENANT_BACKEND_PORTS = @{
    novatech = 8001
    meridian = 8002
    apex     = 8003
    admin    = 8000
}

$NAMESPACE  = "opforcements-$Tenant"
$FRONT_PORT = $TENANT_PORTS[$Tenant]
$BACK_PORT  = $TENANT_BACKEND_PORTS[$Tenant]

function Log($msg) { Write-Host "  $msg" -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "  OK  $msg" -ForegroundColor Green }
function Hdr($msg) { Write-Host "`n==> $msg" -ForegroundColor Yellow }

# ── Prerequisites ────────────────────────────────────────────────────────────
Hdr "Checking prerequisites"
foreach ($cmd in "minikube","kubectl","docker") {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "Required tool '$cmd' not found."
        exit 1
    }
}
Ok "All tools present"

# ── Start minikube ────────────────────────────────────────────────────────────
Hdr "Starting minikube"
$status = minikube status --format "{{.Host}}" 2>$null
if ($status -ne "Running") {
    Log "Starting minikube with Docker driver..."
    minikube start --driver=docker --memory=6144 --cpus=4
} else {
    Ok "minikube already running"
}

# ── Configure Docker to use minikube's daemon ────────────────────────────────
Hdr "Configuring Docker environment"
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
Ok "Using minikube's Docker daemon"

# ── Build images ──────────────────────────────────────────────────────────────
Hdr "Building backend image"
docker build -t opforcements/backend:latest "$ROOT\backend"
Ok "Backend image built"

Hdr "Building frontend image"
docker build -t opforcements/frontend:latest "$ROOT\frontend"
Ok "Frontend image built"

# ── Apply manifests ───────────────────────────────────────────────────────────
if ($Tenant -eq "admin") {
    $MANIFEST_DIR = "$ROOT\k8s\admin"
} else {
    $MANIFEST_DIR = "$ROOT\k8s\tenants\$Tenant"
}

Hdr "Applying manifests for $Tenant (namespace: $NAMESPACE)"
kubectl apply -f "$MANIFEST_DIR\namespace.yaml"
kubectl apply -f "$MANIFEST_DIR\postgres\"
kubectl apply -f "$MANIFEST_DIR\backend\"
kubectl apply -f "$MANIFEST_DIR\frontend\"
Ok "Manifests applied"

# ── Wait for rollouts ─────────────────────────────────────────────────────────
Hdr "Waiting for PostgreSQL"
kubectl rollout status statefulset/postgres -n $NAMESPACE --timeout=120s

Hdr "Waiting for backend"
kubectl rollout status deployment/backend -n $NAMESPACE --timeout=120s

Hdr "Waiting for frontend"
kubectl rollout status deployment/frontend -n $NAMESPACE --timeout=120s

Ok "All workloads ready in $NAMESPACE"

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  Tenant '$Tenant' is running!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Namespace : $NAMESPACE"
Write-Host "  Frontend  : http://localhost:$FRONT_PORT"
Write-Host "  Backend   : http://localhost:$BACK_PORT"
Write-Host ""
Write-Host "  Port-forward commands:"
Write-Host "    kubectl port-forward svc/frontend $FRONT_PORT`:80 -n $NAMESPACE"
Write-Host "    kubectl port-forward svc/backend  $BACK_PORT`:8000 -n $NAMESPACE"
Write-Host ""

# ── Auto port-forward ─────────────────────────────────────────────────────────
if ($PortForward) {
    Log "Starting port-forwards (Ctrl+C to stop backend forward)"
    Start-Process powershell -ArgumentList "-NoExit -Command `"kubectl port-forward svc/frontend $FRONT_PORT`:80 -n $NAMESPACE`""
    Start-Sleep -Seconds 2
    kubectl port-forward svc/backend $BACK_PORT`:8000 -n $NAMESPACE
} else {
    $answer = Read-Host "Start port-forward now? (Y/n)"
    if ($answer -ne "n" -and $answer -ne "N") {
        Start-Process powershell -ArgumentList "-NoExit -Command `"kubectl port-forward svc/frontend $FRONT_PORT`:80 -n $NAMESPACE`""
        Start-Sleep -Seconds 2
        kubectl port-forward svc/backend $BACK_PORT`:8000 -n $NAMESPACE
    }
}
