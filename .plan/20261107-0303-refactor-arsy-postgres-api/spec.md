# Specification

## Requirements

- REQ-001: Arsy runs as an API-only Fastify service and no longer initializes a Vite console.
- REQ-002: Remove Arsy console source/configuration and its Vite-only build/typecheck dependencies.
- REQ-003: Local development uses PostgreSQL, not PGlite.
- REQ-004: Root `pnpm dev` starts a local PostgreSQL service, waits for readiness, applies Arsy migrations, then starts web and Arsy.
- REQ-005: Web registration remains the user-facing account onboarding flow and calls Arsy API.
- REQ-006: Existing PGlite data remains preserved and is not automatically deleted or migrated.

## API contracts

- API-001 Health endpoint remains `GET /health/live` and API routes remain under `/api/v1`.
- API-002 Web onboarding continues to use Arsy `/api/v1/auth/register` and `/api/v1/auth/login`.

## Acceptance

From a fresh local checkout with Docker available, the documented environment and `pnpm dev` start PostgreSQL, apply schema migrations, start API on port 3001 and web on port 3000. Arsy root no longer serves a console. Existing local PGlite files remain intact.
