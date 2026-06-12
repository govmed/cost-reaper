#!/usr/bin/env bash
# Take a clean machine to a running, seeded cost-reaper (FE-1). Idempotent.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

log() { printf '\033[0;36m[setup]\033[0m %s\n' "$*"; }
err() { printf '\033[0;31m[setup:error]\033[0m %s\n' "$*" >&2; }

# 1) Prerequisites
if ! command -v docker >/dev/null 2>&1; then
  err "Docker is not installed/on PATH. See https://docs.docker.com/get-docker/"; exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  err "Docker Compose v2 is required (the 'docker compose' subcommand)."; exit 1
fi
if ! docker info >/dev/null 2>&1; then
  err "The Docker daemon is not running. Start Docker and retry."; exit 1
fi
log "Docker OK — $(docker --version)"

# 2) .env (never overwrite an existing one)
if [ ! -f .env ]; then
  cp .env.example .env
  log "Created .env from .env.example. Review secrets before any non-local use."
else
  log ".env already present — left untouched."
fi

# 3) Build images
log "Building images (db / api / web)… this can take a few minutes the first time."
docker compose build

# 4) Start DB and wait until healthy
log "Starting PostgreSQL…"
docker compose up -d db
log "Waiting for the database to become healthy…"
attempts=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' cost-reaper-db 2>/dev/null || echo starting)" = "healthy" ]; do
  attempts=$((attempts + 1))
  if [ "$attempts" -gt 60 ]; then err "Database did not become healthy in time."; docker compose logs db; exit 1; fi
  sleep 2
done
log "Database is healthy."

# 5) Schema / migrations
if [ -d apps/api/prisma/migrations ] && [ -n "$(ls -A apps/api/prisma/migrations 2>/dev/null)" ]; then
  log "Applying migrations (prisma migrate deploy)…"
  docker compose run --rm api pnpm exec prisma migrate deploy
else
  log "No migration files yet — provisioning schema with 'prisma db push' (baseline)."
  docker compose run --rm api pnpm exec prisma db push --skip-generate
fi

# 6) Seed baseline data
log "Seeding baseline data (admin, rate card, AWS/GCP/Azure catalog, workflow, checklist)…"
docker compose run --rm api pnpm seed

# 7) Next steps
# shellcheck disable=SC1091
set -a; . ./.env 2>/dev/null || true; set +a
log "Setup complete."
cat <<EOF

  Next:     ./scripts/start.sh
  Web:      http://localhost:${WEB_PORT:-5173}
  API:      http://localhost:${API_PORT:-8000}/api/v1
  Health:   http://localhost:${API_PORT:-8000}/health
  Swagger:  http://localhost:${API_PORT:-8000}/docs

EOF
