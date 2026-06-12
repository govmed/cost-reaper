# ADR 0007 — Database-driven reference data (no hard-coded lookups)

- **Status:** Accepted (implementation scheduled — EP-13 / roadmap Sprint 11)
- **Date:** 2026-06-12
- **Requirements:** FR-29, NFR-17

## Context

The application uses many reference/lookup values: SDLC phases, estimate statuses,
billing periods, rate units, cloud providers, cloud price units, non-labor types,
roles, cost categories, checklist scopes/severities, workflow stage keys — and the
business wants room to add more (priorities, resource types, testing phases/types,
document types, …). Today these are encoded as **Prisma enums + Zod enums + TS
constants**. That couples business labels, sequencing, and active/inactive state to
the source tree: renaming a label, re-ordering, deactivating, or adding a value
requires a code change, recompile, migration, and redeploy. That is a maintainability
risk for values that change over time, and it scatters the same list across the DB
schema, the API contract, validation, the UI, reports, and workflow logic.

## Decision

Introduce a **generic reference-data platform**: two tables drive every configurable
lookup.

- **`reference_type`** — the catalog of reference _kinds_ (e.g. `SDLC_PHASE`,
  `ESTIMATE_STATUS`, `WORKFLOW_STAGE`, `TESTING_PHASE`, …).
- **`reference_value`** — the values themselves, with the mandatory columns the
  business specified: **id, code, display_name, description, display_order,
  is_active, created_by, created_at, updated_by, updated_at**, plus a
  **`parent_id` self-FK** for grouped/hierarchical values (SDLC phase → tasks,
  testing phase → testing types, workflow category → statuses) and an optional
  `metadata_json`. Unique on `(reference_type_id, code)`.

The application loads active values **ordered by `display_order`**, caches them, and
resolves by `code`. Validation accepts **any active value** of the relevant type
rather than a fixed code list. Baseline values are populated by **idempotent seed
scripts** at deploy. Reference values are read consistently across UI, API,
validation, reports, dashboards, and workflow processing.

## Consequences

- Adding/renaming/re-sequencing/deactivating a reference value becomes a **data
  change** — no recompile or redeploy (NFR-17).
- Existing enums (`SdlcPhase`, `EstimateStatus`, `BillingPeriod`, `RateUnit`,
  `CloudProvider`, `CloudPriceUnit`, `NonLaborType`, `Role`, `ChecklistSeverity`,
  `ChecklistScope`, workflow stage keys) are **migrated to `reference_value` rows**
  in a dedicated increment (EP-13). Line items keep their `code` string but
  FK/validate against the reference table; **price/rate snapshots on saved estimates
  remain immutable**.
- A thin caching read-layer is needed so per-request DB lookups don't regress
  performance (NFR-1); cache is invalidated on reference-data writes.
- Type-safety trade-off: codes become strings validated at runtime rather than
  compile-time enums. Mitigated by a typed reference-data client + tests.

## Interim note

`SdlcPhase` was introduced as an enum in Sprint 10 (FR-27/FR-28) ahead of this
platform. It is explicitly **interim** and slated for migration under FE-54. Do not
add further hard-coded reference lists without recording the debt against FR-29.
