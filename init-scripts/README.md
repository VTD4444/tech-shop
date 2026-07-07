# Database init (Docker Postgres first boot)

Only optional extensions run here. **Schema is managed by Prisma** (`backend/prisma/migrations`).

- `001-init.sql` — PostgreSQL extensions
- Extended sample data (manual): [`../scripts/sample-data-extended.sql`](../scripts/sample-data-extended.sql)
- Docker backend runs `prisma migrate deploy` and optional `RUN_SEED=true` → `prisma db seed`
