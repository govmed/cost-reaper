# Build Prompt — Technology Project Cost Estimator (Production-Ready Web App)

> **What this is:** A complete, self-contained build brief you can hand to an AI coding agent (Claude Code, Cursor, etc.) or a development team. It defines the personas, the agile process, the full requirement set (business / functional / non-functional), the epics and features those requirements map to, the MVP scope, the reference architecture, and the exact setup/startup/documentation deliverables expected.
>
> **How to use it:** Paste Section 0 ("The Prompt") as your instruction to the agent, and keep Sections 1–18 in the repo as `/docs/PRODUCT_BRIEF.md` so the agent can reference requirement IDs (BR/FR/NFR), epics (EP), and features (FE) throughout the build. Anything labeled *(assumption)* can be overridden at kickoff.

---

## Table of Contents
0. The Prompt (paste this to your agent)
1. Product Vision & Context
2. Personas (delivery team + end users)
3. Agile Delivery Approach
4. Requirements (Business / Functional / Non-Functional)
5. Epics & Features
6. Traceability Matrix
7. MVP Definition & Scope
8. Post-MVP Roadmap
9. Reference Architecture & Tech Stack
10. Initial Data Model
11. API Design Guidelines
12. Environment Setup Scripts
13. Startup & Operational Scripts
14. Documentation Deliverables
15. Testing & Quality
16. Security & Compliance Guardrails
17. Global Definition of Done
18. Deliverables Checklist
- Appendix A: Sample User Stories with Acceptance Criteria

---

## 0. The Prompt

**Role.** You are an autonomous, cross-functional delivery team. You will internally adopt the personas defined in Section 2 (Product Owner, Architect, Backend/Frontend/Database Engineers, DevOps, QA, Security, UX, Technical Writer, Scrum Master) and produce work as each persona would.

**Mission.** Build a **production-ready web application** that estimates the cost of technology projects. The system must expose its own **REST API** and persist data in **PostgreSQL**. It must run on both **Linux and Windows** via scripted environment setup and startup. Deliver full documentation.

**Operating instructions.**
1. **Kickoff first.** Before writing code, restate your understanding, confirm or adjust the *(assumption)* items (tech stack, currency handling, auth model), and present the product backlog (epics → features → MVP stories) for confirmation. Do not gold-plate beyond the MVP in the first increment.
2. **Follow the agile approach in Section 3.** Work in increments. Deliver the **MVP (Section 7) first**, fully working and shippable, before any post-MVP feature.
3. **Honor the requirements in Section 4** and keep the **traceability** (Section 6) intact: every feature traces to a requirement; every requirement is covered by at least one feature.
4. **Every increment is shippable:** it builds clean, passes tests, has migrations, has updated docs, and can be brought up with a single setup script + single startup script on a clean machine.
5. **Quality gates are mandatory** (Section 15) and the **Global Definition of Done** (Section 17) applies to every story.
6. **Security guardrails (Section 16) are non-negotiable:** no secrets in source, parameterized queries only, hashed passwords, validated inputs.
7. **Produce all deliverables in Section 18,** including the cross-platform setup/startup scripts (Sections 12–13) and the documentation set (Section 14).
8. When you must make a decision not covered here, choose the simplest robust option, record it as an ADR (`/docs/adr/`), and continue.

**Output for each increment:** working code in the repo, passing test suite, updated migrations, updated docs, a short increment summary (what shipped, which FR/NFR it satisfies, how to run it), and the updated backlog.

---

## 1. Product Vision & Context

**Vision.** Give technology organizations a single, trustworthy tool to produce consistent, auditable cost estimates for projects — replacing scattered spreadsheets with a versioned, multi-user application that standardizes rate cards and estimation methods.

**Problem.** Estimates today are inconsistent, hard to audit, slow to produce, and trapped in personal spreadsheets. Assumptions get lost; numbers can't be defended or compared.

