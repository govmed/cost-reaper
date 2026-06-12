# Architecture — cost-reaper

End-to-end TypeScript, two tiers (web + API) over PostgreSQL, in a pnpm + Turborepo monorepo.
This document is kept current each increment (NFR-12).

## System overview

```
┌──────────────┐      HTTPS/JSON       ┌──────────────────────────┐      SQL      ┌──────────────┐
│   Web (SPA)  │  ───────────────────▶ │   API (NestJS, REST)     │ ────────────▶ │ PostgreSQL16 │
│ React + Vite │  ◀─────────────────── │  controllers→services→   │ ◀──────────── │  (Prisma)    │
│  TanStack    │   /api/v1 + /docs      │  repositories (Prisma)   │   pooled      │  NUMERIC     │
└──────────────┘                        └──────────────────────────┘               └──────────────┘
        │                                          │
        │ served by nginx (prod build)             │ uses pure packages/engine for all money math
        ▼                                          ▼
   packages/types  ◀─── shared Zod contract ───▶  packages/engine (no I/O)
```

- **Two tiers, kept separate** to satisfy FR-12 (a standalone, documented REST API). No Next.js-as-everything; no microservices for MVP (one modular API).
- **Stateless API** → horizontally scalable behind a load balancer (NFR-2); DB connection pooling via Prisma.
- **Containerized**: `docker-compose.yml` defines `db`, `api`, `web`. Runs on Linux & Windows (NFR-7).

## Monorepo modules (NFR-15)

| Package | Role |
|---|---|
| `apps/web` | React + Vite SPA. Tailwind; (TanStack Table/Query + RHF/Zod arrive with the estimate UI). |
| `apps/api` | NestJS REST API. Feature modules under `src/modules/*`: `health` now; `auth`, `users`, `rate-cards`, `estimates`, `cloud-pricing`, `workflow`, `checklist`, `export`, `audit` per roadmap. |
| `packages/types` | The shared **Zod** contract (+ inferred TS types) used by both tiers — the single source of truth across the wire. |
| `packages/engine` | The **pure** estimation engine (no I/O): upcharge → contingency order, monthly/yearly rollups, category subtotals. Exhaustively unit-tested. |
| `packages/config` | Shared Tailwind / tsconfig presets. (ESLint is a single root flat config.) |

**Dependency direction points inward toward the domain.** `engine` depends only on `types`; the API depends on `engine` + `types`; the web depends on `types`. No circular dependencies. Pluggable concerns sit behind strategy interfaces (`PricingProvider`, `Exporter`, `WorkflowEngine`, `ChecklistEngine`).

## Request lifecycle (API)

1. `CorrelationIdMiddleware` assigns/propagates `x-request-id` (NFR-9).
2. Controller validates input (Zod) and delegates to a service.
3. Service runs business logic; money math is delegated to `packages/engine`.
4. Repository (Prisma) performs **parameterized** queries only (Section 16).
5. `LoggingInterceptor` emits one structured JSON log line per request.
6. Errors become **RFC 7807 problem+json** via the global `ProblemDetailsFilter`.

## Data & money integrity (NFR-5, NFR-14)

- Monetary values: PostgreSQL `NUMERIC(18,4)` (`NUMERIC(18,6)` for cloud unit prices) → Prisma `Decimal`. **Never floats.**
- Money crosses the wire as a **decimal string** in the Zod contract.
- Estimates **snapshot** the labor rate and cloud unit price onto each line, so refreshing a rate card or the cloud catalog never changes a saved estimate.
- All schema changes via versioned Prisma migrations; FK constraints throughout.

## How the NFRs are met (foundation)

| NFR | Where |
|---|---|
| NFR-1 Performance | Pure in-memory engine; indexed FKs; pooled DB. |
| NFR-2 Scalability | Stateless API; container-replicable. |
| NFR-3 Reliability | `/health` + `/ready`; healthchecks in compose; idempotent setup/migrate. |
| NFR-4 Security | Secrets via env only; argon2 for the seeded admin; RBAC guards (per roadmap); `pnpm audit` in CI. |
| NFR-5 Data integrity | Decimal money; migrations; FKs; snapshots. |
| NFR-6 Maintainability | Layered modules; ESLint + Prettier + tsc; ≥80% engine coverage. |
| NFR-7 Portability | Docker; `.sh` + `.ps1` scripts; Node-free host. |
| NFR-9 Observability | Correlation ids; structured JSON logs; problem+json errors. |
| NFR-10 Configurability | `.env.example`; all config from env. |
| NFR-15 Modularity | Monorepo packages + feature modules + strategy seams. |
| NFR-16 Access control | Deny-by-default RBAC, server-side (identity module, per roadmap). |

See [`adr/`](adr/) for the decisions behind these choices.
