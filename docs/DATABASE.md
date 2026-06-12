# Database

PostgreSQL 16, accessed via **Prisma**. Schema: `apps/api/prisma/schema.prisma`. Monetary values are
exact decimals (`NUMERIC`), never floats (NFR-5). All timestamps UTC.

## Migrations

Versioned SQL migrations live in `apps/api/prisma/migrations/`. The first, **`0_init`**, creates the
full MVP schema (15 tables + 10 enums + FK constraints + indexes).

- **Apply** (fresh install or upgrade): `./scripts/migrate.sh` (runs `prisma migrate deploy` in the
  `api` container). `setup.sh` runs this automatically.
- **Create a new migration** after editing `schema.prisma`:
  ```bash
  docker compose up -d db
  docker compose run --rm api pnpm exec prisma migrate dev --name <change>
  ```
  Commit the generated `migrations/<timestamp>_<change>/` folder.

The committed migrations are the source of truth for production. `prisma db push` is only a dev
fallback used by `setup.sh`/`migrate.sh` when **no** migration files exist yet — now that `0_init`
exists, those scripts use `migrate deploy`.

### Baselining an existing (db-push) database

If a database was provisioned with the earlier `db push` baseline (tables already exist but
`_prisma_migrations` is empty), mark the initial migration as already applied instead of re-running
it (which would fail on existing tables):

```bash
docker compose run --rm api pnpm exec prisma migrate resolve --applied 0_init
```

Fresh databases need nothing special — `migrate deploy` applies `0_init`.

## Schema overview

Entities: `User`, `RateCard` (+ `RateCardRole`), `CloudPrice`, `Estimate` (+ `LaborLineItem`,
`NonLaborLineItem`, `CloudComputeLineItem`, `Assumption`), `WorkflowDefinition` (+ `WorkflowStage`,
`WorkflowTransition`, `WorkflowTransitionEvent`), `ChecklistRule`, `AuditEvent`. FK constraints
throughout; estimates **snapshot** labor rates and cloud unit prices so saved estimates never change
when catalogs are refreshed (NFR-5, NFR-14). Full data model: `CLAUDE.md` Section 10.

## Backup / restore

```bash
# backup
docker compose exec db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup.sql
# restore (into a running database)
cat backup.sql | docker compose exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

The `db_data` Docker volume persists data across restarts; `docker compose down -v` wipes it.
