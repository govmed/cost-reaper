# Runbook & Deployment — cost-reaper

Operational guide for running, deploying, and maintaining **cost-reaper**. It covers
prerequisites, configuration, bring-up, health checks, migrations, seeding,
backup/restore, rollback, observability, and common troubleshooting.

## 1. Architecture (operational view)

Three containers, defined in `docker-compose.yml`:

| Service | What                             | Port (host)                                         |
| ------- | -------------------------------- | --------------------------------------------------- |
| `db`    | PostgreSQL 16                    | `${POSTGRES_PORT:-5432}`                            |
| `api`   | NestJS REST API                  | `${API_PORT:-8000}` → `/api/v1`, Swagger at `/docs` |
| `web`   | React/Vite build served by nginx | `${WEB_PORT:-5173}`                                 |

The API is **stateless** (horizontally scalable); all state is in PostgreSQL. See
`docs/ARCHITECTURE.md` for the full picture and `docs/DATABASE.md` for the schema.

## 2. Prerequisites

- **Docker** + **Docker Compose** (the only hard requirement for the scripted path).
- For native/local development: Node 22 LTS+ and pnpm.

## 3. Configuration

All configuration is via environment variables — **no secrets in source**. Copy the
template and edit:

```bash
cp .env.example .env
```

Key variables (`.env.example` documents them all):

| Var                                                   | Purpose                                                  |
| ----------------------------------------------------- | -------------------------------------------------------- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Database credentials/name                                |
| `DATABASE_URL`                                        | Prisma connection string (must match the above)          |
| `API_PORT` / `WEB_PORT` / `POSTGRES_PORT`             | Host ports                                               |
| `JWT_SECRET` / `JWT_REFRESH_SECRET`                   | Token signing secrets — **set strong random values**     |
| `ACCESS_TOKEN_TTL_MIN` / `REFRESH_TOKEN_TTL_DAYS`     | Token lifetimes (default 15 min / 7 days)                |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`            | Initial admin (seed only; never hardcoded)               |
| `CORS_ORIGIN`                                         | Allowed web origin                                       |
| `LOG_LEVEL`                                           | Structured-log verbosity                                 |
| `VITE_API_BASE_URL`                                   | API base the web build points at                         |
| `CLOUD_HOURS_PER_MONTH`                               | Hours used to annualize hourly cloud rates (default 730) |

> **Production:** terminate **TLS** at your load balancer/ingress, set unique strong
> `JWT_*` secrets, and supply secrets via your platform's secret store — not a
> committed `.env`.

## 4. Bring-up (scripted, cross-platform)

A clean machine to a running, seeded app:

```bash
./scripts/setup.sh     # Linux/macOS   (PowerShell: ./scripts/setup.ps1)
./scripts/start.sh     # bring up db + api + web
```

`setup` checks prerequisites, creates `.env` (if absent), builds images, starts the
DB and waits for health, runs **migrations**, and **seeds** baseline data (admin,
sample rate card, AWS/GCP/Azure price catalog, default workflow, checklist rules, and
the reference-data values). Both scripts are **idempotent** and exit non-zero on
failure.

URLs after start: web `:5173`, API `:8000/api/v1`, Swagger `:8000/docs`.

### Operational scripts

| Script (`.sh` / `.ps1`) | Action                                        |
| ----------------------- | --------------------------------------------- |
| `start` / `stop`        | Bring the stack up / down                     |
| `migrate`               | Apply migrations (`prisma migrate deploy`)    |
| `seed`                  | (Re)seed reference/baseline data (idempotent) |
| `test`                  | Run backend + frontend test suites            |
| `logs`                  | Tail service logs                             |

## 5. Health & readiness

- **Liveness:** `GET /health` → `200` when the API process is up.
- **Readiness:** `GET /ready` → `200` when dependencies (DB) are reachable.

```bash
curl -fs http://localhost:8000/health && echo OK
```

Use `/health` for liveness probes and `/ready` for readiness/load-balancer gating.

## 6. Database migrations

Migrations are versioned under `apps/api/prisma/migrations` and applied with
`prisma migrate deploy` (forward-only, idempotent):

```bash
./scripts/migrate.sh
# or:
docker compose run --rm api pnpm exec prisma migrate deploy
```

**Authoring a new migration** (developers): edit `schema.prisma`, generate the SQL
with `prisma migrate diff` against the current DB, review it (prefer in-place,
data-preserving `ALTER`s over drop/recreate), then verify on a throwaway database
that all migrations deploy cleanly and a drift check (`migrate diff --from-migrations
… --exit-code`) reports **no difference**. See `docs/DATABASE.md`.

## 7. Seeding

`./scripts/seed.sh` (or `docker compose run --rm api pnpm seed`) is idempotent —
safe to re-run. It upserts the admin, sample rate card, cloud price catalog, default
workflow, checklist rules, and reference data. It never overwrites user data.

## 8. Backup & restore

PostgreSQL is the single source of truth. Take regular logical backups:

```bash
# Backup (custom format)
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" > backup-$(date +%F).dump

# Restore into a fresh database
docker compose exec -T db pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < backup-YYYY-MM-DD.dump
```

Monetary values are exact decimals and estimates snapshot their rates/prices, so a
restored database reproduces historical totals exactly. Test restores periodically.

## 9. Rollback

- **Application:** redeploy the previous image tag / commit (the API is stateless).
- **Database:** migrations are forward-only. To undo a schema change, ship a new
  **compensating migration** rather than deleting history. For a clean environment,
  restore the latest backup (Section 8). Never run destructive migrations against a
  shared environment without a fresh, verified backup.

## 10. Observability

- **Structured JSON logs** with a per-request **correlation ID**; tail via
  `./scripts/logs.sh` or `docker compose logs -f api`.
- Errors are returned as **RFC 7807** `problem+json` with stable codes.
- Tune verbosity with `LOG_LEVEL`.

## 11. Security operations

- Passwords are **argon2**-hashed; JWT access + refresh with the configured TTLs.
- Authorization is **deny-by-default**, enforced server-side on every protected
  endpoint. Create/modify actions on users, rate cards, estimates, and reference data
  are **audited**.
- Rotate `JWT_*` secrets via your secret store; rotating invalidates existing tokens
  (users re-authenticate). The CI pipeline runs a dependency vulnerability scan.

## 12. Troubleshooting

| Symptom                           | Check                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `setup`/`start` fails immediately | Is Docker running? Re-read the script's error — it states the missing prerequisite.                   |
| API not healthy                   | `docker compose logs api`; confirm `DATABASE_URL` matches the DB env and the DB is healthy.           |
| Web can't reach API               | `VITE_API_BASE_URL` must point at the API as reached **from the browser**; check `CORS_ORIGIN`.       |
| 401 on every call                 | Token expired/invalid — sign in again; verify `JWT_*` secrets are set and stable across restarts.     |
| Migration won't apply             | Inspect `docker compose run --rm api pnpm exec prisma migrate status`; ensure no manual schema drift. |
| Port already in use               | Change `API_PORT` / `WEB_PORT` / `POSTGRES_PORT` in `.env`.                                           |

---

See also: `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API.md` (+ Swagger at
`/docs`), and `docs/USER_GUIDE.md`.
