# ADR-0001 — End-to-end TypeScript (React+Vite / NestJS / PostgreSQL / Prisma)

- **Status:** Accepted (2026-06-11)
- **Context:** The product is calculation- and contract-heavy (estimates, rate cards, money), not ML-heavy. We want the web and API to share one money/contract model across the wire and minimize context-switching.
- **Decision:** One language — TypeScript — across the stack. React + Vite (web), NestJS (API), PostgreSQL 16 with Prisma (`Decimal` money), in a pnpm + Turborepo monorepo with a shared `packages/types` (Zod) contract. REST (not GraphQL); two tiers (not Next.js-as-everything); a single modular API (not microservices).
- **Consequences:** Shared Zod schemas are the single source of truth; one toolchain. Revisit only if ML-based estimation becomes a real epic. Recorded in CLAUDE.md Section 9.
