#Requires -Version 5
# Tail service logs (FE-1). Pass a service name to filter, e.g. ./scripts/logs.ps1 api
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

docker compose logs -f --tail=100 @args
