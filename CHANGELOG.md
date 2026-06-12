# Changelog

All notable changes to **cost-reaper** are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project uses semantic versioning once
it ships a first release.

## [Unreleased]

### Admin UI — Part 3: Cloud Prices browse (FE-38 frontend)

#### Added
- **Cloud prices** page (nav link): browse the seeded AWS/GCP/Azure catalog with a provider filter + free-text search (region/service/instance). Read-only. Completes the admin/reference-data section (Rate Cards · Users · Cloud Prices).

### Admin UI — Part 2: Users (FE-45 frontend)

#### Added
- **Users** admin page (nav link visible to admins): list users, **create** (email/password/role/name), **change role** and **activate/deactivate** inline, and **delete**. Backed by the existing admin-only `/users` API.

### Admin UI — Part 1: Rate Cards (FE-10 frontend)

#### Added
- **Top navigation** (Estimates · Rate cards) in the web app.
- **Rate Cards page** — create rate cards (name + currency), and **add / inline-edit / delete roles & rates** (labor-cost customization), plus activate/deactivate and delete cards.
- Backend: rate-card **role endpoints** (`POST/PATCH/DELETE /rate-cards/:id/roles[/:roleId]`, admin-only, audited) so individual roles/rates are editable after creation.

### Hardening (NFR-6)

#### Changed
- **CI quality gates are now blocking**: `format:check` + `lint` no longer `continue-on-error`. Ran Prettier across the repo; fixed the one ESLint error (`.cjs` config files are ignored) and removed unused `eslint-disable` directives. The append-heavy living docs (`CLAUDE.md`, `PROJECT_LOG.md`, `AUDIT_LOG.md`) are prettier-ignored.

#### Added
- **Playwright e2e** smoke test (`apps/web/e2e/smoke.spec.ts`): login → create estimate → add a line → see totals + checklist. New CI **`e2e` job** builds the Docker images, runs the full stack, migrates + seeds, and drives the browser — which also **exercises the Docker image build** (previously only the Node pipeline ran in CI). Verified the stack + critical path locally end-to-end.

### Database — first real Prisma migration (NFR-5)

#### Added
- `apps/api/prisma/migrations/0_init` — the initial versioned migration (full MVP schema: 15 tables, 10 enums, FK constraints, indexes), generated from `schema.prisma` and verified to `migrate deploy` cleanly onto a fresh PostgreSQL. Replaces the `db push` baseline (`setup`/`migrate` now use `migrate deploy`).
- `docs/DATABASE.md` — migration workflow, baselining an existing db-push database, schema overview, backup/restore.

### Sprint 4 — Estimate Governance (EP-12): workflow + smart checklist

#### Added
- **Workflow engine** (FR-24): estimates flow through the seeded, configurable approval workflow (Draft → In Review → Approved → Final → Archived). Endpoints: `GET /workflows/default`, `GET /estimates/:id/workflow`, `POST /estimates/:id/transitions`. Transitions are **role-gated** and recorded as immutable history; estimates auto-attach the default workflow on create.
- **Smart checklist** (FR-25): `GET /estimates/:id/checklist` evaluates rule-driven completeness (rate card, labor roles, cloud lines, amounts, billing periods, line presence). **Blocking checks gate workflow transitions** (`requiresChecklistPass`). Pure rule evaluator with unit tests.
- **Web**: governance panel in the estimate editor — current stage, role/checklist-gated transition buttons + history, and the live checklist with pass/fail items.

### Sprint 3 — Web UI (EP-4/EP-8 frontend)

#### Added
- **Web app** (React + Vite + Tailwind, TanStack Query, React Router) consuming the REST API:
  - **Login** with JWT (token storage + transparent refresh). (FR-1)
  - **Estimates list** with name search + create. (FR-9, FE-13/26)
  - **Estimate editor**: edit upcharge/contingency/status; add/delete **labor / non-labor / cloud** line items (role & cloud pickers from the API) + assumptions; **live one-time/monthly/yearly/grand totals**; **CSV export** (authenticated blob download). (FR-4..FR-8, FR-21/22/23, FR-10)
- Typed API client, auth context, query hooks.

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
