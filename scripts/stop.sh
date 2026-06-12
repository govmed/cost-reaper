#!/usr/bin/env bash
# Stop the stack cleanly (FE-1). Data volume is preserved.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[stop] Stopping the stack…"
docker compose down
echo "[stop] Stopped. Data volume 'db_data' preserved (use 'docker compose down -v' to wipe it)."
