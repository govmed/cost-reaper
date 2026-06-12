#Requires -Version 5
# (Re)seed reference data (FE-1). Idempotent.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path .env)) { Write-Host "[seed] No .env found — run ./scripts/setup.ps1 first." -ForegroundColor Red; exit 1 }

Write-Host "[seed] Ensuring the database is up…" -ForegroundColor Cyan
docker compose up -d db
$attempts = 0
do {
  Start-Sleep -Seconds 2
  $status = (docker inspect -f '{{.State.Health.Status}}' cost-reaper-db 2>$null)
  $attempts++
  if ($attempts -gt 60) { Write-Host "[seed] Database not healthy in time." -ForegroundColor Red; exit 1 }
} until ($status -eq 'healthy')

Write-Host "[seed] Seeding baseline data…"
docker compose run --rm api pnpm seed
Write-Host "[seed] Done."
