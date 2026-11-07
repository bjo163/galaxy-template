# Technical Specification

## Scope
Implement Arsy issues #12–#31 in the Galaxy pnpm monorepo. Arsy remains a Fastify BaaS using PostgreSQL, Knex/Objection, transaction-local tenant context, forced RLS, and JSONB dynamic records.

## Functional requirements
- REQ-012: Authenticate project credentials independently from operation-specific scope checks.
- REQ-013: Enforce documented project role capabilities on every protected operation.
- REQ-014: Treat model revisions as schema migrations with compatibility classification, validation, resumable transforms, publication gates, and recovery.
- REQ-015: Match JSONB index expressions to typed filter expressions.
- REQ-016: Manage dynamic indexes through observable asynchronous jobs and safe online DDL.
- REQ-017: Protect identity endpoints with endpoint/account-aware distributed throttling.
- REQ-018: Support session inventory, per-session/global revocation, security-event invalidation, and expiry.
- REQ-019: Provide opaque, deterministic, context-bound keyset cursors.
- REQ-020: Bound and paginate control-plane collections; eliminate N+1 fan-out.
- REQ-021: Bound JSON payload bytes, depth, nodes, properties, arrays, and strings.
- REQ-022: Make retry-sensitive mutations idempotent using scoped request fingerprints and persisted responses.
- REQ-023: Write redacted record mutation audit events atomically.
- REQ-024: Expose tenant-safe operational metrics and correlation context.
- REQ-025: Validate PostgreSQL pool sizing/timeouts and expose saturation behavior.
- REQ-026: Add repository-wide CI quality gates and retain the PostgreSQL RLS gate.
- REQ-027: Declare and test PostgreSQL major-version support.
- REQ-028: Provide a secure production container/deployment profile.
- REQ-029: Clean expired sessions, tokens, invitations, and idempotency records safely.
- REQ-030: Define audit retention, archival, integrity, and readback.
- REQ-031: Test migration compatibility, interruption/retry, role grants, and RLS.

## Security invariants
Runtime DB role is not owner, has no BYPASSRLS and no DDL privileges. Missing tenant/project context denies tenant access. Authorization is server-side. Tokens are stored as one-way verifiers. Sensitive auth responses are enumeration-resistant. Audit writes are transactional and redact secrets.

## API principles
Errors use RFC 9457 problem details. Cursors are opaque/versioned and query-context-bound. Idempotency keys are scoped by actor/project/route and request fingerprint. Pagination has deterministic order and a server maximum. Session APIs never expose token hashes.

## Verification
Add unit/API regression tests; run real PostgreSQL tests for RLS, DDL, typed indexes, migrations, idempotency, and cleanup; run workspace lint/typecheck/build/boundary checks; smoke-test the production image as non-root.
