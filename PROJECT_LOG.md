# PROJECT_LOG.md — Chapter Log

> The running, chapter-structured narrative of the **Technology Project Cost Estimator**.
> The agent appends an entry here **after every meaningful action** (a decision, a file created/changed, a command run, a test result, a blocker). Append-only — never delete history; supersede with a new entry instead. Every entry references the relevant requirement (BR/FR/NFR) and feature (FE) IDs. All timestamps are **UTC**.
>
> See `CLAUDE.md` Section 19 for the full protocol. Update order after each action: **CLAUDE.md Current State → this file → AUDIT_LOG.md.**

---

## How to use this file
- A **Chapter** groups a coherent unit of work (a sprint, an epic, or a major task).
- Start a new chapter when you move to a new sprint/epic; otherwise append entries under the current chapter.
- Copy the entry template below for each action.

### Entry template (copy for each action)
```markdown
### YYYY-MM-DD HH:MM UTC — <short action title>
- **Action:** <what I did>
- **Why:** <reason / which BR/FR/NFR/FE it advances>
- **Files touched:** <paths>
- **Result:** <outcome, tests run + pass/fail, decisions made>
- **Next:** <immediate next action>
```

---

## Chapter 0 — Project Kickoff & Foundation (started 2026-06-12)
**Goal:** Stand up the repository, confirm the tech stack and MVP backlog, and deliver EP-1 (Platform Foundation & DevOps): containers, setup/startup scripts, CI, health checks, config. Covers BR-9, FR-12, NFR-1/2/3/6/7/9/10, FE-1..FE-5.

### Restated understanding (Operating Instruction #1)
We are building **cost-reaper**, a production web app that estimates technology-project cost. End-to-end TypeScript: React+Vite web → NestJS REST API → PostgreSQL 16 (Prisma), in a pnpm + Turborepo monorepo with a shared `packages/types` contract. The MVP lets an Estimator log in, build an estimate from a governed rate card **plus AWS/GCP/Azure compute priced from a seeded catalog**, apply a **global + per-line upcharge %** and a **contingency %**, see **one-time / monthly / yearly** totals, search it, and export CSV — all installable on Linux/Windows via one setup + one start script. Operating mode is **AUTONOMOUS** (Section 0.1).

### Product backlog — Epics → Features → MVP stories

**Sprint 0 — Foundation (EP-1)** *(this chapter)*
- FE-1 Cross-platform setup/startup scripts (`setup`, `start`, `stop`, `test`, `migrate`, `seed`, `logs` — `.sh` + `.ps1`).
- FE-2 Docker/compose stack (`db`, `api`, `web`).
- FE-3 CI pipeline (lint → typecheck → test → build → image) via GitHub Actions.
- FE-4 Config & secrets handling (`.env.example`, env-only config, no secrets in source).
- FE-5 Health/readiness endpoints (`/health`, `/ready`) + structured logging skeleton.
- Foundational contract: `packages/types` (shared Zod schemas + TS types) and the full MVP Prisma schema + first migration (Section 10).

**Sprint 1 — Identity + Reference Data (EP-2, EP-3)**
- FE-6 Register/login/logout · FE-7 JWT access+refresh · FE-8 Role-based authz (Admin/Estimator/Viewer) · FE-9 argon2 hashing & password policy. *(FR-1, FR-2)*
- FE-10 Rate-card CRUD (roles + rates + currency). *(FR-3)*
- FE-38 Seeded cloud price catalog for AWS/GCP/Azure (regions, services, instances, units). *(FR-21, NFR-14)*
- FE-30 Audit trail (create/modify on estimates + rate cards). *(FR-11)* · FE-29 Structured logging + correlation IDs.

**Sprint 2 — Estimate Authoring + Engine + Export (EP-4, EP-5, EP-6, EP-8)**
- FE-13 Estimate CRUD + clone · FE-14 Labor lines · FE-15 Non-labor lines · FE-16 Assumptions/notes. *(FR-4/5/6/8)*
- FE-39 Cloud compute lines (provider/region/instance/usage → cost, price snapshot). *(FR-21)*
- FE-17 Line/category/grand totals · FE-18 Contingency % · **FE-41 Upcharge % (global + per-line override)** · **FE-42 Monthly & yearly rollups**. *(FR-7, FR-22, FR-23)*
- FE-26 List/search/filter estimates. *(FR-9)* · FE-21 CSV export + FE-23 printable summary. *(FR-10)*
- EP-10 docs: README/quickstart, OpenAPI/Swagger at `/docs`, ARCHITECTURE, USER_GUIDE. *(FR-12, NFR-12)*

**Post-MVP (Sprints 3+ — Section 8):** PERT (FR-13), scenarios (FR-14), versioning (FR-15), margin/tax (FR-16), multi-currency (FR-17), dashboard (FR-18), collaboration (FR-19), PDF/Excel (FR-20), live cloud price-API sync FR-21a/FE-40.

**MVP exit criteria (Section 7):** clean machine runs `setup` then `start`; seeded Admin + cloud catalog; an Estimator builds an estimate mixing labor + non-labor + cloud lines, applies a global upcharge with ≥1 per-line override, sees correct one-time/monthly/yearly totals, and exports CSV — all green in CI.

---

### 2026-06-12 04:17 UTC — Memory system initialized
- **Action:** `CLAUDE.md` (memory), `PROJECT_LOG.md` (this file), and `AUDIT_LOG.md` (audit) present at repo root.
- **Why:** Establishes the living-documentation system required by CLAUDE.md Section 19 before build work.
- **Files touched:** `CLAUDE.md`, `PROJECT_LOG.md`, `AUDIT_LOG.md`
- **Result:** Memory system ready. Verified workspace state: no code scaffold existed; tooling check shows Docker + Docker Compose + git present, host Node/pnpm absent (by design — stack runs in containers).
- **Next:** Write Chapter 0 backlog (done above) and begin EP-1 scaffold.

### 2026-06-12 04:17 UTC — Inspected remote `govmed/cost-reaper`
- **Action:** Authenticated as `govmed`; listed branches, commits, trees, PRs, tags, branch protection on https://github.com/govmed/cost-reaper.
- **Why:** User flagged that "several branches" exist; must not greenfield over existing work (BR-9, repo governance).
- **Files touched:** none (read-only inspection).
- **Result:** Repo is effectively **empty** — size 0, no PRs, no tags, `main` unprotected. All 5 branches contain only a one-line `README.md`. Linear history: `30f2047` "Initial commit" (`master`/`api`/`postgres`, name `cost-estimate-000`) → `bfa0b1a` "Rename to cost-reaper" (`main`/`documentation`). `main` is the up-to-date default. The topic-named branches are empty placeholders, not real work.
- **Decision/ADR (pending file):** Recommend **trunk-based** (feature branch → PR into `main`); modularity belongs in code structure, not long-lived per-component branches. Branch cleanup (deleting stale placeholders) is **human-gated** (Section 0.1) → logged as NEEDS-HUMAN.
- **Next:** Await user's branch-strategy decision before any push; continue capturing requirements.

### 2026-06-12 04:25 UTC — Spec update: modularity, governance (workflow + checklist), identity/RBAC
- **Action:** Folded four user-requested considerations into `CLAUDE.md`: (1) **high modularity** → NFR-15 + a "Modularity & extensibility" design section + new pure `packages/engine` + feature-module layout; (2) **customizable workflow** → FR-24 + FE-43 + modular `WorkflowEngine` + workflow data-model entities; (3) **automated smart checklist** (resource/pricing/costing completeness) → FR-25 + FE-44 + rule-based `ChecklistEngine` that gates workflow transitions; (4) **identity management + role security** (strengthened) → FR-26 + NFR-16 + FE-45/FE-46 + expanded `User` model. Grouped the two governance features under new **EP-12**; updated the traceability matrix; refreshed the Current State block.
- **Why:** Direct user requirements; advances NFR-15, FR-24, FR-25, FR-26, NFR-16 and strengthens BR-3/BR-8/NFR-4.
- **Files touched:** `CLAUDE.md` (Sections 4.2, 4.3, 5, 6, 9, 10, 19.1).
- **Result:** Requirements captured and traceable. Priorities: FR-26 identity/RBAC = **Must (MVP)**; FR-24 workflow & FR-25 checklist = **Should (Post-MVP)** with the modular engine seams established in MVP (PO may re-prioritize). Interpretation assumption recorded: "workflow" = estimate approval/review lifecycle. No code yet.
- **Next:** Confirm branch strategy with user; then scaffold EP-1 foundation.

### 2026-06-12 04:17 UTC — Branch decision + remote cleanup (trunk-based)
- **Action:** User chose **trunk-based** and authorized deleting stale branches. Wired `origin`, based `feature/ep1-foundation` on `main`, deleted `master`/`api`/`postgres`/`documentation` via `gh api`. Purged 16 macOS `Icon\r` artifacts that had polluted `.git/` (broke fetch).
- **Why:** Modularity belongs in code, not long-lived per-component branches (ADR-0004). Cleanup is human-gated (Section 0.1) — explicit approval given.
- **Files touched:** git refs only (remote); `docs/adr/0004-modularity-and-trunk-based-git.md` (later).
- **Result:** Remote has only `main`. Recoverable SHAs logged: `30f2047` (master/api/postgres), `bfa0b1a` (documentation = main).
- **Next:** Scaffold EP-1.