**Primary outcome.** A user can create a project, build a cost estimate from labor and non-labor line items using a shared rate card, apply a contingency, and export a professional summary — in minutes, with every assumption recorded.

**Out of scope (initially).** Full accounting/invoicing, payroll integration, time tracking, resource scheduling/capacity planning. These may be considered post-MVP but are not requirements.

---

## 2. Personas

### 2.1 Delivery Team Personas (the agent embodies these)

| Persona | Responsibility in this build |
|---|---|
| **Product Owner (PO)** | Owns backlog, prioritizes by business value, accepts/rejects stories against acceptance criteria, defends MVP scope. |
| **Scrum Master / Agile Coach** | Runs the cadence (Section 3), enforces DoR/DoD, removes blockers, keeps increments shippable. |
| **Business Analyst (BA)** | Maintains requirements (Section 4) and the traceability matrix; writes user stories and acceptance criteria. |
| **Solution Architect** | Owns reference architecture (Section 9), records ADRs, ensures NFRs are designed in, not bolted on. |
| **Backend Engineer** | Builds the API, business/estimation logic, persistence layer, migrations. |
| **Frontend Engineer** | Builds the web UI, state management, API integration, accessibility. |
| **Database Engineer / DBA** | Owns schema, indexing, migrations, seed data, backup/restore strategy. |
| **DevOps / Platform Engineer** | Owns Docker, setup/startup scripts, CI/CD, environments, health checks, observability. |
| **QA / Test Engineer** | Owns the test pyramid, automated suites, coverage targets, and the bug bar. |
| **Security Engineer** | Owns authn/authz, secrets, OWASP review, dependency scanning, the security guardrails. |
| **UX/UI Designer** | Owns flows, layout, component consistency, WCAG 2.1 AA compliance. |
| **Technical Writer** | Owns the documentation set (Section 14): README, architecture, API, runbooks, user guide. |

### 2.2 End-User Personas (who the product serves)

| Persona | Goal | Needs |
|---|---|---|
| **Pre-Sales Solutions Consultant** ("Priya") | Produce a defensible client estimate fast. | Fast authoring, clean export, scenario compare (post-MVP). |
| **Delivery / Project Manager** ("Marco") | Plan and re-baseline project cost. | Editable line items, versioning, assumptions log. |
| **Engineering Lead** ("Sam") | Provide accurate effort by role. | Role-based labor estimates, three-point estimation (post-MVP). |
| **Finance / Controller** ("Dana") | Trust and audit the numbers. | Rate-card governance, audit trail, exports. |
| **Administrator** ("Alex") | Govern users and reference data. | User management, rate-card management, categories. |

---

## 3. Agile Delivery Approach

**Framework.** Scrum-style increments with a Kanban-friendly flow. Short sprints; each ends in a shippable increment.

**Cadence.** Sprint 0 (foundation) → Sprints 1–2 (MVP) → Sprints 3+ (post-MVP roadmap, Section 8). Ceremonies: Sprint Planning, Daily progress note, Sprint Review (demo), Retrospective.

**Definition of Ready (DoR)** — a story may enter a sprint only if:
- It traces to a requirement ID (BR/FR/NFR) and an epic/feature.
- Acceptance criteria are written and testable.
- Dependencies and test data are identified.
- It is sized small enough to finish in one sprint.

**Definition of Done (DoD)** — see the **Global DoD** in Section 17 (applies to every story).

