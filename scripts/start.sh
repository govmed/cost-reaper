#!/usr/bin/env bash
# Bring up the full stack (db / api / web) and print URLs (FE-1).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "[start] No .env found — run ./scripts/setup.sh first." >&2
  exit 1
fi

echo "[start] Bringing up db + api + web…"
docker compose up -d

# shellcheck disable=SC1091
set -a; . ./.env 2>/dev/null || true; set +a
cat <<EOF
[start] Stack is up.
  Web:      http://localhost:${WEB_PORT:-5173}
  API:      http://localhost:${API_PORT:-8000}/api/v1
  Health:   http://localhost:${API_PORT:-8000}/health
  Swagger:  http://localhost:${API_PORT:-8000}/docs

  Tail logs with: ./scripts/logs.sh
EOF
