# Arsy database migrations

Add one TypeScript migration per schema change in this directory. Use a
zero-padded sequential prefix and named `up`/`down` exports:

```ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("example_records", (table) => {
    table.increments("id").primary();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("example_records");
}
```

Migrations run in transactions and use the shared `galaxy_migrations` history
and lock tables. Keep each migration reversible and avoid editing a migration
after it has been applied to a shared environment.

The PostgreSQL CI workflow exercises fresh migration, rollback of the latest
batch, and re-application against PostgreSQL 17 and 18. This is not yet a full
prior-version upgrade, interrupted-migration, or rolling-deployment test.

The shared Knex migrator currently wraps migrations in transactions. Do not put
`CREATE INDEX CONCURRENTLY` or `DROP INDEX CONCURRENTLY` in these migration
files. Model field-index replacement is currently performed during model
publication and is not yet an online/resumable lifecycle; see
[`PRODUCTION.md`](./PRODUCTION.md) for the release procedure, recovery rules,
and explicit outstanding gates.

Production migrations must run out-of-band with the dedicated `arsy_migrator`
role. The runtime service must use `arsy_runtime`; application startup must not
silently apply privileged schema changes. Prefer expand/contract changes and a
tested forward-fix path whenever rolling back could affect application data.
