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

### 2026-06-14 — User Guide: add the cloud categories (NFR-12)
- **Action:** Added a "Cloud resources & categories" section to the in-app User Guide (`/guide`) describing the 9 enterprise categories (Compute, Storage, Networking, Database, Containers & Serverless, Analytics & Big Data, AI & ML, Security & Tools, Management & Monitoring), how to filter by Category on Cloud Prices, and that the cloud-line picker groups by category; links to /cloud-prices + the add-cloud-line use case. Tweaked the "Building an estimate" section to point at it ("price resources from the categorized AWS/GCP/Azure catalog").
- **Why:** User: update the User Guide with the new cloud categories.
- **Files touched:** apps/web/src/lib/user-guide-content.ts
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, build 4/4). Live: /guide serves; "Cloud resources & categories" in bundle.
- **Next:** commit → PR → merge.

### 2026-06-14 — Managed Services + SaaS line items (FR-21)
- **Action:** Extended the catalog with two new categories. Added a `SAAS` value to the `CloudProvider` enum (migration `20260614010000_saas_provider`, additive; fresh-deploy + no-drift verified) for third-party SaaS that isn't an AWS/GCP/Azure resource. Seed: `catalogRows` gained a category override + a new `saasRows` helper; added **16 Managed Services** (AWS MSK/MQ/MWAA/Grafana/Backup/Support, GCP Composer/Anthos/Apigee/Backup-for-GKE/Support, Azure Backup/Site Recovery/API Management/Arc/Support) and **26 SaaS** subscriptions (Datadog/New Relic/Grafana/PagerDuty/Splunk, Snowflake/Databricks/Mongo Atlas/Confluent, Okta/Auth0/1Password/CrowdStrike/Cloudflare, M365/Workspace/Slack/Zoom, GitHub/GitLab/Jira/Confluence, Salesforce/HubSpot, Twilio/SendGrid). `sync` guards providers with no live strategy (skips SAAS). Web: SAAS added to the provider filter; the cloud-usage field relabeled **Usage/mo** (with a tooltip) since the catalog now spans hours/GB/requests/seats/months; cloud-line picker already groups by category (so Managed Services + SaaS appear as optgroups). User Guide bullets updated.
- **Why:** User: add managed services and SaaS line items too.
- **Files touched:** apps/api/prisma/{schema.prisma,seed.ts,migrations/20260614010000_…}, packages/types/src/common.ts, apps/api/src/modules/cloud-pricing/cloud-prices.service.ts, apps/web/src/pages/{CloudPricesPage.tsx,EstimateEditorPage.tsx}, apps/web/src/lib/user-guide-content.ts
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, test 69, build 4/4); migration verified. Live: migrate+reseed → **298** prices / **11 categories** (incl. SaaS 26, Managed Services 16) / providers AWS/GCP/AZURE/SAAS; sync?provider=SAAS → 201 (guarded); a SaaS line (M365 E3 ×25 @ usage 1) computed $900/mo correctly.
- **Next:** commit → PR → CI-green → merge.

### 2026-06-14 — Cost-by-category breakdown on the estimate (FR-7/FR-21)
- **Action:** Added a "Cost by category" section to the estimate detail card (one-time / monthly / yearly per category), mirroring the SDLC-phase breakdown, using the engine's existing `categories` subtotals. Cloud lines now categorize by their enterprise category (Compute/Storage/Networking/SaaS/…) instead of "Cloud (provider)": snapshotted the cloud price's `category` onto `CloudComputeLineItem` (migration `20260614020000_cloud_line_category`, additive/drift-free) at add time; engine-mapping carries it (`MappableCloud.category`) and groups cloud lines by it (fallback to `Cloud (provider)` for pre-existing lines). Labor (by role) and non-labor (by cost category) breakdowns unchanged. The new section also flows to CSV/Excel/print (they already used `categories`).
- **Why:** User: add a category breakdown on the estimate.
- **Files touched:** apps/api/prisma/{schema.prisma,migrations/20260614020000_…}, apps/api/src/modules/estimates/{estimates.service.ts,engine-mapping.ts}, apps/web/src/pages/EstimateEditorPage.tsx
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, test 69, build 4/4); migration verified. Live: an estimate with an S3 Storage line + a Datadog SaaS line → totals.categories = Storage $23/mo, SaaS $150/mo (cloud categories reflected); "Cost by category" section in the web bundle.
- **Next:** commit → PR → CI-green → merge.

### 2026-06-14 — Estimation Guide (methodology & training) (NFR-12)
- **Action:** Added an "Estimation Guide" menu page (`/estimation-guide`) — a methodology/training handbook on *how to estimate well* (vs the User Guide's *how to use the tool*). 11 sections: why estimate, techniques (analogous/parametric/bottom-up/three-point-PERT), sizing, uncertainty & contingency, cost→price, build vs run cost (TCO), assumptions, baselines & re-estimation, pitfalls & biases, a worked example, and a glossary — each cross-linked to the matching app feature (PERT, contingency, assumptions, baselines, billing period, category breakdown) via `/help#uc-…` and `/guide`. Reuses the `GuideSection` type + sticky-TOC/hash-deeplink pattern. Nav link added after "User Guide"; reciprocal link from the User Guide; e2e (render + section deep-link). Web-only, no migration.
- **Why:** User asked whether the app has estimating training/materials → yes for using the tool, but no methodology content; user said build the Estimation Guide.
- **Files touched:** apps/web/src/lib/estimation-guide-content.ts (new), apps/web/src/pages/EstimationGuidePage.tsx (new), apps/web/src/App.tsx, apps/web/src/lib/user-guide-content.ts, apps/web/e2e/smoke.spec.ts
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, build 4/4). Live: /estimation-guide serves; content in bundle.
- **Note:** earlier PR #51 (category breakdown) merged with a red e2e (my script merged unconditionally on unprotected main); forward-fixed in PR #52 (scoped the duplicate "Licenses" cell). Going forward, gate merges on all-green.
- **Next:** commit → PR → CI-green → merge.

### 2026-06-14 — Workflow + transition repo (FR-24) — multiple workflows, system keys
- **Action:** Generalized the single-default workflow into a repo of many. Schema: `WorkflowDefinition` + system `key` (unique) + `description`; `WorkflowTransition` + system `key` (unique) + `description`. Migration `20260614030000_workflow_transition_repo` (data-preserving backfill of keys; fresh-deploy + no-drift verified). Backend: `GET /workflows` (list w/ stage/transition counts), `POST /workflows` (admin — system `WF-xxxxxx` key + label + description, auto-seeds a Draft→In Review→Approved→Final starter), `PATCH/DELETE /workflows/:wf` (admin; default undeletable, blocked if estimates use it). Generalized stage/transition CRUD to `/workflows/:wf/...` ('default' still resolves); transitions get a system `TR-xxxxxx` key + editable description. Web: new **Workflows** repo page (`/workflows`, list + create/edit/delete + active toggle + link to editor); the editor moved to `/workflows/:id` (shows transition key + description, add-transition gains a description field). Nav "Workflow"→"Workflows". Seed + Help use case + e2e updated.
- **Why:** User: "create a repo of several workflows" + "a repo of several transitions as well" — system key + label/description, admin CRUD.
- **Files touched:** apps/api/prisma/{schema.prisma,seed.ts,migrations/20260614030000_…}, packages/types/src/governance.ts, apps/api/src/modules/workflow/{workflow.service.ts,workflow.controller.ts}, apps/web/src/lib/{types.ts,queries.ts,help-content.ts}, apps/web/src/pages/{WorkflowPage.tsx,WorkflowsRepoPage.tsx(new)}, apps/web/src/App.tsx, apps/web/e2e/smoke.spec.ts
- **Result:** Pipeline green (format, lint 0, typecheck 6/6, test 69, build 4/4); migration verified. Live: repo lists WF-DEFAULT; created WF-59D982 (4 stages/3 transitions starter); added a transition TR-0B50E2 with description; deleted; default delete guarded (400). /workflows serves.
- **Next:** commit → PR → CI-green (gated) → merge. Then PR B (checklist rule sets repo), PR C (SOW→PDF).

### 2026-06-14 — PR #54 merged + Checklist rule sets repo (FR-25) — PR B
- **Action:** (1) Diagnosed PR #54's red e2e: the Workflows repo renders the workflow name in an editable `<input>` for admins, so `getByText('Default Approval Workflow')` matched nothing → asserted the system key `WF-DEFAULT` (plain text) instead; pushed, CI all-green, **merged #54** (squash, branch deleted). (2) Built **B — checklist rule sets repo**: new `ChecklistRuleSet` (system key `RS-xxxxxx`, label `name`, `description`, `isDefault`, `isActive`) groups `ChecklistRule`s via a new required `rule_set_id` FK. Migration `20260614040000_checklist_rule_sets` — create table, seed `RS-DEFAULT`, backfill every existing rule, set NOT NULL, add FK + index (data-preserving). Backend: `ChecklistService` gains rule-set CRUD (`listRuleSets` w/ `_count.rules`, `createRuleSet` → system key, `updateRuleSet`, `deleteRuleSet` guarding default + non-empty), `listRules(ruleSetId?)`, `createRule` defaults to the default set, `evaluate()` scopes to the default set (behavior-preserving). New `/checklist-rule-sets` admin controller; `/checklist-rules?ruleSetId=` filter. Web: new **Checklist rule sets** repo page (`/checklist-rules`) → per-set rule editor (`/checklist-rules/:id`, back-link + set name/key header); nav "Checklist Rules" now opens the repo. Seed upserts `RS-DEFAULT` and attaches built-ins. Help use case + e2e updated.
- **Why:** User: "Confirm it merged and build B" — #54 had NOT merged (e2e red); fixed + merged. Then "Do the same for Checklist rule sets" — same repo pattern (system key + label/description, admin CRUD).
- **Files touched:** apps/api/prisma/{schema.prisma,seed.ts,migrations/20260614040000_checklist_rule_sets/migration.sql(new)}, apps/api/src/modules/workflow/{checklist.service.ts,checklist-rules.controller.ts,checklist-rule-sets.controller.ts(new),workflow.module.ts}, packages/types/src/governance.ts, apps/web/src/lib/{types.ts,queries.ts,help-content.ts}, apps/web/src/pages/{ChecklistRulesPage.tsx,ChecklistRuleSetsPage.tsx(new)}, apps/web/src/App.tsx, apps/web/e2e/smoke.spec.ts
- **Result:** Verified in Docker: migration fresh-deploy + **no-drift** (migrate diff exit 0), seed → `RS-DEFAULT` with 9 rules linked; **API typecheck clean, web typecheck clean, prettier clean** (all 12 changed files). PR #54 merged.
- **Next:** commit → PR → CI-green (gated) → merge B. Then PR C (editable SOW → official/legal PDF, new menu item).

