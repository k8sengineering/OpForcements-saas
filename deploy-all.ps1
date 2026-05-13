#Requires -Version 5.1
<#
.SYNOPSIS
  Deploy all OpForcements tenants and the admin portal to minikube.

.DESCRIPTION
  Builds the shared backend + frontend images once, then applies manifests
  for all 4 namespaces: novatech, meridian, apex, and admin.

.PARAMETER SkipBuild
  Skip Docker image builds (use if images are already current).

.EXAMPLE
  .\deploy-all.ps1
  .\deploy-all.ps1 -SkipBuild
#>
param([switch]$SkipBuild)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ROOT = $PSScriptRoot

$TENANTS = @(
    @{ Name="novatech"; Namespace="opforcements-novatech"; FrontPort=3001; BackPort=8001 },
    @{ Name="meridian"; Namespace="opforcements-meridian"; FrontPort=3002; BackPort=8002 },
    @{ Name="apex";     Namespace="opforcements-apex";     FrontPort=3003; BackPort=8003 },
    @{ Name="admin";    Namespace="opforcements-admin";    FrontPort=3000; BackPort=8000 }
)

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
    Log "Starting minikube (6GB RAM, 4 CPUs — needed for 4 full stacks)..."
    minikube start --driver=docker --memory=6144 --cpus=4
} else {
    Ok "minikube already running"
}

# ── Configure Docker ──────────────────────────────────────────────────────────
Hdr "Configuring Docker environment"
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
Ok "Using minikube's Docker daemon"

# ── Build images (once, shared across all tenants) ────────────────────────────
if (-not $SkipBuild) {
    Hdr "Building backend image"
    docker build -t opforcements/backend:latest "$ROOT\backend"
    Ok "Backend image built"

    Hdr "Building frontend image"
    docker build -t opforcements/frontend:latest "$ROOT\frontend"
    Ok "Frontend image built"
} else {
    Log "Skipping image builds (-SkipBuild)"
}

# ── Apply manifests for each tenant ──────────────────────────────────────────
foreach ($t in $TENANTS) {
    Hdr "Deploying tenant: $($t.Name)"

    if ($t.Name -eq "admin") {
        $dir = "$ROOT\k8s\admin"
    } else {
        $dir = "$ROOT\k8s\tenants\$($t.Name)"
    }

    kubectl apply -f "$dir\namespace.yaml"
    kubectl apply -f "$dir\postgres\"
    kubectl apply -f "$dir\backend\"
    kubectl apply -f "$dir\frontend\"
    Ok "$($t.Name) manifests applied"
}

# ── Wait for all rollouts ─────────────────────────────────────────────────────
foreach ($t in $TENANTS) {
    $ns = $t.Namespace
    Hdr "Waiting for $($t.Name) ($ns)"
    kubectl rollout status statefulset/postgres -n $ns --timeout=120s
    kubectl rollout status deployment/backend   -n $ns --timeout=120s
    kubectl rollout status deployment/frontend  -n $ns --timeout=120s
    Ok "$($t.Name) ready"
}

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  All OpForcements tenants are running!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Tenant         Frontend              Backend               Login"
Write-Host "  ─────────────────────────────────────────────────────────────────────────"
foreach ($t in $TENANTS) {
    $login = switch ($t.Name) {
        "novatech" { "admin@novatech.io / NovaTech123!" }
        "meridian" { "admin@meridian-fg.com / Meridian123!" }
        "apex"     { "admin@apexhealth.tech / Apex123!" }
        "admin"    { "admin@opforcements.io / Admin2024!" }
    }
    Write-Host ("  {0,-14} http://localhost:{1,-5}   http://localhost:{2,-5}   {3}" -f $t.Name, $t.FrontPort, $t.BackPort, $login)
}
Write-Host ""
Write-Host "  To port-forward a tenant:"
Write-Host "    .\deploy-tenant.ps1 -Tenant novatech -PortForward"
Write-Host ""
Write-Host "  To port-forward all (run each in a separate terminal):"
foreach ($t in $TENANTS) {
    $ns = $t.Namespace
    Write-Host "    kubectl port-forward svc/frontend $($t.FrontPort):80 -n $ns  &  kubectl port-forward svc/backend $($t.BackPort):8000 -n $ns"
}
Write-Host ""
