# Changelog

All notable changes to **Kerdos** (by Veridion LLC; repo codename `cost-reaper`) are documented
here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project uses
semantic versioning once it ships a first release.

## [Unreleased]

_Nothing yet — next changes land here._

## [1.0.1] - 2026-06-16

Post-1.0 UI polish: real Veridion wordmark branding, a floating Help button,
currency-symbol money formatting, and rate-card / labor-card refinements.

### Added
- **Persistent floating "Help" button.** A red **? Help** button is now pinned to the bottom-right of every signed-in page and opens the in-app Help guide (NFR-12), so help is always one click away rather than buried in the Docs menu. Built in CSS (scales crisply, matches the flat UI) and hidden when printing.

### Changed
- **Every dollar amount now shows the `$` symbol and exactly 2 decimals, app-wide.** Money is rendered through a shared `formatMoney` helper as `<symbol><grouped 2-decimals>` — e.g. `$1,234.50` — using the record's currency (USD → `$`). Applied across the estimate editor (totals, line items, per-phase/per-category breakdowns, baseline deltas, scenarios, the role picker), the estimates list, the dashboard (per-currency total **and** the base-currency total), the cloud-price catalog, and the printable summary + Statement of Work. Previously these showed a bare number with a trailing currency code (e.g. `1234 USD`) and, in places, 4+ decimals. The rate-card page reuses the same shared currency-symbol helper.
- **Veridion wordmark branding (orange "V" mark removed everywhere).** The header and login now show the **"Veridion" wordmark** (cropped from the veridion.com logo) — the standalone orange "V"/mark was dropped per request. White wordmark on the teal header, black on the login card; "Kerdos" reads as the product name beside it (the redundant "Veridion LLC" subtitle is gone). The browser-tab **favicon is now a clean teal "K"** (Kerdos) tile instead of the orange mark (with a cache-busting `?v=2` so browsers re-fetch it rather than showing the old cached orange icon).
- **Rate cards: rates now show a currency symbol and 2 decimals, and the table sorts.** Each rate field shows the rate card's currency symbol (USD → `$`) and formats to two decimals on entry (`85` → `85.00`). The **Role** and **Rate** column headers are now clickable to sort the roles (ascending/descending, with a ▲/▼ indicator) — rate sorts numerically, role alphabetically.
- **Labor card: the add-line fields now align under the column headers.** The "add a labor line" inputs were a free-flowing wrapped row that didn't line up with the table titles; they're now a footer row of the same table, so each field (role, resource, allocation, date window, phase, qty, units, billing) sits directly under its column. Dates stack inside the Window column and the optional PERT inputs tuck under Units.

## [1.0.0] - 2026-06-15

First tagged release. **Kerdos** is feature-complete: the full MVP plus every
post-MVP roadmap item (PERT, margin/tax, scenarios, versioning/baselines, live
cloud price sync, multi-currency, comments, dashboard, SSO, Statement of Work,
governance workflow + smart checklist, and database-driven reference data). The
entries below — grouped by theme and sprint — are the work that shipped to reach
1.0.0.

### Database-driven enum labels — FE-54 / FR-29

#### Changed
- **Rate unit, cloud provider, cloud price unit, and checklist severity/scope labels now come from the reference data.** These dropdowns and table cells previously showed hard-coded text (often the bare code, e.g. "HOUR", "AWS", "BLOCKER"); they now resolve their display label from the DB reference tables via `useRefLabeler(typeCode)`, so an admin can rename a label in **Reference data** with no code change. The enum **codes stay code-coupled** (behavioral); only the labels are data-driven. A hard-coded code list remains as a graceful fallback until the reference values load. (Affects Rate cards, Cloud prices, and the Checklist-rule editor.)
- **Role labels now come from the reference data too.** The user-management role pickers, the Roles & permissions matrix (summaries + column headers), and the header role badge resolve their label from the `ROLE` reference type (e.g. `ADMIN` → "Administrator"). The role **code** still drives RBAC; `ROLE_LABELS` remains the pre-load fallback. This completes the label migration for the configurable enums — the remaining ones (billing period, role, provider, severity) stay code-coupled by design because a new *value* there needs new behavior, but their **labels** are now all data-driven.

#### Fixed
- **Seeded reference values now cover every catalog value** (FR-29): added the missing `SAAS` value to `CLOUD_PROVIDER` (the catalog already ships SaaS rows) and `GB` to `CLOUD_PRICE_UNIT`, so the provider filter and the price table label them correctly instead of falling back to the bare code.

### Web delivery — cache headers (NFR-7)