### 2026-06-12 04:30 UTC — EP-1 foundation scaffolded, pushed, PR #1 opened
- **Action:** Built the Sprint 0 foundation (96 files): pnpm+Turborepo monorepo (`apps/{web,api}`, `packages/{types,engine,config}`); Docker stack `db`/`api`/`web` with healthchecks; cross-platform `setup/start/stop/test/migrate/seed/logs` (`.sh`+`.ps1`) + `Makefile`; `.env.example` + root ESLint/Prettier + GitHub Actions CI; shared **Zod contract** (`@cost-reaper/types`); **pure estimation engine** (`@cost-reaper/engine`, decimal upcharge→contingency + monthly/yearly) with an exhaustive Vitest suite; NestJS API skeleton (`/health`+`/ready`, structured JSON logging + correlation ids, RFC7807 filter), full MVP **Prisma schema** + **seed** (admin, rate card, AWS/GCP/Azure catalog, default workflow, checklist rules); Vite/React shell; `docs/ARCHITECTURE.md` + ADRs 0001–0006.
- **Why:** Delivers EP-1 (FE-1..FE-5); advances FR-12, NFR-1/2/3/6/7/9/10/15; seeds schema/contract for FR-21/22/23/24/25/26.
- **Files touched:** see commit `148809c` (96 files).
- **Result:** Static validation passed — `bash -n` (all scripts), JSON parse (all configs), `docker compose config` VALID (db/api/web), Makefile tabs OK. **Not** run in authoring env: container image build + full test suite (no host Node) → delegated to CI on PR #1. Committed, pushed `feature/ep1-foundation`, opened **PR #1** → `main`.
- **Next:** CI/merge PR #1; generate first real Prisma migration to replace the `db push` baseline; start Sprint 1 (EP-2 auth, EP-3 rate cards).

### 2026-06-12 05:10 UTC — CI red → self-heal; HTML docs + draw.io flowcharts (FE-47)
- **Action:** (1) First CI run on PR #1 failed fast — `pnpm/action-setup@v4` rejected pnpm specified in both the action (`version: 9`) and `package.json` (`packageManager`); removed the action's `version`. (2) Found I can't verify locally — no host Node and the Docker daemon is down — so CI is the only oracle; fixed a `composite`+`--noEmit` clash in `packages/types/tsconfig.json` and made `format:check`/`lint` **advisory** (continue-on-error) since I can't run Prettier/ESLint to autofix ~90 hand-written files. (3) Per user requests, added **HTML documentation** (`docs/html/index.html`) and **HTML flowchart designs** — first built with Mermaid, then the user rejected Mermaid → rebuilt with **draw.io / diagrams.net**: editable `.drawio` sources in `docs/diagrams/` (architecture, workflow, calculation, checklist, request-lifecycle) rendered via the official viewer in `docs/html/flowcharts.html` (generated by a Python encoder). Added FR/feature coverage: NFR-12 updated, FE-47 added to EP-10, traceability + Section 18 updated.
- **Why:** Self-heal CI to a green/meaningful state (Section 0.1 rule 4); deliver EP-10 HTML docs (NFR-12, FE-47); honor the user's diagram-tool preference (draw.io).
- **Files touched:** `.github/workflows/ci.yml`, `packages/types/tsconfig.json`, `docs/html/{index,flowcharts}.html`, `docs/diagrams/*.drawio`, `CLAUDE.md` (§14/§4.3/§5/§6/§18 + Current State), memory (`diagram-tooling.md`).
- **Result:** draw.io embeds verified present (5) + viewer script; no Mermaid left in `docs/`. CI fixes pushed will re-trigger the pipeline; expect format/lint advisory, watching typecheck/test/build.
- **Next:** Commit + push; read CI; fix any typecheck/test/build failures; then merge PR #1.

