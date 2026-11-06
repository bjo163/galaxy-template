# Arsy API

Arsy is the Fastify API app in the Galaxy pnpm monorepo. It uses a module-first
layout so each domain can own its routes, service, repository, and schemas as
the product requirements become known.

## Run locally

Use Node.js 22.12 or newer and Docker Desktop, then run commands from the
repository root:

```sh
pnpm install
Copy-Item .env.example .env.development
pnpm dev:arsy
```

The root `pnpm dev` starts PostgreSQL, applies Arsy migrations, and starts the
web and API apps. Use `pnpm dev:arsy` to start PostgreSQL, migrate the schema,
and run only Arsy.

The API listens on `http://localhost:3001`; the web app runs on
`http://localhost:3000`. Development configuration is in the ignored root
`.env.development`, copied from root `.env.example`. A PostgreSQL 18 container
persists data in the `galaxy_arsy-postgres-data` Docker volume. The API requires
`DATABASE_ADAPTER=postgres` and `DATABASE_URL`; it no longer initializes a
PGlite database or a separate browser console. The shared Knex/Objection
adapters live in `packages/database`.

### PostgreSQL roles and tenant isolation

Use separate PostgreSQL login roles for schema migrations and API traffic.
Use a database dedicated to Arsy because provisioning removes `CREATE` and
`TEMPORARY` privileges from `PUBLIC` on its database and `CREATE` on its
`public` schema.
`arsy_migrator` owns the tables and may create objects in `public`;
`arsy_runtime` must not own tables, have `BYPASSRLS`, or have schema/DDL
privileges. Neither role should be a superuser. The runtime role needs only
`CONNECT`, schema `USAGE`, and `SELECT`/`INSERT`/`UPDATE`/`DELETE` on `arsy_*`
tables.

Provision the roles through the database package's typed PostgreSQL provisioning
API. Supply passwords from a secret manager rather than a checked-in file or
shell history:

```sh
ARSY_POSTGRES_ADMIN_URL="$ADMIN_DATABASE_URL" \
ARSY_MIGRATOR_PASSWORD="$ARSY_MIGRATOR_PASSWORD" \
ARSY_RUNTIME_PASSWORD="$ARSY_RUNTIME_PASSWORD" \
  pnpm --filter arsy db:provision-roles
```

Run `pnpm --filter arsy db:migrate` with `DATABASE_URL` set to the
`arsy_migrator` connection. Re-run `db:provision-roles` after migrations to
grant runtime DML on newly created `arsy_*` tables. Run the server with
`DATABASE_URL` set to the `arsy_runtime` connection. Never reuse the migration
connection for API requests. Runtime access to the shared migration-history
tables is not granted.

Tenant tables enable and force row-level security. Workspace and project
context is set transaction-locally by the API; absent or empty context denies
access. Project credentials are looked up by their one-way hash in a
transaction-local credential context, then all subsequent access is scoped to
the resolved workspace and project. The PostgreSQL RLS integration suite runs
against the non-owner runtime role in the `Arsy PostgreSQL RLS` workflow;
PGlite tests are not evidence for the production RLS gate.

## Routes

- `GET /health/live`: process liveness
- `GET /health/ready`: readiness probe that checks the database connection
- `GET /api/v1/health`: versioned API status
- `GET /documentation`: interactive API documentation when enabled
- `GET /documentation/json`: generated OpenAPI 3.1 document when enabled
- `GET /metrics`: authenticated Prometheus scrape endpoint when enabled

The liveness route checks only the process. Readiness verifies the database
connection and returns `503` while it is unavailable.

The v1 API includes:

- Account registration, login, logout, and current-account routes under
  `/api/v1/auth`.
- Workspace and project creation/listing, memberships, project users, scoped
  project credentials, and audit reads.
- Model definition creation, revision creation, validation/publication, and a
  record API at `/api/v1/data/:modelKey`.
- Declarative add-on manifest creation, validation, installation, capability
  grants, configuration, enable/disable, and uninstall routes.

Arsy accounts use password-based sessions. Project credentials are bearer
tokens with explicit scopes; the add-on manager requires `addons:manage`.
Credentials are stored as verifiers, and the secret is shown only when created.
The API applies the same workspace/project context in a transaction for every
tenant-owned table operation.

The current add-on contract accepts declarative JSON metadata only. Arsy does
not execute uploaded JavaScript, packages, or lifecycle hooks. Supported
capabilities are metadata grants, not an executable plug-in runtime.

## Workspace commands

