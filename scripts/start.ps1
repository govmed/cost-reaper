#Requires -Version 5
# Bring up the full stack (db / api / web) and print URLs (FE-1).
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path .env)) { Write-Host "[start] No .env found — run ./scripts/setup.ps1 first." -ForegroundColor Red; exit 1 }

Write-Host "[start] Bringing up db + api + web…" -ForegroundColor Cyan
docker compose up -d

Write-Host "[start] Stack is up."
Write-Host "  Web:     http://localhost:5173"
Write-Host "  API:     http://localhost:8000/api/v1"
Write-Host "  Health:  http://localhost:8000/health"
Write-Host "  Swagger: http://localhost:8000/docs"
Write-Host "  Tail logs with: ./scripts/logs.ps1"
