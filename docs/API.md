# API guide

Base URL: `http://localhost:8000/api/v1` · Interactive docs (Swagger UI): `http://localhost:8000/docs`
· Health: `http://localhost:8000/health`, `/ready`.

All errors are **RFC 7807** `application/problem+json`. All inputs are validated server-side (Zod).

## Authentication (FR-1)

JWT Bearer. Obtain tokens, then send `Authorization: Bearer <accessToken>` on protected routes.

| Method | Path             | Auth   | Body                                     |
| ------ | ---------------- | ------ | ---------------------------------------- |
| POST   | `/auth/register` | public | `{ email, password (≥8), displayName? }` |
| POST   | `/auth/login`    | public | `{ email, password }`                    |
| POST   | `/auth/refresh`  | public | `{ refreshToken }`                       |
| POST   | `/auth/logout`   | bearer | — (stateless; client discards tokens)    |
| GET    | `/auth/me`       | bearer | —                                        |

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

| Method | Path         | Body                                       |
| ------ | ------------ | ------------------------------------------ |
| GET    | `/users`     | —                                          |
| POST   | `/users`     | `{ email, password, role?, displayName? }` |
| PATCH  | `/users/:id` | `{ role?, isActive?, displayName? }`       |
| DELETE | `/users/:id` | —                                          |

## Rate cards (FR-3)

Read: any authenticated user. Write: `ADMIN`.

| Method | Path              | Body                                                               |
| ------ | ----------------- | ------------------------------------------------------------------ |
| GET    | `/rate-cards`     | —                                                                  |
| GET    | `/rate-cards/:id` | —                                                                  |
| POST   | `/rate-cards`     | `{ name, currency, roles: [{ roleName, unit: HOUR\|DAY, rate }] }` |
| PATCH  | `/rate-cards/:id` | `{ name?, isActive? }`                                             |
| DELETE | `/rate-cards/:id` | —                                                                  |

Rates are exact decimals (strings on the wire). Create/modify actions are audited (FR-11).

## Cloud price catalog (FR-21, FE-38)

Read-only (any authenticated user). The seeded AWS/GCP/Azure catalog.

| Method | Path                | Query                                                |
| ------ | ------------------- | ---------------------------------------------------- |
| GET    | `/cloud-prices`     | `provider?`, `region?`, `service?`, `skuOrInstance?` |
| GET    | `/cloud-prices/:id` | —                                                    |

## Estimates (FR-4..FR-10, FR-22, FR-23)

Read: any authenticated user. Write (`POST`/`PATCH`/`DELETE`/line items): `ADMIN` or `ESTIMATOR`.

| Method | Path                    | Notes                                                                          |
| ------ | ----------------------- | ------------------------------------------------------------------------------ |
| GET    | `/estimates`            | list; `q`, `status`, `ownerId`, `page`, `pageSize`                             |
| POST   | `/estimates`            | `{ name, currency, rateCardId?, globalUpchargePercent?, contingencyPercent? }` |
| GET    | `/estimates/:id`        | detail: lines + assumptions + computed totals                                  |
| PATCH  | `/estimates/:id`        | partial update (incl. `status`, upcharge, contingency)                         |
| DELETE | `/estimates/:id`        |                                                                                |
| POST   | `/estimates/:id/clone`  | deep copy (lines + assumptions)                                                |
| GET    | `/estimates/:id/totals` | engine result: one-time / monthly / yearly / grand + category subtotals        |
| GET    | `/estimates/:id/export` | CSV download                                                                   |

Line items & assumptions (all `POST` add / `DELETE` remove):

| Path                             | Body (add)                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/estimates/:id/labor-items`     | `{ rateCardRoleId?, units, quantity?, rateSnapshot?, billingPeriod?, upchargePercentOverride? }` |
| `/estimates/:id/non-labor-items` | `{ category, amount, type?, periods?, billingPeriod?, upchargePercentOverride? }`                |
| `/estimates/:id/cloud-items`     | `{ cloudPriceId, quantity?, usageHoursPerMonth?, billingPeriod?, upchargePercentOverride? }`     |
| `/estimates/:id/assumptions`     | `{ text }`                                                                                       |

**Calculation order** (single engine): base line value → effective upcharge (per-line override beats global) → category subtotals → contingency on the upcharged subtotal → grand total. Recurring lines roll up to monthly **and** yearly (×12). Labor/cloud snapshot the rate / unit price so saved estimates never change when catalogs refresh.