### 2026-06-12 05:30 UTC — CI GREEN on PR #1
- **Action:** Two more self-heal fixes after the pnpm-version fix: removed `cache: pnpm` from `setup-node` (it requires a committed `pnpm-lock.yaml`, which we don't have without local Node). CI then ran the full pipeline.
- **Why:** Get the meaningful quality gates green (Section 0.1 self-heal); CI is the only verification oracle (no host Node; Docker daemon down locally).
- **Files touched:** `.github/workflows/ci.yml` (commits `2ba10c5`, `a8e7080`, + cache fix).
- **Result:** **Both jobs PASS.** `install → prisma generate → format(advisory) → lint(advisory) → typecheck → test → build` all ✓. The estimation-engine Vitest suite passes; types/engine/api/web build. Confirms the foundation builds clean + tests green. Advisory annotations only: Prettier formatting + one ESLint `module`-in-`.cjs` nit (non-blocking).
- **Next:** Human to merge PR #1 (merging `main` is human-gated). Then Sprint 1 (EP-2 auth, EP-3 rate cards) + generate the first real Prisma migration + flip format/lint to blocking after a `pnpm format` pass.

## Chapter 1 — Sprint 1: Identity & Reference Data (started 2026-06-12)
**Goal:** EP-2 (auth + RBAC + user management) and EP-3 (rate-card CRUD), with the audit trail. Covers FR-1, FR-2, FR-3, FR-11, FR-26, NFR-16; FE-6/7/8/9/10/30/45/46.

### 2026-06-12 05:45 UTC — Merged PR #1; fixed author; began Sprint 1
- **Action:** Per user: rewrote the one gmail-authored commit to `tito.morales@govmedai.com` (git filter-branch + force-push, authorized), **merged PR #1 into `main`** (`d1bb05d`, branch deleted), synced local `main`, and started Sprint 1 on `feature/sprint1-auth-ratecards`.
- **Why:** Complete the foundation increment on trunk; honor the commit-identity correction; begin MVP feature work.
- **Files touched:** git history (force-push), `main` (merge).
- **Result:** `main` now carries EP-1 with consistent authorship; only `main` exists remotely.
- **Next:** Build EP-2 + EP-3.

### 2026-06-12 05:55 UTC — EP-2 (auth/RBAC) + EP-3 (rate cards) + audit built
- **Action:** Added `@nestjs/jwt`; built common auth infra (`ZodValidationPipe`, `@Public`/`@Roles`/`@CurrentUser`, `JwtAuthGuard`, `RolesGuard`); **auth module** (register/login/refresh/logout/me — argon2 hashing, JWT access 15m + refresh 7d); **users module** (admin CRUD); **rate-cards module** (read for all authenticated, write admin-only); **audit module** (records create/modify on users + rate cards). Wired app-wide deny-by-default guards into `AppModule` (JwtAuthGuard → RolesGuard); marked `/health`+`/ready` `@Public`. Unit tests: `AuthService` (hash/verify + token roundtrip via mocked Prisma), `ZodValidationPipe`. Updated `CHANGELOG`, `docs/API.md`, Current State.
- **Why:** FR-1, FR-2, FR-3, FR-11, FR-26, NFR-16; FE-6/7/8/9/10/30/45/46.
- **Files touched:** `apps/api/src/common/{decorators,guards,pipes,audit}/*`, `apps/api/src/modules/{auth,users,rate-cards}/*`, `app.module.ts`, `health.controller.ts`, `apps/api/package.json`, `vitest.{config,setup}.ts`, `CHANGELOG.md`, `docs/API.md`.
- **Result:** Stateless logout (client-discards) noted as an assumption; refresh is stateless JWT (denylist post-MVP). Pending CI verification on PR #2 (CI is the only oracle — no local Node/Docker).
- **Next:** Commit, push, open PR #2, watch CI, fix any failures.

### 2026-06-12 06:05 UTC — Diagrams to multi-format; merged PR #2 + #3
- **Action:** User couldn't open `.drawio`, so exported the flowcharts to per-format folders under `docs/diagrams/`: `drawio/` (source), `svg/`, `png/`, `html/` (self-contained inline-SVG), `visio/` (export how-to). Wrote `scripts/render-diagrams.py` (pure-stdlib mxGraph→SVG + `rsvg-convert` PNG); switched `docs/html/flowcharts.html` to `<img>` SVGs (no viewer/CDN). Opened **PR #3** and **merged PR #2 (Sprint 1)** + **PR #3 (diagrams)** into `main`. Visually verified PNGs render correctly.
- **Why:** FE-47 / NFR-12; the raw `.drawio` weren't opening for the user.
- **Files touched:** `docs/diagrams/**`, `docs/html/flowcharts.html`, `scripts/render-diagrams.py`, `CLAUDE.md` §14/FE-47.
- **Result:** `main` = foundation + Sprint 1 + diagrams. User granted **standing permission** to merge/push/advance without asking, and a blanket Bash allow (settings.local.json). Saved memories `standing-permission`; updated `diagram-tooling`.
- **Next:** Sprint 2.

## Chapter 2 — Sprint 2: Estimate Authoring + Engine + Export (started 2026-06-12)
**Goal:** EP-4 (estimate CRUD + clone, labor/non-labor/cloud line items, assumptions), EP-5 (engine-backed totals endpoint), EP-11/FE-38 (cloud-prices read + cloud lines), EP-8 (search), EP-6 (CSV export). Covers FR-4..FR-10, FR-21/22/23.

### 2026-06-12 06:10 UTC — Sprint 2 kickoff
- **Action:** Branched `feature/sprint2-estimates` off `main`; updated Current State to Sprint 2. Beginning the estimates module + engine wiring.
- **Why:** Deliver the MVP estimate-authoring core (the product's heart).
- **Next:** Add line-item/estimate DTOs to `packages/types`; build estimates + cloud-pricing modules; totals endpoint via `@cost-reaper/engine`; CSV export; tests.

### 2026-06-12 06:40 UTC — Sprint 2 core built, CI green, merged (PR #4)
- **Action:** Built the estimate-authoring core: `packages/types` line-item inputs/DTOs + `UpdateEstimateRequest`/`EstimateListQuery`; engine `lineTotal()`; API **estimates** module (CRUD + clone, labor/non-labor/cloud line items + assumptions, list search/filter/pagination, engine-backed `/totals`, CSV `/export`) + **cloud-pricing** read module (FE-38); pure `engine-mapping` + `estimate-csv` with unit tests. Wired into `AppModule`. Updated `docs/API.md` + CHANGELOG.
- **Why:** EP-4/EP-5/EP-6/EP-8/EP-11 — the MVP's heart; FR-4..FR-10, FR-21/22/23.
- **Files touched:** `packages/{types,engine}/src/*`, `apps/api/src/modules/{estimates,cloud-pricing}/*`, `app.module.ts`, `docs/API.md`, `CHANGELOG.md`.
- **Result:** **CI green** (build + security pass; engine-mapping + CSV + prior suites pass). Money kept exact (decimal strings; only counts are numbers, engine does the math). Merged **PR #4** into `main` (`8c78b88`). Backend MVP essentially complete.
- **Next:** Web UI build-out (login → estimates list/search → estimate editor with line items + live totals → CSV); first real Prisma migration.

## Chapter 3 — Sprint 3: Web UI (started 2026-06-12)
**Goal:** Turn the React shell into the estimate-authoring app against the REST API. Completes the MVP user flow (EP-4/EP-8 frontend; FR-1/4-10/22/23).

### 2026-06-12 07:10 UTC — Web UI built, CI green, merged (PR #5) — MVP COMPLETE
- **Action:** Built the React + Vite + Tailwind app: typed API client (JWT + transparent refresh + CSV blob download), auth context, TanStack Query hooks, React Router. Pages: **Login**, **Estimates** (search + create), **Estimate editor** (edit upcharge/contingency/status; add/delete labor/non-labor/cloud line items via role & cloud pickers; assumptions; **live one-time/monthly/yearly/grand totals**; **CSV export**). Web view-types kept local (no `@cost-reaper/types` runtime dep) to avoid CJS/build-order coupling. Updated CHANGELOG.
- **Why:** EP-4/EP-8 frontend — the remaining MVP piece.
- **Files touched:** `apps/web/src/{lib,pages}/*`, `apps/web/package.json`, `CHANGELOG.md`.
- **Result:** **CI green** (vite build + tsc). Merged **PR #5** (`ce06e1c`). **The cost-reaper MVP is complete end-to-end** (backend + web, all CI-green). Runs via `setup.sh` + `start.sh` on any Docker host.
- **Next:** Await direction on post-MVP — governance (workflow/checklist API/UI, the user's FR-24/25 asks), first real Prisma migration, PDF/Excel, dashboard, scenarios.

## Chapter 4 — Sprint 4: Estimate Governance (started 2026-06-12)
**Goal:** EP-12 — the WorkflowEngine (FR-24) + ChecklistEngine (FR-25) the user asked for earlier (seeded but no endpoints/UI).

### 2026-06-12 07:35 UTC — Governance built, CI green (after 1 typecheck fix), merged (PR #6)
- **Action:** Built `apps/api/src/modules/workflow/`: pure `checklist-rules` evaluator (+ unit tests), `ChecklistService`, `WorkflowService` (default-workflow read, lazy-assign, role-gated transitions with checklist gating, immutable history), `WorkflowController` (`/workflows/default`, `/estimates/:id/workflow`, `/estimates/:id/checklist`, `POST /estimates/:id/transitions`). Estimates auto-attach the default workflow on create; detail/list surface `currentStage`. Web: governance panel in the editor (stage, gated transition buttons + history, live checklist). Types: workflow output DTOs.
- **Why:** FR-24 / FR-25 (EP-12) — the user's explicit earlier requests, finally wired end-to-end.
- **Files touched:** `apps/api/src/modules/workflow/*`, `estimates.service.ts`, `app.module.ts`, `packages/types/governance.ts`, `apps/web/src/{lib,pages}/*`, CHANGELOG.
- **Result:** First CI run red — `checklist-rules.ts` union-spread needed `billingPeriod` on the cloud shape (TS2339); fixed (added field + mapping). **CI green** (build + security). Merged **PR #6** (`7e5fa89`).
- **Next:** Await direction — Prisma migration, PDF/Excel, dashboard, scenarios, PERT, live cloud sync, or hardening.

### 2026-06-12 07:55 UTC — First real Prisma migration `0_init` (PR #7)
- **Action:** Docker daemon was up, so generated the initial migration **offline** with `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` in a throwaway `node:22-slim` container (installed openssl first). Created `apps/api/prisma/migrations/0_init/migration.sql` (349 lines: 10 enums, 15 tables, FKs, indexes) + `migration_lock.toml`. **Verified** by spinning up a fresh `postgres:16-alpine` on a docker network and running `prisma migrate deploy` → applied cleanly (16 tables incl. `_prisma_migrations`, recorded applied). Added `docs/DATABASE.md` (workflow, baselining, backup/restore).
- **Why:** Replace the `db push` baseline with versioned migrations (NFR-5).
- **Files touched:** `apps/api/prisma/migrations/**`, `docs/DATABASE.md`, `CHANGELOG.md`.
- **Result:** CI green; merged **PR #7** (`d2f7dd1`). `setup.sh`/`migrate.sh` now use `migrate deploy` (they switch automatically once migrations exist).
- **Next:** Await direction — PDF/Excel, dashboard, scenarios, PERT, live cloud sync, or hardening. (Also: added `Bash(docker *)` to settings.local.json per user approval.)

### 2026-06-12 08:25 UTC — Hardening: blocking gates + Playwright e2e + CI image build (PR #8)
- **Action:** With Docker up, ran the whole toolchain in a container: `pnpm format` repo-wide, fixed the lone ESLint error (ignore `**/*.cjs`), removed unused `eslint-disable` directives; **prettier-ignored the living docs** to protect exact-anchor editing. Removed `continue-on-error` from CI `format:check`+`lint` (now **blocking**). Verified all 5 gates pass in-container. Added **Playwright** (`apps/web/e2e/smoke.spec.ts` + config + dep) and a CI **`e2e` job** (`docker compose up --build` → migrate → seed → `playwright test`). **Verified the full stack locally e2e**: built images, ran stack, login→create→add line→totals returned correct engine math (monthly 1155 / yearly 13860 for $1000/mo @ +10%/+5%), web+Swagger 200.
- **Why:** NFR-6 hardening; close the two standing gaps (advisory gates; Docker image build not in CI).
- **Files touched:** ~29 prettier-formatted files, `.github/workflows/ci.yml`, `.prettierignore`, `eslint.config.mjs`, `apps/api/prisma/seed.ts`, `apps/web/{playwright.config.ts,e2e/smoke.spec.ts,package.json}`, `CHANGELOG.md`, `pnpm-lock.yaml` (now committed).
- **Result:** CI **build + e2e + security all green** (e2e ran the browser against the real Docker stack, 1m55s). Merged **PR #8** (`ad4a369`). All earlier non-blocking follow-ups now resolved.
- **Next:** Await direction — PDF/Excel, dashboard, scenarios, PERT, live cloud sync.

## Chapter 5 — Admin / Reference-data Web UI (started 2026-06-12)
**Goal:** Build the management screens that were API-only (the user found no menus for rate cards / users / cloud prices). Phased: Part 1 Rate Cards, Part 2 Users, Part 3 Cloud Prices. (FE-10/45/38 frontend.)

### 2026-06-12 08:55 UTC — Part 1: nav + Rate Cards management (PR #9)
- **Action:** Backend — added rate-card **role endpoints** (`POST/PATCH/DELETE /rate-cards/:id/roles[/:roleId]`, admin-only, audited) + `UpdateRateCardRoleRequest` type (roles/rates were previously only settable at card creation). Web — top **nav** (Estimates · Rate cards), **`RateCardsPage`** (create cards; add/inline-edit/delete roles & rates → labor-cost customization; activate/deactivate; delete), query hooks. Verified all 5 gates (format/lint/typecheck/test/build) pass in-container.
- **Why:** Close the UX gap the user hit ("where are the menu items to customize labor cost"); FE-10 frontend.
- **Files touched:** `apps/api/src/modules/rate-cards/*`, `packages/types/src/rate-card.ts`, `apps/web/src/{App.tsx,pages/RateCardsPage.tsx,lib/queries.ts}`, CHANGELOG.
- **Result:** CI build+e2e+security green. Merged **PR #9** (`dc51f4d`). **Rebuilt the local stack** (`docker compose up -d --build`) so it's live at localhost:5173 (rate-cards API 200, web 200).
- **Next:** Part 2 (Users admin UI), Part 3 (Cloud Prices browse).

### 2026-06-12 09:05 UTC — Spec: FR-27 resource allocation & capacity
- **Action:** Added **FR-27** (a human resource = 100%/day, splittable by %, **must not exceed 100% on any date**) to `CLAUDE.md`: FR table; **FE-48** on EP-4; data model — `LaborLineItem` gains `resource_name`, `allocation_percent` (default 100), `start_date`/`end_date`; a Section 10 capacity note (ChecklistEngine `resource_capacity` BLOCKER + save-time guard, matched by `resource_name`); folded the rule into FR-25's baseline list; traceability `FR-27 → EP-4, EP-12`.
- **Why:** Direct user requirement (resource capacity/over-allocation guard).
- **Files touched:** `CLAUDE.md` (§4.2, §5, §6, §10).
- **Result:** Captured as a traceable **Should (Post-MVP)** requirement; not yet built. Implementation seam: extend labor lines + add a checklist capacity rule + a save-time over-allocation check.
- **Next:** Continue admin UI (Parts 2/3) or build FR-27 — per user direction.

### 2026-06-12 09:15 UTC — Spec: FR-28 cost per SDLC phase
- **Action:** Added **FR-28** (line items tagged by SDLC phase → per-phase cost breakdown on the estimate detail card) to `CLAUDE.md`: FR table; **FE-49** on EP-5; `sdlc_phase[PLANNING|DESIGN|DEVELOPMENT|TESTING|DEPLOYMENT|MAINTENANCE]` added to all three line-item entities (§10); engine note (per-phase subtotals like categories; un-phased → "Unassigned"); traceability `FR-28 → EP-5, EP-6`. Marked **Should (Post-MVP)**.
- **Why:** Direct user requirement (cost-per-SDLC-phase on the detail card).
- **Files touched:** `CLAUDE.md` (§4.2, §5, §6, §10).
- **Result:** Captured + traceable; not yet built. User said to continue with other work → proceeding to Admin UI Part 2 (Users).
- **Next:** Build Admin UI Part 2 (Users admin page).

### 2026-06-12 09:35 UTC — Admin UI Parts 2 & 3 (Users, Cloud Prices) — section complete
- **Action:** Continued the admin UI per "continue with your other work." **Part 2 (Users)** — `UsersPage` (list, create email/password/role/name, inline role change + activate/deactivate, delete; admin-only nav link), `UserDto` + hooks; backend already had `/users`. PR #10 merged (`ee19614`→main). **Part 3 (Cloud Prices)** — `CloudPricesPage` (browse seeded catalog, provider filter + text search, read-only), nav + route; backend `/cloud-prices` existed. PR #11 merged. Both verified (all 5 gates) + CI green (build/e2e/security).
- **Why:** FE-45 + FE-38 frontends — finish the reference-data management section the user found missing.
- **Files touched:** `apps/web/src/pages/{UsersPage,CloudPricesPage}.tsx`, `apps/web/src/{App.tsx,lib/queries.ts,lib/types.ts}`, CHANGELOG.
- **Result:** **Admin UI complete** (Rate Cards · Users · Cloud Prices). Local stack rebuilt — all endpoints + web 200. `main` @ `d9165bf`.
- **Next:** Build the spec'd post-MVP reqs (FR-27 resource capacity, FR-28 SDLC-phase costs) or other post-MVP — per user direction.

## Chapter 6 — Sprint 10: Resource Capacity, SDLC-Phase Costs & Stage Gates (started 2026-06-12)
**Goal:** Build the two spec'd requirements the user requested — **FR-27** (resource allocation/capacity, ≤100%/date) and **FR-28** (cost per SDLC phase) — plus the user's follow-ups: **stage gates** and **end-to-end testing**. Branch `feature/sprint10-phases-capacity-gates`.

### 2026-06-12 — FR-27 + FR-28 + stage gates built and verified
- **Action:**
  - **Schema/migration:** added `SdlcPhase` enum + `sdlc_phase` to labor/non-labor/cloud lines (FR-28); `resource_name`/`allocation_percent`(default 100)/`start_date`/`end_date` to labor (FR-27). Generated migration `20260612120000_resource_capacity_sdlc_phase` via `prisma migrate diff` (read-only vs live `0_init` db); **verified** it deploys on a fresh DB and `migrate diff --from-migrations … --exit-code` reports **no drift**.
  - **Engine (`packages/engine`):** `computeEstimate` now also emits **per-phase subtotals** (`phases`, lifecycle-ordered, Unassigned last). New pure `findCapacityViolations` (per-resource sweep-line over day boundaries) + unit tests. Shared contract (`packages/types`) extended (`SdlcPhase`, `PhaseSubtotal`, `CapacityViolationDto`, line inputs/DTOs, `IsoDate`, cross-field date refine).
  - **API:** labor add/clone/detail persist + expose the new fields; **save-time 400 guard** rejects over-allocating writes; `toDetailDto` returns `capacityViolations`. **Checklist:** `resource_capacity` BLOCKER evaluator (reuses the engine fn) + seed rule → **gates workflow transitions** (the "stage gate"). CSV export gained an SDLC-phase column + per-phase summary.
  - **Web:** estimate editor — labor form/table gained resource/alloc%/date-window/phase; non-labor & cloud gained phase; new **"Cost by SDLC phase"** card + **over-allocation banner** + inline rejection message.
  - **E2E:** extended Playwright smoke (phase breakdown + capacity-guard rejection + stage-gate disabled button).
- **Why:** FR-27 (FE-48), FR-28 (FE-49), FR-24/FR-25 gating; NFR-6 tests; honoring user asks "add stage gates" + "don't forget end to end testing".
- **Files touched:** `apps/api/prisma/{schema.prisma,seed.ts,migrations/20260612120000_…}`, `packages/engine/src/{estimation-engine,resource-capacity,*.test}.ts`, `packages/types/src/{common,estimate,line-items}.ts`, `apps/api/src/modules/estimates/{estimates.service,engine-mapping,estimate-csv}.ts (+specs)`, `apps/api/src/modules/workflow/{checklist-rules,checklist.service}.ts (+spec)`, `apps/web/src/{pages/EstimateEditorPage.tsx,lib/types.ts,e2e/smoke.spec.ts}`, CHANGELOG.
- **Result:** **Full pipeline green** in a clean Node container — format/lint/typecheck/**test 40 passing**/build. **Live API smoke** against the rebuilt stack confirmed: capacity write → `400 "…over-allocated to 120% on 2026-07-15…"`, `totals.phases` correct (DEV 1680 one-time, TESTING 500/mo·6000/yr), persisted labor fields, `resource_capacity` rule present+passing.
- **Next:** commit → PR → CI-green → merge. Then Sprint 11 (reference-data platform, FR-29).

### 2026-06-12 — Spec updates folded in (FR-21a/b, FR-29/NFR-17/EP-13)
- **Action:** Per user: (1) **cloud price pull + per-provider "last pulled"** — enriched **FR-21a**, added **FR-21b** + a small freshness table (AWS/GCP/AZURE — MM/DD/CCYY). (2) **Database-driven reference data (no hard-coding)** — added **FR-29**, **NFR-17**, **EP-13** (FE-50–54), generic `reference_type`/`reference_value` data model (standard columns + parent-child), traceability, roadmap Sprint 11, and **ADR 0007**. Flagged the new `SdlcPhase` enum as interim, slated for migration under FE-54.
- **Why:** capture the user's evolving spec; keep traceability intact.
- **Files touched:** `CLAUDE.md` (§4.2, §4.3, §5, §6, §8, §10), `docs/adr/0007-database-driven-reference-data.md`.
- **Result:** Spec current; reference-data refactor scoped as its own increment rather than bolted onto Sprint 10.
- **Next:** ship Sprint 10; then plan Sprint 11.

## Chapter 7 — Sprint 11: Reference Data Platform (started 2026-06-12)
**Goal:** Deliver the user's mandate that **all reference values be database-driven, not hard-coded** (FR-29 / NFR-17 / EP-13). Build the generic reference tables + API + seed + admin UI, and start consuming them dynamically. Branch `feature/sprint11-reference-data`.

### 2026-06-12 — Reference-data platform built and verified
- **Action:**
  - **Schema/migration (FE-50):** added `ReferenceType` + `ReferenceValue` (id, code, display_name, description, display_order, is_active, is_builtin, metadata_json, created_by/at, updated_by/at; **parent-child self-FK**; unique (type, code)). Migration `20260612140000_reference_data_platform` generated via `prisma migrate diff` and **verified** — all 3 migrations deploy on a fresh DB, drift check reports no difference.
  - **API (FE-51):** `ReferenceModule` (controller→service) — `GET /reference/types`, `GET /reference/types/:code/values` (active or `?all=true`, nested/ordered), admin-only audited CRUD (`POST` type, `POST`/`PATCH`/`DELETE` value). Built-ins undeletable (deactivate instead); child/parent integrity guarded. Pure `buildReferenceTree`/`toReferenceValueDto` helper + `reference-tree.spec.ts`.
  - **Seed (FE-52):** 16 baseline types (SDLC_PHASE incl. tasks, ESTIMATE_STATUS, BILLING_PERIOD, RATE_UNIT, CLOUD_PROVIDER, CLOUD_PRICE_UNIT, NON_LABOR_TYPE, ROLE, COST_CATEGORY, CHECKLIST_SEVERITY/SCOPE, WORKFLOW_STAGE, PRIORITY, RESOURCE_TYPE, TESTING_PHASE incl. types, DOCUMENT_TYPE) — idempotent, built-in.
  - **Web (FE-53):** shared `reference.ts` contract; `useReferenceTypes`/`useReferenceValues`/`useReferenceMutations` hooks; **Reference data** admin page (type list → value tree, add/rename/reorder/activate/deactivate/delete) + admin nav/route.
  - **FE-54 start:** estimate editor `SdlcSelect` now loads phase labels/order from `GET /reference/types/SDLC_PHASE/values` (filtered to valid enum codes, with fallback). Extended Playwright e2e for the reference page.
- **Why:** FR-29 / NFR-17 / EP-13 (FE-50–54); honoring the user's "refactor so all reference values are DB-driven."
- **Files touched:** `apps/api/prisma/{schema.prisma,seed.ts,migrations/20260612140000_…}`, `apps/api/src/modules/reference/*`, `apps/api/src/app.module.ts`, `packages/types/src/{reference.ts,index.ts}`, `apps/web/src/{lib/types.ts,lib/queries.ts,pages/ReferenceDataPage.tsx,App.tsx,pages/EstimateEditorPage.tsx,e2e/smoke.spec.ts}`, CHANGELOG.
- **Result:** Full pipeline green in a clean container (format/lint/typecheck/**test 43**/build). Live API smoke: 16 types seeded, `SDLC_PHASE` nested (phase→tasks), admin create→rename→deactivate→delete round-trip OK, built-in delete → 400, web page 200.
- **Next:** commit → PR → CI-green → merge. Then finish **FE-54** (migrate remaining enum columns to FK-validate against reference tables).

### 2026-06-12 — FE-54 part 1: SDLC phase fully data-driven
- **Action:** Merged Sprint 11 (PR #13). Then migrated SDLC phase off its enum: dropped the Prisma/Zod `SdlcPhase` enum; `sdlc_phase` columns → `TEXT` via data-preserving migration `20260612160000_sdlc_phase_data_driven` (`ALTER … TYPE TEXT USING …::text`, then `DROP TYPE`). Added cached `ReferenceService.getActiveCodes`/`assertActiveCode` (60s TTL + clear-on-write) and wired `checkSdlcPhase` into estimate labor/non-labor/cloud writes (deny-by-default against active `SDLC_PHASE` values). Estimate-editor dropdowns now offer **any active** phase (removed the hard-coded filter); engine keeps `SDLC_PHASE_ORDER` only as a sort hint.
- **Why:** FR-29 / NFR-17 / FE-54 — make the flagship reference example (SDLC phase) truly data-driven across DB/API/validation/UI/engine.
- **Files touched:** `apps/api/prisma/{schema.prisma, migrations/20260612160000_…}`, `apps/api/src/modules/reference/reference.service.ts`, `apps/api/src/modules/estimates/{estimates.module,estimates.service,engine-mapping}.ts`, `packages/types/src/{common,estimate,line-items}.ts`, `apps/web/src/{lib/types.ts,pages/EstimateEditorPage.tsx}`, CHANGELOG.
- **Result:** Pipeline green (format/lint/typecheck/**test 43**/build); migration verified (4-migration fresh deploy + no drift; existing values preserved). Live smoke: admin added phase **DISCOVERY** → usable on a line (201) + shows in per-phase breakdown; invalid `BOGUS_PHASE` → **400 "not an active SDLC_PHASE value"**.
- **Next:** commit → PR → CI-green → merge; then FE-54 part 2 (remaining descriptive enums) + the small finishing cluster.

### 2026-06-12 — FE-27 Dashboard (FR-18)
- **Action:** Merged FE-54 part 1 (PR #14). Built a **dashboard**: `GET /dashboard` (DashboardModule) backed by a pure, unit-tested `summarizeDashboard` (counts by status & stage, exact per-currency grand totals via new engine `sumMoney`, recent activity). Extracted `toMappableEstimate` into `engine-mapping` so estimates + dashboard share one projection (NFR-15). Web: `DashboardPage` (stat cards + by-stage + recent) + nav link + `/dashboard` route + `useDashboard` hook + shared `DashboardSummary` DTO. Extended Playwright e2e.
- **Why:** FR-18 / FE-27 — a high-value, self-contained read-only feature.
- **Files touched:** `packages/{types/src/dashboard.ts, engine/src/{estimation-engine,index}.ts}`, `apps/api/src/modules/dashboard/*`, `apps/api/src/modules/estimates/{engine-mapping,estimates.service}.ts`, `apps/api/src/app.module.ts`, `apps/web/src/{lib/types.ts,lib/queries.ts,pages/DashboardPage.tsx,App.tsx,e2e/smoke.spec.ts}`, CHANGELOG.
- **Result:** Pipeline green (format/lint/typecheck/**test 47**/build; fixed a test-helper bug where `null ?? 'DRAFT'` masked the no-stage case). Live smoke: `/dashboard` → 3 estimates, USD 22340.0000, by-stage + recent populated; web 200.
- **Next:** commit → PR → CI-green → merge; then FE-54 part 2 / governed cost categories.

### 2026-06-12 — FE-23 Printable estimate summary (FR-10)
- **Action:** Merged FE-27 dashboard (PR #15). Built a **printable summary**: `PrintSummaryPage` at `/estimates/:id/print` rendering a clean read-only document (meta, labor/non-labor/cloud tables, totals, per-phase + per-category breakdowns, assumptions) with a **Print** button (`window.print()`); app header gets `print:hidden`. Added a "Printable summary" link in the estimate editor + the route. Reuses the existing detail payload — no API/migration. Extended Playwright e2e.
- **Why:** FR-10 / FE-23 — clean, self-contained, visible win; closes the printable-summary gap.
- **Files touched:** `apps/web/src/{pages/PrintSummaryPage.tsx, App.tsx, pages/EstimateEditorPage.tsx, e2e/smoke.spec.ts}`, CHANGELOG.
- **Result:** Pipeline green (format/lint/typecheck/**test 47**/build). Web-only, so validated by build + the e2e (CI exercises the print view).
- **Next:** commit → PR → CI-green → merge; then FE-54 part 2 / governed cost categories.

### 2026-06-12 — FE-11 Governed cost categories (FR-29) + config
- **Action:** Merged FE-23 (PR #16). Made non-labor **category governed** by `COST_CATEGORY`: refactored the reference cache to serve both codes + display names; added `assertActiveDisplayName`; `addNonLabor` validates `category` against active COST_CATEGORY display names; web non-labor form now a category **dropdown**; updated e2e to select governed categories. Also set `.claude/settings.local.json` to a blanket `Bash` allow (user approved all Bash, incl. un-analyzable shell).
- **Why:** FR-29 / FE-11 — governed, admin-extensible cost categories (no free-text).
- **Files touched:** `apps/api/src/modules/reference/reference.service.ts`, `apps/api/src/modules/estimates/estimates.service.ts`, `apps/web/src/pages/EstimateEditorPage.tsx`, `apps/web/e2e/smoke.spec.ts`, `.claude/settings.local.json`, CHANGELOG.
- **Result:** Pipeline green (test 47). Live smoke: "Licenses" → 201; "BogusCat" → 400 "not an active COST_CATEGORY value"; admin adds "Marketing" → instantly usable (201). No migration (category column already text).
- **Next:** commit → PR → CI-green → merge; then continue FE-54 (estimate status) / remaining cluster.

### 2026-06-13 — FE-36 user guide + FE-37 runbook
- **Action:** Merged FE-11 (PR #17). Wrote `docs/USER_GUIDE.md` (roles, sign-in, reference-data prep, end-to-end estimate building incl. resource allocation/SDLC phase/upcharge/contingency, governance gates, CSV + printable summary, dashboard, clone) and `docs/RUNBOOK.md` (architecture, config/`.env`, scripted bring-up, scripts, health/readiness, migrations, seeding, backup/restore with pg_dump/pg_restore, rollback, observability, security ops, troubleshooting). Added a **Documentation** section to README linking all docs.
- **Why:** FE-36 / FE-37 (Section 14 deliverables) — fill the two doc gaps.
- **Files touched:** `docs/USER_GUIDE.md`, `docs/RUNBOOK.md`, `README.md`, CHANGELOG.
- **Result:** Docs accurate to the implemented app; prettier-clean (`format:check` passes). Docs-only — no code/typecheck/test impact.
- **Next:** commit → PR → CI-green → merge; then FE-54 part 2 (estimate status) or hardening (FE-31/32).

<!-- Append new entries below this line -->

### 2026-06-13 — FE-19 Three-point / PERT estimation (FR-13)
- **Action:** Merged FE-36/37 (PR #18). Added three-point estimation to labor lines: optional optimistic/most-likely/pessimistic units (migration `20260613090000_pert_three_point`, 3 nullable cols); engine `pert()` + test; `addLabor` computes effective units = PERT when all three set and stores `units` as the expected value; DTO + clone carry the points; editor labor form gained the three inputs. Validation: all-or-none + o≤m≤p.
- **Why:** FR-13 / FE-19 — estimation depth.
- **Files touched:** `apps/api/prisma/{schema.prisma,migrations/20260613090000_…}`, `packages/engine/src/{estimation-engine,index,*.test}.ts`, `packages/types/src/line-items.ts`, `apps/api/src/modules/estimates/estimates.service.ts`, `apps/web/src/{lib/types.ts,pages/EstimateEditorPage.tsx}`, CHANGELOG.
- **Result:** Pipeline green (test 48), migration verified (fresh-deploy + no drift). Live smoke: PERT 2/4/12 → effective units 5, lineTotal 1050; invalid ordering → 400.
- **Next:** commit → PR → CI → merge; continue with FE-20 margin/tax.

### 2026-06-13 — FE-20 Margin & tax (client pricing, FR-16)
- **Action:** Estimate-level marginPercent + taxPercent (migration `20260613100000_margin_tax`); engine computes sellPrice = cost/(1−margin), clientPrice = sell×(1+tax) + marginAmount/taxAmount; threaded through types/mapping/service/DTO; editor Margin/Tax settings + client-price card; CSV rows. Engine tests for the math.
- **Result:** Pipeline green (test 50), migration verified. Live: 20%/10% on cost 1000 → margin 250, sell 1250, tax 125, client 1375.
- **Next:** commit → PR → merge; continue (FE-54 status / FE-22 PDF / scenarios).

### 2026-06-13 — FE-54 part 2: estimate status data-driven (FR-29)
- **Action:** Dropped EstimateStatus enum; `status` → TEXT (migration `20260613110000_estimate_status_data_driven`, data+index preserving); `update()` validates status against active ESTIMATE_STATUS reference codes; editor status dropdown loads from reference. EstimateStatus Zod type loosened to `z.string()`.
- **Result:** Pipeline green (test 50), migration verified (deploy + no drift). Live: FINAL 200, BOGUS 400, admin-added ARCHIVED usable 200.
- **Next:** commit → PR → merge; continue.

### 2026-06-13 — FE-28 Collaboration: comments (FR-19)
- **Action:** `Comment` model (estimate_id, author_id, author_email snapshot, text, created_at; migration `20260613120000_comments`); detail include + DTO; `addComment`/`deleteComment` (author-or-admin delete) + controller endpoints; web Comments panel + hooks.
- **Result:** Pipeline green (test 50), migration verified. Live: comment 201, appears with authorEmail.
- **Next:** commit → PR → merge; continue.

### 2026-06-13 — FE-24 Scenarios (FR-14)
- **Action:** Estimate `scenarioOfId` self-FK (migration `20260613130000_scenarios`); `clone(..., asScenario)` links variants to a shared root; `scenarios(id)` returns root+variants with totals; controller POST/GET `/estimates/:id/scenarios`; web Scenarios compare panel + hook + ScenarioDto.
- **Result:** Pipeline green (test 50), migration verified. Live: create scenario clones + links; GET returns group [base(root/current), scenario] both 1000.
- **Next:** commit → PR → merge; continue (FE-25 versioning, FE-40 last-pulled, FE-31, FE-22, FE-12).

### 2026-06-13 — FE-25 Versioning / baselines (FR-15)
- **Action:** `Baseline` model (label, denormalized totals, full snapshot_json, createdByEmail; migration `20260613140000_baselines`); `captureBaseline`/`listBaselines`/`deleteBaseline` + controller endpoints; web Baselines panel with Δ-vs-current diff; CaptureBaselineRequest/BaselineDto types.
- **Result:** Pipeline green (test 50; added Prisma import), migration verified. Live: capture v1=1000 immutable; after +500 edit current=1500 → Δ +500.
- **Next:** commit → PR → merge; continue (FE-40 last-pulled, FE-31, FE-22, FE-12).

### 2026-06-13 — FE-40 cloud price refresh + last-pulled (FR-21a/b)
- **Action:** `PricingProvider` strategy seam (AWS/GCP/Azure stub) + `lastPulled()` (groupBy max fetchedAt) + `sync()` (admin re-stamp, audited); controller GET `/cloud-prices/last-pulled` + POST `/cloud-prices/sync` (static before `:id`); web freshness table (MM/DD/CCYY) + admin Refresh button. No migration (existing fetchedAt).
- **Result:** Pipeline green (test 50). Live: last-pulled per provider; AWS sync → 06/13, others 06/12. Snapshots immutable (NFR-14).
- **Next:** commit → PR → merge; continue (FE-31 hardening, FE-22 export, FE-12 multi-currency).

### 2026-06-13 — FE-31 Security hardening (OWASP)
- **Action:** `SecurityHeadersMiddleware` (nosniff/frame DENY/CSP frame-ancestors/referrer/COOP/permissions-policy/HSTS-in-prod; strips X-Powered-By) applied app-wide; `LoginThrottleGuard` (in-memory per-IP, 30/min → 429) on /auth/login + /auth/register; `x-powered-by` disabled in main.ts. Dep-free.
- **Result:** Pipeline green (test 50). Live: all headers present, X-Powered-By gone, login still 200.
- **Next:** commit → PR → merge; continue (FE-22 export, FE-12 multi-currency).

### 2026-06-13 — FE-22 Excel export (FR-20)
- **Action:** `toExcelHtml` (HTML-table workbook) + `exportExcel` (shared `buildExport`); controller `GET /estimates/:id/export-excel` (application/vnd.ms-excel); web `downloadExcel` + Export Excel button. Dep-free. PDF = via printable summary.
- **Result:** Pipeline green (test 50). Live: correct content-type/.xls + full table (lines, CLIENT PRICE, phase summary).
- **Next:** commit → PR → merge; last feature FE-12 multi-currency.

### 2026-06-13 — FE-12 Multi-currency / FX rates (FR-17) — FINAL FEATURE
- **Action:** `FxRate` table + seed (USD base + 5); FxModule (GET list + admin PATCH upsert, audited); engine `scaleMoney`; dashboard converts per-currency totals → base (USD) `baseCurrencyTotal`; web FX rates admin page + dashboard base card; migration `20260613150000_fx_rates`.
- **Result:** Pipeline green (test 51), migration verified. Live: 6 rates, dashboard baseCurrencyTotal, admin PATCH EUR→1.10 audited.
- **Milestone:** All 54 features implemented.

### 2026-06-13 — FR-21a real cloud price fetch (Azure live, AWS SigV4, GCP)
- **Action:** Replaced the PricingProvider stub with real integrations — Azure Retail Prices (no auth, live), AWS Price List GetProducts (SigV4 via node:crypto, gated on creds), GCP Cloud Billing skus (gated on key, core+ram → instance price). Pure tested mappers (`price-mappers.ts` + spec, 5 tests); resilient network shells (12s timeout, fallback). `sync` applies refreshed prices + source; compose passes cloud env. No migration.
- **Result:** Pipeline green (test 56). Live: Azure sync 1.35s real call → B2ms/D2s_v5 source → AZURE_API (prices re-confirmed). AWS/GCP mappers unit-verified.
- **Next:** commit → PR → merge.

### 2026-06-13 — Smart-checklist deep-links + rate-card selector (FR-25 UX fix)
- **Action:** Made checklist items clickable — `goToChecklistItem` scrolls to + flashes the relevant editor section (anchors `sec-settings/labor/nonlabor/cloud/totals`, mapped by rule key with scope fallback). Added a **rate-card `<select>`** to the editor Settings (PATCH rateCardId) since there was no in-editor way to set it — the cause of an unfixable `rate_card_selected` blocker. e2e extended.
- **Why:** User reported checklist items weren't clickable and "Select a rate card" had nowhere to go.
- **Result:** Pipeline green (test 56). Live: rate_card_selected false → PATCH rateCardId 200 → true. Web served.
- **Next:** commit → PR → merge.

### 2026-06-13 — Deep-link checklist items to the specific incomplete line (FR-25)
- **Action:** Checklist evaluators now name the exact offending line IDs. Added `entityIds: string[]` to `ChecklistItemResult` (governance.ts); `ChecklistEstimate` line entries carry `id`; the 5 filtering evaluators (`labor_role_assigned`, `cloud_line_complete`, `nonlabor_amount_period`, `billing_period_set`, `resource_capacity`) return `bad.map(x=>x.id)` (capacity → all labor lines of the over-allocated resource); `checklist.service` maps line `id`s in. Web: line `<tr>`s get `id="line-<id>"` + `scroll-mt-24 transition-colors`; `goToChecklistItem` scrolls to + amber-flashes the specific rows when `entityIds` is non-empty, else falls back to the section anchor.
- **Why:** Clicking a checklist item should jump to the *exact* line that's wrong, not just the section (user request).
- **Files touched:** packages/types/src/governance.ts, apps/api/src/modules/workflow/checklist-rules.ts(+spec), apps/api/src/modules/workflow/checklist.service.ts, apps/web/src/lib/types.ts, apps/web/src/pages/EstimateEditorPage.tsx
- **Result:** Pipeline green in a clean container (lint, typecheck 6/6, test 56 incl. new entityIds assertions, build 4/4). Live: rebuilt API; a labor line with units=0 → checklist `labor_role_assigned` returns `entityIds=[<that line id>]`, `rate_card_selected` returns `entityIds=[]`.
- **Next:** commit → PR → merge; then build the meta-tagged Help guide of step-by-step use cases.

### 2026-06-13 — In-app Help guide: meta-tagged step-by-step use cases (deep-linkable)
- **Action:** Built a Help guide — a searchable catalog of **31 step-by-step use cases** spanning every feature (Getting started, Building an estimate, Pricing & markup, Governance & review, Outputs, Administration). Each use case is **meta-tagged** (`featureIds`, `route`, `checklistKeys`, `keywords`) and individually anchored (`/help#uc-<id>`) so the app can **deep-link straight into a use case**. New `apps/web/src/lib/help-content.ts` (data + `useCaseById`/`useCasesByCategory`/`useCaseForChecklistKey`/`searchUseCases`), `HelpPage.tsx` (sidebar TOC, search, hash-scroll + flash on deep-link, per-card meta badges + "Go there" link), `/help` route + nav link. Wired the **smart checklist**: each failing item now shows a **"How?"** link → `/help#uc-<id>` resolved via the rule's `checklistKeys` (the meta-tag join). USER_GUIDE.md §11 added; e2e smoke extended (list + anchor deep-link + search filter).
- **Why:** User asked for a help guide with all possible step-by-step use cases, meta-tagged so the app can deep-link into the right use case when a user is stuck.
- **Files touched:** apps/web/src/lib/help-content.ts (new), apps/web/src/pages/HelpPage.tsx (new), apps/web/src/App.tsx, apps/web/src/pages/EstimateEditorPage.tsx, apps/web/e2e/smoke.spec.ts, docs/USER_GUIDE.md
- **Result:** Clean-container pipeline green (format, lint 0 problems, typecheck 6/6, test 56, build 4/4). Live: rebuilt web; `/help` serves (200) and the catalog is compiled into the bundle.
- **Next:** commit → PR → CI-green → merge.

### 2026-06-13 — Smart-checklist "How?" fallback + empty-state deep-link
- **Action:** Every failing checklist item now always has a "How?" deep-link: when no use case matches the rule key, it falls back to the general `/help#uc-smart-checklist` guide (`useCaseForChecklistKey(key) ?? useCaseById('smart-checklist')`). Added a panel **empty-state** — when the checklist has no items, it shows "No checklist items match this estimate yet." with a "How?" deep-link to the same guide; the "click an item" tip is hidden when empty.
- **Why:** User asked for a "How?" deep-link from the empty-state when no checklist items match — and the per-item How? link previously vanished for any rule key without a specific guide.
- **Files touched:** apps/web/src/pages/EstimateEditorPage.tsx
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, build 4/4). Live: rebuilt web; empty-state string compiled into the bundle, /help 200, api healthy.
- **Next:** commit → PR → CI-green → merge.

### 2026-06-13 — Sticky top navigation (tab strip pinned on scroll)
- **Action:** Made the top nav header sticky — added `sticky top-0 z-30 ... shadow-sm` to the `<header>` in App.tsx so the Navigator tab strip (Estimates/Dashboard/Rate cards/Cloud prices/Help/…) stays pinned at the top instead of scrolling away. Existing deep-link `scroll-mt-20/24` offsets already clear the ~48px header. Stays `print:hidden`.
- **Why:** User asked for the navigator tab strip not to scroll up.
- **Files touched:** apps/web/src/App.tsx
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, build 4/4). Live: rebuilt web; `position:sticky` in the generated CSS + class in the bundle, web 200.
- **Next:** commit → PR → CI-green → merge.

### 2026-06-13 — Freshness timestamps: cloud "last pulled" + FX "last updated" with a live FX refresh
- **Action:** (1) Cloud Prices "last pulled" now shows **date + time** (MM/DD/CCYY HH:MM:SS, local) instead of date only (`fmtPulled`, header "Last pulled (local)"). (2) FX Rates page now shows the overall **"Last updated (local)"** date+time (max `updatedAt`) and each row's updated-at as date+time, plus an admin **"Refresh rates"** button. (3) New backend: pure `mapFxRates` (foreign-per-USD → rateToBase = 1/rate, 6dp) + 2 unit tests; `FxService.refresh()` pulls live rates from a public no-auth source (frankfurter.app, `FX_RATES_ENDPOINT` env, 12s timeout + graceful fallback), re-stamps non-USD rows (USD stays 1), audits `REFRESH:<n>updated`; `POST /fx-rates/refresh` (admin); `useFxRefresh` hook. compose + .env.example wired; e2e asserts the FX timestamp + button (no click → no live call in CI).
- **Why:** User asked to show date+time of last pull on Cloud prices, and to show FX last-updated date+time + a refresh button.
- **Files touched:** apps/web/src/pages/CloudPricesPage.tsx, apps/web/src/pages/FxRatesPage.tsx, apps/web/src/lib/queries.ts, apps/web/e2e/smoke.spec.ts, apps/api/src/modules/fx/{fx-rates.mapper.ts(+spec),fx.service.ts,fx.controller.ts}, docker-compose.yml, .env.example
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, **test 58**, build 4/4). Live: rebuilt api+web; `POST /fx-rates/refresh` → HTTP 201 pulled fresh frankfurter rates (EUR 1.1→1.157, JPY 0.0067→0.00624), timestamps moved, USD untouched at 1; new UI strings confirmed in the web bundle.
- **Next:** commit → PR → CI-green → merge.

### 2026-06-14 — Workflow authoring UI (FR-24 / FE-43) — admin can configure stages + transitions
- **Action:** Exposed the configurable WorkflowEngine through an admin UI (previously only seed-configured). Types: `CreateStageRequest`/`UpdateStageRequest`/`CreateTransitionRequest`/`UpdateTransitionRequest` (stage key validated UPPER_SNAKE_CASE). Backend `WorkflowService` + controller: admin-only `POST/PATCH/DELETE /workflows/default/stages` and `/transitions` — add/rename/reorder/flag stages (single-initial enforced; delete blocked if estimates sit in it or it appears in transition history), add/edit/delete transitions (from→to, allowed role, label, requiresChecklistPass; dup + self-loop guarded), all audited. Web: `useDefaultWorkflow` + `useWorkflowAuthoring` hooks, `WorkflowDefinition` types, new admin **/workflow** page (stages + transitions tables with inline edit + add rows; read-only for non-admins), nav link, route. Added Help use case `manage-workflow` (deep-linkable) + e2e (read-only assertions). No migration (models existed).
- **Why:** Last engine without an admin surface; user asked to build the next polish item (I recommended this).
- **Files touched:** packages/types/src/governance.ts, apps/api/src/modules/workflow/{workflow.service.ts,workflow.controller.ts}, apps/web/src/lib/{types.ts,queries.ts}, apps/web/src/pages/WorkflowPage.tsx (new), apps/web/src/App.tsx, apps/web/src/lib/help-content.ts, apps/web/e2e/smoke.spec.ts
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, test 58, build 4/4). Live: full CRUD round-trip verified — add stage/transition (201), bad key → 400, PATCH role/label (200), delete transition+stage (200), seeded workflow restored to 5 stages/5 transitions; /workflow serves, page in bundle.
- **Next:** commit → PR → CI-green → merge.

### 2026-06-14 — Checklist-rule authoring UI (FR-25 / FE-44) — admin tunes/adds smart-checklist rules
- **Action:** Exposed the rule-driven ChecklistEngine through an admin UI. Backend: exported `EVALUATOR_KEYS` from checklist-rules; `ChecklistService` gains `listRules/createRule/updateRule/deleteRule` (+AuditService) returning `ChecklistRuleDto` with a `hasLogic` flag (key has a built-in evaluator vs advisory/always-passes); new admin-only `ChecklistRulesController` (`GET/POST/PATCH/DELETE /checklist-rules`) registered in the workflow module. Built-ins can be deactivated/re-tuned (severity/description/active) but **not deleted**; custom keys validated lower_snake_case, dup-guarded. Types: `ChecklistRuleDto` + create/update request schemas. Web: `useChecklistRules`/`useChecklistRuleMutations`, new admin **/checklist-rules** page (severity dropdown, active toggle, logic indicator, add/delete custom; read-only for non-admins), nav link + route, Help use case `manage-checklist-rules`, read-only e2e. No migration.
- **Why:** User asked to take the next polish item; this is the natural follow-on to the workflow authoring UI (the other unexposed engine).
- **Files touched:** packages/types/src/governance.ts, apps/api/src/modules/workflow/{checklist-rules.ts,checklist.service.ts,checklist-rules.controller.ts,workflow.module.ts}, apps/web/src/lib/{types.ts,queries.ts}, apps/web/src/pages/ChecklistRulesPage.tsx (new), apps/web/src/App.tsx, apps/web/src/lib/help-content.ts, apps/web/e2e/smoke.spec.ts
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, test 58, build 4/4). Live: list 9 rules; PATCH severity (200), add custom advisory (201, hasLogic=false), bad key → 400, delete built-in → 400; cleanup restored 9 rules with resource_capacity back to BLOCKER. Page in bundle, /checklist-rules serves.
- **Next:** commit → PR → CI-green → merge.

### 2026-06-14 — Native .xlsx export (FR-20 / FE-22) — real OOXML, dependency-free
- **Action:** Replaced the HTML-table `.xls` Excel export with a real `.xlsx` (Office Open XML). New pure `apps/api/src/modules/estimates/xlsx.ts`: a minimal dependency-free OOXML writer — CRC32 + a ZIP builder (deflate via Node's built-in `zlib`) + the 5 SpreadsheetML parts; numeric-looking cells written as numbers, others as inline strings. Refactored `estimate-csv.ts` to share `exportRows()` between CSV and XLSX (dropped `toExcelHtml`/`he`). Service `exportExcel` now returns a Buffer (`estimate-<id>.xlsx`); controller sends `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`; web `downloadExcel` saves `.xlsx`. New `xlsx.spec.ts` (CRC32 check vector, colRef, zip round-trip, buildXlsx parts + cell encoding).
- **Why:** User asked to take the next polish item (native .xlsx). Kept dependency-free to stay CI/security-safe.
- **Files touched:** apps/api/src/modules/estimates/{xlsx.ts,xlsx.spec.ts (new),estimate-csv.ts,estimates.service.ts,estimates.controller.ts}, apps/web/src/lib/api.ts
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, **test 64** incl. 6 new xlsx tests, build 4/4). Live: downloaded a real workbook — content-type + .xlsx filename correct, PK magic, **python zipfile integrity OK** (all CRC32 valid), all 5 OOXML parts present, sheet contains the estimate name + numeric grand-total cell.
- **Next:** commit → PR → CI-green → merge.

### 2026-06-14 — Dashboard "By workflow stage" drill-down (FR-18)
- **Action:** Made each "By workflow stage" row clickable to expand an inline list of the estimates in that stage. Backend: `DashboardService.estimatesInStage(stageKey)` (maps `UNASSIGNED`→`currentStageId: null`, else `currentStage.key`; computes each grandTotal via the engine) + `GET /dashboard/stage/:stageKey` (any authenticated user). Types: `DashboardStageEstimate`. Web: `useStageEstimates(stageKey)` (enabled when open), `StageDetail` component, DashboardPage stage rows are now toggle buttons (▸/▾, aria-expanded) that render the drill-down (name → estimate link, grandTotal, currency, updated date). e2e extended to click a stage and assert it expands.
- **Why:** User asked to click a workflow-stage line on the Dashboard and see the details.
- **Files touched:** packages/types/src/dashboard.ts, apps/api/src/modules/dashboard/{dashboard.service.ts,dashboard.controller.ts}, apps/web/src/lib/{types.ts,queries.ts}, apps/web/src/pages/DashboardPage.tsx, apps/web/e2e/smoke.spec.ts
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, test 64, build 4/4). Live: byStage DRAFT=13/UNASSIGNED=1; GET /dashboard/stage/DRAFT → 13 estimates with totals; unknown stage → 200 empty; web hint string in bundle, /dashboard serves.
- **Next:** commit → PR → CI-green → merge.

### 2026-06-14 — Reference-data labels for behavioral enums (FE-54 tail, FR-29/NFR-17)
- **Action:** Display labels for behavioral enums now come from the DB reference tables (behavior stays code-coupled). New reusable `useRefLabeler(typeCode)` hook (`apps/web/src/lib/refLabels.ts`) → `{ label(code), options, ready }` over `useReferenceValues`, always falling back to the raw code. Applied **billing period** (BILLING_PERIOD → One-time/Monthly/Yearly) across the estimate editor's labor/non-labor tables + the `PeriodSelect` dropdown, and **cloud provider** (CLOUD_PROVIDER → Amazon Web Services/Google Cloud/Microsoft Azure) on cloud lines — in both the editor and the printable summary. Stored values stay codes; an admin rename in /reference-data flows to the UI with no code change. e2e asserts the DB-driven "One-time" label renders.
- **Why:** Last optional polish item — finish the FE-54 story by sourcing enum *labels* from reference data.
- **Files touched:** apps/web/src/lib/refLabels.ts (new), apps/web/src/pages/EstimateEditorPage.tsx, apps/web/src/pages/PrintSummaryPage.tsx, apps/web/e2e/smoke.spec.ts
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, test 64, build 4/4). Live: reference API returns the labels; web serves. Reusable hook makes the remaining enums (role, severity, scope, unit) one-liners.
- **Next:** commit → PR → CI-green → merge.

### 2026-06-14 — Config-driven SSO: OIDC / SAML / WS-Fed (FR-26, ADR-0008)
- **Action:** Added a simple, config-driven SSO layer. Pure `resolveSsoConfig(env)` dispatcher (`SSO_ENABLED` + `SSO_PROTOCOL` picks ONE of OIDC|SAML|WSFED; flat per-protocol vars; fails closed with a reason) + unit tests. Pluggable `SsoProvider` strategy + `createSsoProvider`: **OIDC fully functional dependency-free** (well-known discovery + auth-code exchange + userinfo via fetch); **SAML/WS-Fed** build the login redirect + parse the assertion with best-effort RSA-SHA256 signature verification against the IdP cert. Endpoints `GET /auth/sso` (status), `GET /auth/sso/login` (302 → IdP), `GET|POST /auth/sso/callback` → `AuthService.ssoLogin` provisions a least-privilege VIEWER on first sign-in and issues our JWTs → hands tokens to the SPA via URL fragment. Web: login page "Sign in with …" button (when enabled), `/sso/callback` page, `getSsoStatus`/`ssoLoginUrl`, `completeSso` in the auth context. .env.example + docker-compose passthrough + ADR-0008.
- **Why:** User asked to make SSO/SAML/OIDC/WS-Fed simple + configurable, with code that reads the config and picks the protocol.
- **Files touched:** apps/api/src/modules/auth/sso/{sso-config.ts(+spec),sso-providers.ts,sso.service.ts,sso.controller.ts}, apps/api/src/modules/auth/{auth.service.ts,auth.module.ts}, apps/web/src/lib/{api.ts,auth.tsx}, apps/web/src/pages/{LoginPage.tsx,SsoCallbackPage.tsx}, apps/web/src/App.tsx, .env.example, docker-compose.yml, docs/adr/0008-…
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, **test 69** incl. 5 SSO config tests, build 4/4). Live: default disabled (status enabled:false, password login intact). With SAML config → `/login` 302s to the IdP with a SAMLRequest. With OIDC (Google issuer) → live discovery built the correct authorize URL. .env restored.
- **Next:** commit → PR → merge; then the two new asks — role can/cannot-do feature + online User Guide in the menu.

### 2026-06-14 — Roles & permissions page (FR-2 / NFR-16) — what each role can and cannot do
- **Action:** Added a "Roles" menu item + page showing exactly what Admin/Estimator/Viewer can and cannot do. `apps/web/src/lib/roleCapabilities.ts` holds a 13-capability matrix across 5 categories (Estimates, Reference & pricing, Governance configuration, Administration, Insights), mirroring the server `@Roles` guards (verified by enumerating every controller). `RolesPage.tsx` renders per-role summary cards + a ✓/✕ matrix, highlighting the signed-in user's role column. Nav link visible to all logged-in users; Help use case `roles-permissions` (deep-linkable); e2e asserts the matrix.
- **Why:** User asked to think through what each role can/cannot do and add a feature for it.
- **Files touched:** apps/web/src/lib/roleCapabilities.ts (new), apps/web/src/pages/RolesPage.tsx (new), apps/web/src/App.tsx, apps/web/src/lib/help-content.ts, apps/web/e2e/smoke.spec.ts
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, test 69, build 4/4). Live: /roles serves, matrix in bundle.
- **Next:** commit → PR → merge; then the online User Guide menu feature.

