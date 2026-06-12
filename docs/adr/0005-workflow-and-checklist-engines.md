# ADR-0005 — Configurable workflow engine + rule-based smart checklist

- **Status:** Accepted (2026-06-12)
- **Context:** Estimates need a **customizable approval workflow** (FR-24) and an **automated smart checklist** that ensures resource-assignment, pricing, and costing steps are all met before an estimate advances (FR-25).
- **Decision:** Model both as modular, data-driven engines (NFR-15):
  - **`WorkflowEngine`** — `WorkflowDefinition` → `WorkflowStage` → `WorkflowTransition` (role-gated, `requiresChecklistPass`). Each estimate tracks `currentStage` and an append-only `WorkflowTransitionEvent` history. A seeded **default workflow** (Draft → In Review → Approved → Final → Archived) ships; admin authoring of stages/transitions follows per roadmap.
  - **`ChecklistEngine`** — evaluates active `ChecklistRule`s (key, severity, scope) against an estimate's lines on demand; results need not be persisted. A failing **BLOCKER** rule blocks any transition with `requiresChecklistPass = true`.
- **Consequences:** Governance is configurable, not hard-coded. Checklist gates the workflow, enforcing completeness. Interpretation logged: "workflow" = the estimate approval/review lifecycle (revisit if the user meant a build wizard).
