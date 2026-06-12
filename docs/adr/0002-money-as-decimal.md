# ADR-0002 — Money as exact decimals, never floats

- **Status:** Accepted (2026-06-11)
- **Context:** Financial estimates must be exact and auditable (NFR-5, NFR-14). Floating point introduces drift.
- **Decision:** Store money as PostgreSQL `NUMERIC(18,4)` (cloud unit prices `NUMERIC(18,6)`) via Prisma `Decimal`. Transport money as a decimal **string** in the Zod contract. The estimation engine computes with `decimal.js` (ROUND_HALF_UP) and only rounds final outputs to the configured scale. Estimates snapshot the rate / unit price used.
- **Consequences:** No float math anywhere in the money path. The engine is pure and exhaustively tested. Slightly more ceremony converting at boundaries — worth it for correctness.