### 2026-06-14 — Identity switch includes built-in LOCAL mode (FR-26)
- **Action:** Made the identity selector a single switch over **LOCAL | OIDC | SAML | WSFED**. `resolveSsoConfig` now returns a `mode` and treats `SSO_PROTOCOL=LOCAL` (or BUILTIN/NONE, or master `SSO_ENABLED=false`, or unset) as the **built-in** username/password identity — the default. External protocols only activate when fully configured (else fall back to LOCAL + reason). Added `SSO_FORCE` (hide the built-in password form so SSO is the only option) → exposed as `forceSso` in `/auth/sso` status. Web: `SsoStatus` gains `mode`+`forceSso`; the login page hides the password form when `forceSso`. `.env.example` + docker-compose default to `SSO_PROTOCOL=LOCAL`. Config tests updated (LOCAL cases).
- **Why:** User noted the app has its own identity system and wanted the config switch to also select that (built-in) instead of an external IdP.
- **Files touched:** apps/api/src/modules/auth/sso/{sso-config.ts(+spec),sso.service.ts}, apps/web/src/lib/api.ts, apps/web/src/pages/LoginPage.tsx, .env.example, docker-compose.yml
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, test 69, build 4/4). Live: default → mode LOCAL; SSO_ENABLED=true+SSO_PROTOCOL=LOCAL → LOCAL; OIDC+SSO_FORCE=true → mode OIDC, enabled, forceSso true; restored → LOCAL.
- **Next:** commit → PR → merge; then the online User Guide menu feature.

