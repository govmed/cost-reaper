# Changelog

All notable changes to **cost-reaper** are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project uses semantic versioning once
it ships a first release.

## [Unreleased]

### Sprint 2 — Estimate Authoring + Engine + Export (EP-4, EP-5, EP-6, EP-8, EP-11)

#### Added
- **Estimates** (`/api/v1/estimates`): create / list (search by name, filter by status & owner, paginated) / get (detail) / update / delete / **clone**. (FR-4, FR-9, FE-13/26)
- **Line items** under an estimate: **labor** (role × qty × units, rate snapshot), **non-labor** (fixed/recurring), **cloud compute** (from the catalog, unit-price snapshot) + **assumptions**. (FR-5/6/8/21, FE-14/15/16/39)
- **Totals** (`/estimates/:id/totals`): computed by `@cost-reaper/engine` — upcharge (global + per-line) → contingency → one-time/monthly/yearly + grand total + category subtotals. (FR-7, FR-22, FR-23)
- **CSV export** (`/estimates/:id/export`). (FR-10, FE-21)
- **Cloud prices** (`/api/v1/cloud-prices`): read the seeded AWS/GCP/Azure catalog with filters. (FR-21, FE-38)
- Engine `lineTotal()` helper; unit tests for the engine mapping + CSV builder.

### Sprint 1 — Identity & Reference Data (EP-2, EP-3)

#### Added
- **Auth** (`/api/v1/auth`): register, login, refresh, logout, me — argon2 hashing, JWT access (15m) + refresh (7d). (FR-1, FE-6/7/9)
- **RBAC**: deny-by-default `JwtAuthGuard` + `RolesGuard` app-wide; `@Roles` / `@Public` / `@CurrentUser` decorators; `ZodValidationPipe`. (FR-2, FR-26, NFR-16, FE-8/46)
- **User management** (`/api/v1/users`, admin-only): list / create / update / delete. (FR-26, FE-45)
- **Rate cards** (`/api/v1/rate-cards`): list/get for any authenticated user; create/update/delete admin-only, with roles + rates. (FR-3, FE-10)
- **Audit trail**: create/modify on users + rate cards recorded as `AuditEvent`. (FR-11, FE-30)
- Unit tests: `AuthService` (hash/verify + token roundtrip), `ZodValidationPipe`.

### Sprint 0 — Foundation (EP-1)

#### Added
- pnpm + Turborepo monorepo scaffold: `apps/web`, `apps/api`, `packages/types`, `packages/engine`,
  `packages/config`. (NFR-6, NFR-15)
- Docker stack (`docker-compose.yml`): `db` (PostgreSQL 16) / `api` (NestJS) / `web` (Vite build via
  nginx), with health checks. (FE-2, NFR-7)
- Cross-platform scripts (`setup`, `start`, `stop`, `test`, `migrate`, `seed`, `logs` — `.sh` + `.ps1`)
  and a `Makefile`. (FE-1)
- Config & secrets handling: `.env.example`, env-only configuration, nothing secret in source. (FE-4, NFR-10)
- API health & readiness endpoints (`/health`, `/ready`) + structured logging. (FE-5, NFR-9)
- Shared contract package `@cost-reaper/types` (Zod schemas + TS types).
- Pure estimation engine `@cost-reaper/engine` with unit tests (upcharge → contingency, monthly/yearly
  rollups, rounding). (FR-7, FR-22, FR-23)
- Full MVP Prisma schema + initial migration covering rate cards, estimates, labor/non-labor/cloud
  line items, cloud price catalog, workflow, checklist rules, audit. (Section 10)
- GitHub Actions CI: format → lint → typecheck → test → build + dependency audit. (FE-3)
- Documentation: `README` quickstart, `docs/ARCHITECTURE.md`, and ADRs 0001–0006.

[Unreleased]: https://github.com/govmed/cost-reaper/commits/main
