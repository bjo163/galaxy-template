# Arsy Platform Hardening — Execution Tasks

## P0 — Authorization and session security
- [x] [M] Separate project credential authentication from operation scope checks; add read-only/write-only regression tests. (#12)
- [x] [L] Enforce distinct project-user data-plane scopes for admin, developer, and member roles. (#13)
- [ ] [L] Add session inventory, single/global revocation, and security-event invalidation. (#18)
- [ ] [M] Add endpoint/account-aware authentication throttling with a shared store contract. (#17)

## P1 — Schema and data correctness
- [ ] [XL] Add revision compatibility classification, dry-run validation, resumable backfills, and publication gates. (#14)
- [ ] [L] Align JSONB typed filter SQL and matching indexes; verify with PostgreSQL EXPLAIN. (#15)
- [ ] [XL] Add asynchronous online index lifecycle with job states, retries, and safe concurrent DDL. (#16)
- [x] [M] Enforce record payload byte/depth/node/property/array/string budgets. (#21)
- [ ] [L] Add scoped idempotency keys for retry-sensitive mutations. (#22)

## P1 — API scalability
- [ ] [L] Add opaque context-bound keyset cursors to record APIs. (#19)
- [ ] [M] Bound and paginate control-plane listings; batch membership reads and audit queries. (#20)

## P2 — Governance and production
- [ ] [M] Add transactional redacted record audit events. (#23)
- [ ] [L] Add tenant-safe database/application metrics with bounded labels. (#24)
- [x] [M] Expose validated PostgreSQL pool sizing and timeouts. (#25)
- [ ] [M] Add monorepo CI quality gates and workspace boundary validation. (#26)
- [ ] [M] Declare and test PostgreSQL support matrix. (#27)
- [ ] [L] Add secure production Docker/deployment profile. (#28)
- [ ] [M] Add bounded multi-worker cleanup for expired sessions and tokens. (#29)
- [ ] [M] Implement audit retention/archive lifecycle. (#30)
- [ ] [L] Add migration compatibility, interruption/retry, and rollback tests. (#31)

## Completion
- [ ] [M] Run all tests, typecheck, lint, build, PostgreSQL integration and workspace validation.
- [ ] [S] Update each GitHub issue with implementation evidence; close only fully verified issues.
- [ ] [S] Complete `report.md` with evidence and remaining risks.
