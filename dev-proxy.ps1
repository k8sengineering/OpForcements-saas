$env:PATH = "C:\Program Files\Kubernetes\Minikube\;$env:PATH"
Write-Host "OpForcements dev proxy - keep this window open"
Write-Host "App: http://localhost:3000"
Write-Host ""

$fJob = $null
$bJob = $null

while ($true) {
    if ($fJob -eq $null -or $fJob.State -ne 'Running') {
        if ($fJob -ne $null) { Remove-Job $fJob -Force }
        $fJob = Start-Job -ScriptBlock {
            $env:PATH = "C:\Program Files\Kubernetes\Minikube\;$env:PATH"
            & minikube kubectl -- port-forward svc/frontend-service 3000:80 -n opforcements 2>&1
        }
        Write-Host "$(Get-Date -Format 'HH:mm:ss') Frontend port-forward started (job $($fJob.Id))"
    }

    if ($bJob -eq $null -or $bJob.State -ne 'Running') {
        if ($bJob -ne $null) { Remove-Job $bJob -Force }
        $bJob = Start-Job -ScriptBlock {
            $env:PATH = "C:\Program Files\Kubernetes\Minikube\;$env:PATH"
            & minikube kubectl -- port-forward svc/backend 8000:8000 -n opforcements 2>&1
        }
        Write-Host "$(Get-Date -Format 'HH:mm:ss') Backend port-forward started (job $($bJob.Id))"
    }

    Start-Sleep -Seconds 10
}
