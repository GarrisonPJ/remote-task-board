# Database Migration & Seed Policy

> Rules for managing Prisma migrations and seed data across development, CI, and production environments.

---

## Migration Commands by Environment

| Environment | Command | Notes |
|---|---|---|
| Development | `prisma migrate dev` | Creates and applies migrations. Safe for local work. |
| CI (Testing) | `prisma migrate deploy` | Runs automatically before tests in GitHub Actions. Applies only existing migrations. |
| Production | `prisma migrate deploy` | **Never** use `migrate dev` in production. Only apply pre-generated migrations. |

## Seed Data

The seed script (`prisma/seed.ts`) creates demo accounts:

| Email | Password | Role |
|---|---|---|
| `alice@test.com` | `password123` | OWNER |
| `bob@test.com` | `password123` | MEMBER |

Run via: `pnpm db:seed`

- **Development / Staging**: Seed is safe and expected.
- **Production databases**: Do NOT seed. The demo accounts and sample data are not appropriate for real production environments.
- **CI runs**: The seed script runs after `migrate deploy` in the CI pipeline to populate the test database with known state.

## Rollback Strategy

Prisma migrations are forward-only. The `prisma migrate dev` create/apply cycle does not generate down migrations.

To roll back a deployed migration:

1. Write a **new migration** that reverses the schema change (e.g., `ALTER TABLE ... DROP COLUMN`).
2. Test the reversal locally using `prisma migrate dev`.
3. Deploy the reversal migration via `prisma migrate deploy`.

### Migration Testing Process

Before deploying a migration to production:

1. Apply the migration to a staging environment with a recent production database dump.
2. Verify the application boots and all E2E tests pass against the migrated schema.
3. Confirm no data loss by reviewing the generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql`.

## Backup

Before each production deploy that includes a migration, run:

```bash
pg_dump --no-owner --clean --if-exists \
  --file=pre-deploy-backup-$(date +%Y-%m-%d-%H%M).sql \
  $DATABASE_URL
```

Store backups in a secure, off-database location (e.g., S3 with server-side encryption).

## Scripts Reference

```bash
pnpm prisma:generate    # Generate Prisma Client (dev + CI)
pnpm prisma:migrate     # prisma migrate dev (local only)
pnpm db:seed            # Seed demo data (dev/staging/CI only)
```
