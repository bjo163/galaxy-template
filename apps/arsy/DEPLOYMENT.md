# Arsy Production Deployment

## Supported runtime

- Node.js 22.12 or newer.
- PostgreSQL 17 and 18; both majors are exercised by the real-PostgreSQL RLS workflow.
- Arsy API runs with the `arsy_runtime` role. Never use the migration owner connection for HTTP traffic.

## Build the production image

Run from the repository root:

```sh
docker build -f apps/arsy/Dockerfile -t arsy:local .
```

The multi-stage image installs the locked workspace, builds Arsy and its shared database package, deploys production dependencies, and runs as UID/GID 10001. The runtime filesystem is read-only in the supplied Compose profile.

## Database preparation and migrations

Use a dedicated Arsy database. Provision separate `arsy_migrator` and `arsy_runtime` roles using the database package provisioning CLI. Supply admin and role passwords through your secret manager; do not put them in a tracked file or shell history.

Apply migrations as a one-shot release step using the migrator connection:

```sh
DATABASE_ADAPTER=postgres DATABASE_URL="$ARSY_MIGRATOR_DATABASE_URL" pnpm --filter arsy db:migrate
```

After migrations, refresh runtime DML grants with the role-provisioning command. Run the API only with the runtime connection. The runtime role must not own tenant tables, have `BYPASSRLS`, or possess DDL privileges.

## Compose profile

Export the following variables through the deployment environment or secret manager:

- `DATABASE_URL`: PostgreSQL runtime-role URL; require TLS for remote databases.
- `CORS_ORIGINS`: comma-separated explicit HTTPS origins.
- `TRUST_PROXY`: exact trusted proxy IPs/CIDRs, or `false` when directly exposed.
- Optional pool, timeout, and metrics variables documented in `apps/arsy/README.md`.

Start the API:

```sh
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 arsy
```

The Compose profile binds the API to loopback on the host for a local reverse proxy. Keep the database network private and expose only the reverse proxy. The container drops Linux capabilities, disallows privilege escalation, runs non-root, uses a read-only root filesystem, and has bounded CPU/memory settings.

## Capacity and rollout

Budget PostgreSQL connections across all replicas:

`replica_count × DB_POOL_MAX + migration_connections + operational_reserve < max_connections`.

Use expand/contract migrations for rolling releases. Apply migrations as a release job before deploying code that requires the new schema. Keep the previous image available for rollback, and do not roll back a schema migration unless its down migration is explicitly safe for the data already written.

## Operations

- Monitor `/health/live` and `/health/ready`; route traffic only when ready.
- Keep `/metrics` on a private network and enable it only with a strong secret token.
- Use an external backup policy and verify restores separately; this image/profile does not certify backup/restore (tracked in issue #3).
- Rotate database credentials through the secret manager and restart workloads after rotation.
- Do not mount development PGlite data or use development Compose credentials in production.
