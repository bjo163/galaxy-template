# rule.md — Hard rules for fake-db centralization + DB/API emulation plan

R-1 (Classification). Extract only RECORD_DATA: repeated objects with identity/fields where a user could imagine adding or editing a row. CHART_SERIES (chart `series`/`categories`) and UI_CONFIG (labels, steps, status→color/icon maps, select options, form-wizard steps) stay in code — never moved into `@galaxy/fake-db`. AUTH_SECRETS (credentials, PAN/CVV-shaped values, API keys) never enter the package or any DB seed. See spec §4.

R-2 (No secrets). Plaintext passwords, PAN/CVV, and secret-shaped values are never stored in `packages/fake-db`, never seeded into `@galaxy/database` tables, and never logged. Demo credentials stay web-local behind env overrides only.

R-3 (Server-side boundary). Record data flows through server actions / route handlers only. Client widgets receive data via props; no client widget imports a `@galaxy/fake-db` data module directly, except documented tiny stat tiles.

R-4 (Seam stability). Every `get*Data()` action keeps the same return shape across `static` / `db` / `api` modes. Components and props never change when the source flips (FR-006).

R-5 (Data-source toggle). The active source is controlled by `DATA_SOURCE=static|db|api` (default `static`). API mode calls only endpoints in the endpoint map under `process.env.API_URL`; no hardcoded production URLs.

R-6 (Contamination). Commit only this plan's files: `apps/web/src/app/server/*`, `apps/web/src/views/*`, `packages/fake-db/*`, `packages/database/src/repositories/*` (pilot only), plus the five artifacts under `.plan/20261107-1159-refactor-fake-db-centralize-emulation/`. Per-file staging; never `git add -A`, `git stash`, or `git checkout --` of foreign workstreams.

R-7 (Scoped gates). Run typecheck/lint/build filtered: `--filter=web --filter=@galaxy/fake-db [--filter=@galaxy/database]`. Never unfiltered root gates while unrelated apps exist in the tree.

R-8 (Idempotent seed). The seed script upserts with `ON CONFLICT DO UPDATE` and is safe to run repeatedly.

R-9 (Reversibility). Each extraction unit is a single, revertible change; no unit touches another unit's files.

R-10 (Type safety). New fake-db modules reuse `@galaxy/types`; zero new typecheck errors on touched filters.

R-11 (Tests). Every extracted dataset gets a parity test (static output equals previous inline rows); every `get*Data` action gets an integration test per mode.

R-12 (No production writes). No schema migrations executed, no deploys, no production data writes as part of this plan.