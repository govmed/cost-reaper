#!/usr/bin/env bash
# (Re)seed reference data (FE-1). Idempotent.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "[seed] No .env found — run ./scripts/setup.sh first." >&2
  exit 1
fi

echo "[seed] Ensuring the database is up…"
docker compose up -d db
attempts=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' cost-reaper-db 2>/dev/null || echo starting)" = "healthy" ]; do
  attempts=$((attempts + 1))
  if [ "$attempts" -gt 60 ]; then echo "[seed] Database not healthy in time." >&2; exit 1; fi
  sleep 2
done

echo "[seed] Seeding baseline data…"
docker compose run --rm api pnpm seed
echo "[seed] Done."
