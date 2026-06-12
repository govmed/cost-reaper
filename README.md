# cost-reaper

**Technology Project Cost Estimator** — a production web app that produces consistent, auditable
cost estimates for technology projects. Build estimates from a governed **rate card**, from
**AWS / GCP / Azure** compute pricing, apply an **upcharge** and **contingency**, see **monthly and
yearly** totals, run them through a **customizable approval workflow** with an **automated
completeness checklist**, and export a professional summary — in minutes, with every assumption
recorded.

> End-to-end **TypeScript**: React + Vite web → **NestJS** REST API → **PostgreSQL 16** (Prisma),
> in a **pnpm + Turborepo** monorepo with a shared `packages/types` contract and a pure
> `packages/engine` estimation engine. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and
> [`CLAUDE.md`](CLAUDE.md) (the full product brief & living memory).

## Prerequisites

The only hard requirement is **Docker** (with Docker Compose v2). Everything runs in containers — you
do **not** need Node, pnpm, or PostgreSQL installed on the host.

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS / Windows) or Docker Engine + Compose (Linux)
- Git

## Quickstart (one setup + one start)

**Linux / macOS**

```bash
./scripts/setup.sh     # checks Docker, creates .env, builds images, starts DB, migrates, seeds
./scripts/start.sh     # brings up db + api + web and prints URLs
```

**Windows (PowerShell)**

```powershell
./scripts/setup.ps1
./scripts/start.ps1
```

Then open:

| Service           | URL                          |
| ----------------- | ---------------------------- |
| Web app           | http://localhost:5173        |
| API               | http://localhost:8000/api/v1 |
| API health        | http://localhost:8000/health |
| Swagger / OpenAPI | http://localhost:8000/docs   |

A seeded **Admin** is created from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in your `.env`.

## Common commands

| Task                | Linux/macOS            | Windows                 |
| ------------------- | ---------------------- | ----------------------- |
| Set up from scratch | `./scripts/setup.sh`   | `./scripts/setup.ps1`   |
| Start the stack     | `./scripts/start.sh`   | `./scripts/start.ps1`   |
| Stop the stack      | `./scripts/stop.sh`    | `./scripts/stop.ps1`    |
| Run tests           | `./scripts/test.sh`    | `./scripts/test.ps1`    |
| Run migrations      | `./scripts/migrate.sh` | `./scripts/migrate.ps1` |
| (Re)seed data       | `./scripts/seed.sh`    | `./scripts/seed.ps1`    |
| Tail logs           | `./scripts/logs.sh`    | `./scripts/logs.ps1`    |

(Linux/macOS users can also use the `Makefile`: `make setup`, `make up`, `make down`, `make test`.)

## Monorepo layout

```
apps/web        React + TS + Vite frontend
apps/api        NestJS REST API (Prisma, migrations, feature modules)
packages/types  shared Zod schemas + TS types — the contract across the wire
packages/engine pure estimation engine (no I/O): totals, upcharge, contingency, monthly/yearly
packages/config shared eslint / tsconfig / tailwind presets
scripts         cross-platform setup / start / stop / test / migrate / seed / logs
docs            architecture, ADRs, API, database, runbook, user guide
```

## Project status

Sprint 0 — Foundation (EP-1). See [`PROJECT_LOG.md`](PROJECT_LOG.md) for the running narrative and
[`CLAUDE.md`](CLAUDE.md) → Section 19 "Current State" for where things stand right now.

## Troubleshooting

- **`docker: command not found`** — install Docker Desktop / Engine and ensure it is running.
- **Port already in use** — change `API_PORT` / `WEB_PORT` / `POSTGRES_PORT` in `.env`.
- **DB not healthy** — `./scripts/logs.sh db`; the API waits for a healthy DB before migrating.
- **Reset everything** — `./scripts/stop.sh` then re-run `./scripts/setup.sh` (the `db_data` volume
  persists data; remove it with `docker compose down -v` for a clean slate).

## License

UNLICENSED — internal project. See [`CLAUDE.md`](CLAUDE.md) for governance.