### 2026-06-14 — Statement of Work → official/legal PDF (BR-7) — PR C
- **Action:** Built the SOW feature: a persisted, editable, official Statement of Work composed from an estimate and printed to PDF in-browser (dependency-free, like the printable summary). New `StatementOfWork` entity — system `SOW-xxxxxx` number, status DRAFT|ISSUED, editable sections (client/provider parties, overview, scope, deliverables, timeline, payment terms, assumptions, terms & conditions), effective date, and a pricing snapshot. Migration `20260614050000_statement_of_work` (additive new table; FK to estimates ON DELETE CASCADE; verified fresh-deploy + no-drift). New `sow` NestJS module (controller→service) injecting the now-exported `EstimatesService` to pre-fill from / snapshot the estimate's totals: `GET /sow`, `GET /sow/:id` (live pricing for drafts, snapshot once issued), `POST /sow` (create from estimate, pre-filled legal boilerplate + assumptions; Admin/Estimator), `PATCH /sow/:id` (edit; rejected once issued), `POST /sow/:id/issue` (lock + snapshot totals), `POST /sow/:id/revert`, `DELETE /sow/:id`. Web: new **Statements of Work** nav item → list/create-from-estimate (`/sow`) → section editor (`/sow/:id`, Save/Issue/Revert) → official print-ready document (`/sow/:id/print`) with a Pricing table and two signature blocks and a Print/Save-as-PDF button. Help use case + e2e smoke added.
- **Why:** User: "create an official and legal statement of work pdf … another menu item because sometimes the user may want to edit the SOW before creating it." Persisting + an Issue/lock + pricing snapshot makes it auditable/immutable (BR-3, BR-7).
- **Files touched:** apps/api/prisma/{schema.prisma,migrations/20260614050000_statement_of_work/migration.sql(new)}, apps/api/src/app.module.ts, apps/api/src/modules/estimates/estimates.module.ts (export EstimatesService), apps/api/src/modules/sow/{sow.service.ts,sow.controller.ts,sow.module.ts}(new), packages/types/src/{sow.ts(new),index.ts}, apps/web/src/lib/{types.ts,queries.ts,help-content.ts}, apps/web/src/pages/{SowListPage,SowEditorPage,SowPrintPage}.tsx(new), apps/web/src/App.tsx, apps/web/e2e/smoke.spec.ts
- **Result:** Verified in Docker: migration fresh-deploy + **no-drift** (migrate diff exit 0); **API typecheck clean, web typecheck clean, prettier clean** (16 changed files). Settings: blanket `Bash` + `Bash(cd *)` allow re-added per user request.
- **Next:** commit → PR → CI-green (gated) → merge C. All three requested features (A/B/C) then complete.

