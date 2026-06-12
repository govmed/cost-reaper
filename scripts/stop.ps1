#Requires -Version 5
# Stop the stack cleanly (FE-1). Data volume is preserved.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "[stop] Stopping the stack…" -ForegroundColor Cyan
docker compose down
Write-Host "[stop] Stopped. Data volume 'db_data' preserved (use 'docker compose down -v' to wipe it)."
