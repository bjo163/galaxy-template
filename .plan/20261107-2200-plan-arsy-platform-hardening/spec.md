# Technical Specification

## Scope
Implement GitHub issues #12–#31 for Arsy in the Galaxy monorepo. Arsy remains an API-only Fastify BaaS using PostgreSQL, Knex/Objection, transaction-local tenant context, and forced PostgreSQL RLS.

## Functional requirements
- REQ-012: Authenticate project credentials independently from per-operation scope authorization.
- REQ-013: Enforce a documented role-to-capability matrix on every protected operation.
- REQ-014: Treat model revisions as schema migrations; classify compatibility, validate existing data, support resumable transforms, and gate activation.
- REQ-015: Use typed JSONB SQL expressions and matching index expressions for every supported filter type.
- REQ-016: Manage dynamic indexes as observable asynchronous jobs; do not block unrelated tenant writes with unsafe DDL.
- REQ-017: Apply endpoint/account-aware abuse protection to identity endpoints with shared distributed enforcement.
- REQ-018: Support session inventory, per-session/global revocation, security-event invalidation, and expiry.
- REQ-019: Provide stable opaque keyset cursors for record list APIs.
- REQ-020: Bound and paginate control-plane collections; eliminate per-workspace N+1 fan-out.
- REQ-021: Bound JSON payload bytes, nesting, nodes, properties, arrays, and strings before persistence.
- REQ-022: Make supported mutation retries idempotent using scoped request fingerprints and persisted responses.
- REQ-023: Write safe record mutation audit events atomically with data mutations.
- REQ-024: Expose tenant-safe operational metrics and correlation context with bounded cardinality.
- REQ-025: Make PostgreSQL pool capacity/timeouts configurable and observable.
- REQ-026: Run repository-wide quality gates and the separate real-PostgreSQL RLS gate in CI.
- REQ-027: Declare and test the PostgreSQL major-version support matrix.
- REQ-028: Supply a secure production container/deployment profile and operational runbook.
- REQ-029: Clean expired identity and idempotency artifacts with bounded, resumable multi-worker jobs.
- REQ-030: Define and implement audit retention/archive lifecycle without compromising append-only access.
- REQ-031: Test migration compatibility, interruption/retry, role grants, RLS, and recovery behavior.

## Security invariants
- Runtime DB role is not owner, has no BYPASSRLS, and no DDL privileges.
- Missing tenant/project context denies tenant-owned data access.
- Authorization is enforced server-side on every route and is not inferred from UI visibility.
- Tokens are stored only as one-way verifiers; plaintext secrets are returned once and never logged.
- Sensitive auth responses remain enumeration-resistant.
- Audit writes are transactional with their source mutation and redact secret-bearing fields.

## API contract principles
- Return RFC 9457 problem details for invalid, unauthorized, rate-limited, conflict, and unavailable cases.
- Cursor tokens are opaque, versioned, size-bounded, and query-context-bound.
- Idempotency keys are scoped by actor/project/route and request fingerprint; same-key/different-body requests conflict.
- Pagination uses deterministic order plus a unique tie-breaker and enforces a server maximum.
- Session management never reveals token hashes or bearer secrets.

## Non-functional requirements
- PostgreSQL operations must be safe under concurrency and multi-replica deployment.
- No unbounded result sets, fan-out, or background batches.
- Observability must not leak tenant identifiers or user data into high-cardinality labels.
- Migrations use expand/contract where rolling application versions may overlap.
- CI evidence must identify exact commits and PostgreSQL versions.

## Verification
- Unit and API regression tests for every implemented contract.
- Real PostgreSQL tests for RLS, typed indexes/query plans, concurrent DDL, migrations, idempotency, and cleanup locking.
- Root workspace lint/typecheck/build plus monorepo boundary validation.
- Production container smoke test and non-root verification.