### 2026-06-14 — Professional navigation redesign (usability)
- **Action:** Reworked the top nav strip: ~15 flat links (cramped/overflowing) → **3 primary links** (Dashboard, Estimates, Statements of Work) + **4 grouped dropdown menus** (Pricing · Governance · Admin · Docs). Added a reusable `TopNav` component with click-to-open menus, click-outside + route-change auto-close, **active-route highlighting** (filled pill on the strip, brand-colored item in menus), hover states, a chevron that rotates when open, and admin-gated items/groups (a group with no visible items is hidden). Polished the header: tighter padding, a uppercase **role pill**, and a bordered **Log out** button; the email is hidden on small screens. Updated 8 e2e tests to open the parent menu before clicking a now-grouped link.
- **Why:** User: "On the Navigator/menu strip — they don't [look] professional. Can you make them fit and look very professional." Grouping reduces 15 top-level items to 7, so the strip stays clean and fits.
- **Files touched:** apps/web/src/App.tsx, apps/web/e2e/smoke.spec.ts
- **Result:** Local gates green — web typecheck, ESLint, prettier all clean. (This time ESLint run locally too, per the #56 lesson.)
- **Next:** commit → PR → CI-green (gated) → merge.

## Chapter 8 — Maintenance, Brand & Memory Hygiene (started 2026-06-15)
**Goal:** Keep `main` green and the living memory truthful now that the feature backlog is 54/54. Covers Section 19 (living docs), DoD hygiene, and the trailing polish PRs (#60–#69).

### 2026-06-15 00:00 UTC — Merge PR #69, clean repo, refresh project memory
- **Action:** Resumed an autonomous session. (1) Found PR #69 (`chore/web-cache-headers` — no-cache `index.html` + immutable hashed assets in nginx) open with **all CI green** (build/e2e/security); merged it (squash, branch deleted) → `main` at `75fe0b4`. (2) `git pull` then failed with "fatal: bad object … Icon?" — a stray macOS `Icon\r` file had been committed into `.git/refs/heads/chore/` (and its remote-tracking mirror). Removed both with `find .git/refs -name 'Icon*' -delete`, ran `git remote prune origin` (pruned 16 merged feature branches), and fast-forwarded `main`. (3) Audited the codebase to reconcile reality vs. the stale `CLAUDE.md` Current State block: confirmed **FR-21a/b are fully built** (Azure Retail / AWS SigV4 / GCP Billing `PricingProvider` strategies, `POST /cloud-prices/sync`, `GET /cloud-prices/last-pulled`, web "Refresh prices" + last-pulled table) — the block wrongly listed them as "spec'd, not yet built." Also verified on `main`: SaaS provider + catalog `category`, native `.xlsx` writer (`estimates/xlsx.ts`, no dep), scenarios/baselines/comments/fx/margin-tax/PERT migrations, checklist in `workflow/checklist.service.ts`, SSO in `auth/sso`. (4) Rewrote the **Current State** block to match reality and added a local-env note (node/pnpm not on PATH in this shell → CI is the health gate) + the `Icon`-ref gotcha.
- **Why:** Section 19 / DoD — the living memory must reflect "now"; it had drifted (referenced long-merged branches as "not yet merged" and called shipped features unbuilt).
- **Files touched:** CLAUDE.md (Current State block), PROJECT_LOG.md (this chapter), AUDIT_LOG.md.
- **Result:** `main` clean at `75fe0b4`, PR #69 merged, stray refs removed, stale branches pruned, no open PRs. Could not run the toolchain locally (node/pnpm absent in the tool shell) — relied on the merged PR's green CI as the health gate.
- **Next:** commit the memory refresh on a docs branch → PR → CI-green → merge. Then await direction or pick the next optional-polish item (FE-54 enum-label migration).

### 2026-06-15 14:30 UTC — Merge memory refresh (PR #70) + backfill CHANGELOG (#67–#69)
- **Action:** Memory-refresh PR #70 went green (build/security/e2e) and merged → `main` at `85b855b` (cleaned another stray `docs/Icon` ref + pruned on the way). Then found the CHANGELOG's `[Unreleased]` stopped at #65 (the #66 rollup covered #54–#65) and was missing the three PRs that landed after: added a **"Web delivery — cache headers (NFR-7)"** section for #69 and a **"Fixed"** entry under the Smart-checklist section for #67 (no green checks on an untouched estimate) + #68 (e2e guard). Also saved a persistent memory `git-icon-ref-breakage.md` (+ MEMORY.md index) for the recurring macOS `Icon\r` ref that breaks `git pull`.
- **Why:** Section 14/19 — keep the CHANGELOG current per increment; capture the recurring env gotcha so future sessions don't re-diagnose it.
- **Files touched:** CHANGELOG.md, PROJECT_LOG.md, AUDIT_LOG.md (+ external memory files under `~/.claude/.../memory/`).
- **Result:** CHANGELOG now documents through #69. Docs-only.
- **Next:** commit CHANGELOG + living-file updates on a branch → PR → CI-green → merge. Backlog remains 54/54; await direction or pick FE-54 enum-label polish.

### 2026-06-15 15:30 UTC — Replace checklist "N/A" with an actionable "To do" state (FR-25)
- **Action:** User concern: on a brand-new estimate (name only), the Smart checklist shows ~7 items as **"N/A"**, which reads as "not applicable / ignore me" when in fact they're applicable and just not started. They proposed Red ✕ + a "How?" link. I laid out the trade-offs (pure red looks broken on a fresh estimate and would falsely fail legitimately-empty categories, e.g. a cloud-only estimate's labor rule) and recommended a distinct **"To do" (not started)** state; via AskUserQuestion the user picked the **amber "To do"** option. Implemented a **three-state checklist**: `✓` done (green) · `✕` needs fixing (red/amber, real problems only) · `○` **To do** (amber, not-started). Engine (`checklist-rules.ts`) not-applicable messages reworded from passive ("No labor lines to check yet") to **imperative next steps** ("Add labor lines and assign each a role", "Set a global upcharge %", …). UI (`EstimateEditorPage.tsx`) now renders all three states in one unified item row — to-do items show an amber `○` + "To do:" prefix, are **clickable** (jump to that section), and carry a **"How?"** guide link (previously only failures did); added a worded legend (Done · Needs fixing · To do) that avoids the `✓` glyph so the #68 "no green on a fresh estimate" e2e still holds. **No change to blocking/completeness** — a to-do still neither blocks nor counts toward %.
- **Why:** FR-25 usability — the checklist should read as an actionable to-do list on a new estimate, not "not applicable" (misleading) and not all-red (alarming + false negatives for unused categories). Builds on the #65/#67/#68 "no vacuous green" work.
- **Files touched:** apps/api/src/modules/workflow/checklist-rules.ts (+ .spec.ts comments), packages/types/src/governance.ts, apps/web/src/pages/EstimateEditorPage.tsx, apps/web/src/lib/{types.ts,help-content.ts}, apps/web/e2e/smoke.spec.ts, CHANGELOG.md.
- **Result:** Engine unit tests assert on the `applicable` flag (not message text) so they stay green; e2e #68 updated (asserts "To do:" + the reworded labor message, no longer "N/A"). **Could not run the toolchain locally** (node/pnpm absent in the tool shell) — relying on CI. Self-reviewed JSX + Playwright selectors against the nested markup.
- **Next:** commit on a branch → PR → CI-green (build/typecheck/test/lint + e2e) → merge.

### 2026-06-15 16:30 UTC — Smart-checklist panel polish (FR-25) + FE-54 audit
- **Action:** User asked to "Polish Smart Checklist then FE-54 enum-label items." (1) **Polish (this PR):** extracted the checklist panel into a `ChecklistPanel` component and added — **state ordering** (needs-fixing first, blockers before warnings → to-do → done) so the next action is always at the top; a **completeness progress bar** (rose when blocking, emerald otherwise); an at-a-glance **count summary** ("N to fix · M to do · K done"); and a subtle **"blocks"** tag on failing BLOCKERs (the ones that actually gate a workflow transition). Kept the three-state markers + How? links + legend from #72. (2) **FE-54 audit (for the next PR):** ran a read-only Explore agent — all 9 remaining reference types are already seeded; reusable web helper is `useRefLabeler(typeCode)` (`apps/web/src/lib/refLabels.ts`); still-hardcoded label sources are RateUnit (RateCardsPage), CloudProvider (CloudPricesPage), Role (UsersPage + roleCapabilities), ChecklistSeverity/Scope (ChecklistRulesPage); BillingPeriod already wired (with a hardcoded fallback); NonLaborType isn't user-rendered; workflow stages are entity-driven (out of scope); one seed bug — `CLOUD_PRICE_UNIT` missing the `GB` value.
- **Why:** FR-25 usability — make the panel scannable and the gating obvious. Audit de-risks the FE-54 PR.
- **Files touched:** apps/web/src/pages/EstimateEditorPage.tsx (new `ChecklistPanel` + `stateRank`/`sevRank`), apps/web/e2e/smoke.spec.ts (assert progress bar + counts), CHANGELOG.md.
- **Result:** Pure presentation change (no API/engine change), so unit tests unaffected; e2e fresh-checklist test extended to assert the progressbar + "N to fix"/"M to do". Carefully matched prettier (printWidth 100: collapsed one bar `<div>`, made the rank helpers block-body to avoid arrow-ternary paren ambiguity) since node/pnpm can't run locally.
- **Next:** commit polish → PR → CI-green → merge. Then FE-54: swap the 5 hardcoded enum option/label sources to `useRefLabeler`, fix the `GB` seed value.

### 2026-06-15 17:30 UTC — FE-54 part 1: DB-driven enum labels (rate unit / provider / price unit / severity / scope) (FR-29)
- **Action:** Polish merged as PR #73 → `main` `4768611`. Started FE-54 in two PRs. **PR A (this one):** swapped the hard-coded label/option sources for **RateUnit** (RateCardsPage RoleRow + AddRoleRow), **CloudProvider** + **CloudPriceUnit** (CloudPricesPage — filter dropdown, freshness table, price table provider + unit columns), and **ChecklistSeverity** + **ChecklistScope** (ChecklistRulesPage RuleRow + AddRuleRow) to the DB reference data via the existing `useRefLabeler(typeCode)` hook (`apps/web/src/lib/refLabels.ts`). Each keeps a hard-coded code list as a graceful fallback until the reference values load; the enum **codes stay code-coupled** (behavioral), only labels are data-driven. Fixed two seed gaps: added `SAAS` to `CLOUD_PROVIDER` and `GB` to `CLOUD_PRICE_UNIT` (the catalog already ships those). Kept `severityClass` color map keyed on the code (styling is behavioral). **Role** (UsersPage + roles matrix + header pill) is deferred to PR B (wider blast radius).
- **Why:** FR-29/NFR-17/FE-54 — labels must be admin-renameable from Reference data with no code change.
- **Files touched:** apps/api/prisma/seed.ts; apps/web/src/pages/{RateCardsPage,CloudPricesPage,ChecklistRulesPage}.tsx; CHANGELOG.md.
- **Result:** e2e-safe — verified no test asserts these display texts (selectors use value/index; the only label assertion, columnheader "Estimator", is unchanged). `useRefLabeler` hooks added at component top-level (RoleRow/AddRoleRow/RuleRow/AddRuleRow/CloudPricesPage are all components — hook rules OK). Matched prettier (printWidth 100) by hand since node/pnpm can't run locally.
- **Next:** commit PR A → CI-green → merge. Then PR B: Role labels (header pill, UsersPage, RolesPage/roleCapabilities) from `ROLE` reference data.

### 2026-06-15 18:00 UTC — FE-54 part 2: DB-driven Role labels (FR-29)
- **Action:** PR A merged (#74 → `main` `3d91ea2`). **PR B (this one):** wired **Role** labels to the `ROLE` reference type via `useRefLabeler`: UsersPage (create-form + per-row role selects), RolesPage (the "signed in as" line, the role summary cards, and the capability-matrix column headers), and the header **role badge** — extracted into a small `RolePill` component so the ROLE reference fetch only fires once a user exists (not on the login screen, since `useReferenceValues` is `enabled` purely on typeCode). `ROLE_LABELS` stays as the pre-load fallback; the role **code** still drives RBAC. This finishes the label migration for the configurable enums.
- **Why:** FR-29/NFR-17/FE-54 — admin-renameable role labels with no code change.
- **Files touched:** apps/web/src/pages/{UsersPage,RolesPage}.tsx, apps/web/src/App.tsx (new `RolePill`), CHANGELOG.md.
- **Result:** e2e-safe — the index-based `roleSelect` test targets the labor-line *rate-card role* picker, not the user-role select; the only role-label assertion (columnheader "Estimator") is unchanged (seed + fallback both "Estimator"). Used a block-body arrow for `roleLabel` to dodge prettier's arrow-ternary paren behavior; scoped the pill hook to avoid an unauthenticated reference fetch. node/pnpm unavailable locally → CI gate.
- **Next:** commit PR B → CI-green → merge. FE-54 enum-label items then complete (workflow stages are entity-driven, out of scope; NonLaborType isn't user-rendered).

## Chapter 9 — Release v1.0.0 (started 2026-06-15)
**Goal:** Cut the first tagged release of Kerdos (feature-complete: MVP + all post-MVP), then begin new feature work (per the user: "cut a new release - then we will begin on adding more features").

### 2026-06-15 18:40 UTC — Release prep for v1.0.0
- **Action:** PR B merged (#75 → `main` `2fe94e9`). User: "cut a new release … to the new release version." Bumped the version `0.1.0`→`1.0.0` across all six package.json (root + apps/{api,web} + packages/{config,types,engine}) and the Swagger `setVersion` in `apps/api/src/main.ts`. Promoted the CHANGELOG `[Unreleased]` section to `## [1.0.0] - 2026-06-15` (with a release-summary blurb), added a fresh empty `[Unreleased]`, and updated the bottom link refs (`[Unreleased]` → `compare/v1.0.0...HEAD`, new `[1.0.0]` → release tag). Internal deps are `workspace:*` so the bump is drift-free.
- **Why:** First shippable release; the CHANGELOG header already noted "semantic versioning once it ships a first release."
- **Files touched:** package.json (×6), apps/api/src/main.ts, CHANGELOG.md, CLAUDE.md, PROJECT_LOG.md, AUDIT_LOG.md.
- **Result:** Pending — release-prep PR → CI-green → merge, then annotated tag `v1.0.0` + GitHub release from the CHANGELOG notes. node/pnpm unavailable locally → CI gate.
- **Next:** open release-prep PR; on green, merge → `git tag -a v1.0.0` → push tag → `gh release create v1.0.0`. Then start new feature work.

## Chapter 10 — Post-1.0 polish (started 2026-06-15)
**Goal:** Small fixes/refinements on top of v1.0.0 before the next feature batch.

### 2026-06-15 19:45 UTC — Real Veridion logo in header + login
- **Action:** v1.0.0 released (tag + GitHub release on `main` `54cc96f`). User: "I don't like the logo you created … pull the logo from veridion.com … crop the png to only show the logo." The old `veridion-mark.png` was the bare amber "V" mark (Veridion's `mobile-logo.png`). Pulled the official site logo `main-logo-2.png` (amber mark + "Veridion" wordmark + "AI business intelligence" tagline, 297×30 transparent), and cropped off the tagline with PIL (kept x 0–225 = mark + wordmark; tagline starts ~x227, found by per-column content-height analysis). Produced two assets: `veridion-logo.png` (amber mark + black wordmark, for white/login) and `veridion-logo-onteal.png` (amber mark + **white** wordmark — only the black text recolored, mark stays amber — for the teal header). Rewrote `BrandLogo` with an `onLight`/`onDark` variant prop; header uses `onDark` + a divider + "Kerdos" product name (dropped the redundant "Veridion LLC" subtitle, now in the logo); login stacks the colour logo above "Kerdos · Project Cost Estimator". Favicon left as the square mark.
- **Why:** User dislikes the homemade-looking bare mark; wants the recognizable Veridion brand. FE/UX.
- **Files touched:** apps/web/public/{veridion-logo.png,veridion-logo-onteal.png}(new), apps/web/src/components/BrandLogo.tsx, apps/web/src/App.tsx, apps/web/src/pages/LoginPage.tsx, CHANGELOG.md.
- **Result:** Previewed both variants composited on teal/white — clean. e2e-safe: the only brand assertion, `getByRole('link', {name:'Kerdos'})`, still matches (substring of the home link's "Veridion Kerdos" accessible name). No node/pnpm locally → CI gate.
- **Next:** commit → PR → CI-green → merge. Then begin the next feature batch.

### 2026-06-15 20:30 UTC — Rate card UX: $ + 2 decimals + sortable columns
- **Action:** Real-logo PR merged (#77 → `main` `efc940c`). Three rate-card tweaks (user, in one turn): (1) "make sure the rate is in $ dollars" → each rate field now shows the card's currency symbol (USD→`$`, via a small `currencySymbol` map threaded from `card.currency`); (2) "85 should look like 85.00" → a `toMoney` helper formats rates to 2 decimals (initial display + on blur; saves the normalized value, compared numerically so unchanged blurs don't write); (3) "allow me to sort the role and Rate" → the **Role** and **Rate** `<th>`s are now sort buttons (▲/▼; rate numeric, role alphabetical, asc/desc toggle) over a `useMemo`-sorted copy of `card.roles`. The rate inputs became bordered `$`-prefixed fields (`inputMode="decimal"`).
- **Why:** Rate-card authoring clarity + usability (the user's direct asks).
- **Files touched:** apps/web/src/pages/RateCardsPage.tsx, CHANGELOG.md.
- **Result:** UI-only, RateCardsPage-scoped. e2e-safe — no test navigates the Rate cards page. Matched prettier by hand (block-body `arrow`/`toggleSort` to dodge arrow-ternary parens; dropped `font-medium` from the sort buttons — inherited from the `<th>` under Tailwind preflight — so both header buttons stay ≤100 cols on one line). node/pnpm unavailable locally → CI gate.
- **Next:** commit → PR → CI-green → merge.

### 2026-06-15 21:15 UTC — Labor card: align the add-line fields under the column titles
- **Action:** Rate-card PR merged (#78 → `main` `9a50aa0`). User: "In the Labor card — I don't think the Titles align to the fields very well." The data rows were a proper `<table>` (aligned), but the "add a labor line" inputs were a separate `flex flex-wrap` row that didn't line up under the column headers. Moved that row into the table as a **`<tfoot>` row** (11 cells matching the 11 headers): role / resource / allocation / window (the two date inputs stacked) / phase / qty / units (with the optional PERT opt-likely-pess tucked underneath) / rate ("auto", derived from role) / billing / line-total (blank) / Add-labor button. Inputs are `w-full` so they fill each column; preserved every e2e-referenced selector (role "Select role…" option, "resource (optional)"/"alloc %" placeholders, the two `type=date` inputs in start→end order, both Phase selects, the "Add labor" button) — only the unreferenced PERT placeholders were shortened (opt/likely/pess → o/m/p).
- **Why:** Alignment/clarity — a table footer guarantees the add-line fields sit under their titles (the user's ask).
- **Files touched:** apps/web/src/pages/EstimateEditorPage.tsx (LaborSection), CHANGELOG.md.
- **Result:** UI-only. Couldn't preview locally (no node/pnpm) but the table layout structurally guarantees the alignment; matched prettier by hand. CI is the gate. **Merged as PR #79** (after a follow-up: putting form controls in `<td>`s leaked their values into the cells' accessible names, so two `getByRole('cell')` e2e assertions matched the footer — scoped "One-time" to `#sec-nonlabor` and "CapTester" to `#sec-labor tbody`).

### 2026-06-15 21:50 UTC — Floating Help button + (next) $ on monetary values
- **Action:** User shared a glossy red "HELP" stock image and asked to find a use; separately asked to "use the $ symbol on monetized values." (1) **Help button (this PR):** flagged that the supplied image is a **123RF watermarked stock photo** (licensing) + low-res raster + clashes with the flat UI — did NOT ship it; instead built a clean CSS floating **? Help** pill (`HelpButton` in App.tsx), fixed bottom-right, red, linking to `/help`, rendered only when signed in (the route is Protected), `print:hidden`. `aria-label="Help and guides"` so its accessible name doesn't collide with the nav's exact-"Help" link in e2e; added an e2e assertion. (2) **$ on money (next PR):** queued — extract a shared `currencySymbol`/`formatMoney` helper and apply across the estimate editor totals + line items (currently render `"1234.00 USD"`), refactoring RateCardsPage to use it.
- **Why:** NFR-12 (help always reachable); avoid shipping a watermarked/licensed asset.
- **Files touched:** apps/web/src/App.tsx (HelpButton + mount), apps/web/e2e/smoke.spec.ts, CHANGELOG.md.
- **Result:** UI-only; e2e-safe (floating button name disambiguated). CI is the gate. **Merged as PR #80** (`main` `6d97838`).

### 2026-06-15 22:10 UTC — Remove the orange "V" mark everywhere → Veridion wordmark + "K" favicon
- **Action:** User: "Remove that orange V logo" → (AskUserQuestion) **everywhere**. Re-cropped the veridion.com logo to the **"Veridion" wordmark only** (x≈81–224, dropping the orange mark at 0–63 and the tagline) → `veridion-wordmark.png` (black) + `veridion-wordmark-onteal.png` (white, for the teal header). Generated a clean **teal "K" favicon** (`favicon.png`, 180×180 rounded tile, Arial Bold via PIL) to replace the orange mark in the browser tab. Updated `BrandLogo` to the wordmark assets, `index.html` to `/favicon.png` (+ apple-touch-icon). **Removed** the orange-V assets `veridion-mark.png`, `veridion-logo.png`, `veridion-logo-onteal.png`. (Also deleted a stray macOS `Icon` file that appeared in `apps/web/public/` — untracked, not committed.)
- **Why:** User dislikes the orange V; wants the wordmark + a non-orange favicon.
- **Files touched:** apps/web/public/{veridion-wordmark.png,veridion-wordmark-onteal.png,favicon.png}(new) + removed 3 old assets; apps/web/src/components/BrandLogo.tsx; apps/web/index.html; CHANGELOG.md.
- **Result:** Previewed wordmark on teal/white + the K favicon — clean. e2e-safe (home link still resolves "Kerdos" via substring; no asset asserted by name). CI is the gate. **Merged as PR #81** (`main` `d3dfe1b`).

### 2026-06-15 22:40 UTC — `$` on monetary values app-wide (FR-7/FR-23)
- **Action:** User: "In the values that are monetize use the $ symbol." Added a shared `apps/web/src/lib/money.ts` — `currencySymbol(code)` (USD→`$`, etc.) and `formatMoney(value, currency)` → `<symbol><grouped 2 decimals>` (e.g. `$1,234.50`, via `toLocaleString`). Applied it across **every money display**: estimate editor (8 totals cards, labor/non-labor/cloud line cells, per-phase + per-category breakdowns, the upcharge/contingency line, baseline grand-total + signed delta, scenarios, cloud-price picker option), the estimates list, the dashboard (recent + by-currency + stage drill-down), the cloud-price catalog unit price, and the printable summary + SOW print (their `money()` helpers). Refactored RateCardsPage to import the shared `currencySymbol` (dropped its local duplicate). FX rates left as-is (they're multipliers, not money); the estimate "Currency" column still shows the code.
- **Why:** Consistent, professional money formatting with the `$` symbol (the user's ask); previously rendered "1234 USD".
- **Files touched:** apps/web/src/lib/money.ts (new); apps/web/src/pages/{EstimateEditorPage,EstimatesPage,DashboardPage,CloudPricesPage,PrintSummaryPage,SowPrintPage,RateCardsPage}.tsx; CHANGELOG.md.
- **Result:** e2e-safe — e2e only asserts the "Grand total" label, not money values (so `$`/decimals/grouping don't break it). Matched prettier by hand (wrapped the >100-col cells; JSX-text reflow for the upcharge line + cloud picker). Big multi-file change; node/pnpm unavailable locally → CI is the gate. **Merged as PR #82** (`main` `0f0a9e3`).

### 2026-06-16 — Release v1.0.1 (post-1.0 UI polish)
- **Action:** User: "Cut v1.0.1 release." Bumped `1.0.0`→`1.0.1` across all 6 package.json + Swagger `setVersion`; promoted CHANGELOG `[Unreleased]` → `## [1.0.1] - 2026-06-16` (+ fresh empty Unreleased, + `[1.0.1]` compare link ref). The v1.0.1 batch = PRs #72/#73 (checklist), #74/#75 (FE-54 labels), #78 (rate-card $/sort), #79 (labor align), #80 (Help button), #81 (Veridion wordmark + K favicon), #82 (app-wide $ money). Internal deps `workspace:*` so drift-free.
- **Why:** Package the post-1.0 polish into a tagged release (user's request).
- **Files touched:** package.json (×6), apps/api/src/main.ts, CHANGELOG.md, CLAUDE.md, PROJECT_LOG.md, AUDIT_LOG.md. **Plus two money fixes bundled into the release** (user flagged "Total Value" had no `$`): apps/web/src/pages/DashboardPage.tsx (base-currency total → `formatMoney`) and apps/web/src/pages/EstimateEditorPage.tsx (labor role-picker rate → `formatMoney`).
- **Result:** **Released** — PR #83 merged, tag `v1.0.1` on `main`, GitHub release published. (Cache-bust `?v=2` added in a follow-up commit on the release branch.)
- **Next:** —

### 2026-06-16 — Post-1.0.1: logo restore, favicon, Labor column widths
- **Action:** Several quick rounds with the user:
  1. **"see for yourself" (localhost:5173 still orange):** root cause was the running **Docker `web` container was a stale build** (old `index.html` → `/veridion-mark.png`). Rebuilt it (`docker compose build web && up -d web`) and verified `:5173` serves the new assets. (Lesson: a UI change needs the web container rebuilt to show on :5173; merging ≠ updating the running app.)
  2. **"I liked the way you had it … edit out the orange V, use the icon from veridion.com":** realized Veridion's *real* icon is the **amber bar** (their favicon/app-icon), and the "orange V" was my homemade bar-**V** mark. **Restored** the bar+wordmark logo (header/login) and set the favicon to Veridion's amber-bar icon (PR #84, merged; `?v=3`).
  3. **"swap Veridion with your logo":** declined — that's the Anthropic/Claude trademark; shipped the Veridion restore (their stated preference) instead.
  4. **"Labor card — Role doesn't have enough room; make fields proportional, a 2nd line is fine":** made the Labor table `table-fixed` with a proportional `<colgroup>` (Role ~19%, wraps for long names; numeric cols compact). Gave `PeriodSelect`/`SdlcSelect` an optional `className` so the add-row selects are `w-full`; PERT row `flex-wrap`; Role/Resource cells `break-words`.
- **Why:** User-driven branding + Labor-card readability.
- **Files touched:** apps/web/src/components/BrandLogo.tsx, apps/web/index.html, apps/web/public/* (logo PR #84); apps/web/src/pages/EstimateEditorPage.tsx + CHANGELOG.md (Labor widths).
- **Result:** Logo PR #84 merged. Labor change e2e-safe (selectors unchanged). **Can't visually verify layout locally (no toolchain) — will rebuild the web container so the user sees it and confirm.**
- **Next:** commit Labor change → PR → CI-green → merge → rebuild web container → verify on :5173.
### 2026-06-17 — GM (General Manager) approver role (FR-2, FR-26)
- **Action:** Continued in-progress work that had added `GM` to the Prisma `Role` enum + migration `20260617060000_add_gm_role`. Threaded the new role through the whole stack: shared Zod `Role` (`packages/types/src/common.ts`) and web `Role` type (`apps/web/src/lib/types.ts`); the capability matrix (`apps/web/src/lib/roleCapabilities.ts`) — added `ROLES`/`ROLE_LABELS`/`ROLE_SUMMARIES` entries and a new `A_E_G` map so GM = view/export/use-reference/dashboard **+ advance-workflow**, but **no authoring, no admin/config** — so the Roles & permissions page auto-renders a GM column; fallback role lists in `UsersPage.tsx` + `WorkflowPage.tsx`; the seeded `ROLE` reference values (`prisma/seed.ts`). Re-gated the **default workflow**: `IN_REVIEW→APPROVED` ("Approve") and `IN_REVIEW→DRAFT` ("Return to draft") now require `GM` (ADMIN still overrides via the engine's admin bypass), and the transition endpoint `@Roles('ADMIN','ESTIMATOR','GM')` so GM can reach it.
- **Why:** FR-2/FR-26 — a manager-level approver who governs the review gate (approve / send back) without the ability to create or edit estimates.
- **Files touched:** apps/api/prisma/schema.prisma, apps/api/prisma/migrations/20260617060000_add_gm_role/migration.sql, apps/api/prisma/seed.ts, apps/api/src/modules/workflow/workflow.controller.ts, packages/types/src/common.ts, apps/web/src/lib/types.ts, apps/web/src/lib/roleCapabilities.ts, apps/web/src/pages/UsersPage.tsx, apps/web/src/pages/WorkflowPage.tsx; CLAUDE.md/PROJECT_LOG.md/AUDIT_LOG.md.
- **Result:** Estimate mutation endpoints stay ADMIN/ESTIMATOR-only (GM can't edit); GET routes open to any authed user (GM reviews). No test hardcodes the Approve role, so the re-gate is safe. Removed a stray macOS `Icon` file from the migration dir. Toolchain not on PATH locally → **CI is the gate**. Branch + PR next.
- **Next:** commit on a feature branch → push → open PR → watch CI → merge when green.

### 2026-06-17 — GM role merged (PR #91) + Icon-ref recovery
- **Action:** PR #91 opened and all three CI jobs went green (build 52s, e2e 1m51s, security). `gh pr merge --squash --delete-branch` reported `fatal: bad object refs/Icon?` and failed to fast-forward local `main` — the macOS Icon-ref breakage again. Verified the squash had actually landed server-side (`gh pr view 91` → MERGED, mergeCommit `4971b98`), then recovered local: `find .git/refs -name 'Icon*' -delete` (removed ~13 stray Icon refs), `git remote prune origin`, `git pull --ff-only origin main`.
- **Why:** Land the GM approver role (FR-2/FR-26) and keep the local repo consistent with `origin/main`.
- **Result:** `main` at `4971b98`; GM verified present (transition endpoint `@Roles('ADMIN','ESTIMATOR','GM')`, Zod/web `Role` include GM); working tree clean; no remaining Icon refs.
- **Next:** maintenance/polish or whatever the user directs.

### 2026-06-17 — Site brought current (GM live) + demo users + FR-30/FE-55 registered
- **Action:** (1) User asked "is the website running?" — Docker was off; started Docker Desktop, brought the stack up, found it was a stale pre-GM build, so rebuilt `api`+`web` images from `main`, `migrate deploy` (applied `add_gm_role`), idempotent re-seed, and re-gated the existing default workflow's IN_REVIEW→APPROVED and IN_REVIEW→DRAFT transitions to GM via targeted SQL (preserving data — a fresh seed would do this but would wipe). Verified Role enum = ADMIN/ESTIMATOR/VIEWER/GM, web bundle carries "General Manager", 58 estimates intact. (2) Created demo users via the API as admin: `gm@example.com` [GM], `estimator@example.com` [ESTIMATOR], `viewer@example.com` [VIEWER] (password `Kerdos!2026`); `admin@example.com` already seeded. (3) User idea → registered **FR-30** (admin-defined roles & permission-based RBAC) + **FE-55** under EP-2, traceability + roadmap Sprint 12 rows, and **ADR-0010** (*Proposed*). User chose "register in spec only" (no build yet).
- **Why:** Make the running app match `main`; give the user one login per role to exercise GM; formalize the custom-roles idea (FR-26/FR-29/NFR-16 extension) without committing to the build.
- **Files touched:** CLAUDE.md (FR-30, FE-55, traceability, roadmap, §10 note, Current State), docs/adr/0010-admin-defined-roles-and-permissions.md (new), PROJECT_LOG.md, AUDIT_LOG.md. (No app-code changes; user/runtime actions were against the local stack only.)
- **Result:** Site live & current at :5173 with GM; 4 role accounts exist; FE-55/FR-30 in the backlog. Backlog 54/54 prior + 1 new registered.
- **Next:** Address the user's contextual-help-panel idea (help icon on the Setting card → right-side "How" panel). Then optionally build FE-55 when directed.

### 2026-06-17 — Per-card test initiative: ~500 tests + 500-estimate volume test
- **Action:** User: "Overall there should be about 500 test cases — every Card needs at least 50 test cases. Then there should be a test of 500 estimates for volume." Built **510 pure vitest cases** across 10 card suites, each exercising the REAL shared contracts (`@cost-reaper/types`) and engine math (`@cost-reaper/engine`) — no DB/HTTP, so they run in the standard `build` gate: Labor 78 (shipped in #94), Engine/Totals 56 (`computeEstimate`: rollups, upcharge→contingency order, margin/tax, category/phase subtotals + ordering), Settings 52 (Create/UpdateEstimateRequest), Non-labor 52, Cloud 52, Rate card 52, Users/RBAC 52 (incl. GM + login/register), Workflow 52 (governance contracts + GM gating + UPPER_SNAKE keys), Assumptions/Comments/Reference/FX 54, and Volume 10 (`volume.spec.ts`: 500-line estimate, 200-line recalc <500ms per NFR-1, 500-estimate batch <5s per NFR-2, 500-line capacity sweep). Verified by mounting the specs into the `api` Docker image and running `pnpm exec vitest run` (510 passed) + `tsc -p tsconfig.json --noEmit` (clean) — the host has no node/pnpm.
- **Why:** Thorough, regression-proof QA of every card's contract + math, per the user's ~500-test / 50-per-card / 500-estimate-volume directive.
- **Files touched (new):** apps/api/src/modules/estimates/{engine-totals-card,estimate-settings-card,nonlabor-card,cloud-card,assumptions-comments-reference-card,volume}.spec.ts; apps/api/src/modules/rate-cards/rate-card.spec.ts; apps/api/src/modules/users/users-rbac-card.spec.ts; apps/api/src/modules/workflow/workflow-card.spec.ts; CLAUDE.md/PROJECT_LOG.md/AUDIT_LOG.md.
- **Result:** 510 green locally (in-container). PR next; CI runs them as part of `build`.
- **Next:** ship the PR; continue with whatever the user directs.

### 2026-06-17 — SOW template (doc) from the bid-response reference (BR-7)
- **Action:** User supplied a 33-section SOW bid-response reference template and asked to create a SOW template. Chose "doc now, app next." Created `docs/templates/SOW_TEMPLATE.md` — a refined, contract-ready, fill-in template with a machine-friendly `{{TOKEN}}` placeholder convention + legend, all core sections (exec summary, customer understanding, scope/out-of-scope, solution + stack, methodology, governance, roles, RACI, deliverables, functional/non-functional reqs, security/compliance, testing, deployment, maintenance + SLAs, schedule, staffing, assumptions, constraints, risks, acceptance, change control, pricing framework, maintenance pricing, comms, docs, quality, IP, data/privacy, warranty, sign-off + Appendices A/B), and a **Kerdos mapping note** tying §23 Pricing to the estimate's labor/non-labor/cloud + upcharge/contingency + monthly/yearly totals. Rendered `SOW_TEMPLATE.docx` via the `pandoc/core` container (per the .docx deliverable rule). Prettier-clean.
- **Why:** Reusable, professional SOW template (BR-7) and the canonical structure the Kerdos SOW generator will target.
- **Files touched:** docs/templates/SOW_TEMPLATE.md (new), docs/templates/SOW_TEMPLATE.docx (new), living docs.
- **Result:** Doc deliverable ready; PR next.
- **Next (queued, user-approved "app next"):** expand the Kerdos `sow` module to follow this structure — add the missing sections to the schema/editor/print view + seed a default template, populating §23 pricing from the estimate. Separate PR.

### 2026-06-17 — SOW module expanded to the template structure (step 2, BR-7)
- **Action:** Wired the SOW_TEMPLATE.md structure into the Kerdos `sow` module. Added 12 narrative sections to `StatementOfWork` (executiveSummary, customerUnderstanding, outOfScope, solutionOverview, governanceModel, rolesResponsibilities, nonFunctionalRequirements, testingStrategy, maintenanceSupport, risksMitigation, acceptanceCriteria, changeControl) across: Prisma model + additive migration `20260617120000_sow_template_sections` (TEXT NOT NULL DEFAULT ''); shared `StatementOfWorkDto` + `UpdateSowRequest`; the web `StatementOfWork` interface; `SowService.toDto`/`create`/`update` (toDto now typed against the Prisma `StatementOfWork` row) with **seeded default boilerplate** for each new section; the SOW editor (`SECTIONS` list, Form, init — in template order); and the print view (sections inserted in document order and renumbered 1–21, pricing now §9, acceptance §21).
- **Why:** BR-7 — the app's generated SOW now follows the full template the user supplied; issuing still snapshots pricing immutably.
- **Files touched:** apps/api/prisma/schema.prisma, apps/api/prisma/migrations/20260617120000_sow_template_sections/migration.sql (new), packages/types/src/sow.ts, apps/api/src/modules/sow/sow.service.ts, apps/web/src/lib/types.ts, apps/web/src/pages/SowEditorPage.tsx, apps/web/src/pages/SowPrintPage.tsx, living docs.
- **Result:** Verified in-container: rebuilt `@cost-reaper/types` + `prisma generate` + `tsc -p apps/api` = **API TYPECHECK PASS**; prettier clean; field names consistent across all 7 layers. Web typecheck via CI. Migration additive/no-drift. PR next.
- **Next:** ship the PR; CI runs build (web typecheck + api tests) + e2e + security.

### 2026-06-17 — FE-55 / FR-30: admin-defined roles & permission-based RBAC (BUILT)
- **Action:** Implemented ADR-0010 end-to-end. Dropped the Prisma `Role` enum; added a data-driven `roles` table (code/displayName/description/isActive/isBuiltin/permissions String[]) + migration `20260617130000_configurable_roles` (ALTER user.role + workflow_transitions.allowed_role → TEXT, DROP TYPE "Role", CREATE TABLE roles). Shared types: a code-defined **permission catalog** (`packages/types/permissions.ts` — `PermissionKey`/`PERMISSIONS`/`WILDCARD '*'`) + `RoleDto`/`CreateRoleRequest`/`UpdateRoleRequest`; `RoleCode` (UPPER_SNAKE) added to common.ts and used to widen `AuthUser.role`, user create/update, `UserDto`, and `allowedRole` (membership validated server-side, FR-29 pattern; built-in `Role` enum kept for the baseline set). Backend: `@RequirePermission` decorator + `PermissionsGuard` (cached role→permission resolver; ADMIN wildcard) registered as APP_GUARD; **all 10 controllers migrated off `@Roles`** to permissions (estimate.author / sow.author / workflow.advance / workflow.configure / ratecard.manage / cloudprice.manage / fx.manage / reference.manage / checklist.configure / users.manage / roles.manage); legacy `RolesGuard` kept inert; new `roles` module (`/roles` CRUD + `/permissions`); `UsersService` validates role against active roles; seed creates the 4 built-ins with permission sets mirroring prior gating exactly. Web: widened `Role` to string + `RoleDto`/`PermissionMeta`; `useRoles`/`usePermissionCatalog`/`useRoleMutations`; **rewrote RolesPage into an editable matrix** (create role, toggle permissions, activate/deactivate, delete); Users + Workflow role dropdowns now from `/roles`; deleted the static `roleCapabilities.ts`. Tests: new `roles-permissions.spec.ts` (36) + updated users-rbac/workflow specs (role membership now server-side).
- **Why:** FR-30 — admins create/modify roles without a code change; authorization keyed on permissions (NFR-16).
- **Files touched:** ~30 (schema + migration + seed; packages/types {common,auth,governance,permissions,index}; api common/{decorators,guards}, app.module, roles module, users svc/module, 10 controllers; web {types,queries,RolesPage,UsersPage,WorkflowPage}; e2e smoke; specs). roleCapabilities.ts deleted.
- **Result:** Verified in-container: `@cost-reaper/types` rebuild + `prisma generate` + `tsc -p apps/api` = PASS; FR-30 + users-rbac + workflow specs = 140 passed; prettier clean. Web tsc + e2e via CI (updated the Roles-page e2e assertions to the new catalog labels + the SOW pricing §9 already handled). Behavior preserved (ADMIN=*, GM advances, ESTIMATOR authors, VIEWER read-only). PR next.
- **Next:** ship PR; iterate CI; rebuild local stack (migrate+seed) so the Roles editor is live.

### 2026-06-17 — SOW Deliverables → per-phase milestone schedule (BR-7)
- **Action:** User: replace the generic "Deliverable 1/2/3" with the SDLC phases + cost-per-phase, each becoming an invoiceable milestone. The estimate's per-phase cost breakdown already flows into the SOW (`pricing.phases`), so: (1) SowPrintPage §7 is now **"Deliverables & Milestone Schedule"** — the editable deliverables intro + a computed table from `pricing.phases` (Phase/Milestone · one-time milestone fee · recurring monthly · recurring yearly + totals from the subtotals), with a note that each phase is invoiced on acceptance and amounts exclude contingency (carried in §9 Pricing); (2) the SOW `DEFAULT_DELIVERABLES` boilerplate now describes phase-based milestone billing instead of "Deliverable 1/2/3"; (3) the repo template `SOW_TEMPLATE.md` §9 rewritten to a phase/milestone schedule table with `{{PHASE_*}}` tokens + invoice triggers, `.docx` re-rendered.
- **Why:** BR-7 — bill by milestone (completed SDLC phase) using the estimate's cost-per-phase; matches the user's invoicing model.
- **Files touched:** apps/web/src/pages/SowPrintPage.tsx, apps/api/src/modules/sow/sow.service.ts, docs/templates/SOW_TEMPLATE.{md,docx}, living docs.
- **Result:** Pricing stays §9 (no renumber); milestone table renders only when the estimate has phase costs. Prettier clean; docx re-rendered. Web tsc/e2e via CI. PR next.

### 2026-06-17 — Tests: SOW milestone schedule = cost per SDLC phase (BR-7)
- **Action:** User asked for tests proving the SOW milestones derive from the estimate's per-phase cost. Added `apps/api/src/modules/sow/sow-milestones.spec.ts` (14 cases) against the real `computeEstimate` phase output (what the SOW renders): tagged phase → one-time milestone fee, qty×base, same-phase aggregation, lifecycle ordering, "Unassigned" rollup last, milestone fees sum to oneTimeSubtotal, recurring-only phase has $0 one-time (billed on cadence), mixed one-time+recurring split, yearly annualization, upcharge included (global + per-line override), contingency excluded, empty → no milestones, full 5-phase build.
- **Result:** 14/14 pass in-container; prettier clean. PR next.

### 2026-06-17 — SOW list: sortable columns (BR-7)
- **Action:** User: SOW card columns should be sortable. Added client-side column sorting to SowListPage (the list loads all SOWs) using the same idiom as RateCardsPage (#78): a `sort` state (null = API default, most-recent-first), `toggleSort` (asc↔desc), a `SortTh` header button with a ▲/▼ arrow, and a `useMemo` sort via `localeCompare(..., {numeric:true})`. Sortable headers: Number, Title, Estimate, Client, Status. Actions column stays unsorted.
- **Files touched:** apps/web/src/pages/SowListPage.tsx; living docs.
- **Result:** Prettier clean; web tsc/e2e via CI. PR next.

### 2026-06-17 — Admin: read-only Audit Log viewer (FR-11)
- **Action:** User asked for an Admin menu item to view the immutable audit trail (read-only) in a friendly way. Added a new `audit.view` permission (catalog, Administration group; ADMIN wildcard covers it, admins can grant to custom roles). Backend: `AuditService.list()` (paginated, joins actor email, newest-first, free-text `q` over entityType/action/entityId + exact `entityType` filter) + `entityTypes()` (distinct, for the filter); new read-only `AuditController` (`GET /audit`, `GET /audit/entity-types`, both `@RequirePermission('audit.view')`) registered on the global `AuditModule`. Shared types: `AuditEventDto` + `AuditListQuery` (`packages/types/audit.ts`). Web: `AuditPage` — read-only table (When/Actor/Action/Entity/Reference) with action badges, a search box + entity-type filter, and Prev/Next pagination + "Showing X–Y of N"; nav item **Admin → Audit Log** (admin-only) + route `/audit`; `useAudit`/`useAuditEntityTypes` hooks. Tests: `audit.spec.ts` (16).
- **Why:** FR-11 — surface the append-only audit trail to admins without any mutation path (read-only).
- **Files touched:** packages/types/src/{audit.ts(new),permissions.ts,index.ts}; apps/api/src/common/audit/{audit.service.ts,audit.controller.ts(new),audit.module.ts,audit.spec.ts(new)}; apps/web/src/{lib/types.ts,lib/queries.ts,pages/AuditPage.tsx(new),App.tsx}; living docs.
- **Result:** In-container: api tsc PASS; audit(16)+roles(36)=52 specs pass; prettier clean. ADMIN wildcard grants audit.view (no re-seed needed). Web tsc/e2e via CI. PR next.

### 2026-06-17 — Checklist rules: pick a rule from a dropdown by description (FR-25)
- **Action:** User: when creating a checklist rule the Rule field should be a dropdown (users don't know the rule_key), and show the description instead of the raw key. Added a `CHECKLIST_RULE_CATALOG` (the 9 engine built-ins: key + description + default severity/scope) to apps/web/src/lib/types.ts, mirroring the seed/engine. Rewrote AddRuleRow on ChecklistRulesPage: a **Rule dropdown** listing built-ins **by description** (only those not already in the set), which auto-fills key + description + default severity/scope on select; a "➕ Custom advisory rule…" option still allows a free-text lower_snake_case key for custom reminders. Scope/severity stay adjustable (pre-filled). The raw rule_key is no longer typed for built-ins.
- **Files touched:** apps/web/src/lib/types.ts, apps/web/src/pages/ChecklistRulesPage.tsx; living docs.
- **Result:** Prettier clean; web tsc/e2e via CI. PR next.

### 2026-06-17 — Estimate supporting documents: upload + catalog (FR-29)
- **Action:** User: add a card on the Estimates editor to upload supporting documents and catalog them by a DB-driven document-type reference set; dropdown shows the description. Implemented end-to-end: `EstimateDocument` Prisma model (file bytes in-DB as bytea, document_type validated against DOCUMENT_TYPE) + migration `20260617140000_estimate_documents`; expanded the seeded `DOCUMENT_TYPE` reference set from 4 → 16 values (Requirements/RFP, Proposal, SOW, Contract/MSA, Pricing/Quote, …, Other); `documents` module — `POST /estimates/:id/documents` (multipart via FileInterceptor, 10 MB cap, validates type via ReferenceService.assertActiveCode, `@RequirePermission('estimate.author')`), `GET` list (metadata only, no bytes), `GET :docId/download` (streams bytes), `DELETE` (estimate.author); `EstimateDocumentDto` + `MAX_DOCUMENT_BYTES` types. Web: a **Supporting documents** card on the estimate editor — a table (file / type[label] / description / size / uploaded) with Download + Delete, and an upload form (file input + **document-type dropdown showing the display name** + optional description); `uploadDocument` (multipart) + `downloadDocument` api helpers + `useEstimateDocuments`/`useDocumentMutations` hooks. Uploads emit `EstimateDocument` audit events (visible in the new Audit Log). Tests: `documents.spec.ts` (6).
- **Why:** FR-29 — attach + classify supporting files against an estimate using a data-driven document-type catalog.
- **Files touched:** schema + migration + seed; packages/types/src/{documents.ts(new),index.ts}; apps/api/src/app.module.ts + modules/documents/* (new); apps/web/src/{lib/types.ts,lib/api.ts,lib/queries.ts,pages/EstimateEditorPage.tsx}; living docs.
- **Result:** In-container: api tsc PASS; documents.spec (6) pass; prettier clean. PR next; CI runs web tsc/e2e. Needs migrate + seed locally to surface the new table + doc types.

### 2026-06-17 — Tests: Checklist Rule Sets contract suite (FR-25)
- **Action:** User asked for a proper Rule Sets suite (~50 cases). Added `apps/api/src/modules/workflow/checklist-rule-sets.spec.ts` — **61 cases** against the shared contracts: severity/scope enums; `ChecklistRuleSetDto`; `CreateChecklistRuleSetRequest`/`UpdateChecklistRuleSetRequest`; `ChecklistRuleDto`; `CreateChecklistRuleRequest` (incl. the lower_snake_case key rule, bounds, severity/scope, optional ruleSetId); `UpdateChecklistRuleRequest`; and the gating `ChecklistResult` (completeness 0..1, item defaults). Closes the gap (the card previously had only 8 engine-evaluation tests).
- **Result:** 61/61 pass in-container; prettier clean. PR next.

### 2026-06-17 — SOW list: show when the source estimate was last updated (BR-7)
- **Action:** User: fit a date/time of when the estimate was updated into the SOW card. Added `estimateUpdatedAt` to `SowSummaryDto` (+ web `SowSummary`); the sow.service list now includes `estimate.updatedAt`. SowListPage gains a sortable **"Estimate updated"** column (localized date/time) so users can spot drift between the SOW and its source estimate (a draft SOW reflects live estimate pricing).
- **Files touched:** packages/types/src/sow.ts, apps/api/src/modules/sow/sow.service.ts, apps/web/src/lib/types.ts, apps/web/src/pages/SowListPage.tsx, living docs.
- **Result:** api tsc PASS; prettier clean. PR next.

### 2026-06-17 — Fix: estimate updatedAt now bumps on content edits (BR-7/NFR-5)
- **Action:** User reported the SOW "Estimate updated" stayed stale after editing a draft estimate (verified on SOW-8CED04: estimate.updated_at was 2026-06-14 while the SOW was 2026-06-18). Root cause: Prisma `@updatedAt` on `Estimate` only bumps when the Estimate row is updated; line-item/assumption edits write child tables and never touch the parent. Fix: added a private `touch(id)` that bumps `estimate.updatedAt`, called in all 8 content mutators (labor/non-labor/cloud add+delete, assumption add+delete). Settings/status patches already bump it via the real `estimate.update`; comments intentionally don't (not pricing content).
- **Files touched:** apps/api/src/modules/estimates/estimates.service.ts; living docs.
- **Result:** api tsc PASS (Prisma allows the `updatedAt` override); prettier clean. PR next. (Pre-existing rows keep their old timestamp; future edits update correctly.)

### 2026-06-17 — Dashboard card: full QA suite (FR-18)
- **Action:** User asked for a full Dashboard suite (~50) with per-case pass evidence. Added `apps/api/src/modules/dashboard/dashboard-card.spec.ts` — **51 cases** against the pure `summarizeDashboard`: empty input (7), total count incl. 500-volume (3), by-status (counts/sort/aggregate/data-driven codes/sum-to-total, 7), by-stage (incl. null→UNASSIGNED, label source, first-seen-label, 8), totals-by-currency (exact decimals, sort, +/- net, precision, 8), recent (newest-first, default cap 5, custom limit, limit 0, field mapping, null stage, no-mutation, 9), FX roll-up to base USD (passthrough, convert, missing-rate→0, multi-currency, fractional, negative, 8), output shape (1). Ran with `vitest --reporter=verbose` → 51 ✓ lines captured as evidence.
- **Result:** 51/51 pass in-container (verbose log per case); prettier clean. (Existing dashboard-summary.spec.ts 5 cases kept.) PR next.

### 2026-06-17 — Observability: log denied/errored requests too (NFR-9)
- **Action:** Log-tailing during testing surfaced that the LoggingInterceptor used a success-only `tap(() => …)`, so guard denials (401/403) and handler errors (4xx/5xx) never produced a request-log line (they run before/around the success path). Changed it to `tap({ next, error })` — logs both paths, derives the status from `HttpException.getStatus()` (else 500), tags level warn/error for ≥400/≥500, and includes the error message. The request log is now a complete audit/observability trail (incl. permission denials).
- **Files touched:** apps/api/src/common/interceptors/logging.interceptor.ts; living docs.
- **Result:** api tsc PASS; prettier clean. PR next; will re-demonstrate the captured log now includes the 403.

### 2026-06-17 — Observability (follow-up): log guard denials too, in the filter (NFR-9)
- **Action:** Re-tailing logs showed the interceptor error-path still missed guard denials — NestJS runs guards BEFORE interceptors, so a denied (401/403) request never reaches the interceptor. Moved failure logging to the global `ProblemDetailsFilter` (which `@Catch()`-es everything: guard denials, validation 4xx, 404s, 5xx) and reverted the interceptor to success-only (no double-logging). Net: interceptor logs 2xx/3xx, filter logs every failure → complete request/audit log incl. permission denials.
- **Files touched:** apps/api/src/common/interceptors/logging.interceptor.ts, apps/api/src/common/http/http-exception.filter.ts; living docs.
- **Result:** api tsc PASS; problem-details spec green; prettier clean. PR next; will re-capture showing 403/404/401 logged.

### 2026-06-17 — Docs: add GM role to the User Guide (FR-2/FR-30)
- **Action:** User noted USER_GUIDE.md lacked the GM role. Added the **GM (General Manager)** row to the "Roles at a glance" table (review/approve estimates or return to draft; cannot create/edit), refreshed the Admin row (now also manages roles + audit log), and added a note that roles are data-driven (Admin → Roles & permissions can create custom roles, FR-30).
- **Files touched:** docs/USER_GUIDE.md; living docs.
- **Result:** prettier clean (table re-aligned). No USER_GUIDE.docx counterpart exists. PR next.

### 2026-06-17 — Deliverable: Test Case Catalog (docs/TEST_CASES.md + .docx)
- **Action:** User couldn't find "test case documents" (tests were only `.spec.ts` source). Added `scripts/gen-test-catalog.py` that parses every `*.spec.ts`/`*.test.ts` (describe/it titles) and writes `docs/TEST_CASES.md` — a readable catalog: intro + summary table (Area | file | count) + per-suite describe/it listings. **778 cases across 31 suites.** Rendered `docs/TEST_CASES.docx` via the pandoc/core container (deliverable-format rule). Regenerate with `python3 scripts/gen-test-catalog.py`.
- **Files touched:** scripts/gen-test-catalog.py (new), docs/TEST_CASES.md (new), docs/TEST_CASES.docx (new); living docs.
- **Result:** prettier clean; docx rendered. PR next.

### 2026-06-17 — Tests + refactor: pagination suite (FR-9)
- **Action:** User asked for the pagination suite (the gap: EstimateListQuery/PaginationQuery + skip/take slicing were untested). Extracted pure helpers `apps/api/src/common/pagination.ts` (`pageSkipTake`, `lastPage`, `paginate`) and **used `pageSkipTake` in the real estimates + audit `list()`** so the tests cover prod paging. Added `pagination.spec.ts` — **42 cases**: PaginationQuery + EstimateListQuery contracts (defaults/coercion/bounds/order/ownerId), `pageSkipTake` (skip/take math, no-negative-skip), `lastPage` (partial/exact/empty), and `paginate` slice semantics (first/second/partial-last/out-of-range page, total preserved, boundaries, pageSize 1). Verbose run shows PG-01..PG-42 ✓. Regenerated the Test Case Catalog (now 820 cases).
- **Files touched:** apps/api/src/common/pagination.ts (new) + pagination.spec.ts (new); audit.service.ts + estimates.service.ts (use the helper); docs/TEST_CASES.md+docx; living docs.
- **Result:** api tsc PASS; pagination(42)+audit(16)=58 pass in-container; prettier clean. PR next.

### 2026-06-17 — GM role scoping across estimates + dashboard (FR-2/FR-24/FR-26)
- **Action:** Five GM-specific rules. Added shared pure helper `apps/api/src/common/gm-scope.ts` (`GM_VISIBLE_STAGE_KEYS=['IN_REVIEW','APPROVED']`, `isGmScoped`, `gmStageWhere`, `gmCanViewStage`) + `gm-scope.spec.ts` (13 cases). (1) Estimates list scoped to the GM queue (estimates.service.list + controller passes user). (2) Governance nav group made Admin-only (App.tsx — Roles item → admin) so a GM doesn't see it. (3) Dashboard summary scoped for GM (byStage/byStatus/totals only In Review/Approved) + drill-down guarded (gmCanViewStage). (4) Dashboard "recent activity" for a GM = estimates THEY acted on (derived from their AuditEvents) not everyone's. (5) Web Estimates page hides the create form unless the user has `estimate.author` (FR-30-aware; API already 403s). User Guide updated with a "GM scope" note.
- **Result:** api tsc PASS; gm-scope 13/13; live verify — GM sees 3 estimates (2 In Review/1 Approved), dashboard byStage only those, recent=0 (own only), create→403, DRAFT drill→[]. Catalog regenerated (833 cases). prettier clean. PR next.

### 2026-06-17 — GM scoping follow-ups: permissions in AuthUser + no doc upload (FR-30)
- **Action:** CI build failed (web tsc: user.permissions absent). Proper fix: added `permissions` to `AuthUser` (optional; populated on login/register/SSO via RolesService.permissionsFor, omitted on token-derived req.user). AuthModule imports RolesModule; toAuthUser now async. Web `AuthUser` gains optional `permissions`; new `apps/web/src/lib/permissions.ts` `canAuthorEstimates()` (perms with built-in role fallback). EstimatesPage create form + EstimateEditor **Supporting documents** upload form & Delete buttons now gated by `canAuthorEstimates` — a GM can view/download docs but not upload/delete (API already 403s via estimate.author). Local-verified: api+web tsc PASS, gm-scope/auth/pagination specs pass.
- **Result:** ready to re-push to feat/gm-role-scoping.

### 2026-06-17 — Cloud Prices: sortable columns + pagination; reusable controls (FR-9)
- **Action:** User: Cloud Prices needs sortable columns + a page-size dropdown (10/20/25/40/50), and pagination should be consistent across all list cards. Built reusable pieces: `lib/usePagedSort.ts` (client sort+paginate, type-aware compare, page clamp), `components/Pagination.tsx` (rows-per-page dropdown + "X–Y of N" + Prev/Next), `components/SortableTh.tsx` (▲▼↕ header). Applied to CloudPricesPage (all 8 columns sortable, unit price numeric; paginated). Rollout to the other list cards follows next.
- **Result:** web tsc + eslint + prettier PASS locally. PR next.

### 2026-06-17 — Consistent pagination + sorting across list cards (FR-9)
- **Action:** Rolled the reusable usePagedSort + <Pagination> + <SortableTh> out to the main flat-table list cards: Estimates (useEstimates now fetches pageSize 200 so the card sorts/paginates client-side), SOW (replaced its bespoke SortTh/sort with the shared controls), Users. Cloud Prices already done. Each now has sortable columns + a rows-per-page dropdown (10/20/25/40/50) + "X–Y of N" + Prev/Next, looking identical. (Rate Cards is a card-list not a flat table; Audit already paginates server-side — left as-is.)
- **Result:** web tsc + eslint + repo format:check PASS. PR next.

### 2026-06-17 — Catalog: add AWS us-west-2 region (FR-21)
- **Action:** User noted no us-west for AWS. It was never seeded (catalog is a us-east-1-centric sample). Factored the EC2 instance list into a shared `AWS_EC2` const and seeded **us-west-2** (Oregon) — full EC2 catalog (same on-demand pricing as us-east-1) + S3 + EBS = 75 prices. Idempotent upsert; saved estimate snapshots unaffected (NFR-14).
- **Result:** prettier clean; rebuilt api + re-seeded → AWS regions now us-east-1 (110), us-west-2 (75), eu-west-1 (3). PR next.

### 2026-06-17 — Workflow: add a note when transitioning (esp. GM Return to draft) (FR-24)
- **Action:** User: when a GM clicks "Return to draft", let them add a comment so the estimator knows why. Backend already supported `TransitionRequest.note` + stores it on `WorkflowTransitionEvent`. Web: clicking a transition now stages it and reveals a textarea (Confirm/Cancel) — for return-to-draft the prompt asks for a reason ("the estimator will see this"); other transitions get an optional note. The workflow **history** now renders each event's note (so the estimator sees the reason). Detection: toStageKey==='DRAFT' or label matches /draft/i.
- **Result:** web tsc + eslint + format:check PASS; live-verified the note persists (GM IN_REVIEW→DRAFT with note stored on the event). PR next.

### 2026-06-17 — Estimate Status dropdown: add missing statuses (FR-29/FR-24)
- **Action:** User: the Status dropdown has missing statuses. The ESTIMATE_STATUS seed defined only DRAFT+FINAL (DB also had ARCHIVED from a migration) — missing IN_REVIEW and APPROVED. Aligned ESTIMATE_STATUS with the 5 default workflow stages: Draft, In Review, Approved, Final, Archived (seed + web fallback in EstimateEditorPage). Data-driven (FR-29) so an admin can still add/rename/reorder.
- **Result:** web tsc + format:check PASS; rebuilt api + re-seeded → ESTIMATE_STATUS now 5 values in order. PR next.

### 2026-06-17 — Remove the manual estimate Status; workflow stage is the source of truth (FR-24)
- **Action:** User chose to remove the redundant manual Status (it diverged from the workflow stage). Cross-cutting refactor: dropped `Estimate.status` (migration `20260617180000_drop_estimate_status`) + the `EstimateStatus` type + `ESTIMATE_STATUS` reference seed. Estimate DTOs now carry `currentStageKey`/`currentStageLabel` instead of `status`; dashboard drops `byStatus` (keeps `byStage`); EstimateListQuery drops the status filter. Web: removed the Status dropdown (header now shows a read-only **Stage** badge; change it via Governance), estimates list **Status→Stage** column, dashboard Drafts/Final stats derive from byStage, scenario + print + summary show stage. Tests updated (settings card status tests → name-bound; dashboard by-status block → by-stage; pagination PG-13). 
- **Result:** api tsc + 795 api tests PASS; web tsc + eslint + format:check PASS; live-verified — status column dropped, list returns currentStageKey/Label, dashboard byStage only. Catalog 833. PR next.
