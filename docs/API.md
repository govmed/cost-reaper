# API guide

Base URL: `http://localhost:8000/api/v1` · Interactive docs (Swagger UI): `http://localhost:8000/docs`
· Health: `http://localhost:8000/health`, `/ready`.

All errors are **RFC 7807** `application/problem+json`. All inputs are validated server-side (Zod).

## Authentication (FR-1)

JWT Bearer. Obtain tokens, then send `Authorization: Bearer <accessToken>` on protected routes.

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/auth/register` | public | `{ email, password (≥8), displayName? }` |
| POST | `/auth/login` | public | `{ email, password }` |
| POST | `/auth/refresh` | public | `{ refreshToken }` |
| POST | `/auth/logout` | bearer | — (stateless; client discards tokens) |
| GET  | `/auth/me` | bearer | — |

`login`/`register` return `{ user, accessToken, refreshToken }`. Access token TTL 15 min, refresh 7 days.

```bash
# log in (seeded admin from .env SEED_ADMIN_*)
curl -s -X POST localhost:8000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@example.com","password":"change_me"}'
```

## Roles & access (FR-2, FR-26, NFR-16)

Roles: `ADMIN`, `ESTIMATOR`, `VIEWER`. Authorization is **deny-by-default**, enforced server-side.

## Users — admin only (FR-26)

| Method | Path | Body |
|---|---|---|
| GET | `/users` | — |
| POST | `/users` | `{ email, password, role?, displayName? }` |
| PATCH | `/users/:id` | `{ role?, isActive?, displayName? }` |
| DELETE | `/users/:id` | — |

## Rate cards (FR-3)

Read: any authenticated user. Write: `ADMIN`.

| Method | Path | Body |
|---|---|---|
| GET | `/rate-cards` | — |
| GET | `/rate-cards/:id` | — |
| POST | `/rate-cards` | `{ name, currency, roles: [{ roleName, unit: HOUR\|DAY, rate }] }` |
| PATCH | `/rate-cards/:id` | `{ name?, isActive? }` |
| DELETE | `/rate-cards/:id` | — |

Rates are exact decimals (strings on the wire). Create/modify actions are audited (FR-11).

> Coming next: estimates + line items (labor / non-labor / cloud), the estimation engine
> endpoints (totals with upcharge + contingency, monthly/yearly), CSV export.
