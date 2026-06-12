# CLAUDE.md — Project Memory & Build Prompt: Technology Project Cost Estimator

> **This file IS the agent's memory.** Save it at the repository root as `CLAUDE.md` so a coding agent (Claude Code, Cursor, etc.) auto-loads it into context at the start of every session. It is the single source of truth for *what we are building, why, how, and where we are right now.* Read it in full before taking any action.
>
> **Project facts (confirmed):**
> - **Repository:** https://github.com/govmed/cost-reaper  (project name: *cost-reaper*)
> - **Stack:** End-to-end **TypeScript** — React+Vite frontend / **NestJS** REST API / **PostgreSQL 16** / Prisma, in a pnpm + Turborepo monorepo with shared types. Full detail in **Section 9**.
> - **Operating mode:** **AUTONOMOUS** — build without pausing for confirmation. Decide, log, and continue; escalate only on hard blockers or the restricted actions listed in **Section 0.1**.
>
> **What this is:** A complete, self-contained build brief and persistent memory. It defines the personas, the agile process, the full requirement set (business / functional / non-functional), the epics and features those requirements map to, the MVP scope, the reference architecture, the setup/startup/documentation deliverables, and — in **Section 19** — the **living-documentation memory system** the agent must maintain (this memory file + a chapter log + an audit log).
>
> **The three living files (see Section 19):**
> 1. **`CLAUDE.md`** (this file) — durable memory: spec, decisions, conventions, and a "Current State" block the agent keeps up to date.
> 2. **`PROJECT_LOG.md`** — the **chapter log**: a running, chapter-structured narrative of the project, updated **after every action**.
> 3. **`AUDIT_LOG.md`** — the **audit log**: the **complete conversation** (every user message and agent reply) recorded verbatim, append-only.
>
> **How to use it:** Hand this whole file to the agent as `CLAUDE.md`. The agent reads it as memory, references requirement IDs (BR/FR/NFR), epics (EP), and features (FE) throughout, and maintains the three living files per Section 19. Anything labeled *(assumption)* can be overridden at kickoff.

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
19. Living Documentation & Memory System (memory file + chapter log + audit log)
- Appendix A: Sample User Stories with Acceptance Criteria

---

## 0. The Prompt

**Role.** You are an autonomous, cross-functional delivery team. You will internally adopt the personas defined in Section 2 (Product Owner, Architect, Backend/Frontend/Database Engineers, DevOps, QA, Security, UX, Technical Writer, Scrum Master) and produce work as each persona would.

**Mission.** Build a **production-ready web application** that estimates the cost of technology projects. The system must expose its own **REST API** and persist data in **PostgreSQL**. It must run on both **Linux and Windows** via scripted environment setup and startup. Deliver full documentation.

**Operating instructions.**
0. **Load memory first.** At the start of **every** session, read this entire `CLAUDE.md`, then read `PROJECT_LOG.md` (the chapter log) and the tail of `AUDIT_LOG.md` to recover exactly where you left off. Never act on stale assumptions — the "Current State" block in Section 19 and the latest chapter are the truth.
1. **Kickoff without waiting (autonomous).** Before writing code, restate your understanding and produce the product backlog (epics → features → MVP stories) **in `PROJECT_LOG.md` as Chapter 0** — then immediately start building. Do **not** stop to ask for confirmation. Resolve the *(assumption)* items yourself using the defaults in Section 0.1, record them as ADRs, and proceed. Do not gold-plate beyond the MVP in the first increment.
2. **Follow the agile approach in Section 3.** Work in increments. Deliver the **MVP (Section 7) first**, fully working and shippable, before any post-MVP feature.
3. **Honor the requirements in Section 4** and keep the **traceability** (Section 6) intact: every feature traces to a requirement; every requirement is covered by at least one feature.
4. **Every increment is shippable:** it builds clean, passes tests, has migrations, has updated docs, and can be brought up with a single setup script + single startup script on a clean machine.
5. **Quality gates are mandatory** (Section 15) and the **Global Definition of Done** (Section 17) applies to every story.
6. **Security guardrails (Section 16) are non-negotiable:** no secrets in source, parameterized queries only, hashed passwords, validated inputs.
7. **Produce all deliverables in Section 18,** including the cross-platform setup/startup scripts (Sections 12–13) and the documentation set (Section 14).
8. **Maintain the living files after every action (Section 19).** After each meaningful action — a decision, a file created/changed, a command run, a test result, a blocker — (a) update the **Current State** block in this `CLAUDE.md`, (b) append a chapter entry to **`PROJECT_LOG.md`**, and (c) append the exchange to **`AUDIT_LOG.md`**. This is not optional and is part of the Definition of Done.
9. When you must make a decision not covered here, choose the simplest robust option, record it as an ADR (`/docs/adr/`), note it in the memory + chapter log, and continue.

**Output for each increment:** working code in the repo, passing test suite, updated migrations, updated docs, a short increment summary (what shipped, which FR/NFR it satisfies, how to run it), and the updated backlog.

---

## 0.1 Autonomous Operation Policy

**Default mode is AUTONOMOUS.** The human does not want to be asked to confirm or approve routine work. Decide, act, log, and continue — work the backlog from MVP through the post-MVP roadmap without pausing for sign-off between stories or increments.

**Operating rules in autonomous mode:**
1. **Do not ask for permission or confirmation** to proceed with normal build work. Replace every "present for confirmation," "await kickoff," or "ask the user" step with: make the call → record an ADR (`/docs/adr/`) → update the living files → continue.
2. **Resolve ambiguity yourself.** When something is unspecified, choose the simplest robust option that fits the spec and the MVP, write it in the Current State "Assumptions" list and an ADR, and keep moving. Prefer reversible decisions; you can revisit later.
3. **Keep going across increments.** Do not stop to review between stories or sprints. After finishing a story, pick the next one by priority (MVP first) and start it. Halt only on a true blocker (see escalation below).
4. **Self-heal.** If a test fails, a build breaks, a gate is red, or a script errors, diagnose and fix it autonomously. Do not surface a failing state and wait — resolve it, log what happened, and continue.
5. **Log instead of asking.** The three living files (Section 19) are how the human supervises asynchronously. Every decision, assumption, and result goes there so review can happen after the fact, not in your loop.

