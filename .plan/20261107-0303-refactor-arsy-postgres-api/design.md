# Design

## Context

Arsy startup currently waits for Fastify-Vite to initialize a separate console before listening. The runtime log showed it stops at console initialization. PostgreSQL is not currently listening locally, but Docker and Docker Compose are installed.

## Decisions

- Remove the console entrypoint and Vite-specific sources/dependencies so API startup is independent of frontend tooling.
- Add a local Docker Compose PostgreSQL service with a persistent named volume and healthcheck.
- Make root development start PostgreSQL, run migrations, then start Turbo apps.
- Keep the PGlite data directory untouched as a preserved legacy/local data copy; no automatic migration is attempted.
- Keep the web app's registration form as the only onboarding UI.

## Trade-offs and risks

Docker must be running for local development. A persistent PostgreSQL volume retains local data across restarts. Production must use separately provisioned PostgreSQL roles and secrets, not local compose defaults.
