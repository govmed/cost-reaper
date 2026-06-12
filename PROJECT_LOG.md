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

<!-- Append new entries below this line -->
