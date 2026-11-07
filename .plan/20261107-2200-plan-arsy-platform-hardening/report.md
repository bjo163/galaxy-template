# Completion Report

**Status:** IN PROGRESS — lifecycle implementation is present on the current PR head; CI is queued and production acceptance is not complete.
**Branch:** `feat-arsy-issues-12-31`
**PR:** [#32](https://github.com/bjo163/galaxy-template/pull/32)
**Scope:** GitHub issues #12–#31
**Reviewed head:** `3793ea1df21af1512ef63aff9eb3a7aad7e70a7a`

## Current implementation snapshot

- #12–#13 — Credential scope and project membership capability enforcement are implemented; keep open until all issue-specific regression evidence is linked.
- #14 — Resumable migration-job code is present: bounded batches, persisted cursor/progress, staged payloads, validation, failure state, retry path, write pause, and gated publication. Remaining: verify failure/restart and concurrent mutation behavior on PostgreSQL, race-safe snapshot semantics, staged cutover under concurrent reads/writes, and large-model lock duration.
- #15 — Typed JSONB query/index expressions are implemented. PostgreSQL EXPLAIN evidence and representative selectivity/performance measurements remain.
- #16 — Persistent online index-job code is present with concurrent DDL outside transactions, advisory locking, retry budget, validity checks, and deferred retirement. Remaining: PostgreSQL failure/restart and concurrent-publish tests, invalid-index cleanup/recovery evidence, and proof publication cannot pass with any required index not valid.
- #17–#25 — Authentication throttling, session lifecycle, keyset pagination, bounded control-plane listings, payload budgets, idempotency, audit events, observability, and pool configuration have implementation in this branch. Issue-level acceptance gaps remain: abuse/concurrency behavior; reset/change session invalidation; cursor tamper/backward/concurrent mutation; endpoint/query-budget inventory; real-PostgreSQL idempotency and audit rollback/redaction; pool saturation, acquisition wait and graceful shutdown.
- #26 — Monorepo quality workflow and workspace-boundary validation are added. Current-head run is queued; do not cite earlier-head CI as current evidence.
- #27 — PostgreSQL 17/18 matrix is configured. Broader backup/restore and index lifecycle compatibility evidence remains.
- #28 — Hardened non-root production image and Compose profile are present. A real deployment, health/smoke test, separate one-shot migrator operation, graceful shutdown and rolling upgrade remain unverified.
- #29 — Bounded cleanup jobs are present. Scheduler integration, verification-token/invitation coverage and operational telemetry remain.
- #30 — Audit policy, project-scoped NDJSON export and integrity/count verification are present. KMS/key rotation, immutable archive storage, automated readback and deletion lifecycle remain unimplemented.
- #31 — Migration runbook and rollback/re-apply checks are present. Full PostgreSQL interrupted-migration injection/retry, upgrade from explicitly supported prior Arsy schema versions, and overlapping old/new application compatibility remain unverified.

## Current CI state

At the reviewed head, GitHub Actions runs are queued:

- Monorepo Quality: [run 42341932709](https://github.com/bjo163/galaxy-template/actions/runs/42341932709)
- Arsy PostgreSQL RLS (PostgreSQL 17/18): [run 42341932723](https://github.com/bjo163/galaxy-template/actions/runs/42341932723)

Earlier successful runs belong to a different commit and are not evidence for this head. Recheck both runs after completion and inspect failed jobs before changing this report.

## Remaining release blockers

1. Complete and prove #14 PostgreSQL failure/restart, race-safe record snapshot/cursor semantics, concurrent read/write behavior, and production-sized cutover lock measurements.
2. Complete and prove #16 PostgreSQL failure/restart, concurrent-publish safety, invalid-index recovery, and required-index publication gating.
3. Complete #31 with injected interrupted migration/retry, supported prior-schema upgrade tests, and rolling old/new application compatibility.
4. Complete #30 encryption/key management, immutable archive, readback, deletion and retention lifecycle after the ownership decision in #8.
5. Complete #3 backup/restore with a successful restore rehearsal; do not claim recoverability without it.
6. Run a real production Compose smoke deployment with distinct least-privilege runtime/migrator credentials, health checks, graceful shutdown and rolling upgrade.
7. Close remaining acceptance gaps for #12–#13 and #15, #17–#25, #27–#29 with direct test/evidence links in the relevant issue threads.

## Merge decision

Keep PR #32 in Draft. Do not merge to `main` or close issues #12–#31 until current-head CI is green and each issue's acceptance criteria have direct implementation and test evidence. The repository's branch governance prohibits pushing directly to `main`.
