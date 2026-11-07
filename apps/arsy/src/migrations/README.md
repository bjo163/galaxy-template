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

The PostgreSQL CI workflow exercises fresh migration, rollback/re-application,
RLS and grants, migrator lock policy, tenant-scoped transform staging, and
concurrent index create/retire against PostgreSQL 17 and 18. The shared database
package also tests interrupted migration retry and expand-upgrade behavior in
PGlite. This is not yet a full prior-version Arsy schema upgrade or rolling
old/new application deployment test.

The shared Knex migrator currently wraps migrations in transactions. Do not put
`CREATE INDEX CONCURRENTLY` or `DROP INDEX CONCURRENTLY` in these migration
files. Model publication now rejects new or changed indexed-field definitions
rather than executing transactional index DDL, and synchronous revision
validation is capped at 500 records. These are safety guards, not a replacement
for the resumable model/index job lifecycle; see
[`PRODUCTION.md`](./PRODUCTION.md) for the release procedure, recovery rules,
and explicit outstanding gates.

Production migrations must run out-of-band with the dedicated `arsy_migrator`
role. The runtime service must use `arsy_runtime`; application startup must not
silently apply privileged schema changes. Prefer expand/contract changes and a
tested forward-fix path whenever rolling back could affect application data.


## Model revision and index lifecycle

Model changes with existing records should use the lifecycle API rather than attempting a large synchronous publish:

1. Create a draft revision using the model revision endpoint.
2. Call `POST .../revisions/:revision/migration-preview` with declarative `rename`, `set_default`, `remove`, validated `cast`, and explicit enum `map` operations. Preview samples up to 100 records and reports the total record count and index changes.
3. Enqueue the validated plan with `POST .../revisions/:revision/migration-jobs`.
4. Run `pnpm --filter arsy db:lifecycle:work` as the dedicated migrator role. Schedule repeated one-shot invocations until the migration and index jobs reach terminal states.
5. Inspect `GET .../migration-jobs` and `GET .../index-jobs`. Failed migration jobs can be restarted through the migration retry endpoint after the underlying cause is addressed; it clears staged payloads and resets associated failed index-build attempts. A failed post-publication index retirement can be retried through the index-job retry endpoint.
6. Publish the revision only after the transform job is ready and every required index build is ready. Index retirement jobs run after cutover.

Transforms are deterministic JSON operations; arbitrary JavaScript is never evaluated. Backfilled payloads are staged separately and become live in the publication transaction. Record writes are rejected with HTTP 409 while a migration is queued/running; reads continue against the active revision. Publication performs a single cutover transaction, so large models still require a maintenance/lock-duration assessment before production use.

Online index jobs use PostgreSQL `CREATE INDEX CONCURRENTLY` and `DROP INDEX CONCURRENTLY` outside Knex transactions. The worker persists attempts and status, resumes interrupted building/retiring jobs, and verifies `pg_index.indisvalid` before a create job is marked ready.