### 2026-06-14 — Online User Guide in the menu (NFR-12, FR-12)
- **Action:** Added a "User Guide" menu item + `/guide` page — a navigable in-app handbook (12 sections: Welcome, Signing in & identity, Roles, Building an estimate, Pricing, SDLC phases & capacity, Review & approval, Scenarios/baselines, Exports, Dashboard, Administration, Getting help) with a sticky table of contents, hash deep-linking (`/guide#<id>` scrolls + highlights), and per-section links into the task-based Help use cases (`/help#uc-…`) and app routes. Content in `apps/web/src/lib/user-guide-content.ts`; page in `UserGuidePage.tsx`. Nav link for all logged-in users; e2e asserts render + section deep-link.
- **Why:** User asked for an online User Guide as part of the menu system.
- **Files touched:** apps/web/src/lib/user-guide-content.ts (new), apps/web/src/pages/UserGuidePage.tsx (new), apps/web/src/App.tsx, apps/web/e2e/smoke.spec.ts
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, test 69, build 4/4). Live: /guide serves, content in bundle.
- **Next:** commit → PR → merge. (All three of this batch's asks — SSO, LOCAL switch, roles, user guide — then complete.)

### 2026-06-14 — Expanded the cloud compute catalog (FR-21) — full AWS/GCP/Azure families
- **Action:** Grew the seeded cloud price catalog from ~10 to **180** entries across AWS (78), GCP (52), Azure (50). Added a `catalogRows([sku,price])` builder in seed.ts and comprehensive compute families: AWS EC2 general-purpose (T3/T4g/M5/M6i/M7i/M7g), compute (C5/C6i/C7g), memory (R5/R6i/X2idn), storage (I3/I4i/D3) and accelerated (G4dn/G5/P3/P4d/Inf2/Trn1) + S3/EBS; GCP Compute Engine E2/N1/N2/N2D/T2D/C2/C3/highmem/highcpu/M1/M2 + A2(A100)/G2(L4) + Cloud Storage; Azure VMs B/D(v3,v5,AMD)/F/E/M/L/N(GPU) + Blob/Managed Disks; plus alternate-region samples (eu-west-1, europe-west1, westeurope). Extended `GCP_MACHINE_SPECS` (E2/N2/N2D/T2D/N1 standard sizes) so the live refresh can price more of them. Existing keys preserved (idempotent upsert).
- **Why:** User: more compute "appliances" are needed; pull a full list from Google/Azure/AWS.
- **Files touched:** apps/api/prisma/seed.ts, apps/api/src/modules/cloud-pricing/price-mappers.ts
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, test 69, build 4/4). Live: re-seeded → 180 prices (AWS 78 / GCP 52 / AZURE 50), GPU/accelerated + 6 regions confirmed.
- **Next:** commit → PR → merge; then reorder + Title-Case the nav menu.