- `pnpm --filter arsy dev`: run with watch mode
- `pnpm --filter arsy build`: compile to `dist`
- `pnpm --filter arsy start`: run the compiled server
- `pnpm --filter arsy test`: run API tests
- `pnpm --filter arsy typecheck`: check TypeScript types
- `pnpm db:status:arsy`: show completed and pending migrations
- `pnpm db:migrate:arsy`: apply all pending migrations
- `pnpm db:rollback:arsy`: roll back the latest migration batch

Arsy migrations live in `src/migrations`, are compiled with the app, and are
executed explicitly before deploying a schema change. The migration runner uses
the shared `galaxy_migrations` history and lock tables. The initial control-plane
migration defines the account, workspace, project, model, record, add-on, and
audit tables; later domain changes get separate reversible migrations.

The service validates all environment settings on startup. See the repository
root `.env.example` for supported variables and defaults. CORS origins must be explicit HTTP(S)
origins; wildcard CORS is rejected in production. Set `TRUST_PROXY` to explicit
trusted proxy IP addresses or CIDRs only when Arsy is behind those proxies;
leave it `false` when clients can connect directly.

API errors use one RFC 9457 problem-details response shape with a request ID
and `application/problem+json` content type. Internal errors are logged with
request context and return a generic response without implementation details.
Incoming request IDs are accepted only when they use a bounded, safe character
set; otherwise Arsy generates one. Logs redact common credential fields and
record the route template instead of query strings. Requests are rate-limited
by client IP; the default in-memory
limiter is per process, so multi-replica deployments must use a shared
rate-limit store before relying on a global quota. Health probes are excluded
from rate limiting.

The runtime applies a request timeout, request-body size limit, and bounded
graceful shutdown. SIGINT and SIGTERM trigger an idempotent close; active
connections are closed if the graceful period expires.

OpenAPI and Swagger UI default to enabled outside production and disabled in
production. The example environment opts out explicitly; set
`OPENAPI_ENABLED=true` for local interactive docs or only when the production
contract should be publicly available.

## Account onboarding

Create Arsy accounts through the Galaxy web app at `/register`. The form sends
registration to Arsy's `/api/v1/auth/register` endpoint and signs the user into
the web app after account creation. Arsy itself exposes only the API and API
documentation; its root path does not host a management UI.

Prometheus metrics are disabled by default. To enable them, set
`METRICS_ENABLED=true` and provide `METRICS_TOKEN` with 32 to 256 safe
characters. Generate a hexadecimal token with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Scrapers must send `Authorization: Bearer <token>`. Metrics use route
templates and bounded method labels, never request paths or query values. Node
process metrics and HTTP request totals/latency are exposed from the
per-process registry. Keep the scrape endpoint on a private network even with
token authentication.

## Module conventions

Place each domain under `src/modules/<domain>` and keep its HTTP routes, input
and response schemas, service logic, and persistence adapter together.
Register modules in `src/modules/register-modules.ts`; keep app composition in
`src/app.ts`, and process startup and shutdown in `src/runtime`. The executable
entrypoint is `src/server.ts`. Cross-cutting concerns belong in `src/plugins`
and validated environment settings belong in `src/config`. Shared HTTP contracts
belong in `src/core/http`. Keep dependencies flowing from routes to services
and from services to persistence adapters; domain modules should not import
each other's internals.

Arsy now registers account/control-plane, dynamic model/data, and declarative
add-on modules. Its migrations create the control-plane and JSONB record
catalog. Route and model tests run against ephemeral PGlite. These tests do not
prove PostgreSQL RLS behavior with a non-owner runtime role; production
deployment must keep that acceptance gate.

Arsy currently owns password registration and login, but does not provide
email verification, password reset, or email invitations. Project users must
already have an Arsy account. The separate PocketBase app has been removed;
this does not migrate or delete any PocketBase data that may exist outside this
repository.

## Product goal

The implemented foundation supports tenant-scoped projects, dynamic model
definitions and records, and declarative add-on lifecycle management through
the API. The console supports account registration/login, workspace/project
creation, model publication, and add-on installation/configuration. It does
not yet cover all control-plane operations or a full production deployment.

`@galaxy/database` remains the persistence foundation for fixed Arsy tables. It
is not a dynamic model engine. The model catalog and record API remain Arsy
modules. Track remaining work, decisions, dependencies, and completion evidence
in the [canonical Arsy GitHub issue register](https://github.com/bjo163/galaxy-template/issues/1).
