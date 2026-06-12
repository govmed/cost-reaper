# ADR-0004 — Modularity in code, trunk-based in git

- **Status:** Accepted (2026-06-12)
- **Context:** The application must be **highly modular** (NFR-15). The remote repo arrived with empty, misleadingly named per-component branches (`api`, `postgres`, `documentation`) — an attempt to model architecture as git branches, which is an antipattern that causes drift and merge pain.
- **Decision:** Express modularity in the **code structure** — monorepo packages (`apps/web`, `apps/api`, `packages/types`, `packages/engine`, `packages/config`) plus NestJS feature modules per bounded context, communicating only through shared typed contracts, with strategy interfaces for pluggable concerns (`PricingProvider`, `Exporter`, `WorkflowEngine`, `ChecklistEngine`). Use **trunk-based git**: short-lived feature branches → PR into `main`. The stale placeholder branches were deleted (with human approval); `main` is the single trunk.
- **Consequences:** Clean history, easy review, no branch drift. New modules/providers slot in behind their interface without touching unrelated code.
