# Labor Line Item — Engineering Audit & Test Evidence

**Scope:** the estimate **labor line item** feature (add-form, estimation engine, persistence, API, security) — triggered by a production defect report: *"I entered 8 units and none of the labors show 8 units."*
**Date:** 2026-06-17 (UTC) · **Build under test:** `main` @ `c589ebd` + fix branch · **Stack:** containerized (db/api/web), migrated + seeded.
**Author personas (CLAUDE.md §2):** QA/Test Engineer, Backend Engineer, Security Engineer, DBA, Release/Tech Lead.
**Evidence:** automated suite `scripts/qa/labor_matrix.py` (41 cases, all green); Playwright UI verification; live DB inspection.

---

## 1. Defect report (the trigger)

| Field | Value |
|---|---|
| **ID** | DEF-LABOR-001 |
| **Title** | Typed "Units" silently discarded; saved labor lines show units = 1 |
| **Severity / Priority** | High (data correctness) / High |
| **Reported** | User: *"I entered 8 units and none of the Labors show 8 units… go look at the database."* |
| **Requirements** | FR-5 (labor line items), FR-13 (PERT), FR-7 (calculation) |
| **Root cause** | When the three **PERT** boxes (optimistic/most-likely/pessimistic) are filled, the engine computes `units = PERT(o,m,p)` and **ignores the plain Units field** (by design). The add-form's success handler **only reset the Role** (`onSuccess: () => setRoleId('')`), so once PERT values were entered they **persisted across every subsequent line add**, silently forcing `units = PERT(1,1,1) = 1` and discarding the typed `8`. No UI signalled that Units was being overridden. |
| **DB evidence** | `Test 01 Estimate` — 3 labor lines, every one `units=1` **and** `units_optimistic=1, units_most_likely=1, units_pessimistic=1`. Contrast: a non-PERT line (`Smoke S10`) correctly stored `units=8`. |
| **Fix** | `apps/web/src/pages/EstimateEditorPage.tsx`: (1) `resetForm()` clears **all** add-row fields (incl. PERT) after a successful add — no stale carry-over; (2) the Units input is **disabled with a "via PERT" hint** whenever PERT is active, so the override is never silent; (3) form hint documents PERT precedence. |
| **Verification** | Playwright: line with PERT(2,4,9) → units **4.5**, Units box disabled; PERT cleared after add; next line typed **8** → units **8**. Automated `TC-L09/L10` + UI regression. |
| **Status** | **Fixed — retested — PASS.** Pre-existing affected rows in `Test 01 Estimate` are stale data (see §8 Known issues). |

---

## 2. Test plan

- **Objective:** prove every labor field and variation behaves to spec; surface any further defects; establish a repeatable regression.
- **Approach:** risk-based + data-driven + boundary + negative + security. API-level (deterministic) as the backbone, UI (Playwright) for the reported flow, DB inspection for integrity.
- **Levels:** unit (engine, existing Vitest), integration/API (this suite), E2E (Playwright smoke), DB review.
- **Environment:** docker-compose stack, seeded admin, standard rate card (PM @ $165/hr).
- **Entry:** stack healthy, migrations applied, seed loaded. **Exit:** 100% of planned cases executed, 0 open High/Critical defects, regression green.
- **Data hygiene:** suite creates and **deletes** its own estimates/rate-cards (teardown).

## 3. Test cases & execution results (41 cases — automated)

Source of truth: `scripts/qa/labor_matrix.py` → **41/41 PASS, exit 0**.

