#!/usr/bin/env bash
# Tail service logs (FE-1). Pass a service name to filter, e.g. ./scripts/logs.sh api
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

docker compose logs -f --tail=100 "$@"