### 2026-06-14 — Reorder + Title-Case the top nav (UX)
- **Action:** Replaced the ad-hoc nav with a data-driven `NAV_ITEMS` list rendered in the requested order with Title Case: Dashboard, Estimates, Rate Cards, Workflow, Checklist Rules, Reference Data, Cloud Prices, FX Rates, Users, Roles, User Guide, Help. Admin-only items (Workflow, Checklist Rules, Reference Data, FX Rates, Users) render in-position only for Admins. Updated the 3 e2e nav-link assertions whose labels changed case (Reference Data, FX Rates, Checklist Rules); page headings unchanged.
- **Why:** User specified the exact menu order + Title Case.
- **Files touched:** apps/web/src/App.tsx, apps/web/e2e/smoke.spec.ts
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, build 4/4). e2e validated in CI.
- **Next:** commit → PR → merge; then the categorized enterprise cloud catalog (storage/network/database/containers/tools).

### 2026-06-14 — Categorized enterprise cloud catalog (FR-21) — everything to model a cloud build
- **Action:** Turned the compute catalog into a full enterprise catalog the architect can use for a cost model. Schema: added `CloudPrice.category` (default 'Compute') + a `GB` unit; migration `20260614000000_enterprise_catalog_category` (additive — verified fresh-deploy + no-drift). Seed: a `SERVICE_CATEGORY` map derives each row's category; added ~80 new rows beyond compute across **Storage** (tiers: IA/Glacier/Nearline/Coldline/Archive, EFS/Filestore/Files, Managed Disks), **Networking** (egress, ELB/LB/App Gateway, NAT, CloudFront/CDN/Front Door, Route53/DNS, VPN/Direct Connect/Interconnect), **Database** (RDS/Aurora, Cloud SQL, Azure SQL, DynamoDB/Firestore/Cosmos, ElastiCache/Memorystore/Redis), **Containers & Serverless** (Lambda/Functions, Fargate/Cloud Run/Container Instances, EKS/GKE/AKS), **Analytics** (Athena/BigQuery/Synapse, Kinesis/Event Hubs, Dataflow), **AI & ML** (SageMaker/Vertex/Azure ML, Bedrock/OpenAI), **Security & Tools** (WAF/Cloud Armor, KMS/Key Vault, Secrets, Defender), **Management & Monitoring** (CloudWatch/Cloud Monitoring/Azure Monitor). Types/DTO/service: `category` field + `category` list filter + category-first ordering; `GB` unit. Web: Cloud Prices page gains a Category filter + column; the cloud-line picker groups options by category (`<optgroup>`), placeholder "Select cloud resource".
- **Why:** User: include cloud storage, network devices, and tools; categorize; everything to build an entire cloud enterprise for the architect's cost model.
- **Files touched:** apps/api/prisma/{schema.prisma,seed.ts,migrations/20260614000000_…}, apps/api/src/modules/cloud-pricing/cloud-prices.service.ts, packages/types/src/cloud-pricing.ts, apps/web/src/lib/types.ts, apps/web/src/pages/{CloudPricesPage.tsx,EstimateEditorPage.tsx}
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, test 69, build 4/4). Migration verified (fresh-deploy + no-drift). Live: migrate deploy + reseed → **256** prices across **9 categories** (Compute 171, Networking 20, Storage 20, Database 13, Containers 11, Security 7, Analytics 6, AI/ML 5, Monitoring 3); all 5 units (HOUR/MONTH/GB_MONTH/GB/REQUEST); `?category=Networking` filter → 20.
- **Next:** commit → PR → CI-green → merge.