**Prioritization.** MoSCoW (Must/Should/Could/Won't) within the MVP; WSJF-style value vs. effort beyond MVP. MVP = "Must" only.

**Backlog hierarchy.** Theme → **Epic (EP)** → **Feature (FE)** → User Story → Task. IDs are stable and referenced in commits/PRs.

---

## 4. Requirements

> IDs are stable. Use them in code comments, commit messages, and the traceability matrix (Section 6).

### 4.1 Business Requirements (BR)

| ID | Business Requirement |
|---|---|
| **BR-1** | Produce consistent, repeatable cost estimates to reduce systematic under/over-estimation. |
| **BR-2** | Reduce the time required to produce a project estimate. |
| **BR-3** | Improve accuracy and auditability by recording assumptions and a change history for every estimate. |
| **BR-4** | Provide a single source of truth for estimates accessible to multiple stakeholders. |
| **BR-5** | Standardize estimation through governed, reusable rate cards and cost categories. |
| **BR-6** | Enable comparison of scenarios/options to support investment decisions. |
| **BR-7** | Generate professional, shareable outputs (reports/exports) for clients and internal approvals. |
| **BR-8** | Protect commercially sensitive financial data with appropriate access control and security. |
| **BR-9** | Run anywhere the team works (Linux and Windows) with low setup friction. |

### 4.2 Functional Requirements (FR)

| ID | Functional Requirement | Priority |
|---|---|---|
| **FR-1** | Users can register, log in, and log out; sessions are secured with tokens. | Must (MVP) |
| **FR-2** | The system supports roles (at minimum: Admin, Estimator/Editor, Viewer) controlling what each user can do. | Must (MVP) |
| **FR-3** | Admins can manage a **rate card**: named roles with hourly/daily rates and a currency. | Must (MVP) |
| **FR-4** | Users can create, view, edit, clone, and delete **projects/estimates** they are authorized for. | Must (MVP) |
| **FR-5** | Users can add **labor line items** (role × quantity × hours/days × rate) to an estimate. | Must (MVP) |
| **FR-6** | Users can add **non-labor line items** (fixed costs and recurring costs: licenses, infrastructure, third-party services). | Must (MVP) |
| **FR-7** | The system calculates line totals, category subtotals, a **contingency %**, and a grand total in the estimate's currency. | Must (MVP) |
| **FR-8** | Users can record free-text **assumptions and notes** on each estimate. | Must (MVP) |
| **FR-9** | Users can **list, search, and filter** their estimates (by name, status, owner, date). | Must (MVP) |
| **FR-10** | Users can **export** an estimate summary (CSV at minimum for MVP; PDF post-MVP). | Must (MVP) |
| **FR-11** | The system records a basic **audit trail** (who created/last-modified, timestamps). | Must (MVP) |
| **FR-12** | The system exposes a documented **REST API** (OpenAPI) for all estimate operations. | Must (MVP) |
| **FR-13** | Users can apply **three-point / PERT estimation** (optimistic, most likely, pessimistic) per line item. | Should (Post-MVP) |
| **FR-14** | Users can create and **compare multiple scenarios** for the same project. | Should (Post-MVP) |
| **FR-15** | The system supports **versioning/baselines** of an estimate with diff/history view. | Should (Post-MVP) |
| **FR-16** | Users can apply **margin/markup and tax** options to produce a client-facing price. | Could (Post-MVP) |
| **FR-17** | Admins can manage **cost categories** and **multiple currencies / FX rates**. | Could (Post-MVP) |
| **FR-18** | A **dashboard** summarizes estimates (counts, totals, recent activity). | Could (Post-MVP) |
| **FR-19** | Users can **collaborate** (comments, sharing per estimate). | Could (Post-MVP) |
| **FR-20** | Export to **branded PDF and Excel**. | Should (Post-MVP) |

### 4.3 Non-Functional Requirements (NFR)

| ID | Non-Functional Requirement | Target |
|---|---|---|
| **NFR-1 Performance** | Typical API read responses < 300 ms p95; estimate recalculation < 500 ms p95 for an estimate of ≤ 200 line items. |
| **NFR-2 Scalability** | Stateless API; horizontally scalable behind a load balancer; DB connection pooling. Support 100 concurrent users without degradation. |
| **NFR-3 Availability/Reliability** | Graceful error handling; health and readiness endpoints; no data loss on restart; idempotent migrations. |
| **NFR-4 Security** | OWASP Top 10 mitigations; hashed passwords (argon2/bcrypt); JWT with refresh; TLS in production; secrets via env/secret store only; dependency scanning in CI. |
| **NFR-5 Data Integrity** | All schema changes via versioned migrations; FK constraints; monetary values stored as exact decimals (never floats); documented backup/restore. |
| **NFR-6 Maintainability** | Layered architecture; linting + formatting enforced; ≥ 80% backend unit-test coverage on business logic; typed code. |
| **NFR-7 Portability** | Runs on Linux and Windows via scripts; fully containerized with Docker; reproducible builds. |
| **NFR-8 Usability/Accessibility** | WCAG 2.1 AA; keyboard navigable; responsive; clear validation messages. |
| **NFR-9 Observability** | Structured logging with correlation IDs; basic metrics; health checks; meaningful error responses (RFC 7807 problem+json). |
| **NFR-10 Configurability** | All environment-specific values via env vars; documented `.env.example`; no hardcoded URLs/credentials. |
| **NFR-11 Compliance/Privacy** | Minimal PII (account data only); right-to-delete account; audit timestamps in UTC. |
| **NFR-12 Documentation** | Complete docs per Section 14, kept current each increment. |
| **NFR-13 Internationalization** | Currency-aware formatting; UTC storage with localized display; copy externalized to ease future i18n. |

---

## 5. Epics & Features

| Epic | Description | Features |
|---|---|---|
| **EP-1 Platform Foundation & DevOps** | Repo, containers, CI/CD, scripts, config. | FE-1 Cross-platform setup scripts · FE-2 Docker/compose stack · FE-3 CI pipeline (lint/test/build) · FE-4 Config & secrets handling · FE-5 Health/readiness endpoints |
| **EP-2 Identity & Access Management** | Auth and roles. | FE-6 Register/login/logout · FE-7 JWT access+refresh · FE-8 Role-based authorization · FE-9 Password hashing & policy |
| **EP-3 Reference Data Management** | Rate cards & categories. | FE-10 Rate-card CRUD (roles+rates+currency) · FE-11 Cost categories · FE-12 Multi-currency/FX *(post-MVP)* |
| **EP-4 Estimate Authoring (Core)** | Create and manage estimates. | FE-13 Estimate CRUD + clone · FE-14 Labor line items · FE-15 Non-labor line items · FE-16 Assumptions/notes |
| **EP-5 Estimation Engine** | Calculations. | FE-17 Line/category/grand totals · FE-18 Contingency % · FE-19 Three-point/PERT *(post-MVP)* · FE-20 Margin & tax *(post-MVP)* |
| **EP-6 Reporting & Export** | Outputs. | FE-21 CSV export (MVP) · FE-22 PDF/Excel export *(post-MVP)* · FE-23 Printable summary view |
| **EP-7 Scenario & Version Mgmt** | Compare & baseline. | FE-24 Scenarios *(post-MVP)* · FE-25 Versioning/baselines + diff *(post-MVP)* |
| **EP-8 Dashboard, Search & Collaboration** | Find & work together. | FE-26 List/search/filter (MVP) · FE-27 Dashboard *(post-MVP)* · FE-28 Comments/sharing *(post-MVP)* |
| **EP-9 Observability, Security & Compliance** | Run safely. | FE-29 Structured logging + correlation IDs · FE-30 Audit trail · FE-31 Security hardening/OWASP · FE-32 Backup/restore |
| **EP-10 Documentation & Onboarding** | Make it usable. | FE-33 README/quickstart · FE-34 Architecture + ADRs · FE-35 API docs (OpenAPI/Swagger UI) · FE-36 User guide · FE-37 Runbook/deploy guide |

---

## 6. Traceability Matrix

| Requirement | Covered by Epic(s) | Key Feature(s) |
|---|---|---|
| BR-1, BR-5 | EP-3, EP-5 | FE-10, FE-17, FE-18 |
| BR-2 | EP-4, EP-8 | FE-13, FE-26 |
| BR-3 | EP-4, EP-9 | FE-16, FE-30 |
| BR-4 | EP-2, EP-4 | FE-8, FE-13 |
| BR-6 | EP-7 | FE-24, FE-25 |
| BR-7 | EP-6 | FE-21, FE-22, FE-23 |
| BR-8 | EP-2, EP-9 | FE-8, FE-31 |
| BR-9 | EP-1 | FE-1, FE-2 |
| FR-1, FR-2 | EP-2 | FE-6, FE-7, FE-8 |
| FR-3 | EP-3 | FE-10 |
| FR-4 | EP-4 | FE-13 |
| FR-5, FR-6 | EP-4 | FE-14, FE-15 |
| FR-7 | EP-5 | FE-17, FE-18 |
| FR-8 | EP-4 | FE-16 |
| FR-9 | EP-8 | FE-26 |
| FR-10 | EP-6 | FE-21 |
| FR-11 | EP-9 | FE-30 |
| FR-12 | EP-1, EP-10 | FE-35 |
| FR-13–FR-20 | EP-3/5/6/7/8 | FE-12,19,20,22,24,25,27,28 |
| NFR-1,2,3 | EP-1, EP-9 | FE-2, FE-5, FE-29 |
| NFR-4,11 | EP-2, EP-9 | FE-7, FE-9, FE-31 |
| NFR-5 | EP-3/4, EP-9 | FE-13, FE-32 |
| NFR-6,7,10 | EP-1 | FE-1, FE-2, FE-3, FE-4 |
| NFR-8 | EP-4/8 | FE-13, FE-26 |
| NFR-9 | EP-9 | FE-29, FE-5 |
| NFR-12 | EP-10 | FE-33–FE-37 |

**Rule:** No feature ships without a requirement; no Must-have requirement ships without a feature and a passing test.

---

## 7. MVP Definition & Scope

The MVP is the smallest end-to-end product that lets an Estimator log in, build a real estimate from a shared rate card, calculate it with contingency, save/search it, and export it — all installable and runnable on Linux/Windows with one command.

**In MVP (Must):**
- EP-1 fully (setup/startup scripts, Docker+PostgreSQL, CI, health checks, config).
- EP-2: register/login/logout, JWT, Admin/Estimator/Viewer roles, hashed passwords. *(FR-1, FR-2)*
- EP-3: rate-card CRUD with roles, rates, currency. *(FR-3)*
- EP-4: estimate CRUD + clone, labor & non-labor line items, assumptions/notes. *(FR-4, FR-5, FR-6, FR-8)*
- EP-5: line/category/grand totals + contingency %. *(FR-7)*
- EP-6: CSV export + printable summary. *(FR-10)*
- EP-8: list/search/filter estimates. *(FR-9)*
- EP-9: basic audit trail + structured logging. *(FR-11)*
- EP-10: README/quickstart, OpenAPI/Swagger, architecture overview, user guide. *(FR-12, NFR-12)*

**Explicitly deferred (Post-MVP):** PERT (FR-13), scenarios (FR-14), versioning (FR-15), margin/tax (FR-16), multi-currency (FR-17), dashboard (FR-18), collaboration (FR-19), PDF/Excel (FR-20).

**MVP acceptance:** a clean machine can run `setup` then `start`, a seeded Admin can create a rate card, an Estimator can build and export an estimate, and the API docs are live — all green in CI.

---

## 8. Post-MVP Roadmap (suggested increments)

| Sprint | Theme | Features | Requirements |
|---|---|---|---|
| 3 | Better estimation | FE-19 PERT, FE-20 margin/tax | FR-13, FR-16 |
| 4 | Decisions | FE-24 scenarios, FE-25 versioning/diff | FR-14, FR-15 |
| 5 | Professional outputs | FE-22 PDF/Excel, FE-27 dashboard | FR-18, FR-20 |
| 6 | Scale & govern | FE-12 multi-currency, FE-28 collaboration, FE-32 backup/restore hardening | FR-17, FR-19, NFR-5 |

Re-prioritize at each review with the PO; the table is a default, not a contract.

---

## 9. Reference Architecture & Tech Stack *(assumption — confirm at kickoff)*

**Shape:** Single-page web client → REST API → PostgreSQL. Stateless API, containerized, layered (routes → services → repositories → DB).

**Recommended stack (defensible default; swap if you prefer):**
- **Frontend:** React + TypeScript + Vite; a component library (e.g., MUI or shadcn/ui); React Query for data fetching.
- **Backend:** Python **FastAPI** + Pydantic v2; **SQLAlchemy 2.0** ORM; **Alembic** migrations. *(Equally acceptable: Node.js + TypeScript + NestJS + Prisma — pick one and record an ADR.)*
- **Database:** PostgreSQL 16. Monetary values as `NUMERIC(18,4)`.
- **Auth:** JWT (short-lived access + refresh), argon2 password hashing.
- **Packaging:** Docker + docker-compose (services: `db`, `api`, `web`).
- **CI/CD:** GitHub Actions (lint → test → build → image).
- **Observability:** structured JSON logs + correlation IDs; `/health` and `/ready`.

**Repository layout (suggested):**
```
/                      repo root
  /backend             API, services, models, migrations, tests
  /frontend            web client
  /scripts             setup.sh, setup.ps1, start.sh, start.ps1, stop.*, test.*, seed.*
  /docs                README links, ARCHITECTURE.md, API.md, DATABASE.md, RUNBOOK.md, USER_GUIDE.md, adr/
  docker-compose.yml
  .env.example
  Makefile             convenience targets (optional, Linux/macOS)
  README.md
```

---

## 10. Initial Data Model (MVP)

Entities (the agent finalizes columns/constraints):

- **User** (id, email, password_hash, role[ADMIN|ESTIMATOR|VIEWER], created_at, updated_at)
- **RateCard** (id, name, currency, is_active, created_by, timestamps)
- **RateCardRole** (id, rate_card_id→RateCard, role_name, unit[HOUR|DAY], rate `NUMERIC(18,4)`)
- **Estimate** (id, name, description, status[DRAFT|FINAL], currency, contingency_percent `NUMERIC(5,2)`, rate_card_id→RateCard, owner_id→User, created_at, updated_at)
- **LaborLineItem** (id, estimate_id→Estimate, rate_card_role_id→RateCardRole, quantity, units `NUMERIC`, rate_snapshot `NUMERIC(18,4)`, line_total `NUMERIC(18,4)`)
- **NonLaborLineItem** (id, estimate_id→Estimate, category, description, type[FIXED|RECURRING], amount `NUMERIC(18,4)`, periods, line_total `NUMERIC(18,4)`)
- **Assumption** (id, estimate_id→Estimate, text, created_at)
- **AuditEvent** (id, entity_type, entity_id, action, actor_id→User, occurred_at)

**Notes:** store a **rate snapshot** on labor lines so historical estimates are immutable even if the rate card changes (supports BR-3/NFR-5). All timestamps UTC. FK constraints required.

---

## 11. API Design Guidelines

- RESTful resources: `/api/v1/auth`, `/users`, `/rate-cards`, `/rate-cards/{id}/roles`, `/estimates`, `/estimates/{id}/labor-items`, `/estimates/{id}/non-labor-items`, `/estimates/{id}/assumptions`, `/estimates/{id}/export`.
- Consistent JSON; pagination on list endpoints; filtering/sorting query params.
- **OpenAPI** auto-generated; **Swagger UI** served at `/docs`.
- Errors as **RFC 7807** problem+json with stable error codes.
- Versioned (`/api/v1`). Auth via `Authorization: Bearer`. Validate all inputs server-side.
- Idempotent, parameterized DB access only (no string-built SQL).

---

## 12. Environment Setup Scripts

Provide **cross-platform** setup that takes a clean machine to a running, seeded app. Two entry points with identical behavior:
- `scripts/setup.sh` (Linux/macOS, bash)
- `scripts/setup.ps1` (Windows, PowerShell)

**Each setup script must:**
1. Check prerequisites (Docker + Docker Compose; or Node/Python if running natively) and print clear, actionable messages if missing.
2. Create `.env` from `.env.example` if absent (never overwrite an existing `.env`).
3. Build images / install dependencies.
4. Start PostgreSQL (via `docker-compose up -d db`) and wait for it to be healthy.
5. Run database **migrations**.
6. **Seed** baseline data (one Admin user from env-provided credentials, a sample rate card, sample categories).
7. Print next steps and the local URLs (web, API, Swagger).
8. Be **idempotent** (safe to re-run) and exit non-zero on failure.

**`.env.example` (illustrative — the agent completes it):**
```
# Database
POSTGRES_USER=estimator
POSTGRES_PASSWORD=change_me
POSTGRES_DB=cost_estimator
DATABASE_URL=postgresql://estimator:change_me@db:5432/cost_estimator

# API
API_PORT=8000
JWT_SECRET=change_me_long_random
ACCESS_TOKEN_TTL_MIN=15
REFRESH_TOKEN_TTL_DAYS=7

# Seed admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=change_me

# Frontend
WEB_PORT=5173
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 13. Startup & Operational Scripts

Provide matching pairs (bash + PowerShell), each idempotent and clearly logging:
- `start.sh` / `start.ps1` — bring up the full stack (`db`, `api`, `web`) and print URLs.
- `stop.sh` / `stop.ps1` — stop the stack cleanly.
- `test.sh` / `test.ps1` — run backend + frontend test suites.
- `migrate.sh` / `migrate.ps1` — apply/rollback migrations.
- `seed.sh` / `seed.ps1` — (re)seed reference data.
- `logs.sh` / `logs.ps1` — tail service logs.
- *(Optional)* `Makefile` with `make setup`, `make up`, `make down`, `make test` for Linux/macOS convenience.

All scripts must succeed on a clean checkout with only Docker installed, and fail loudly with a helpful message otherwise.

---

## 14. Documentation Deliverables

| File | Contents |
|---|---|
| `README.md` | Project intro, prerequisites, **one-command quickstart** (setup → start), URLs, common commands, troubleshooting. |
| `docs/ARCHITECTURE.md` | System diagram, components, data flow, technology choices, how NFRs are met. |
| `docs/adr/` | Architecture Decision Records (stack choice, auth model, money type, etc.). |
| `docs/API.md` + Swagger UI | How to authenticate and call the API; link to live `/docs`. |
| `docs/DATABASE.md` | ERD, table descriptions, migration & backup/restore instructions. |
| `docs/USER_GUIDE.md` | Step-by-step for end users: create rate card → build estimate → export. |
| `docs/RUNBOOK.md` / `docs/DEPLOYMENT.md` | Environments, config, deploy steps, health checks, rollback, backup/restore. |
| `docs/PRODUCT_BRIEF.md` | This document (requirements, epics, traceability) kept current. |
| `CONTRIBUTING.md` | Branching, commits referencing FR/FE IDs, code style, test expectations. |
| `CHANGELOG.md` | Per-increment summary of what shipped. |

---

## 15. Testing & Quality

- **Test pyramid:** unit (services/estimation engine) → integration (API + DB) → a few end-to-end smoke tests of the critical path (login → create estimate → export).
- **Coverage:** ≥ 80% on backend business logic (NFR-6).
- **Estimation engine** has exhaustive unit tests (rounding, contingency, currency, large estimates) — this is the heart of the product.
- **Quality gates in CI:** lint, format check, type check, tests, build, dependency vulnerability scan. PRs blocked on red.
- **Bug bar:** no known data-corruption or auth-bypass bugs may ship.

---

## 16. Security & Compliance Guardrails (non-negotiable)

- No secrets in source control; everything via env/secret store (NFR-4, NFR-10).
- Passwords hashed with argon2/bcrypt; never stored or logged in plaintext.
- JWT access+refresh; sensible TTLs; reject tampered/expired tokens.
- Role checks enforced server-side on every protected endpoint (FR-2).
- Parameterized queries only; validate and sanitize all inputs; output-encode in UI.
- OWASP Top 10 review before MVP sign-off; TLS in production.
- Audit trail for create/modify on estimates and rate cards (FR-11).
- Minimal PII; UTC timestamps; account deletion path (NFR-11).

---

## 17. Global Definition of Done

A story is **Done** only when:
1. Code merged to main, traced to a requirement/feature ID.
2. Unit + integration tests written and passing; coverage target met.
3. Migrations included and reversible; seed data updated if needed.
4. API documented in OpenAPI; user-facing docs updated.
5. Lint/format/type/security gates green in CI.
6. Accessibility checks pass for any new UI (NFR-8).
7. The increment runs end-to-end via `setup` + `start` on a clean Linux **and** Windows environment.
8. Demoable against its acceptance criteria and accepted by the PO.

---

## 18. Deliverables Checklist

- [ ] Confirmed backlog (epics → features → MVP stories) presented at kickoff.
- [ ] Running app: web client + REST API + PostgreSQL, containerized.
- [ ] `scripts/setup.{sh,ps1}` and `start/stop/test/migrate/seed/logs.{sh,ps1}` — cross-platform, idempotent.
- [ ] `.env.example` complete; no secrets committed.
- [ ] Database schema + migrations + seed (Admin, sample rate card/categories).
- [ ] OpenAPI spec + live Swagger UI at `/docs`.
- [ ] Health/readiness endpoints + structured logging.
- [ ] Test suites passing in CI with coverage report.
- [ ] Documentation set per Section 14.
- [ ] MVP acceptance met (Section 7); post-MVP roadmap in backlog.

---

## Appendix A — Sample User Stories with Acceptance Criteria (MVP)

**US-1 (FR-1, FE-6) — Log in.**
*As an Estimator, I want to log in so that I can access my estimates.*
- Given valid credentials, when I submit, then I receive an access + refresh token and land on the estimates list.
- Given invalid credentials, when I submit, then I get a 401 with a clear message and no token.
- Passwords are verified against an argon2/bcrypt hash; failures are logged without revealing which field was wrong.

**US-2 (FR-3, FE-10) — Manage rate card.**
*As an Admin, I want to define roles and rates so estimators use governed numbers.*
- I can create a rate card with a name and currency.
- I can add roles with a unit (hour/day) and rate stored as exact decimal.
- Estimators can select but not edit rate cards.

**US-3 (FR-4/5/7, FE-13/14/17/18) — Build and calculate an estimate.**
*As an Estimator, I want to add labor lines and see totals so I can produce an estimate.*
- I create an estimate tied to a rate card and currency.
- Adding a labor line (role × quantity × units) computes a line total using a rate snapshot.
- Category subtotals, a contingency %, and a grand total update correctly and are rounded consistently.
- Changing the rate card later does not alter saved line snapshots.

**US-4 (FR-9, FE-26) — Find estimates.**
*As an Estimator, I want to search and filter estimates so I can find my work.*
- The list paginates and supports filtering by name, status, and date.
- A Viewer sees only estimates they're authorized to view.

**US-5 (FR-10, FE-21/23) — Export.**
*As an Estimator, I want to export an estimate so I can share it.*
- I can download a CSV containing line items, subtotals, contingency, and grand total.
- A printable summary view renders the same figures.

*(The team extends this appendix per sprint; every new story must carry an ID, trace to a requirement/feature, and include testable acceptance criteria.)*
