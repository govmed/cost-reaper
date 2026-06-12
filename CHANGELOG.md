# Changelog

All notable changes to **cost-reaper** are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project uses semantic versioning once
it ships a first release.

## [Unreleased]

### Governed cost categories (FE-11, FR-29)

#### Changed
- **Non-labor `category` is now governed by the `COST_CATEGORY` reference list** instead of free text. The estimate editor presents a category **dropdown** (from the reference data), and the API **validates** the submitted category against the active `COST_CATEGORY` values (deny-by-default). An admin can add a category in **Reference data** and it's immediately selectable — verified live ("Marketing" added → usable; "BogusCat" → 400). Reuses the cached reference-validation layer (new `assertActiveDisplayName`). No migration (the column was already text).

### Printable estimate summary (FE-23, FR-10)

#### Added
- **Printable summary** view at `/estimates/:id/print` (a "Printable summary" button in the estimate editor): a clean, read-only document — header/meta, labor/non-labor/cloud line tables, one-time/monthly/yearly/upcharge/contingency/grand totals, per-SDLC-phase and per-category breakdowns, and assumptions — with a **Print** button (`window.print()`). The app chrome is hidden when printing (`print:hidden`). Reuses the existing estimate detail payload (no new API). Covered by the Playwright e2e.

### Dashboard (FE-27, FR-18)

#### Added
- **Dashboard** — a new landing-adjacent page (nav link) summarizing estimates: total count, drafts/final, **grand totals per currency** (exact decimal sum), a **by-workflow-stage** breakdown, and **recent activity** (clickable). New `GET /dashboard` endpoint backed by a pure, unit-tested `summarizeDashboard` aggregator; grand totals computed via the shared estimation engine (new `sumMoney` helper). Read-only, available to any authenticated user. Extended Playwright e2e. Verified live.
- Refactor: extracted `toMappableEstimate` into `engine-mapping` so the estimates and dashboard services share one estimate→engine projection (NFR-15).

### FE-54 (part 1) — SDLC phase fully data-driven (FR-29, NFR-17)

#### Changed
- **SDLC phase is no longer a hard-coded enum.** Dropped the Prisma/Zod `SdlcPhase` enum; the `sdlc_phase` columns are now `TEXT` (migration `20260612160000_sdlc_phase_data_driven` converts in place with `USING ::text`, **preserving existing values**). The set of valid phases lives in the `SDLC_PHASE` reference table.
- **Server-side validation** now checks a line's phase against the **active** `SDLC_PHASE` reference values (deny-by-default) via a new cached `ReferenceService.assertActiveCode`. The estimate editor's phase dropdowns offer **any active** phase (no hard-coded filter).
- Net effect: an admin can **add/rename/re-order/retire an SDLC phase in Reference data with no code change** — the new phase is immediately selectable, storable, validated, and rolled up in the per-phase cost breakdown. Verified live (new "DISCOVERY" phase usable end-to-end; invalid phase → 400). This is the first column migrated off enums; the rest of FE-54 (status, billing period, role, provider, etc.) follows the same pattern.

### Sprint 11 — Reference Data Platform (FR-29, NFR-17, EP-13)

#### Added
- **Generic reference-data schema (FE-50):** `reference_type` + `reference_value` tables (id, code, display_name, description, display_order, is_active, created_by/at, updated_by/at) with a **parent-child self-relation** for grouped values (SDLC phase → tasks, testing phase → testing types). Migration `20260612140000_reference_data_platform` — verified fresh-DB deploy of all migrations + no drift.
- **Reference API (FE-51):** `GET /reference/types`, `GET /reference/types/:code/values` (active or `?all=true`, nested + ordered), and admin-only audited CRUD (`POST /reference/types`, `POST /reference/types/:code/values`, `PATCH /reference/values/:id`, `DELETE /reference/values/:id`). Built-in values can be deactivated/renamed/re-sequenced but not deleted. Pure `buildReferenceTree` helper with unit tests.
- **Seed (FE-52):** 16 baseline reference types (SDLC_PHASE incl. tasks, ESTIMATE_STATUS, BILLING_PERIOD, RATE_UNIT, CLOUD_PROVIDER, CLOUD_PRICE_UNIT, NON_LABOR_TYPE, ROLE, COST_CATEGORY, CHECKLIST_SEVERITY/SCOPE, WORKFLOW_STAGE, PRIORITY, RESOURCE_TYPE, TESTING_PHASE incl. types, DOCUMENT_TYPE) — idempotent, marked built-in.
- **Admin UI (FE-53):** **Reference data** page (admin nav) — pick a type, view its values as a tree, add values, rename, re-order, activate/deactivate, and delete custom values.
- **First dynamic consumer (FE-54 start):** the estimate editor's **SDLC-phase dropdowns now load labels/order from the reference API** (falling back to built-in codes); renaming/re-sequencing a phase in Reference data flows through without a code change.
- Extended **Playwright e2e** (reference page serves seeded values + built-in Rename/no-Delete). Full pipeline green (format/lint/typecheck/test 43/build); reference API verified live (CRUD round-trip + built-in delete guard).

#### Note
Existing Prisma/Zod enums remain the stored type for now; migrating columns off enums to FK-validate against the reference table (the rest of **FE-54**) is the next increment. The interim `SdlcPhase` enum is first in line.

### Sprint 10 — Resource capacity, SDLC-phase costs & stage gates (FR-27, FR-28)

#### Added
- **Resource allocation & capacity (FR-27, FE-48):** labor lines carry a **resource name**, **allocation %** (a resource = 100%/day, splittable), and an optional **start/end date** window. A pure `findCapacityViolations` engine function enforces that **no resource exceeds 100% on any date**; over-allocating writes are **rejected on save (400)** and a **`resource_capacity` BLOCKER checklist rule** gates workflow transitions. The estimate editor shows the new columns, an over-allocation banner, and the inline rejection message.
- **Cost per SDLC phase (FR-28, FE-49):** every line item can be tagged with an **SDLC phase** (`PLANNING…MAINTENANCE`). The engine rolls up **per-phase subtotals** (one-time/monthly/yearly, post-upcharge) shown on a **"Cost by SDLC phase"** card and in the CSV export; un-phased lines roll up under **Unassigned**.
- **Stage gates:** forward workflow transitions remain gated by the blocking checklist; the new capacity rule participates as a gate.
- **DB migration** `20260612120000_resource_capacity_sdlc_phase` (SdlcPhase enum + `sdlc_phase` on all line items; `resource_name`/`allocation_percent`/`start_date`/`end_date` on labor). Verified to apply cleanly on a fresh DB with **no drift**.
- **Tests:** new engine unit tests (capacity sweep-line edge cases; per-phase grouping), checklist `resource_capacity` rule tests, and an extended **Playwright e2e** (phase breakdown + capacity-guard rejection + stage-gate). Full pipeline green (format/lint/typecheck/test/build) and verified live end-to-end against the running stack.

#### Spec (CLAUDE.md)
- **FR-21a/FR-21b** — pull cloud prices from provider pricing sources + per-provider **"last pulled"** date (with a small freshness table).
- **FR-29 / NFR-17 / EP-13 (+ ADR 0007)** — **database-driven reference data**: a generic `reference_type`/`reference_value` model (code/name/desc/order/active/audit + parent-child) to replace hard-coded enums across SDLC phases, statuses, roles, categories, etc. Migration of existing enums is scheduled as a dedicated increment (Sprint 11).

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