| Group | Cases | Coverage | Result |
|---|---|---|---|
| G1 Units & Quantity | TC-L01..08 | math, decimals, `0` boundary, negative/omitted reject, 1e6 precision | 8/8 ✅ |
| G2 PERT (FR-13) | TC-L09..13 | expected value, PERT-wins, partial reject, ordering o≤m≤p reject | 5/5 ✅ |
| G3 Billing rollups (FR-23) | TC-L14×3, L15 | ONE_TIME / MONTHLY (×12) / YEARLY (÷12); invalid reject | 4/4 ✅ |
| G4 Upcharge (FR-22) | TC-L16..18 | global, per-line override wins, explicit-0 precedence | 3/3 ✅ |
| G5 Contingency/Margin/Tax (FR-7/16) | TC-L19..20 | order base→upcharge→contingency; margin then tax | 2/2 ✅ |
| G6 Capacity (FR-27) | TC-L21..25 | 50+50=100 ok, +60 over-alloc reject, non-overlap ok, date-pair refine | 5/5 ✅ |
| G7 SDLC phase (FR-28/29) | TC-L26..28 | valid accept, invalid/lowercase reject (DB-driven ref) | 3/3 ✅ |
| G8 Snapshot immutability (BR-3/NFR-14) | TC-L29..31 | role snapshot, explicit snapshot, rate-change does not alter saved line | 3/3 ✅ |
| G9 Security/AuthZ/Errors | TC-L32..39 | 401, 404, 400 validation, RFC7807, SQLi, mass-assignment, alloc>100 | 8/8 ✅ |

**Pass/fail summary:** 41 passed / 0 failed / 0 blocked. Two interim FAILs during authoring were **harness** bugs (wrong id field; `"100"` vs `"100.0000"` string compare), corrected — product behavior was correct throughout.

## 4. Requirements traceability matrix (RTM)

| Requirement | Verified by | Status |
|---|---|---|
| FR-5 labor line items | TC-L01..08, UI | ✅ |
| FR-7 calculation/totals | TC-L19, engine units | ✅ |
| FR-13 PERT three-point | TC-L09..13, DEF-LABOR-001 fix | ✅ |
| FR-22 upcharge (global + per-line) | TC-L16..18 | ✅ |
| FR-23 monthly & yearly | TC-L14 (×3) | ✅ |
| FR-27 resource capacity ≤100%/day | TC-L21..25 | ✅ |
| FR-28 cost per SDLC phase | TC-L26 | ✅ |
| FR-29/NFR-17 DB-driven reference | TC-L27..28 | ✅ |
| BR-3 / NFR-14 snapshot immutability | TC-L29..31 | ✅ |
| FR-1/FR-2/NFR-16 authn/authz | TC-L32 | ✅ |
| NFR-4 input validation / injection | TC-L34..37, L39 | ✅ |
| NFR-5 exact decimals | DB §7, TC-L08 | ✅ |
| NFR-9 RFC7807 error contract | TC-L33, L36 | ✅ |
| FR-11 audit trail | DB §7 (audit_events) | ✅ |

## 5. Coverage analysis & gaps

- **Field coverage:** 100% of `LaborLineInput` fields exercised (role, description, quantity, units, rateSnapshot, upchargePercentOverride, billingPeriod, sdlcPhase, resourceName, allocationPercent, start/endDate, PERT triplet).
- **Gaps / follow-ups (low risk):** (a) no automated unit test asserting the UI `resetForm()` (covered by Playwright manual run — recommend adding to `apps/web/e2e/smoke.spec.ts`); (b) concurrency/optimistic-locking on simultaneous edits not tested; (c) performance/load (NFR-1/2) not in scope here.

## 6. Security review (Application Security Engineer)

**Files reviewed:** `apps/api/src/modules/estimates/{estimates.controller,estimates.service}.ts`, `packages/types/src/line-items.ts`, `apps/api/src/common/{pipes/zod-validation.pipe,http/problem-details}.ts`, Prisma data access.
**Method:** OWASP Top-10-oriented DAST against the running API + code review.

### STRIDE threat model (labor write path)
| Threat | Vector | Control | Evidence |
|---|---|---|---|
| **S**poofing | unauthenticated write | JWT Bearer required, deny-by-default guards | TC-L32 → 401 |
| **T**ampering | malformed/over-range input | Zod server-side validation (parse + refine) | TC-L05/07/11/12/13/24/25/34/35/38 |
| **R**epudiation | who changed what | `audit_events` row per write (FR-11) | DB §7 |
| **I**nfo disclosure | error leakage | RFC7807 problem+json, no stack/SQL leak | TC-L36 |
| **D**enial of service | huge payloads | NUMERIC bounds; (rate-limit = follow-up) | TC-L08 |
| **E**lev. of privilege | mass assignment | unknown fields ignored; role/owner not client-set | TC-L39 |

