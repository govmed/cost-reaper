# Contributing to cost-reaper

## Branching model — trunk-based (ADR-0004)

Modularity lives in the **code structure** (monorepo packages + NestJS feature modules + strategy
interfaces), **not** in long-lived per-component branches. We use **trunk-based development**:

- `main` is the single, always-shippable trunk.
- Each unit of work gets a **short-lived feature branch** off `main`, e.g.
  `feature/ep4-labor-line-items`, `fix/estimate-rounding`, `chore/ci-cache`.
- Open a **Pull Request into `main`**. CI (lint → typecheck → test → build) must be green.
- Keep branches small and merge often to avoid drift.

Do **not** create long-lived branches per layer/component (`api`, `postgres`, …) — that fights
modularity and causes integration pain.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) and **reference requirement / feature
IDs** so work stays traceable (CLAUDE.md Sections 4–6):

```
feat(estimates): add labor line items with rate snapshot  (FR-5, FE-14)
fix(engine): round contingency after upcharge             (FR-7, FR-22)
chore(ci): cache pnpm store
```

Scopes mirror modules: `auth`, `users`, `rate-cards`, `estimates`, `cloud-pricing`, `workflow`,
`checklist`, `export`, `audit`, `engine`, `types`, `web`, `ci`, `docs`.

## Code style

- TypeScript everywhere; shared contracts live in `packages/types` (Zod) — the single source of truth.
- `pnpm format` (Prettier) and `pnpm lint` (ESLint) must pass; CI enforces `format:check` + `lint`.
- The estimation engine (`packages/engine`) is **pure** (no I/O) and must stay dependency-light.

## Tests

- Unit-test business logic; the estimation engine has exhaustive unit tests (NFR-6, ≥80% on business logic).
- API changes need integration tests (Supertest); critical paths get a Playwright smoke test.
- `pnpm test` must pass before opening a PR.

## Definition of Done

Every change must satisfy the **Global Definition of Done** (CLAUDE.md Section 17): tests passing,
migrations reversible, OpenAPI + docs updated, quality gates green, and the three living files
(`CLAUDE.md` Current State, `PROJECT_LOG.md`, `AUDIT_LOG.md`) updated.
