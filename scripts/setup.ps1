#Requires -Version 5
# Take a clean machine to a running, seeded cost-reaper (FE-1). Idempotent.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Log($m)  { Write-Host "[setup] $m" -ForegroundColor Cyan }
function Fail($m) { Write-Host "[setup:error] $m" -ForegroundColor Red; exit 1 }

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Fail "Docker is not installed/on PATH. See https://docs.docker.com/get-docker/"
}
docker compose version *> $null; if ($LASTEXITCODE -ne 0) { Fail "Docker Compose v2 is required." }
docker info *> $null;            if ($LASTEXITCODE -ne 0) { Fail "The Docker daemon is not running. Start Docker and retry." }
Log "Docker OK"

if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Log "Created .env from .env.example. Review secrets before any non-local use."
} else {
  Log ".env already present — left untouched."
}

Log "Building images (db / api / web)… this can take a few minutes the first time."
docker compose build; if ($LASTEXITCODE -ne 0) { Fail "Image build failed." }

Log "Starting PostgreSQL…"
docker compose up -d db

Log "Waiting for the database to become healthy…"
$attempts = 0
do {
  Start-Sleep -Seconds 2
  $status = (docker inspect -f '{{.State.Health.Status}}' cost-reaper-db 2>$null)
  $attempts++
  if ($attempts -gt 60) { docker compose logs db; Fail "Database did not become healthy in time." }
} until ($status -eq 'healthy')
Log "Database is healthy."

if ((Test-Path 'apps/api/prisma/migrations') -and (Get-ChildItem 'apps/api/prisma/migrations' -ErrorAction SilentlyContinue)) {
  Log "Applying migrations (prisma migrate deploy)…"
  docker compose run --rm api pnpm exec prisma migrate deploy
} else {
  Log "No migration files yet — provisioning schema with 'prisma db push' (baseline)."
  docker compose run --rm api pnpm exec prisma db push --skip-generate
}

Log "Seeding baseline data (admin, rate card, AWS/GCP/Azure catalog, workflow, checklist)…"
docker compose run --rm api pnpm seed

Log "Setup complete. Next: ./scripts/start.ps1"
Write-Host "  Web:     http://localhost:5173"
Write-Host "  API:     http://localhost:8000/api/v1"
Write-Host "  Health:  http://localhost:8000/health"
Write-Host "  Swagger: http://localhost:8000/docs"
