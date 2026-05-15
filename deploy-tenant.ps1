#Requires -Version 5.1
<#
.SYNOPSIS
  Build and deploy a single OpForcements tenant to minikube.

.PARAMETER Tenant
  Tenant name: novatech | meridian | apex | admin

.EXAMPLE
  .\deploy-tenant.ps1 -Tenant novatech
  .\deploy-tenant.ps1 -Tenant admin
#>
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('novatech','meridian','apex','admin')]
    [string]$Tenant
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ROOT = $PSScriptRoot

$TENANT_HOSTS = @{
    novatech = 'novatech.opforcements.local'
    meridian = 'meridian.opforcements.local'
    apex     = 'apex.opforcements.local'
    admin    = 'admin.opforcements.local'
}

$NAMESPACE  = 'opforcements-' + $Tenant
$HOSTNAME   = $TENANT_HOSTS[$Tenant]

function Log($msg) { Write-Host ('  ' + $msg) -ForegroundColor Cyan }
function Ok($msg)  { Write-Host ('  OK  ' + $msg) -ForegroundColor Green }
function Hdr($msg) { Write-Host ("`n==> " + $msg) -ForegroundColor Yellow }

# Prerequisites
Hdr 'Checking prerequisites'
foreach ($cmd in 'minikube','kubectl','docker') {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error ('Required tool not found: ' + $cmd)
        exit 1
    }
}
Ok 'All tools present'

# Start minikube
Hdr 'Starting minikube'
$status = minikube status --format '{{.Host}}' 2>$null
if ($status -ne 'Running') {
    Log 'Starting minikube...'
    minikube start --driver=docker --memory=6144 --cpus=4
} else {
    Ok 'minikube already running'
}

# Enable ingress addon
Hdr 'Enabling ingress addon'
minikube addons enable ingress
Ok 'Ingress addon ready'

# Configure Docker
Hdr 'Configuring Docker environment'
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
Ok 'Using minikube Docker daemon'

# Build images
Hdr 'Building backend image'
docker build -t opforcements/backend:latest "$ROOT\backend"
Ok 'Backend image built'

Hdr 'Building frontend image'
docker build -t opforcements/frontend:latest "$ROOT\frontend"
Ok 'Frontend image built'

# Apply manifests
if ($Tenant -eq 'admin') {
    $MANIFEST_DIR = "$ROOT\k8s\admin"
} else {
    $MANIFEST_DIR = "$ROOT\k8s\tenants\$Tenant"
}

Hdr ('Applying manifests for ' + $Tenant + ' (namespace: ' + $NAMESPACE + ')')
kubectl apply -f "$MANIFEST_DIR\namespace.yaml"
kubectl apply -f "$MANIFEST_DIR\postgres\"
kubectl apply -f "$MANIFEST_DIR\backend\"
kubectl apply -f "$MANIFEST_DIR\frontend\"
kubectl apply -f "$MANIFEST_DIR\ingress.yaml"
Ok 'Manifests applied'

# Wait for rollouts
Hdr 'Waiting for PostgreSQL'
kubectl rollout status statefulset/postgres -n $NAMESPACE --timeout=120s

Hdr 'Waiting for backend'
kubectl rollout status deployment/backend -n $NAMESPACE --timeout=120s

Hdr 'Waiting for frontend'
kubectl rollout status deployment/frontend -n $NAMESPACE --timeout=120s

Ok ('All workloads ready in ' + $NAMESPACE)

# Hosts file info
$MINIKUBE_IP = minikube ip

Write-Host ''
Write-Host '================================================================' -ForegroundColor Green
Write-Host ('  Tenant ' + $Tenant + ' is running!') -ForegroundColor Green
Write-Host '================================================================' -ForegroundColor Green
Write-Host ''
Write-Host '  Add to C:\Windows\System32\drivers\etc\hosts (run Notepad as Admin):'
Write-Host ('  ' + $MINIKUBE_IP + '  ' + $HOSTNAME) -ForegroundColor White
Write-Host ''
Write-Host ('  Then open: http://' + $HOSTNAME) -ForegroundColor Cyan
Write-Host ''
