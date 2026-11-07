# Arsy production migration runbook

This runbook describes the safe release procedure for the current migration runner. It is deliberately conservative: a successful migration command is not proof that an application release is compatible with every version that may be serving traffic.

## Current implementation constraints

- Arsy migrations are discovered from compiled JavaScript in `apps/arsy/src/migrations`.
- `pnpm --filter arsy db:migrate` runs the shared Knex migrator using the configured `DATABASE_URL`.
- The shared migrator currently runs migrations in transactions (`disableTransactions: false`). Do not put PostgreSQL commands that are forbidden in a transaction (notably `CREATE INDEX CONCURRENTLY` and `DROP INDEX CONCURRENTLY`) in these migrations.
- The production Compose profile starts the application with the least-privilege `arsy_runtime` connection. It does not run migrations automatically. Run migration commands as the separately provisioned `arsy_migrator` role.
- Model publication validates at most 500 existing records synchronously. Larger models are rejected and require the resumable transform lifecycle. Index-definition changes are rejected with HTTP 409; model publication does not execute index DDL. New/changed indexes remain unavailable until the asynchronous online index-job lifecycle is implemented and verified.
- Model revision publication currently does not provide resumable transform jobs, staged rollout, or a complete forward-fix workflow. Breaking schema changes must not be treated as zero-downtime deployable.

## Required expand/contract sequence

1. **Expand:** add nullable columns/tables/index-compatible structures without removing or renaming anything used by the currently deployed application.
2. Deploy an application version that can read both old and new representations and writes the new representation safely.
3. Backfill in bounded, resumable batches. Record progress and make each batch idempotent. Do not run an unbounded rewrite inside an HTTP request or a schema migration transaction.
4. Verify row counts, validation failures, constraints, RLS policies, index validity, and application-level read/write behavior.
5. Switch reads only after the backfill and verification gates pass.
6. **Contract:** remove old fields/paths only in a later release, after all old application instances and consumers have been retired.
7. Retain a forward-fix procedure for any migration whose rollback could discard or reinterpret user data.

## Release procedure

### Before deployment

- Identify the exact source and target application versions and confirm the target supports the current schema plus the proposed expanded schema.
- Take a database backup using the deployment's configured backup provider and record the backup identifier, timestamp, retention class, and restore instructions.
- Verify that a restore rehearsal has recently succeeded for the same PostgreSQL major version. A backup without a tested restore is not a recovery guarantee.
- Review every pending migration for lock duration, table rewrites, data loss, RLS/grant changes, and transaction compatibility.
- Confirm the runtime and migrator credentials are distinct. Never give the application runtime role migration ownership or superuser privileges.

### Apply

1. Put the deployment into its documented maintenance/compatibility mode if the change requires it.
2. Provision or retrieve the dedicated migrator credentials from the deployment secret manager.
3. Run `pnpm --filter arsy db:status` against the target database using the migrator connection.
4. Run `pnpm --filter arsy db:migrate` using the same migrator connection.
5. Capture command output and migration history as release evidence.
6. Verify schema objects, indexes, RLS policies, grants, and application health before routing traffic to the new version.
7. Deploy/roll the application only when the expanded schema is compatible with both overlapping application versions.

### Failure and recovery

- For a migration that fails while using the transactional runner, confirm PostgreSQL rolled back the migration transaction and inspect `galaxy_migrations` before retrying. Do not assume this behavior for future non-transactional jobs.
- Do not manually delete rows from `galaxy_migrations` to force a retry.
- Do not run `db:rollback` automatically in production after application data has been written. A schema rollback can be syntactically reversible while being semantically destructive.
- If a release has written data in the new format, prefer a tested forward-fix or restore procedure. Record the decision, backup identifier, affected migration, and verification evidence.
- If the migration process is interrupted, first establish whether the migration transaction committed. Re-run only after checking the migration ledger and actual schema state.
- If application and schema versions are incompatible, stop rollout and use the documented restore/forward-fix plan. Do not leave mixed application versions serving incompatible schemas.

## Required verification matrix

Before declaring migration compatibility complete, CI must exercise each supported PostgreSQL major version for:

- Fresh install from an empty database.
- Upgrade from every explicitly supported prior schema version.
- Failure injected during a migration, followed by inspection and retry.
- Rollback only for migrations explicitly classified as reversible.
- Re-application after rollback where supported.
- RLS policy and forced-RLS behavior, including runtime-role access and denied cross-tenant access.
- Index existence and `pg_index.indisvalid` checks.
- Expand/contract compatibility with old and new application versions running concurrently.
- A real PostgreSQL test for concurrent reads/writes while a model revision is staged and published.

The existing PostgreSQL 17/18 workflow covers fresh migration, latest-batch rollback/re-apply, and the Arsy test suite. It does not yet establish the full matrix above or prove a production deployment/restore.

## Release blockers tracked separately

- Issue #14: resumable schema-transform jobs, preview, staged publication, progress, and forward-fix semantics.
- Issue #16: persistent online index jobs, concurrent DDL outside transactions, retries, index validity checks, and publication gating.
- Issue #31: interrupted migration/retry, supported prior-version upgrades, and rolling-deployment verification.
- Issue #3: production backup/restore with an actual provider and successful restore evidence.
- Issue #30: approved retention/deletion policy, immutable archive storage, encryption/key management, automated readback, and retention tests.

Do not close these issues solely because this runbook exists. Each requires implementation and executable evidence.


## Model lifecycle operations

For revisions that need record transforms or index changes, use the model lifecycle preview/job endpoints and run the one-shot worker as `arsy_migrator`:

```sh
pnpm --filter arsy db:lifecycle:work
```

Repeat the command until migration jobs report `ready` and index jobs report `ready` or `removed`. The worker can safely be restarted: transform batches persist their cursor and staged payloads, while concurrent index jobs persist their state and attempt count. Failed transform jobs expose a retry endpoint; correct the underlying issue before retrying. Do not manually alter job cursors or delete staging rows.

The migration API pauses writes to the affected model while a transform is queued/running; reads continue against the currently active revision. Publication verifies transform/index readiness and switches staged payloads plus the active revision in one transaction. The cutover transaction may lock many record rows for a large model; measure lock duration on a production-sized clone and schedule a maintenance window if necessary. This is not a claim of zero-downtime publication.

The online index worker deliberately uses non-transactional concurrent DDL. It must run with a role that owns the target index/table and can access the lifecycle job tables. Never run this worker using the ordinary application runtime role.
