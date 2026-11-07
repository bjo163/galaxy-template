# Architecture and Implementation Design

## Context
Arsy is a Fastify API in a pnpm/Turborepo monorepo. Tenant data uses shared PostgreSQL tables with forced RLS and transaction-local workspace/project settings. Dynamic records use JSONB payloads and model metadata.

## Boundaries
- Identity/session lifecycle: `apps/arsy/src/core/auth` and control-plane auth routes.
- Authorization: shared role/capability policy; routes request capabilities rather than ad hoc role lists.
- Dynamic model/data: `apps/arsy/src/modules/models` and model core; long-running schema/index jobs persist state.
- Control plane: `apps/arsy/src/modules/control-plane`; pagination and batched queries.
- Persistence: `apps/arsy/src/migrations`; all tenant operations use transaction context helpers.
- Observability: `apps/arsy/src/plugins` and `apps/arsy/src/core/observability`.
- Operations: `.github/workflows`, production Docker assets, README and runbooks.

## Decisions
1. PostgreSQL remains the source of truth; no second application database.
2. Use explicit database-backed job/limiter contracts unless a shared cache is provisioned.
3. Separate revision validation/migration/index work from activation; failed jobs remain visible and resumable.
4. Use concurrent index operations outside transactions and trusted deterministic identifiers.
5. Use keyset cursors, not offset pagination, for large record collections.
6. Persist idempotency and audit companions transactionally with mutations.
7. Do not claim production completeness without real PostgreSQL and deployment evidence.

## Risks/open questions
Role capabilities must preserve supported owner/admin/developer/member/viewer semantics. Schema transforms must remain declarative, not executable JavaScript. PostgreSQL support majors must be limited to versions actually tested in CI. Backup/restore remains separate in #3.
