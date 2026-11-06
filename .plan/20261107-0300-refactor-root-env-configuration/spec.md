# Specification

## Requirements

- REQ-001: Development configuration lives in the repository-root `.env`.
- REQ-002: Root `pnpm dev` makes root env values visible to web/Next.js and Arsy processes.
- REQ-003: Web Prisma migration reads root `.env`.
- REQ-004: One root `.env.example` documents web, Arsy, auth, and database variables.
- REQ-005: Web login and registration use the same root-configured Arsy origin.
- REQ-006: The old fake credential endpoint no longer accepts static demo credentials.

## Acceptance

Starting apps from the root loads expected URLs and secrets from root `.env`; no app-local env file is needed. Typecheck passes. Tracked env example contains no secret values.
