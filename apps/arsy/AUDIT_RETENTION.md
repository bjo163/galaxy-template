# Arsy Audit Retention and Archive Policy

## Event integrity and access

- Audit events are append-only to application actors. The API writes record mutation events in the same transaction as the source mutation.
- Event metadata must remain redacted and bounded. Record events may include model keys, changed field names, and field counts, but not raw record values, bearer tokens, passwords, or credentials.
- Audit reads remain workspace/project-scoped and require the documented workspace role.
- Do not treat application logs or metrics as an audit archive.

## Retention policy

- Keep the hot PostgreSQL audit history for at least 365 days by default.
- Do not automatically delete audit events as part of session/token cleanup.
- Account/workspace deletion behavior remains subject to the product lifecycle decision in issue #8 and applicable legal holds.
- No destructive audit retention job is enabled until archive export, integrity verification, and restore/readback are automated.

## Archive format

The target archive format is UTF-8 NDJSON, one canonical JSON event per line, ordered by (created_at, id). Each archive batch must have a separate manifest containing:

- archive format version;
- workspace and optional project scope;
- inclusive start and exclusive end timestamps;
- event count;
- SHA-256 digest of the exact NDJSON bytes;
- export tool version and creation timestamp.

Archives must be encrypted with the deployment's KMS-managed key and stored in immutable/WORM-capable object storage with access logging. Do not put encryption keys in the archive or repository.

## Verification and restore

1. Recompute the SHA-256 digest before accepting an archive.
2. Validate the manifest scope, timestamps, event count, and canonical event shape.
3. Restore/read back into an isolated audit store first; never overwrite live audit history by default.
4. Compare counts and digest after readback.
5. Record the exact archive object version, verification run, and operator identity.

## Export and verification commands

Export one project-scoped archive using a database connection that can read that project:

```sh
DATABASE_ADAPTER=postgres DATABASE_URL="$ARSY_RUNTIME_DATABASE_URL" \
  pnpm --filter arsy audit:export --workspace-id "$WORKSPACE_ID" \
  --project-id "$PROJECT_ID" --since "2026-01-01T00:00:00Z" \
  --before "2027-01-01T00:00:00Z" > events.ndjson 2> manifest.json
```

Verify the exact bytes and event count before encryption or upload:

```sh
node .scripts/verify-audit-archive.mjs events.ndjson manifest.json
```

The exporter is project-scoped and uses keyset batches of 500 events. It writes event data to stdout and a JSON manifest to stderr so the two files can be captured independently.

## Current implementation status

Record create/update/delete audit writes, project-scoped NDJSON export, and local SHA-256/count verification are implemented. KMS integration, immutable object storage, automated restore/readback, workspace-level events export, and retention deletion are not yet implemented. Issue #30 remains open until those capabilities are verified.