#### Changed
- **Correct browser caching for the SPA** (#69): nginx now serves `index.html` with `Cache-Control: no-cache` (always revalidate, so a new deploy is picked up immediately) while the content-hashed `assets/*` are served `immutable` with a one-year max-age. Prevents users from getting a stale shell pointing at old/removed bundles after a release.

### Estimate-governance repos — workflows & checklist rule sets (FR-24, FR-25)

#### Added
- **Workflow + transition repo** (#54): keep a repository of approval workflows. Each `WorkflowDefinition` and `WorkflowTransition` gets a **system-assigned key** (`WF-…` / `TR-…`) behind the scenes plus an admin-typed label + description; add/update/delete is **Admin-only**. New `/workflows` repo page → per-workflow stage/transition editor. Migration `20260614030000` (data-preserving key backfill, verified no drift).
- **Checklist rule-sets repo** (#55): a `ChecklistRuleSet` (system key `RS-…` + label/description) groups `ChecklistRule`s; Admin CRUD at `/checklist-rules` → per-set rule editor. The **default set** drives evaluation, so behaviour is unchanged. Migration `20260614040000` (seed default set + backfill all rules + FK, verified no drift).

### Statement of Work → official PDF (BR-7)

#### Added
- **Editable Statement of Work** (#56): a new **SOW** menu item. Compose a SOW from an estimate, edit every section (parties, scope, deliverables, timeline, payment terms, assumptions, terms & conditions), then **Print / Save as PDF** with signature blocks. A system number (`SOW-…`) is assigned; **Issue** locks the document and **snapshots its pricing** (immutable), **Revert** reopens. New `statements_of_work` table (migration `20260614050000`, verified no drift).
- **Visible save feedback** (#63): the SOW editor shows **"Saving… / ✓ Saved / ● Unsaved changes"** plus a **"last saved"** time, and the Save button disables when there's nothing to save.

#### Changed
- **Only approved estimates can start a SOW** (#64): the source picker lists only estimates at an **Approved/Final** workflow stage (reaching which already required the smart checklist to pass), and `POST /sow` enforces it **server-side** (deny-by-default). New `GET /sow/eligible-estimates`; an empty-state hint when nothing qualifies; the seed ships one approved sample estimate.

### Smart checklist — honest states, "To do", + manual re-check (FR-25)

#### Changed
- **Per-line rules show "N/A" instead of a vacuous green** (#65): labor / cloud / non-labor / resource / billing-period rules report **"nothing to check yet"** when there are no applicable lines, so a green ✓ means *verified*. N/A items **don't block** and are **excluded from completeness**, so a brand-new estimate no longer looks ~complete — its real blockers (rate card, line items) stay red.

#### Added
- **"↻ Re-check" button + "last checked" time** on the Smart-checklist panel (#65). The checklist still auto-re-evaluates on every edit; the button adds confidence and picks up shared-data changes (a rule or rate card edited elsewhere).

#### Fixed
- **No green checks on an untouched estimate** (#67): a freshly created estimate showed some rules already passing (vacuously) before any work was done. Such rules now report **N/A / pending** until there's something real to verify, so an unworked estimate has **zero green** checklist items. Locked in by an e2e test asserting a brand-new estimate surfaces no green checklist items (#68).

#### Changed
- **"N/A" replaced by an actionable "To do" state.** Users read "N/A" as "doesn't apply / ignore me", but those items *are* applicable — they just haven't been started. Not-started rules now render as an amber **○ "To do"** with the **next step to take** ("To do: add labor lines and assign each a role", "Set a global upcharge %", …) and a **"How?"** guide link, and they're **clickable** to jump to the section where you'd start them. Red **✕** is now reserved for things you entered that are actually wrong/incomplete. A small legend (**Done · Needs fixing · To do**) explains the three states. Completeness/blocking are unchanged — a "To do" still neither blocks nor inflates progress, so a brand-new estimate reads as a to-do list at 0%, not "complete" or "broken".
- **Smart-checklist panel polish.** Items are now **ordered by what needs action** — needs-fixing first (blockers before warnings), then to-do, then done — so the top of the list is always what to do next. Added a **completeness progress bar** and an at-a-glance **count summary** ("N to fix · M to do · K done"), and a subtle **"blocks"** tag on the failing items that actually gate a workflow transition (a failing BLOCKER), so it's obvious which reds are stopping approval.

### Rebrand to Kerdos by Veridion LLC, and professional navigation

#### Changed
- **Grouped top navigation** (#57): the ~15-item strip became **3 primary links + 4 dropdown menus** (Pricing / Governance / Admin / Docs) with active-route highlighting, hover/click-outside behaviour, admin-gating, and a polished header (role pill + bordered Log out). The Statement-of-Work nav label was shortened to **SOW** (#58).
- **Product renamed to Kerdos** (#59, #60): dropped the `cost-reaper` codename from the UI — header, login screen, browser title, Swagger title, and the User/Estimation/Help guides now read **Kerdos**, by **Veridion LLC** (subtitle, login lockup, and a new app footer). Repo / package / container names keep `cost-reaper` as the internal codename.
- **Official Veridion logo** (#61, #62): the brand mark is now the official amber Veridion "V" (transparent PNG sourced from veridion.com) in the header, login, and favicon — adapting cleanly to both the teal header and the white login.

### Smart-checklist navigation + rate-card selector (FR-25 UX)

#### Added
- **Clickable smart-checklist items**: each item now jumps the editor to the section where it's fixed and briefly **highlights** it (e.g. clicking "✕ Select a rate card for the estimate" scrolls to Settings; labor/cloud/non-labor and resource-capacity items jump to their sections). Mapped by rule key, with a scope fallback.
- **Rate-card selector in the estimate editor** (Settings): pick/change the estimate's rate card directly — previously there was no in-editor control, so the `rate_card_selected` blocker couldn't be cleared from the estimate screen. Selecting one clears the blocker (verified live). Section anchors added throughout the editor.

### Live cloud price fetch — real AWS/GCP/Azure integration (FR-21a)

#### Changed
- The `PricingProvider` stub is now **real provider integrations**:
  - **Azure** — live, no-auth pull from the **Retail Prices API** (filters VM SKUs by region; matches Linux on-demand hourly prices). Verified live (sync round-trips to `prices.azure.com`, matched rows stamped `source: AZURE_API`).
  - **AWS** — **SigV4-signed** call to the **Price List Query API** (`GetProducts`, EC2 on-demand), activated when `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` are set. No SDK dependency (signing via `node:crypto`).
  - **GCP** — **Cloud Billing Catalog API**, activated when `GCP_BILLING_API_KEY` is set; computes per-instance price from the separate Core + RAM SKUs.
- Each provider has a **pure, unit-tested response mapper** (Azure/AWS/GCP); network calls have a 12s timeout and **fall back to the catalog** on any error or missing credentials (estimate snapshots untouched, NFR-14). `sync` now updates matched rows' unit price + `source` and re-stamps `fetched_at`. `docker-compose` passes the optional cloud credentials through. No migration.

### Multi-currency / FX rates (FE-12, FR-17)

#### Added
- **FX rates** for multi-currency roll-ups: a seeded `fx_rates` table (USD base + EUR/GBP/CAD/AUD/JPY), `GET /fx-rates`, and admin upsert `PATCH /fx-rates/:currency` (audited). New admin **FX rates** page to view/edit rates.
- The **dashboard** now converts every currency's grand total to the base currency (USD) via FX and shows a **Total (USD equivalent)** card (exact decimal `scaleMoney`). Migration `20260613150000_fx_rates` (verified fresh-deploy + no drift). Verified live (rates listed, base total computed, admin update audited).

### Excel export (FE-22, FR-20)

#### Added
- **Export Excel** button on the estimate editor: `GET /estimates/:id/export-excel` returns a spreadsheet (`application/vnd.ms-excel`, `.xls`) — line items, all totals, client pricing, and the per-SDLC-phase summary — that opens natively in Excel/Sheets. Dep-free (HTML-table workbook); shares one export-data builder with the CSV export. **PDF** export is covered by the **Printable summary** (browser Print → Save as PDF). Verified live.

### Security hardening (FE-31, OWASP)

#### Added
- **Security response headers** on every API response (dep-free middleware): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy`, `Permissions-Policy`, and `Strict-Transport-Security` in production; `X-Powered-By` removed.
- **Brute-force throttle** on the credential endpoints (`/auth/login`, `/auth/register`): an in-memory per-IP limiter returns `429` past a generous threshold. Complements the existing argon2 hashing + deny-by-default RBAC. Verified live (headers present, login still 200). No deps, no migration.

### Cloud price refresh + per-provider "last pulled" (FE-40, FR-21a/b)

#### Added
- **Per-provider "last pulled" freshness** (FR-21b): `GET /cloud-prices/last-pulled` and a small table on the Cloud Prices screen showing each provider's last-pulled date (`MM/DD/CCYY`) + price count.
- **Admin-triggered price refresh** (FR-21a): `POST /cloud-prices/sync` (admin) re-stamps the catalog's `fetched_at` via a **`PricingProvider` strategy seam** (AWS/GCP/Azure; the live provider-API fetch — AWS Price List / Azure Retail / GCP Billing — is a future drop-in, currently stubbed to echo the catalog). **Saved-estimate price snapshots are never altered** (NFR-14). A **Refresh prices** button on the Cloud Prices screen (admin) triggers it. Verified live (AWS sync → today; others unchanged). No migration (uses existing `fetched_at`).

### Versioning — baselines & diff (FE-25, FR-15)

#### Added
- **Baselines**: capture an immutable, labelled snapshot of an estimate (full detail + denormalized totals) at a point in time, and **diff** it against the current estimate. The editor's **Baselines & versions** panel shows each baseline's grand total and the **Δ vs current**. `POST/GET/DELETE /estimates/:id/baselines`. New `baselines` table (migration `20260613140000_baselines`, verified fresh-deploy + no drift). Verified live (v1=1000 stays fixed; after edits current=1500 → Δ +500).

### Scenarios (FE-24, FR-14)

#### Added
- **Scenarios** — create linked **variants** of an estimate and **compare** them side by side. "Create scenario" clones the estimate (with its line snapshots) and links it to a shared root via `scenario_of_id` (migration `20260613130000_scenarios`, verified fresh-deploy + no drift). `GET /estimates/:id/scenarios` returns the whole group (root + variants) with grand total + client price; `POST /estimates/:id/scenarios` creates one. The editor gains a **Scenarios — compare** panel. Clones (non-scenario) are unaffected.

### Collaboration — comments (FE-28, FR-19)

#### Added
- **Comments on estimates**: any authenticated user can post comments (author email + timestamp captured); the **author or an admin** can delete. Surfaced as a **Comments** panel in the estimate editor and returned on the estimate detail. New `comments` table (migration `20260613120000_comments`, verified fresh-deploy + no drift); endpoints `POST/DELETE /estimates/:id/comments`. Clones do not copy comments.

### FE-54 (part 2) — estimate status data-driven (FR-29)

#### Changed
- **Estimate `status` is no longer a hard-coded enum.** Dropped the Prisma/Zod `EstimateStatus` enum; the `status` column is now `TEXT` (migration `20260613110000_estimate_status_data_driven` converts in place, preserving values + the index). Status is **validated server-side against the active `ESTIMATE_STATUS` reference values**, and the editor's status dropdown loads from reference data. An admin can add a status (e.g. "Archived") with no code change — verified live (FINAL ok, BOGUS → 400, admin-added ARCHIVED usable).

### Margin & tax — client pricing (FE-20, FR-16)

#### Added
- **Estimate-level margin and tax** to produce a client-facing price. The engine takes the grand-total **cost** and computes **sell price = cost / (1 − margin%)**, then **client price = sell × (1 + tax%)**, exposing `marginAmount`, `sellPrice`, `taxAmount`, `clientPrice`. Surfaced in the editor (Margin %/Tax % settings + a client-price card shown when either is set) and the CSV export. Migration `20260613100000_margin_tax` (2 columns, default 0; verified fresh-deploy + no drift). Verified live (20%/10% on 1000 → 1375).

### Three-point / PERT estimation (FE-19, FR-13)

#### Added
- **Three-point estimation on labor lines**: optional **optimistic / most-likely / pessimistic** units. When all three are set, the line's **effective units = PERT expected value** `(o + 4·m + p) / 6` (pure engine `pert`), and that's what drives the line total and all roll-ups. Validated (all-or-none; `o ≤ m ≤ p`). Stored alongside the raw three points (migration `20260613090000_pert_three_point`, 3 nullable columns; verified fresh-deploy + no drift). Editor labor form gained the three optional inputs. Verified live (2/4/12 → units 5, total 1050).

### Docs — user guide & runbook (FE-36, FE-37)

#### Added
- **`docs/USER_GUIDE.md`** — end-user walkthrough: roles, sign-in, preparing reference data (rate cards, categories, cloud prices), building an estimate (labor/non-labor/cloud, resource allocation, SDLC phase, upcharge/contingency, totals), governance (workflow + smart checklist gates), search, **CSV export & printable summary**, dashboard, clone.
- **`docs/RUNBOOK.md`** — operate & deploy: architecture, prerequisites, configuration (`.env`), scripted bring-up, the operational scripts, health/readiness, migrations, seeding, **backup/restore** (`pg_dump`/`pg_restore`), rollback, observability, security ops, troubleshooting.
- Linked both (plus architecture/database/API/ADRs/HTML docs) from a new **Documentation** section in `README.md`.

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

[Unreleased]: https://github.com/govmed/cost-reaper/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/govmed/cost-reaper/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/govmed/cost-reaper/releases/tag/v1.0.0
