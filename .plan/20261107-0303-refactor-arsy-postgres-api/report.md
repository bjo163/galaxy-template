# Completion Report

Status: COMPLETE

## Tasks

- [x] Remove console runtime/source.
- [x] Remove Vite console tooling.
- [x] Configure Docker PostgreSQL and startup/migrations.
- [x] Remove stale app-local environment files; root `.env.example`, `.env.development`, and `.env` are canonical.
- [x] Update documentation for API-only Arsy.
- [x] Verify build and health.

## Built

Arsy now starts as a pure API without Fastify-Vite. Root `pnpm dev` starts a persistent PostgreSQL 18 Docker service, waits for health, applies Arsy migrations, then starts the web and API. Web registration remains the account onboarding UI. The old PGlite directory remains untouched. PostgreSQL health and Arsy live/readiness endpoints returned HTTP 200; Arsy `/` returns 404.

## Deviations

Docker Compose PostgreSQL 18 requires mounting the named volume at `/var/lib/postgresql`; the initial `/var/lib/postgresql/data` mount was rejected and was corrected. Windows env loader was adjusted to invoke `.exe` directly and resolve app-relative working directories so migrations run correctly.

## Verification evidence

`docker compose -f docker-compose.dev.yml up -d --wait` reported PostgreSQL Healthy. `pnpm db:migrate:arsy` applied the schema (2 migrations completed). `pnpm dev` reached Next.js Ready and Arsy logged database connected/listening on port 3001. `GET /health/live` and `/health/ready` returned 200; `GET /` returned 404. `pnpm --filter arsy build` and `pnpm --filter web typecheck` passed. Arsy typecheck remains blocked by three existing errors in `src/core/tenancy/postgres-rls.test.ts` (not introduced by this change); regular server build passes.

## Remaining risks and follow-ups

Existing PGlite files under `apps/arsy/data/arsy` are preserved and not imported into PostgreSQL. Local PostgreSQL credentials are demo-only and must not be reused outside localhost development. Docker PostgreSQL volume persists across restarts.
