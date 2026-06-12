#!/usr/bin/env bash
# Apply database migrations (FE-1, NFR-5). Idempotent.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "[migrate] No .env found — run ./scripts/setup.sh first." >&2
  exit 1
fi

echo "[migrate] Ensuring the database is up…"
docker compose up -d db
attempts=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' cost-reaper-db 2>/dev/null || echo starting)" = "healthy" ]; do
  attempts=$((attempts + 1))
  if [ "$attempts" -gt 60 ]; then echo "[migrate] Database not healthy in time." >&2; exit 1; fi
  sleep 2
done

if [ -d apps/api/prisma/migrations ] && [ -n "$(ls -A apps/api/prisma/migrations 2>/dev/null)" ]; then
  echo "[migrate] Applying migrations (prisma migrate deploy)…"
  docker compose run --rm api pnpm exec prisma migrate deploy
else
  echo "[migrate] No migration files yet — syncing schema with 'prisma db push' (baseline)."
  docker compose run --rm api pnpm exec prisma db push --skip-generate
fi
echo "[migrate] Done."
