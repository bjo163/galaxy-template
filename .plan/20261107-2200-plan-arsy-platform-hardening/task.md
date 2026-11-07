# Arsy Platform Hardening — Execution Tasks

Legend: [x] implementation present in the reviewed branch; [ ] remaining acceptance/production evidence or implementation still required. A checked implementation item is not authorization to close its GitHub issue.

## P0 — Authorization and session security
- [x] Separate credential authentication from operation-specific scopes; read-only/write-only regression tests. (#12)
- [x] Enforce role-derived project data-plane capabilities. (#13)
- [x] Add session inventory and revoke-one/revoke-other/revoke-all operations. (#18)
- [x] Add shared database-backed endpoint/account-keyed authentication throttling. (#17)
- [ ] Verify password-change/reset/account-disable invalidation, session expiry policy, multi-device concurrency and enumeration resistance. (#17, #18)

## P1 — Schema and data correctness
- [x] Align typed JSONB filters with typed index expressions. (#15)
- [ ] Verify typed indexes with PostgreSQL EXPLAIN/ANALYZE and representative data. (#15)
- [ ] Implement resumable schema-transform jobs, progress, retry/recovery, staged publication and forward-fix/rollback contract. (#14)
- [ ] Implement persistent asynchronous index lifecycle (requested/building/ready/failed/retiring/removed), concurrent DDL outside transactions, retry/lock policy and publication gating. (#16)
- [x] Enforce record payload byte/depth/node/property/array/string budgets. (#21)
- [x] Add scoped idempotency persistence and replay to record mutations. (#22)
- [ ] Verify idempotency under real PostgreSQL concurrency, rollback, expiry and cross-project isolation. (#22)

## P1 — API scalability
- [x] Add bounded keyset pagination for dynamic record listing. (#19)
- [x] Add bounded pagination to multiple control-plane listings and batch membership reads. (#20)
- [ ] Complete list-endpoint inventory, N+1/query-count tests, concurrent insert/delete tests, cursor invalidation/tamper tests, and pagination documentation. (#19, #20)

## P2 — Governance and production
- [x] Add transactional redacted record audit events. (#23)
- [x] Add bounded-label HTTP/database metrics and pool gauges. (#24)
- [x] Expose validated PostgreSQL pool sizing/timeouts. (#25)
- [ ] Add pool wait/acquire-timeout, transaction-duration, correlation-ID, saturation, shutdown and alert/runbook coverage. (#24, #25)
- [x] Add monorepo quality workflow and workspace manifest/boundary validation. (#26)
- [x] Add PostgreSQL 17/18 CI matrix for the configured RLS/migration workflow. (#27)
- [ ] Extend matrix coverage to typed indexes, migration upgrade/interruption, and backup/restore before broad support claims. (#27, #31, #3)
- [x] Add non-root Docker image and hardened production Compose profile. (#28)
- [ ] Verify a real Compose deployment, separate one-shot migrator/runtime roles, rolling upgrade, graceful shutdown and reverse-proxy/TLS contract. (#28)
- [x] Add bounded multi-worker cleanup for expired sessions, rate-limit buckets and idempotency keys. (#29)
- [ ] Cover verification tokens/invitations, scheduler integration, metrics, retries and concurrent-worker behavior. (#29)
- [x] Define audit retention policy and add project-scoped NDJSON export plus local digest/count verification. (#30)
- [ ] Add KMS encryption, immutable object storage, automated restore/readback and lifecycle/deletion policy; coordinate ownership decisions in #8. (#30)
- [x] Add PostgreSQL migration rollback/re-apply to the CI RLS workflow. (#31)
- [ ] Add interrupted migration/retry, prior-version upgrade, rolling deployment and role-grant verification. (#31)

## CI evidence recorded
- [x] Monorepo Quality run passed on reviewed head: https://github.com/bjo163/galaxy-template/actions/runs/42301441922
- [x] PostgreSQL 17/18 RLS workflow passed on reviewed head: https://github.com/bjo163/galaxy-template/actions/runs/42301441904
- [ ] Record real deployment, restore, online-index and remaining issue-specific acceptance evidence.

## Merge-safety guards for incomplete model lifecycle
- [x] Bound synchronous model revision validation/backfill to at most 500 records; reject larger revisions until resumable jobs are implemented. (#14 mitigation)
- [x] Remove synchronous transactional index DDL from model publication; reject changed/new indexed-field definitions until online index jobs are implemented. (#16 mitigation)
- [x] Add regression coverage for rejected index lifecycle changes.

## Migration safety documentation
- [x] Add production migration runbook covering expand/contract, dedicated migrator execution, transactional runner constraints, interrupted migration recovery, and required verification matrix.
- [x] Clarify that concurrent index DDL cannot run inside the current transactional migration runner and that model index publication remains a blocker until an online lifecycle exists.

## Completion gate
- [ ] Finish #14 and #16 implementation.
- [ ] Complete outstanding acceptance tests and production verification for #12–#31.
- [ ] Complete backup/restore issue #3 and ownership/retention decisions where required.
- [ ] Update each GitHub issue with exact implementation/test evidence; close only when its acceptance criteria are met.
- [ ] Update the PR description/report and mark PR #32 ready only after all release blockers are resolved.
- [ ] Do not push directly to `main`; follow the branch's hard rules.
