#Requires -Version 5
# Apply database migrations (FE-1, NFR-5). Idempotent.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path .env)) { Write-Host "[migrate] No .env found — run ./scripts/setup.ps1 first." -ForegroundColor Red; exit 1 }

Write-Host "[migrate] Ensuring the database is up…" -ForegroundColor Cyan
docker compose up -d db
$attempts = 0
do {
  Start-Sleep -Seconds 2
  $status = (docker inspect -f '{{.State.Health.Status}}' cost-reaper-db 2>$null)
  $attempts++
  if ($attempts -gt 60) { Write-Host "[migrate] Database not healthy in time." -ForegroundColor Red; exit 1 }
} until ($status -eq 'healthy')

if ((Test-Path 'apps/api/prisma/migrations') -and (Get-ChildItem 'apps/api/prisma/migrations' -ErrorAction SilentlyContinue)) {
  Write-Host "[migrate] Applying migrations (prisma migrate deploy)…"
  docker compose run --rm api pnpm exec prisma migrate deploy
} else {
  Write-Host "[migrate] No migration files yet — syncing schema with 'prisma db push' (baseline)."
  docker compose run --rm api pnpm exec prisma db push --skip-generate
}
Write-Host "[migrate] Done."
