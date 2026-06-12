#Requires -Version 5
# Run the test suites inside a throwaway container (no host Node required) (FE-1).
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "[test] Running monorepo test suites (turbo run test)…" -ForegroundColor Cyan
docker compose run --rm --no-deps api sh -lc "cd /repo && pnpm test"
Write-Host "[test] Done."
