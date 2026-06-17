# ADR 0009 — Estimates are edit-locked outside the Draft stage

**Status:** Accepted · **Date:** 2026-06-17 · **Requirements:** FR-24 (workflow), FR-25 (checklist), NFR-16 (server-side access control)

## Context

The estimate approval workflow (FR-24) moves an estimate **Draft → In Review → Approved → Final → Archived**. Reviewers approve a _specific_ artifact, and downstream documents (the Statement of Work, BR-7) snapshot an **approved** estimate. But the API allowed content edits in **any** stage: an estimate in _In Review_ still accepted labor/non-labor/cloud line changes, settings changes, and deletes. That means the numbers a reviewer approves can change underneath them — a governance and auditability gap.

A user surfaced it: _"If it's in Submit for Review shouldn't the Estimate be locked until it is approved or returned to draft?"_ Reproduced: an estimate forced to `IN_REVIEW` accepted `POST /labor-items` (201) and `PATCH` settings (200).

## Decision

**An estimate's content is editable only while it sits in its workflow's _initial_ stage (Draft).** Once it leaves Draft it is **read-only** until it transitions back to Draft (rejection/reopen) or onward (Approved/Final/Archived stay locked).

- **Enforced server-side** (NFR-16, the source of truth): a private `ensureEditable()` guard in `EstimatesService` loads the estimate's `currentStage` and throws **409 Conflict** with an actionable message (`This estimate is locked while in "In Review". Return it to Draft to make changes.`) when the stage is not the initial one. It guards every content mutation: `update` (settings/name/status), `addLabor`/`deleteLabor`, `addNonLabor`/`deleteNonLabor`, `addCloud`/`deleteCloud`, `addAssumption`/`deleteAssumption`.
- **Intentionally NOT locked:** workflow **stage transitions** (you must be able to return to Draft or approve), **comments** (reviewers discuss a locked estimate), **clone**, **scenarios**, **baselines**, reads/exports.
- **Editability is exposed** on the estimate detail as `editable: boolean` so the UI reflects it: a lock banner, and the add-row forms / delete buttons / settings inputs are hidden or disabled outside Draft.

"Editable = the workflow's initial stage" reuses the existing `WorkflowStage.isInitial` flag, so **no migration** is required and it honours the data-driven workflow (FR-24): whatever stage a custom workflow marks initial is the editable one.

## Consequences

- Approved/in-review estimates are now immutable content-wise — what a reviewer approves is what stays (strengthens BR-3 auditability and the SOW snapshot guarantee).
- To edit a submitted estimate you must move it back to Draft (a recorded, role-gated `WorkflowTransitionEvent`), leaving an audit trail of the reopen.
- **Trade-off / future work:** a workflow that wants _multiple_ editable stages (e.g. a distinct "Revisions" stage) isn't expressible with `isInitial` alone — that would need a per-stage `isEditable` flag (small additive migration + a toggle in the workflow editor). Deferred until needed.

## Verification

Live: Draft edits 201 → forced to In Review → add/patch/delete all **409**, comments still 201 → Approved **409** → back to Draft **201** again; `editable` flips true/false/true. Regression: labor API matrix 41/41, Playwright smoke 13/13, `nest build` + `vite build` clean.
