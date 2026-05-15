#Requires -Version 5.1
<#
.SYNOPSIS
  Deploy all OpForcements tenants and the admin portal to minikube.

.PARAMETER SkipBuild
  Skip Docker image builds (use if images are already current).

.EXAMPLE
  .\deploy-all.ps1
  .\deploy-all.ps1 -SkipBuild
#>
param([switch]$SkipBuild)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ROOT = $PSScriptRoot

$TENANTS = @(
    @{ Name='novatech'; Namespace='opforcements-novatech'; Host='novatech.opforcements.local' },
    @{ Name='meridian'; Namespace='opforcements-meridian'; Host='meridian.opforcements.local' },
    @{ Name='apex';     Namespace='opforcements-apex';     Host='apex.opforcements.local'     },
    @{ Name='admin';    Namespace='opforcements-admin';    Host='admin.opforcements.local'    }
)

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
    Log 'Starting minikube (6GB RAM, 4 CPUs)...'
    minikube start --driver=docker --memory=6144 --cpus=4
} else {
    Ok 'minikube already running'
}

# Enable ingress addon (nginx ingress controller)
Hdr 'Enabling ingress addon'
minikube addons enable ingress
Ok 'Ingress addon ready'

# Configure Docker
Hdr 'Configuring Docker environment'
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
Ok 'Using minikube Docker daemon'

# Build images
if (-not $SkipBuild) {
    Hdr 'Building backend image'
    docker build -t opforcements/backend:latest "$ROOT\backend"
    Ok 'Backend image built'

    Hdr 'Building frontend image'
    docker build -t opforcements/frontend:latest "$ROOT\frontend"
    Ok 'Frontend image built'
} else {
    Log 'Skipping image builds (-SkipBuild)'
}

# Apply manifests
foreach ($t in $TENANTS) {
    Hdr ('Deploying tenant: ' + $t.Name)
    if ($t.Name -eq 'admin') {
        $dir = "$ROOT\k8s\admin"
    } else {
        $dir = "$ROOT\k8s\tenants\" + $t.Name
    }
    kubectl apply -f "$dir\namespace.yaml"
    kubectl apply -f "$dir\postgres\"
    kubectl apply -f "$dir\backend\"
    kubectl apply -f "$dir\frontend\"
    kubectl apply -f "$dir\ingress.yaml"
    Ok ($t.Name + ' manifests applied')
}

# Wait for rollouts
foreach ($t in $TENANTS) {
    $ns = $t.Namespace
    Hdr ('Waiting for ' + $t.Name + ' (' + $ns + ')')
    kubectl rollout status statefulset/postgres -n $ns --timeout=120s
    kubectl rollout status deployment/backend   -n $ns --timeout=120s
    kubectl rollout status deployment/frontend  -n $ns --timeout=120s
    Ok ($t.Name + ' ready')
}

# Get minikube IP for hosts file
$MINIKUBE_IP = minikube ip
$HOSTS_LINE = $MINIKUBE_IP
foreach ($t in $TENANTS) { $HOSTS_LINE = $HOSTS_LINE + '  ' + $t.Host }

# Summary
Write-Host ''
Write-Host '================================================================' -ForegroundColor Green
Write-Host '  All OpForcements tenants deployed!' -ForegroundColor Green
Write-Host '================================================================' -ForegroundColor Green
Write-Host ''
Write-Host '  STEP 1 - Add this line to C:\Windows\System32\drivers\etc\hosts'
Write-Host '  (open Notepad as Administrator to edit):' -ForegroundColor Yellow
Write-Host ''
Write-Host ('  ' + $HOSTS_LINE) -ForegroundColor White
Write-Host ''
Write-Host '  STEP 2 - Open your browser:' -ForegroundColor Yellow
Write-Host ''
foreach ($t in $TENANTS) {
    $login = switch ($t.Name) {
        'novatech' { 'admin@novatech.io / NovaTech123!' }
        'meridian' { 'admin@meridian-fg.com / Meridian123!' }
        'apex'     { 'admin@apexhealth.tech / Apex123!' }
        'admin'    { 'admin@opforcements.io / Admin2024!' }
    }
    Write-Host ('  http://' + $t.Host + '   ->  ' + $login)
}
Write-Host ''
Write-Host '  No port-forwarding needed!' -ForegroundColor Green
Write-Host ''