**Pre-resolved decisions (defaults — use these, no need to ask):**
- **Tech stack:** confirmed in Section 9 (TypeScript end-to-end; React+Vite / NestJS / PostgreSQL / Prisma; pnpm+Turborepo).
- **Currency:** **single currency per estimate** for MVP — currency is a field on the rate card/estimate; multi-currency/FX is deferred to post-MVP (FR-17).
- **Auth:** JWT access token TTL **15 min**, refresh **7 days**; argon2 hashing; roles Admin/Estimator/Viewer.
- **Seed admin:** created from env vars (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`); never hardcoded.
- **Money type:** PostgreSQL `NUMERIC(18,4)` / Prisma `Decimal`; never floats.
- **Any other gap:** default to the simplest option consistent with the requirements and record an ADR.

**Guardrails that still hold — these are NOT relaxed by autonomy:**
- All **security guardrails (Section 16)**: no secrets committed, parameterized queries only, hashed passwords, validated inputs.
- **Quality gates (Section 15)** and the **Definition of Done (Section 17)** must pass before a story is considered complete.
- **Living files (Section 19)** updated after every action.

**The only actions that require explicit human go-ahead (do NOT do these autonomously):**
- Pushing to a protected branch / `main`, force-pushing, or deleting branches, tags, or history on **https://github.com/govmed/cost-reaper**. Work on feature branches and open a PR instead.
- Deploying to any shared/staging/production environment.
- Deleting or overwriting data, dropping databases, or running destructive migrations against a non-local environment.
- Rotating, exposing, printing, or committing credentials/secrets.
- Anything that spends money, changes repo/org settings, or has legal/contractual/compliance implications.
- For each of these: prepare the change locally, write a clear **`NEEDS-HUMAN`** entry in `PROJECT_LOG.md` and the Current State "Blockers" list describing exactly what's needed and why, then **continue with other unblocked work** rather than halting.

**Escalation (when, and only when, to surface something):**
- A **hard blocker** you cannot resolve yourself: a missing secret/credential only the human can supply, an external dependency that is down, or a genuine contradiction in the requirements that cannot be reasonably defaulted. Log it as `NEEDS-HUMAN`, then keep working on anything not blocked by it. Do not stop the whole effort for a partial blocker.

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
| **FR-21** | Users can add **cloud compute line items** priced from **AWS, Google Cloud, and Azure** — selecting provider, region, service/instance type, quantity, and usage — with cost computed from a maintained provider price catalog. *(Catalog-based pricing is MVP; live provider-API price sync is FR-21a, post-MVP.)* | Must (MVP) |
| **FR-21a** | The system can **pull fresh prices from each provider's public pricing source** (AWS Price List API, Azure Retail Prices API, GCP Cloud Billing Catalog API) to **refresh the catalog on demand (admin-triggered) or on a schedule**. Each refresh **records a per-provider "last pulled" timestamp** and re-stamps `CloudPrice.source`/`fetched_at`; existing estimate line-item **price snapshots are never altered** by a refresh (NFR-14). | Should (Post-MVP) |
| **FR-21b** | The system **tracks and displays, per provider (AWS / GCP / Azure), the date the price catalog was last pulled** (`MM/DD/CCYY`) so users can see how current each provider's prices are. A successful refresh (FR-21a) updates that provider's **last-pulled** date; the value is shown on the Cloud Prices screen and returned by the API. | Should (Post-MVP) |
| **FR-22** | Users can apply an **upcharge (markup) percentage**: a single **across-the-board** percentage for the whole estimate **and/or** a **per-line-item override**. The per-line value, when set, takes precedence over the global value for that line. *(Supersedes the markup portion of FR-16.)* | Must (MVP) |
| **FR-23** | The system computes and displays costs on **both a monthly and a yearly (annualized) basis**. Each line item is one-time or recurring; recurring costs roll up to a monthly total and a yearly total (×12), and the estimate summary shows both. | Must (MVP) |
| **FR-24** | Estimates flow through a **customizable approval/review workflow**. An Admin can configure the workflow's **stages** (e.g., Draft → In Review → Approved → Final → Archived) and the **allowed transitions** between them, gating each transition by **role**. Every estimate tracks its **current stage** plus an append-only **transition history** (actor, timestamp, from→to, optional note). The workflow is **data-driven and configurable** — not hard-coded — so each organization tailors its estimate governance. Built as a modular `WorkflowEngine` (NFR-15). *(Modular engine + seeded default workflow established during MVP so estimate status routes through it; the Admin UI to author stages/transitions follows per roadmap.)* | Should (Post-MVP) |
| **FR-25** | An **automated smart checklist** continuously validates that an estimate is complete and internally consistent across **resource assignment, pricing, and costing** before it can advance/finalize. It is **rule-driven** (each rule: key, description, severity, pass/fail, actionable message) and **auto-evaluates on every change**. Baseline rules include: a rate card is selected; every **labor line has a role/resource assigned** with quantity & units; every **cloud line has provider/region/instance/usage and a snapshotted unit price**; every **non-labor line has an amount and billing period**; upcharge and contingency are set (or explicitly zero); no recurring line is missing a billing period; **no human resource is allocated over 100% on any date (FR-27)**; one-time/monthly/yearly totals reconcile. **Blocking checks gate workflow transitions (FR-24)** — an estimate cannot move to Approved/Final until they pass. Results are surfaced in the UI and via the API. Built as a modular, rule-based `ChecklistEngine` (NFR-15). *(Modular engine + baseline built-in rules established during MVP; admin-configurable/“smart” rule editing follows per roadmap.)* | Should (Post-MVP) |
| **FR-26** | The system provides **identity management and role-based access control (RBAC)**. Admins can **manage users**: create/invite, view/list, assign and change **roles** (Admin/Estimator/Viewer), **activate/deactivate** accounts, trigger credential resets, and remove users (right-to-delete, NFR-11). Access is **deny-by-default**; every protected endpoint enforces role/permission checks **server-side**, and changes to users/roles are **audited** (FR-11). *(Self-registration, login/logout, JWT access+refresh, role guards, and admin user management are MVP; SSO/SAML/OIDC and fine-grained per-resource permissions are post-MVP.)* | Must (MVP) |
| **FR-27** | **Resource allocation & capacity.** A human resource has a capacity of **100% per day**. A resource can be **split by percentage** across assignments (e.g. 50% + 50%), so each labor assignment carries an **allocation percentage** and an optional **date range** (start/end). The system **prevents over-allocation**: summed across all of a resource's assignments, the allocation on **any given date must not exceed 100%** — over-allocations are flagged as a **BLOCKER** by the smart checklist (FR-25) and rejected on save. | Should (Post-MVP) |
| **FR-28** | **Cost per SDLC phase.** Each line item (labor / non-labor / cloud) can be tagged with an **SDLC phase** — `PLANNING`, `DESIGN`, `DEVELOPMENT`, `TESTING`, `DEPLOYMENT`, `MAINTENANCE`. The **estimate detail card** shows a **cost breakdown per SDLC phase** (one-time / monthly / yearly subtotal per phase + phase grand total), alongside the existing per-category breakdown. The estimation engine groups line totals by phase (post-upcharge, consistent with the category subtotals); un-phased lines roll up under "Unassigned". | Should (Post-MVP) |
| **FR-29** | **Database-driven reference data (no hard-coded values).** Every configurable reference/lookup value the app uses — **SDLC phases (and their tasks), status values, priority values, resource types, testing phases (and testing types), document types, workflow steps/categories, roles, cost categories, units, cloud providers, checklist scopes/severities**, and any other value that may change over time — is stored in **database reference tables**, not hard-coded as enums/constants in application logic. The application retrieves them **dynamically** and uses them **consistently across the UI, APIs, validation logic, reports, dashboards, and workflow processing**. Each reference table carries at minimum: **id, code, display_name, description, display_order, is_active, created_by, created_at, updated_by, updated_at**. **Grouped/sequenced values use parent-child relationships** (e.g., SDLC phase → tasks, testing phase → testing types, workflow category → statuses). Baseline values ship via **seed scripts** run at deployment. Changing a label, sequence (display_order), or active flag must require **no source change, recompilation, or redeployment**. *(Cross-cutting refactor: the generic reference-data platform + migration of existing enums is a dedicated increment — see EP-13 / roadmap Sprint 11.)* | Should (Post-MVP) |

#### Provider price freshness — "last pulled" (FR-21a / FR-21b)

The price catalog records when each provider's prices were last pulled from its pricing source. The app surfaces a small freshness table — the date label is **last pulled** (`MM/DD/CCYY`):

| Provider | Last pulled |
|---|---|
| AWS   | 06/12/2026 |
| GCP   | 06/12/2026 |
| AZURE | 06/12/2026 |

Dates above are illustrative — they reflect the seeded catalog (source `CATALOG_SEED`). A live pull (FR-21a) updates the corresponding provider's row to the date of the refresh. Saved estimates keep their snapshotted unit prices regardless of refreshes (NFR-14).

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
| **NFR-12 Documentation** | Complete docs per Section 14, kept current each increment — including an **HTML documentation site** and **HTML flowchart designs** (**draw.io / diagrams.net**: architecture, estimate workflow, calculation flow, checklist gating) alongside the Markdown sources. |
| **NFR-13 Internationalization** | Currency-aware formatting; UTC storage with localized display; copy externalized to ease future i18n. |
| **NFR-14 Pricing Data Integrity** | Cloud prices are stored with **provider, region, SKU/instance, unit, currency, source, and effective date**; an estimate **snapshots the exact unit price used** so saved estimates never change when the catalog is refreshed (same immutability principle as the labor rate snapshot). |
| **NFR-15 Modularity & Extensibility** | The system is **highly modular**: cohesive, loosely-coupled modules with explicit contracts so features can be added, replaced, or removed with minimal ripple. Each bounded context (auth, users, rate cards, estimates, estimation engine, cloud pricing, **workflow**, **checklist/validation**, export, audit) is a self-contained module (controller→service→repository) communicating only through shared **typed contracts** — no reach-through, no circular dependencies, dependencies point inward toward the domain. Pluggable concerns sit behind **strategy interfaces**: `PricingProvider` (AWS/GCP/Azure + future), `Exporter` (CSV/PDF/Excel), the configurable `WorkflowEngine`, and the rule-based `ChecklistEngine`. The estimation engine is a pure, I/O-free package. Every module is independently unit-testable. |
| **NFR-16 Access Control & Least Privilege** | Authorization is **deny-by-default** and enforced **server-side** on every protected endpoint via centralized RBAC guards (no client-trust). Users hold the least privilege needed (Admin/Estimator/Viewer); role/permission changes and access-sensitive actions are **audited** (FR-11). Tokens are validated for signature, expiry, and role on each request; the identity module is the single choke point for authn/authz (FR-1, FR-2, FR-26). |
| **NFR-17 Configurable Reference Data (no hard-coding)** | Reference/lookup values (phases, statuses, priorities, resource types, testing phases/types, document types, workflow steps/categories, roles, categories, units, providers, severities, …) are **not** embedded as enums or string literals in business logic, validation, UI, reports, or workflow code. They are read from **database reference tables** (FR-29), cached, and resolved by `code`. Adding a value, renaming a label, re-sequencing (`display_order`), or deactivating one is a **data change** — no recompile or redeploy. Validation accepts any **active** value for the relevant reference type rather than a fixed code list. Enforces FR-29. |

---

## 5. Epics & Features

| Epic | Description | Features |
|---|---|---|
| **EP-1 Platform Foundation & DevOps** | Repo, containers, CI/CD, scripts, config. | FE-1 Cross-platform setup scripts · FE-2 Docker/compose stack · FE-3 CI pipeline (lint/test/build) · FE-4 Config & secrets handling · FE-5 Health/readiness endpoints |
| **EP-2 Identity & Access Management** | Identity management & role-based access control. | FE-6 Register/login/logout · FE-7 JWT access+refresh · FE-8 Role-based authorization · FE-9 Password hashing & policy · FE-45 User management (admin: invite/CRUD, role assignment, activate/deactivate) · FE-46 RBAC permission model + per-endpoint server-side guards (deny-by-default) |
| **EP-3 Reference Data Management** | Rate cards & categories. | FE-10 Rate-card CRUD (roles+rates+currency) · FE-11 Cost categories · FE-12 Multi-currency/FX *(post-MVP)* |
| **EP-4 Estimate Authoring (Core)** | Create and manage estimates. | FE-13 Estimate CRUD + clone · FE-14 Labor line items · FE-15 Non-labor line items · FE-16 Assumptions/notes · FE-48 Resource allocation (% split + date range) with per-date 100% capacity guard |
| **EP-5 Estimation Engine** | Calculations. | FE-17 Line/category/grand totals · FE-18 Contingency % · FE-19 Three-point/PERT *(post-MVP)* · FE-20 Margin & tax *(post-MVP)* · FE-41 Upcharge % (global + per-line override) · FE-42 Monthly & yearly (annualized) rollups · FE-49 Cost-per-SDLC-phase rollup (shown on the estimate detail card) |
| **EP-6 Reporting & Export** | Outputs. | FE-21 CSV export (MVP) · FE-22 PDF/Excel export *(post-MVP)* · FE-23 Printable summary view |
| **EP-7 Scenario & Version Mgmt** | Compare & baseline. | FE-24 Scenarios *(post-MVP)* · FE-25 Versioning/baselines + diff *(post-MVP)* |
| **EP-8 Dashboard, Search & Collaboration** | Find & work together. | FE-26 List/search/filter (MVP) · FE-27 Dashboard *(post-MVP)* · FE-28 Comments/sharing *(post-MVP)* |
| **EP-9 Observability, Security & Compliance** | Run safely. | FE-29 Structured logging + correlation IDs · FE-30 Audit trail · FE-31 Security hardening/OWASP · FE-32 Backup/restore |
| **EP-10 Documentation & Onboarding** | Make it usable. | FE-33 README/quickstart · FE-34 Architecture + ADRs · FE-35 API docs (OpenAPI/Swagger UI) · FE-36 User guide · FE-37 Runbook/deploy guide · FE-47 **HTML documentation site + flowchart designs** (draw.io sources → SVG/PNG/HTML/Visio per-format folders: architecture, workflow, calculation flow, checklist, request lifecycle) |
| **EP-11 Cloud Pricing & Provider Integration** | Price compute from AWS, GCP, Azure. | FE-38 Provider price catalog (AWS/GCP/Azure: regions, services, instances, units) · FE-39 Cloud compute line items (provider/region/instance/usage → cost) · FE-40 Live price sync via provider pricing sources + **per-provider "last pulled" tracking/display** *(post-MVP)* |
| **EP-12 Estimate Governance: Workflow & Smart Validation** | Customizable lifecycle + automated completeness. | FE-43 Customizable estimate **workflow** (configurable stages/transitions, role-gated, transition history) · FE-44 Automated **smart checklist** (rule-driven validation of resource assignment + pricing + costing; gates workflow transitions) |
| **EP-13 Reference Data Platform** | DB-driven, admin-managed reference/lookup values (no hard-coding). | FE-50 Generic **reference-data schema** (`reference_type` + `reference_value` with code/display_name/description/display_order/is_active + created/updated by/date, **parent-child** self-relation) · FE-51 **Reference-data API** (list active values by type, grouped/ordered; admin CRUD, audited) · FE-52 **Seed scripts** for baseline reference values (idempotent, run at deploy) · FE-53 **Admin reference-data management UI** · FE-54 **Migrate existing enums → reference tables** (SDLC phase + tasks, estimate status, roles, cost categories, billing period/units, cloud providers, checklist scope/severity, workflow stages) and read them dynamically across UI/API/validation/reports/workflow |

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
| FR-26 | EP-2 | FE-45, FE-46, FE-8 |
| FR-27 | EP-4, EP-12 | FE-48, FE-44 |
| FR-28 | EP-5, EP-6 | FE-49, FE-17 |
| FR-29 | EP-13 | FE-50, FE-51, FE-52, FE-53, FE-54 |
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
| FR-21, FR-21a, FR-21b | EP-11 | FE-38, FE-39, FE-40 |
| FR-22 | EP-5 | FE-41 |
| FR-23 | EP-5 | FE-42 |
| NFR-14 | EP-11, EP-4 | FE-38, FE-39 |
| FR-24 | EP-12 | FE-43 |
| FR-25 | EP-12, EP-5 | FE-44, FE-17 |
| NFR-15 | EP-1, EP-5, EP-11, EP-12 | FE-2, FE-17, FE-38, FE-43, FE-44 |
| NFR-16 | EP-2, EP-9 | FE-8, FE-45, FE-46, FE-30 |
| NFR-17 | EP-13 | FE-50, FE-51, FE-54 |
| NFR-1,2,3 | EP-1, EP-9 | FE-2, FE-5, FE-29 |
| NFR-4,11 | EP-2, EP-9 | FE-7, FE-9, FE-31 |
| NFR-5 | EP-3/4, EP-9 | FE-13, FE-32 |
| NFR-6,7,10 | EP-1 | FE-1, FE-2, FE-3, FE-4 |
| NFR-8 | EP-4/8 | FE-13, FE-26 |
| NFR-9 | EP-9 | FE-29, FE-5 |
| NFR-12 | EP-10 | FE-33–FE-37, FE-47 |

**Rule:** No feature ships without a requirement; no Must-have requirement ships without a feature and a passing test.

---

## 7. MVP Definition & Scope

The MVP is the smallest end-to-end product that lets an Estimator log in, build a real estimate from a shared rate card **and from AWS/GCP/Azure compute pricing**, apply an **upcharge** and **contingency**, see **monthly and yearly** totals, save/search it, and export it — all installable and runnable on Linux/Windows with one command.

**In MVP (Must):**
- EP-1 fully (setup/startup scripts, Docker+PostgreSQL, CI, health checks, config).
- EP-2: register/login/logout, JWT, Admin/Estimator/Viewer roles, hashed passwords. *(FR-1, FR-2)*
- EP-3: rate-card CRUD with roles, rates, currency. *(FR-3)*
- EP-4: estimate CRUD + clone, labor & non-labor line items, assumptions/notes. *(FR-4, FR-5, FR-6, FR-8)*
- EP-5: line/category/grand totals + contingency %; **upcharge % (global default + per-line override)**; **monthly and yearly (annualized) rollups**. *(FR-7, FR-22, FR-23)*
- EP-11: **cloud compute line items priced from AWS, GCP, and Azure** using a **seeded provider price catalog** (common regions/instances/services), with the unit price **snapshotted** onto the line. Live provider-API sync is deferred. *(FR-21, NFR-14)*
- EP-6: CSV export + printable summary (showing monthly and yearly totals). *(FR-10)*
- EP-8: list/search/filter estimates. *(FR-9)*
- EP-9: basic audit trail + structured logging. *(FR-11)*
- EP-10: README/quickstart, OpenAPI/Swagger, architecture overview, user guide. *(FR-12, NFR-12)*

**Explicitly deferred (Post-MVP):** PERT (FR-13), scenarios (FR-14), versioning (FR-15), margin/tax beyond upcharge (FR-16), multi-currency (FR-17), dashboard (FR-18), collaboration (FR-19), PDF/Excel (FR-20), **live cloud price sync via provider APIs (FR-21a / FE-40)**.

**MVP acceptance:** a clean machine can run `setup` then `start`; a seeded Admin can create a rate card and the cloud price catalog is seeded for AWS/GCP/Azure; an Estimator can build an estimate that mixes labor, non-labor, and cloud compute lines, apply a global upcharge with at least one per-line override, see correct **monthly and yearly** totals, and export it — all green in CI.

---

## 8. Post-MVP Roadmap (suggested increments)

| Sprint | Theme | Features | Requirements |
|---|---|---|---|
| 3 | Better estimation | FE-19 PERT, FE-20 margin/tax | FR-13, FR-16 |
| 4 | Decisions | FE-24 scenarios, FE-25 versioning/diff | FR-14, FR-15 |
| 5 | Professional outputs | FE-22 PDF/Excel, FE-27 dashboard | FR-18, FR-20 |
| 6 | Live cloud pricing | FE-40 provider-API price sync (AWS/Azure/GCP) | FR-21a |
| 7 | Scale & govern | FE-12 multi-currency, FE-28 collaboration, FE-32 backup/restore hardening | FR-17, FR-19, NFR-5 |
| 11 | Reference data platform | FE-50 generic reference schema, FE-51 reference API + admin CRUD, FE-52 seed scripts, FE-53 admin UI, FE-54 migrate enums → reference tables | FR-29, NFR-17 |

Re-prioritize at each review with the PO; the table is a default, not a contract.

---

## 9. Reference Architecture & Tech Stack *(CONFIRMED — 2026-06-11)*

**Decision:** End-to-end **TypeScript** so the UX and API share one money/contract model (Zod schemas + types) across the wire. Recorded as an ADR. Chosen over a split Python/JS stack because this product is calculation- and contract-heavy (not ML-heavy today); revisit only if ML-based estimation becomes a real epic.

**Shape:** Single-page web client → standalone documented REST API → PostgreSQL. Stateless API, containerized, layered (controllers → services → repositories → DB). FE and API stay as **two separate tiers** (satisfies FR-12).

**Confirmed stack:**
- **Frontend:** React + TypeScript + **Vite**.
- **UI / styling:** **Tailwind CSS + shadcn/ui** (component ownership for the form- and table-heavy estimate screens).
- **Data grid:** **TanStack Table** for estimate line items (the core UX surface). *(AG Grid only if spreadsheet-style inline editing is needed later.)*
- **Forms + validation:** **React Hook Form + Zod** — Zod schemas are shared with the backend as the single source of truth.
- **Server state:** **TanStack Query** (caching, refetch, optimistic updates on estimate edits).
- **Backend / API:** **NestJS** (Node + TypeScript), layered controllers→services→repositories; auto-generated **OpenAPI/Swagger** at `/docs`.
- **ORM + migrations:** **Prisma** (type-safe queries, first-class migrations, `Decimal` for money). *(Drizzle acceptable if a leaner SQL-first layer is preferred — record an ADR if switched.)*
- **Database:** **PostgreSQL 16**; monetary values as `NUMERIC(18,4)` (Prisma `Decimal`) — never floats.
- **Auth:** JWT (short-lived access + refresh) via Passport/Nest; **argon2** password hashing.
- **Monorepo:** **pnpm workspaces + Turborepo** with a shared `packages/types` (Zod schemas + TS types used by both `web` and `api`).
- **Testing:** **Vitest** (unit), **Supertest** (API integration), **Playwright** (E2E smoke of login → create estimate → export).
- **Packaging:** Docker + docker-compose (services: `db`, `api`, `web`); **Node 22 LTS+**.
- **CI/CD:** GitHub Actions (lint → typecheck → test → build → image).
- **Observability:** structured JSON logs + correlation IDs; `/health` and `/ready`.

**Explicitly avoided for this build:** microservices (a single modular API is right for MVP), GraphQL (REST is specified and sufficient), and using Next.js as the whole stack (it would collapse the FE/API separation required by FR-12). Keep two tiers.

**Modularity & extensibility (NFR-15) — a first-class design constraint.** The application must be **highly modular**; realize it concretely, not aspirationally:
- **Monorepo boundaries** separate tiers and shared code: `apps/web`, `apps/api`, `packages/types` (the shared Zod/TS contract — single source of truth across the wire), `packages/config`, and **`packages/engine`** — the pure, I/O-free **estimation engine** (the heart of the product), reused by the API and exhaustively unit-tested in isolation.
- **NestJS feature modules** per bounded context (`auth`, `users`, `rate-cards`, `estimates`, `cloud-pricing`, `workflow`, `checklist`, `export`, `audit`, `health`). Each is self-contained (controller→service→repository), exposes a narrow surface, and depends on others only through injected interfaces or shared types — **no circular dependencies; dependencies point inward toward the domain**.
- **Strategy/plugin seams** for everything that varies: a `PricingProvider` interface with `Aws`/`Gcp`/`Azure` implementations behind a registry (FR-21a live sync and new providers drop in), an `Exporter` interface (CSV now; PDF/Excel later), a configurable **`WorkflowEngine`** (FR-24 — data-driven stages/transitions), and a rule-based **`ChecklistEngine`** (FR-25 — pluggable validation rules).
- **Identity & access** is its own module with **deny-by-default RBAC** guards applied per endpoint (FR-26, NFR-16), so authorization is centralized and testable rather than scattered.
- **Test the seams:** every module and the engine package are independently testable; `packages/types` is the boundary the tests assert against.

> **Branching follows modularity in *code*, not in git.** Modularity lives in the package/module structure above — **not** in long-lived per-component branches (an antipattern that causes drift and merge pain). Use **trunk-based** development: short-lived feature branches, each delivering one module/slice, PR'd into `main`.

**Repository:** **https://github.com/govmed/cost-reaper** (project name: *cost-reaper*).

**Repository layout (monorepo):**
```
/                      repo root  (https://github.com/govmed/cost-reaper)
  /apps
    /web               React + TS + Vite frontend (feature-foldered)
    /api               NestJS REST API — feature modules under src/modules/*:
                       auth, users, rate-cards, estimates, cloud-pricing,
                       workflow, checklist, export, audit, health
  /packages
    /types             shared Zod schemas + TS types (the contract — single source of truth)
    /engine            pure estimation engine (no I/O): totals, upcharge, contingency, monthly/yearly
    /config            shared eslint/tsconfig/tailwind presets
  /scripts             setup.sh, setup.ps1, start.sh, start.ps1, stop.*, test.*, seed.*
  /docs                ARCHITECTURE.md, API.md, DATABASE.md, RUNBOOK.md, USER_GUIDE.md, adr/
  CLAUDE.md            project memory (this file)
  PROJECT_LOG.md       chapter log
  AUDIT_LOG.md         conversation audit
  docker-compose.yml   db / api / web
  pnpm-workspace.yaml
  turbo.json
  .env.example
  README.md
```

---

## 10. Initial Data Model (MVP)

Entities (the agent finalizes columns/constraints):

- **User** (id, email, password_hash, role[ADMIN|ESTIMATOR|VIEWER], **display_name**, **is_active boolean default true**, **last_login_at nullable**, created_at, updated_at) — identity record for RBAC (FR-26, NFR-16)
- **RateCard** (id, name, currency, is_active, created_by, timestamps)
- **RateCardRole** (id, rate_card_id→RateCard, role_name, unit[HOUR|DAY], rate `NUMERIC(18,4)`)
- **Estimate** (id, name, description, status[DRAFT|FINAL], currency, **global_upcharge_percent `NUMERIC(5,2)` default 0**, contingency_percent `NUMERIC(5,2)`, rate_card_id→RateCard, owner_id→User, created_at, updated_at)
  - *Computed/derived (not stored, or stored as a cached summary): subtotal, upcharge_amount, contingency_amount, **monthly_total**, **yearly_total**, grand_total.*
- **LaborLineItem** (id, estimate_id→Estimate, rate_card_role_id→RateCardRole, **resource_name nullable** (the assigned human resource), quantity, units `NUMERIC`, rate_snapshot `NUMERIC(18,4)`, **upcharge_percent_override `NUMERIC(5,2)` nullable**, **allocation_percent `NUMERIC(5,2)` default 100** (FR-27), **start_date / end_date `DATE` nullable** (allocation window), **billing_period[ONE_TIME|MONTHLY|YEARLY]**, **sdlc_phase[PLANNING|DESIGN|DEVELOPMENT|TESTING|DEPLOYMENT|MAINTENANCE] nullable** (FR-28), line_total `NUMERIC(18,4)`)
- **NonLaborLineItem** (id, estimate_id→Estimate, category, description, type[FIXED|RECURRING], amount `NUMERIC(18,4)`, **upcharge_percent_override `NUMERIC(5,2)` nullable**, **billing_period[ONE_TIME|MONTHLY|YEARLY]**, periods, **sdlc_phase[PLANNING|DESIGN|DEVELOPMENT|TESTING|DEPLOYMENT|MAINTENANCE] nullable** (FR-28), line_total `NUMERIC(18,4)`)
- **CloudComputeLineItem** (id, estimate_id→Estimate, cloud_price_id→CloudPrice, provider[AWS|GCP|AZURE], region, service, sku_or_instance, quantity, **usage_hours_per_month `NUMERIC`** (or usage units), **unit_price_snapshot `NUMERIC(18,6)`**, **upcharge_percent_override `NUMERIC(5,2)` nullable**, **billing_period[ONE_TIME|MONTHLY|YEARLY]** default MONTHLY, **sdlc_phase[PLANNING|DESIGN|DEVELOPMENT|TESTING|DEPLOYMENT|MAINTENANCE] nullable** (FR-28), line_total `NUMERIC(18,4)`)
- **CloudPrice** (id, provider[AWS|GCP|AZURE], region, service, sku_or_instance, unit[HOUR|MONTH|GB_MONTH|REQUEST|…], unit_price `NUMERIC(18,6)`, currency, source[CATALOG_SEED|AWS_API|AZURE_API|GCP_API], effective_date, fetched_at) — the maintained price catalog (FR-21/NFR-14)
- **Assumption** (id, estimate_id→Estimate, text, created_at)
- **AuditEvent** (id, entity_type, entity_id, action, actor_id→User, occurred_at)
- **WorkflowDefinition** (id, name, is_default, is_active, created_by→User, timestamps) — the configurable estimate workflow (FR-24)
- **WorkflowStage** (id, workflow_definition_id→WorkflowDefinition, key, label, sort_order, is_initial, is_terminal)
- **WorkflowTransition** (id, workflow_definition_id→WorkflowDefinition, from_stage_id→WorkflowStage, to_stage_id→WorkflowStage, allowed_role[ADMIN|ESTIMATOR|VIEWER], label, **requires_checklist_pass boolean default true**)
- **WorkflowTransitionEvent** (id, estimate_id→Estimate, from_stage_id→WorkflowStage, to_stage_id→WorkflowStage, actor_id→User, note, occurred_at) — append-only lifecycle history (FR-24)
- **ChecklistRule** (id, key, description, severity[BLOCKER|WARNING|INFO], scope[ESTIMATE|LABOR|NONLABOR|CLOUD|RESOURCE], is_active, is_builtin, config_json nullable) — rule definitions for the smart checklist (FR-25); built-ins seeded, admins may add/toggle (post-MVP)
- **ReferenceType** (id, code, display_name, description, display_order, is_active, created_by→User, created_at, updated_by→User, updated_at) — the catalog of reference *kinds* (e.g. `SDLC_PHASE`, `ESTIMATE_STATUS`, `BILLING_PERIOD`, `RATE_UNIT`, `CLOUD_PROVIDER`, `CLOUD_PRICE_UNIT`, `NON_LABOR_TYPE`, `ROLE`, `COST_CATEGORY`, `RESOURCE_TYPE`, `TESTING_PHASE`, `TESTING_TYPE`, `DOCUMENT_TYPE`, `PRIORITY`, `CHECKLIST_SEVERITY`, `CHECKLIST_SCOPE`, `WORKFLOW_STAGE`) (FR-29)
- **ReferenceValue** (id, reference_type_id→ReferenceType, parent_id→ReferenceValue nullable (self-FK for grouped/child values), code, display_name, description, display_order, is_active, metadata_json nullable, created_by→User, created_at, updated_by→User, updated_at) — the actual lookup values; **unique (reference_type_id, code)**; parent_id models hierarchies (SDLC phase → tasks, testing phase → testing types, workflow category → statuses) (FR-29, NFR-17)

**Notes:**
- **Database-driven reference data (FR-29, NFR-17):** the generic `ReferenceType` + `ReferenceValue` pair replaces hard-coded enums/constants for every configurable lookup. The app loads active values **ordered by `display_order`**, caches them, and resolves by `code`; validation accepts any **active** value of the relevant type (not a fixed list). Seed scripts populate baseline values idempotently at deploy. **Migration plan (EP-13, Sprint 11):** today's Prisma/Zod enums (`SdlcPhase`, `EstimateStatus`, `BillingPeriod`, `RateUnit`, `CloudProvider`, `CloudPriceUnit`, `NonLaborType`, `Role`, `ChecklistSeverity`, `ChecklistScope`, workflow stage keys) move to `ReferenceValue` rows; line items keep their `code` string but FK-validate against the reference table. Snapshots on saved estimates remain immutable. Until that increment lands, new enums (e.g. `SdlcPhase`) are interim and explicitly slated for migration — do not add more hard-coded reference lists without recording it as debt against FR-29.
- **Identity & RBAC (FR-26, NFR-16):** `User` carries the role and `is_active`; authorization is **deny-by-default**, enforced server-side by guards on every protected route. User/role changes emit `AuditEvent`s. Fine-grained per-resource permissions and SSO are post-MVP seams.
- **Estimate lifecycle (FR-24):** `Estimate` references a `WorkflowDefinition` and a `current_stage_id→WorkflowStage`; MVP assigns the seeded **default workflow**. Stage changes are recorded as immutable `WorkflowTransitionEvent`s and are role-gated.
- **Smart checklist (FR-25):** checklist *results* are **computed on demand** by the `ChecklistEngine` from active `ChecklistRule`s against the estimate's lines (resource/role assigned, price snapshot present, billing period set, amounts present, totals reconcile); they need not be persisted. A failing **BLOCKER** rule prevents any workflow transition whose `requires_checklist_pass` is true.
- **Resource capacity (FR-27):** a human resource = **100% capacity per day**. Labor assignments carry `allocation_percent` (split allowed — e.g. 50% + 50% across lines/estimates) and an optional `start_date`/`end_date` window. The `ChecklistEngine` adds a **BLOCKER** rule (`resource_capacity`) that, per resource (matched by `resource_name`), checks that **no calendar date within any assignment's window has a summed allocation > 100%**; the API also rejects writes that would over-allocate. Lines with no resource or no dates are excluded from the check. *(A normalized `Resource`/person entity may replace `resource_name` post-MVP.)*
- Store a **rate snapshot** on labor lines and a **unit_price_snapshot** on cloud lines so historical estimates are immutable even when the rate card or cloud catalog is refreshed (BR-3, NFR-5, NFR-14). All timestamps UTC. FK constraints required.
- **Upcharge resolution (FR-22):** a line's *effective upcharge* = `upcharge_percent_override` if set, otherwise the estimate's `global_upcharge_percent`. Marked-up line value = base × (1 + effective_upcharge/100).
- **Calculation order (FR-7, FR-22, FR-23):** base line value → apply effective upcharge → category subtotals → apply estimate contingency on the upcharged subtotal → grand total. Keep this order in one well-tested engine function.
- **Cost per SDLC phase (FR-28):** each line carries an optional `sdlc_phase`; the engine produces **per-phase subtotals** (one-time/monthly/yearly per phase) exactly as it does category subtotals (post-upcharge). The **estimate detail card** renders the per-phase breakdown; lines with no phase roll up under **"Unassigned"**.
- **Monthly vs yearly (FR-23):** each line has a `billing_period`. ONE_TIME contributes to neither recurring roll-up (shown separately as one-off). MONTHLY contributes its amount to the **monthly_total** and ×12 to the **yearly_total**. YEARLY contributes ÷12 to monthly_total and its amount to yearly_total. The summary shows one-time, monthly, and annualized (yearly) figures distinctly. Cloud compute defaults to MONTHLY (hourly usage × 730 hrs/month, configurable).

---

## 11. API Design Guidelines

- RESTful resources: `/api/v1/auth`, `/users`, `/rate-cards`, `/rate-cards/{id}/roles`, `/cloud-prices` (catalog: filter by provider/region/service/instance), `/estimates`, `/estimates/{id}/labor-items`, `/estimates/{id}/non-labor-items`, `/estimates/{id}/cloud-items`, `/estimates/{id}/assumptions`, `/estimates/{id}/totals` (returns one-time / monthly / yearly / grand totals with upcharge + contingency breakdown), `/estimates/{id}/export`.
- Consistent JSON; pagination on list endpoints; filtering/sorting query params.
- **OpenAPI** auto-generated; **Swagger UI** served at `/docs`.
- Errors as **RFC 7807** problem+json with stable error codes.
- Versioned (`/api/v1`). Auth via `Authorization: Bearer`. Validate all inputs server-side.
- Idempotent, parameterized DB access only (no string-built SQL).
- *(Post-MVP)* `/cloud-prices/sync` triggers provider-API refresh (FR-21a) — admin-only, rate-limited.

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
6. **Seed** baseline data (one Admin user from env-provided credentials, a sample rate card, sample categories, and a **cloud price catalog seeded for AWS, GCP, and Azure** — common regions and instance/service types with unit prices, source `CATALOG_SEED`).
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

# Cloud pricing (MVP uses the seeded catalog; these are OPTIONAL, for post-MVP live sync FR-21a)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_PRICING_REGION=us-east-1
# AZURE_RETAIL_PRICES_ENDPOINT=https://prices.azure.com/api/retail/prices
# GCP_BILLING_API_KEY=
# CLOUD_HOURS_PER_MONTH=730   # used to convert hourly cloud rates to monthly
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
| `docs/html/` | **HTML documentation site** — the docs rendered as a styled, navigable, offline-openable HTML hub, kept in sync with the Markdown sources. |
| `docs/diagrams/` | **Flowchart designs** authored in **draw.io / diagrams.net**, exported per-format into their own folders: `drawio/` (editable source), `svg/` (vector — opens anywhere), `png/` (raster 2×), `html/` (self-contained inline-SVG), `visio/` (export how-to). Diagrams: architecture, estimate **approval workflow** (FR-24), **calculation flow** (FR-7/22/23), **smart-checklist gating** (FR-25), request lifecycle (NFR-9). Rendered at `docs/html/flowcharts.html`; regenerate via `scripts/render-diagrams.py` (`.drawio` → SVG + PNG). |
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
- [ ] Database schema + migrations + seed (Admin, sample rate card/categories, **AWS/GCP/Azure cloud price catalog**).
- [ ] OpenAPI spec + live Swagger UI at `/docs`.
- [ ] Health/readiness endpoints + structured logging.
- [ ] Test suites passing in CI with coverage report.
- [ ] Documentation set per Section 14, including the **HTML documentation site** and **HTML flowchart designs** (`docs/html/`).
- [ ] **Living memory system (Section 19): `CLAUDE.md` with a current "Current State" block, `PROJECT_LOG.md` chapter log, and `AUDIT_LOG.md` conversation audit — all kept current after every action.**
- [ ] MVP acceptance met (Section 7); post-MVP roadmap in backlog.

---

## 19. Living Documentation & Memory System

The agent maintains **three** markdown files so that work is resumable, narratable, and auditable. Keeping them current is part of the **Definition of Done** for every story and every action.

### 19.1 `CLAUDE.md` — Project Memory (this file)
Durable memory the agent reads at the start of every session. It holds the spec (Sections 1–18), the conventions, the decisions, and a **Current State** block that the agent edits in place so it always reflects reality. Keep the Current State block at the top of this section so it is easy to find.

**Current State block — keep this updated in place:**
```markdown
<!-- CURRENT STATE — update after every action -->
- **Last updated (UTC):** 2026-06-12
- **Repository:** https://github.com/govmed/cost-reaper  (project: *cost-reaper*) — **`main` is the single trunk** (unprotected); **trunk-based** (ADR-0004). Merged to `main` through PR #12 (foundation → Sprints 1–4 → migration → hardening → admin UI → Sprint 10 capacity/phases/gates). User granted **standing permission** to merge/push/advance without asking each time. **Sprint 11 on `feature/sprint11-reference-data`** (FR-29 reference-data platform).
- **Operating mode:** **AUTONOMOUS** — build without pausing for confirmation; log decisions; escalate only on hard blockers (see Section 0.1).
- **Current sprint / increment:** Sprint 11 — Reference Data Platform (FR-29/NFR-17/EP-13): generic reference tables + API + seed + admin UI; SDLC-phase dropdowns now DB-driven (branch `feature/sprint11-reference-data`)
- **Confirmed stack:** React + TS + Vite (Tailwind/shadcn, TanStack Table/Query, RHF+Zod) / **NestJS** API (Prisma) / **PostgreSQL 16**; pnpm + Turborepo monorepo with shared `packages/types` + pure `packages/engine`. See Section 9.
- **Key capabilities:** multi-cloud compute pricing **AWS/GCP/Azure** (seeded catalog, FR-21); **upcharge %** global + per-line override (FR-22); **monthly & yearly** costing (FR-23); **resource allocation & capacity** (FR-27 — resource=100%/day, %-split, ≤100%/date, save-time guard + BLOCKER stage gate); **cost per SDLC phase** (FR-28 — per-phase rollup on the detail card + CSV); **database-driven reference data** (FR-29 — generic `reference_type`/`reference_value` + parent-child, reference API, admin UI, 16 seeded types; SDLC-phase dropdowns consume it; **enum→reference column migration is the remaining FE-54**); **identity management + RBAC** (FR-26, NFR-16); **customizable workflow engine** (FR-24) + **smart checklist** (FR-25) gating transitions (EP-12); **high modularity** (NFR-15); **HTML docs + draw.io flowcharts** (FE-47). **Spec'd, not yet built:** cloud price pull + per-provider "last pulled" (FR-21a/b).
- **MVP status:** **COMPLETE + governance** ✅ — Sprints 0–4 merged to `main` (PR #1–#6), all CI-green. Backend: auth/RBAC, user mgmt, rate cards, AWS/GCP/Azure catalog, estimates CRUD+clone, labor/non-labor/cloud lines + assumptions, engine-backed totals (upcharge→contingency, monthly/yearly), search, CSV export, audit, Swagger, **+ workflow engine (FR-24) + smart checklist (FR-25) gating transitions**. **Web app**: login, estimates list/search, estimate editor (line items + live totals + CSV + **governance panel**). Runs via `setup.sh`+`start.sh`. **First real Prisma migration `0_init` shipped** (PR #7) — verified to `migrate deploy` cleanly; db-push baseline retired; `docs/DATABASE.md` added. Post-MVP epics still open: PDF/Excel, scenarios, dashboard, PERT, live cloud price-API sync, hardening.
- **Done so far:** memory system + spec (incl. NFR-15 modularity, FR-24 workflow, FR-25 checklist, FR-26 identity/RBAC). **2026-06-12:** deleted stale branches (trunk-based on `main`); scaffolded EP-1 — pnpm+Turborepo monorepo (`apps/{web,api}`, `packages/{types,engine,config}`), Docker stack (db/api/web) + healthchecks, cross-platform scripts + Makefile, `.env.example`/CI, shared Zod contract, **pure estimation engine + full Vitest suite**, NestJS `/health`+`/ready` + structured logging + RFC7807, full MVP Prisma schema + seed (admin, rate card, AWS/GCP/Azure catalog, default workflow, checklist rules), Vite/React shell, ARCHITECTURE + ADRs 0001–0006. Committed (`148809c`), pushed, **PR #1** opened.
- **Done so far (recent):** **Sprint 10 merged** (PR #12, all CI green incl. e2e) — FR-27 resource capacity + FR-28 SDLC-phase costs + stage gates. **Sprint 11 built & locally verified** on `feature/sprint11-reference-data` — `ReferenceType`/`ReferenceValue` schema + migration `20260612140000_reference_data_platform` (3-migration fresh-deploy + no-drift verified), reference module (`/reference/*` list + admin CRUD, audited, built-ins undeletable), pure `buildReferenceTree` + tests, seed of 16 reference types (incl. SDLC_PHASE→tasks, TESTING_PHASE→types), admin **Reference data** web page, and the **SDLC-phase dropdowns wired to the reference API** (first FE-54 consumer, with fallback). Full pipeline green (format/lint/typecheck/test=43/build); live API smoke confirmed (16 types, nested values, CRUD round-trip, built-in delete→400). **Next: commit → PR → CI-green → merge.**
- **Next up:** **Finish FE-54** — migrate the remaining enum-backed columns (EstimateStatus, BillingPeriod, RateUnit, CloudProvider, NonLaborType, Role, ChecklistSeverity/Scope, workflow stage keys) to validate against the reference tables and read labels dynamically across UI/API/validation/reports. Also open: FR-21a/b cloud price pull + "last pulled"; PDF/Excel (FR-20), dashboard (FR-18), scenarios/versioning (FR-14/15), PERT (FR-13). Standing permission to proceed without micro-approvals; Bash/Docker allow-listed.
- **Assumptions (defaulted, see Section 0.1):** single-currency per estimate (MVP); JWT TTLs 15 min / 7 days; money NUMERIC(18,4), cloud unit prices NUMERIC(18,6); cloud compute defaults MONTHLY @ 730 hrs/month; upcharge before contingency; **modularity realized via monorepo packages + NestJS feature modules + strategy interfaces, not long-lived git branches**; **"workflow" interpreted as the estimate approval/review lifecycle** (data-driven `WorkflowEngine`); **checklist is rule-driven, computed on demand**, gating workflow transitions; identity/RBAC is **deny-by-default**, enforced server-side.
- **Blockers / risks:** none open. CI: `build` (format→lint→typecheck→test→build, **all blocking**) + `e2e` (Docker images built, full stack up, migrate+seed, Playwright smoke) + `security` — all green. All earlier follow-ups resolved: real Prisma migration `0_init` ✓, lint/format blocking ✓, Docker image build exercised by CI ✓, `pnpm-lock.yaml` committed ✓.
- **How to run right now:** `./scripts/setup.sh && ./scripts/start.sh` (Linux/macOS) or `*.ps1` (Windows). Needs only Docker. Web :5173 · API :8000/api/v1 · Swagger /docs.
<!-- END CURRENT STATE -->
```

### 19.2 `PROJECT_LOG.md` — Chapter Log (updated after every action)
A running, **chapter-structured** narrative of the whole project. A "chapter" groups a coherent unit of work (e.g., a sprint, an epic, or a major task); within a chapter, the agent appends a dated entry **after every meaningful action**. This is the project's story over time — readable top to bottom by a newcomer.

**Update protocol:** append-mostly. Start a new chapter when moving to a new sprint/epic; otherwise append an entry under the current chapter. Never delete history; if something changes, add a new entry that supersedes the old one. Every entry references the relevant requirement/feature IDs.

**Entry template:**
```markdown
## Chapter N — <Sprint/Epic title>  (started YYYY-MM-DD)
**Goal:** <what this chapter delivers and the requirement/feature IDs it covers>

### YYYY-MM-DD HH:MM UTC — <short action title>
- **Action:** <what I did, e.g., "Created docker-compose with db/api/web services">
- **Why:** <reason / which FR/NFR/FE it advances>
- **Files touched:** <paths>
- **Result:** <outcome, tests run + pass/fail, decisions made>
- **Next:** <immediate next action>
```

### 19.3 `AUDIT_LOG.md` — Conversation Audit (complete, verbatim, append-only)
A faithful record of the **entire conversation**: every user message and every agent reply, in order, with UTC timestamps. Append-only — nothing is edited or removed. This is the accountability trail showing exactly what was asked and what was done in response.

**Update protocol:** after each turn, append the user's message verbatim and a faithful summary-or-verbatim of the agent's reply (including key tool actions taken). Redact only secrets/credentials, replacing them with `[REDACTED]`. Use a stable, greppable format.

**Entry template:**
```markdown
---
### [YYYY-MM-DD HH:MM UTC] — USER
<verbatim user message>

### [YYYY-MM-DD HH:MM UTC] — AGENT
<agent reply; list concrete actions/commands/files as bullet points>
**Actions taken:**
- <command or file change>
- <test run + result>
---
```

### 19.4 Ordering & consistency rules
- After every action, update in this order: **(1) `CLAUDE.md` Current State → (2) `PROJECT_LOG.md` chapter entry → (3) `AUDIT_LOG.md` turn entry.**
- All three files use **UTC timestamps**.
- The three must never contradict each other; if they do, `CLAUDE.md` Current State is authoritative for "now," `PROJECT_LOG.md` for "how we got here," and `AUDIT_LOG.md` for "what was literally said."
- These files are committed with the work they describe (they are part of every increment, not an afterthought).
- Starter templates for `PROJECT_LOG.md` and `AUDIT_LOG.md` are provided alongside this file — drop them into the repo root and begin appending.

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

**US-6 (FR-21/22/23, FE-39/41/42) — Cloud compute with upcharge, monthly & yearly.**
*As an Estimator, I want to price cloud compute across providers, mark it up, and see monthly and yearly cost.*
- I can add a cloud compute line by choosing **provider (AWS/GCP/Azure)**, region, and instance/service from the seeded catalog; the unit price is snapshotted onto the line.
- I can set a **global upcharge %** on the estimate and **override it on any individual line**; the per-line value wins where set.
- Upcharge is applied to the base line value, then the estimate **contingency** is applied to the upcharged subtotal (consistent, well-tested order).
- The summary shows distinct **one-time**, **monthly**, and **yearly (annualized ×12)** totals; changing a line's billing period updates both correctly.
- Refreshing the cloud price catalog later does **not** change this saved estimate (price snapshot holds).

*(The team extends this appendix per sprint; every new story must carry an ID, trace to a requirement/feature, and include testable acceptance criteria.)*
