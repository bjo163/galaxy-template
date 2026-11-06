# Architecture and Implementation Design

## Context
Arsy is a Fastify API in a pnpm/Turborepo monorepo. Tenant data is stored in shared PostgreSQL tables protected by forced RLS and transaction-local workspace/project settings. Dynamic records use JSONB payloads and model metadata. Existing CI has a dedicated real-PostgreSQL RLS workflow.

## Module boundaries
- Identity and session lifecycle: `apps/arsy/src/core/auth` plus auth routes and migrations.
- Authorization: shared capability/role policy module; routes ask for capabilities, not ad hoc role arrays.
- Dynamic model/data: `apps/arsy/src/modules/models` and model core; schema/index jobs persist state and execute PostgreSQL DDL through a controlled worker/service.
- Control plane: `apps/arsy/src/modules/control-plane`; pagination and batch queries live with route/service logic.
- Persistence: migrations in `apps/arsy/src/migrations`; all tenant operations use existing context transaction helpers.
- Observability: `apps/arsy/src/plugins` and `apps/arsy/src/core/observability`.
- Operations: `.github/workflows`, Dockerfile/production compose, README and Arsy operations docs.

## Key decisions
1. Keep PostgreSQL as the source of truth; do not introduce a second application database.
2. Prefer a shared database-backed limiter/job lease contract when no shared cache service is provisioned; make the storage abstraction explicit so Redis can be introduced later without changing route semantics.
3. Keep schema revision publication separate from long-running data/index jobs: draft → validated → migrating → ready → active; failures remain visible and resumable.
4. Use concurrent index creation only outside transactions, with deterministic trusted identifiers and catalog validation.
5. Use keyset pagination with opaque signed/context-bound cursors rather than offset pagination for large record sets.
6. Treat idempotency and audit records as transactional companions to their source mutations.
7. Avoid claiming a feature is production-complete until real PostgreSQL and deployment tests exist.

## Trade-offs and open questions
- The exact role capability matrix must preserve current owner/admin/developer/member/viewer behavior and be documented before enforcement.
- Model transformation syntax must remain declarative and non-executable; never accept arbitrary user JavaScript.
- PostgreSQL support majors must be constrained by CI image availability and the project's current PostgreSQL 18 development image.
- Backup/restore remains tracked separately in #3; this plan must not claim backup certification.
