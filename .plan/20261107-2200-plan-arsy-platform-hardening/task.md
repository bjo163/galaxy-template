# Arsy Platform Hardening — Execution Tasks

## P0 — Authorization and session security

- [ ] [M] Separate project credential authentication from operation scope checks in `apps/arsy/src/modules/models/model.routes.ts`; require read scope only for read/list and write scope only for mutations. Add read-only/write-only regression tests. (#12)
- [ ] [L] Define a single project-role capability matrix and enforce it across workspace/project, credential, membership, model, record, and audit routes. Preserve owner invariants and test role/action boundaries. (#13)
- [ ] [L] Add session inventory, single-session revocation, global revocation, and session invalidation on password/security lifecycle events. Add expiry and multi-device tests. (#18)
- [ ] [M] Add endpoint-specific login/register/recovery throttling with shared-store adapter contract; do not duplicate the project quota system in #4. Keep account responses enumeration-safe. (#17)

## P1 — Schema and data correctness

- [ ] [XL] Add schema revision compatibility classification, dry-run validation, resumable backfill jobs, publication gates, and rollback/forward-fix contract. Add legacy-record integration tests. (#14)
- [ ] [L] Align JSONB typed filter SQL expressions and generated index expressions; verify with PostgreSQL EXPLAIN. (#15)
- [ ] [XL] Implement asynchronous online index lifecycle with state tracking, idempotent retries, and safe concurrent DDL outside transactions. (#16)
- [ ] [M] Add record payload byte/depth/node/property/array/string budgets consistently across data writes and imports. (#21)
- [ ] [L] Add idempotency-key storage and middleware/service contract for retry-sensitive mutation routes. (#22)

## P1 — API scalability

- [ ] [L] Add opaque cursor pagination for dynamic record APIs with stable tie-breakers and filter/project binding. (#19)
- [ ] [M] Bound and paginate control-plane listings and audit reads; batch workspace membership lookups to remove N+1 query fan-out. (#20)

## P2 — Governance, operations, and production

- [ ] [M] Add transactional, redacted audit events for record create/update/delete. (#23)
- [ ] [L] Expand observability for database pool, query/transaction latency, auth, RLS, quotas, schema/index jobs, and add-on failures with bounded labels. (#24)
- [ ] [M] Expose validated PostgreSQL pool sizing/timeouts and graceful saturation behavior. (#25)
- [ ] [M] Add full monorepo CI gates for install integrity, lint, typecheck, tests, build, and workspace validation; retain real PostgreSQL RLS gate. (#26)
- [ ] [M] Declare PostgreSQL support matrix and test migrations/RLS/JSONB features on each supported major. (#27)
- [ ] [L] Add production Docker image/deployment profile, non-root runtime, health checks, migration job, secrets, resource limits, and rollout guidance. (#28)
- [ ] [M] Add bounded multi-worker cleanup for expired sessions/tokens/invitations/idempotency records. (#29)
- [ ] [M] Define audit retention/archive/integrity/readback and account deletion interaction. (#30)
- [ ] [L] Add migration expand/contract compatibility, interruption/retry, role grants/RLS verification, and rollback/forward-fix tests. (#31)

## Cross-cutting completion

- [ ] [M] Update API and operational documentation with implemented contracts and configuration.
- [ ] [M] Run Arsy tests, typecheck, lint, build, PostgreSQL integration tests, and monorepo validation; record exact evidence.
- [ ] [S] Update each GitHub issue with implementation evidence; close only issues whose acceptance criteria are fully met.
- [ ] [S] Populate this folder's `report.md` with completed tasks, deviations, evidence, and remaining blockers.
