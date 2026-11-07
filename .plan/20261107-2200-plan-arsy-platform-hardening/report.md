# Completion Report

**Status:** IN PROGRESS — implementation branch has passing CI, but production acceptance is not complete.  
**Branch:** `feat-arsy-issues-12-31`  
**Scope:** GitHub issues #12–#31  
**Reviewed head:** `2502258a98e29915b6ee0c581f13f8ddb4c3bbc9`

## Implemented in this branch

- [x] #12 — Project credential authentication is separated from operation-specific scope checks; read-only/write-only regression tests are included.
- [x] #13 — Project-user roles map to distinct data-plane capabilities.
- [x] #15 — Typed JSONB query expressions and matching typed index expressions are implemented. PostgreSQL query-plan/EXPLAIN evidence is still required.
- [x] #17 — Database-backed fixed-window authentication throttling uses hashed identifiers and endpoint scopes. Full abuse-resistance acceptance (backend failure behavior, concurrency and enumeration tests) still needs evidence.
- [x] #18 — Session inventory and revocation operations are implemented. Password-change/reset invalidation and the full session policy still need acceptance verification.
- [x] #19 — Record listing supports bounded keyset pagination with project/model/filter-bound cursors. Backward navigation, concurrent mutation and tamper/context regression coverage remain to be verified.
- [x] #20 — Several control-plane list endpoints now have bounded pagination and batched membership lookup. Complete endpoint inventory, query budgets and N+1 regression coverage remain open.
- [x] #21 — Record payload complexity budgets and regression coverage are implemented.
- [x] #22 — Scoped idempotency persistence/replay is implemented for record mutations. Real-PostgreSQL concurrent duplicate, rollback, expiry and cross-project tests remain required.
- [x] #23 — Record create/update/delete audit events are written transactionally with redacted metadata. Audit query coverage and rollback/redaction tests require final evidence.
- [x] #24 — HTTP, database query and pool metrics are implemented with bounded labels. Pool sampling, acquisition wait/timeout, transaction duration, correlation IDs and operational alert/runbook coverage remain incomplete.
- [x] #25 — PostgreSQL pool sizing and acquire/idle/create timeouts are configurable and validated. Connection budget, saturation and graceful-shutdown acceptance still need verification.
- [x] #26 — Monorepo quality workflow and workspace manifest/boundary validation are added.
- [x] #27 — CI matrix runs PostgreSQL 17 and 18. These versions are CI-tested for the current RLS/migration workflow; broader index and backup/restore matrix coverage remains outstanding.
- [x] #28 — Non-root production image and hardened Compose profile are added. A real deployment/smoke test and separate privileged one-shot migration deployment remain to be demonstrated.
- [x] #29 — Bounded cleanup for expired sessions, rate-limit buckets and idempotency rows is implemented. Verification-token/invitation coverage, scheduler integration and operational telemetry remain open.
- [x] #30 — Audit policy, project-scoped NDJSON export, SHA-256 manifest verification and count validation are implemented. KMS encryption, immutable object storage, automated restore/readback and deletion lifecycle are explicitly not implemented.
- [ ] #14 — Revision compatibility checks and transactional record validation/backfill exist, but resumable transform jobs, progress/failure recovery and staged rollout are not implemented.
- [ ] #16 — Dynamic index creation/removal is not yet an asynchronous online lifecycle. Persistent job states, concurrent DDL outside transactions, retries and publication gating remain required.
- [ ] #31 — PostgreSQL CI now verifies migration rollback/re-apply and RLS behavior. Interrupted migration/retry, supported-version upgrade compatibility and rolling-deployment verification remain incomplete.

## CI evidence

The reviewed head has two completed successful GitHub Actions runs:

- Monorepo Quality: https://github.com/bjo163/galaxy-template/actions/runs/42301441922
- Arsy PostgreSQL RLS (PostgreSQL 17/18 matrix): https://github.com/bjo163/galaxy-template/actions/runs/42301441904

These runs are evidence for the checks configured in those workflows only. They are not evidence of a production deployment, backup/restore, online index lifecycle, or all acceptance criteria above.

## Release blockers

1. Complete #14 with resumable revision migration jobs and safe publication/rollback semantics.
2. Complete #16 with persistent online index jobs and PostgreSQL concurrent DDL outside transactions.
3. Expand #31 to interrupted/retried migrations and supported prior-version upgrades.
4. Complete #30's KMS/WORM/readback and retention lifecycle, coordinated with the ownership/retention decision in #8.
5. Execute a real production Compose deployment with a separately provisioned least-privilege runtime role; verify health, graceful shutdown and rolling upgrade.
6. Complete backup/restore issue #3 before claiming recoverability.
7. Finish the remaining acceptance tests called out per issue, then update the issue threads with exact evidence.

## PR decision

Keep PR #32 in Draft. Do not close issues #12–#31 or merge to `main` until each issue's own acceptance criteria have direct implementation and test evidence. The branch rule explicitly prohibits pushing to `main`.