### Findings
| ID | Finding | Risk (CVSS-style) | Remediation | Status |
|---|---|---|---|---|
| SEC-1 | **SQL injection** — payload `Robert'); DROP TABLE…--` stored **literally**, table intact (Prisma parameterized) | **Informational** (control verified) | None — keep parameterized queries (no raw SQL) | ✅ Verified safe |
| SEC-2 | **Mass assignment** — extra/`__proto__` fields ignored by Zod schema | **Informational** | Keep strict DTO parsing | ✅ Verified safe |
| SEC-3 | **AuthN/AuthZ** — write rejected without valid token | **Informational** | Keep guards deny-by-default | ✅ Verified safe |
| SEC-4 | **Error contract** — structured problem+json, no internal leakage | **Low** (good) | n/a | ✅ |
| SEC-5 | No per-endpoint **rate limiting** on write path | **Low** | Add throttling (NestJS Throttler) on mutations | ⚠ Open (backlog) |

**Secrets:** none in source (env-only). **Crypto:** passwords `argon2` hashed (`password_hash`, never plaintext — DB §7). **Residual risk:** **Low** — one Low backlog item (SEC-5). **Exceptions:** none. **Approval:** security-gate PASS for this change.

## 7. Database review (DBA)

| Control | Finding | Req |
|---|---|---|
| Money/exact decimals | `units, quantity, rate_snapshot, line_total = NUMERIC(18,4)`; `allocation_percent = NUMERIC(5,2)` — **no floats** | NFR-5 |
| Referential integrity | FK `estimate_id` → **ON DELETE CASCADE**; `rate_card_role_id` → **ON DELETE SET NULL** (preserves snapshot history) | NFR-5 |
| Indexing | `labor_line_items_estimate_id_idx` supports the dominant filter (lines by estimate) | NFR-1 |
| NOT NULL / defaults | `units, rate_snapshot, line_total` NOT NULL; `quantity` def 1, `allocation_percent` def 100, `billing_period` def ONE_TIME | NFR-5 |
| Audit columns | writes emit `audit_events` (entity, action, actor, occurred_at UTC) | FR-11 |
| Injection safety | post-SQLi-test row count intact (parameterized) | NFR-4 |
| Privacy / PII | `users` holds only email, `password_hash`, display_name, role, flags, timestamps — minimal PII | NFR-11 |

**DBA recommendations (backlog):** consider a composite index `(estimate_id, sdlc_phase)` if phase breakdowns grow; add `created_at` to `labor_line_items` for line-level audit ordering.

## 8. Regression & known issues

- **Regression:** Playwright smoke **13/13 PASS**; engine Vitest **25/25 PASS**; API matrix **41/41 PASS** — after the fix, no regressions.
- **Known data issue (not a code defect):** existing `Test 01 Estimate` lines retain `units=1` + `PERT(1,1,1)` from before the fix. Remediation options: re-enter the lines (PERT now clears) or a one-off data correction. **No schema/code change required.**
- **Open backlog:** SEC-5 (rate limiting); UI reset assertion in e2e; optional composite index.

## 9. Release readiness / Go-No-Go

| Gate | Status |
|---|---|
| Defect fixed + retested | ✅ DEF-LABOR-001 |
| Automated tests green (unit/API/e2e) | ✅ 25 + 41 + 13 |
| Security review | ✅ residual Low |
| DB integrity | ✅ |
| Rollback plan | Revert the single-file UI commit; no migration/data change → instant, risk-free rollback |
| Migrations | none in this change |
| Traceability | ✅ RTM §4 |

**Recommendation: GO** for the fix branch → PR → CI → merge. Residual risk **Low**; only backlog (non-blocking) items remain.
