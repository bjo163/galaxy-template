# rule.md — hard rules for the remaining-fake-db + DB-emulation work

1. **Plan-only.** This folder is a plan. Do not edit application source, do not create
   files, do not modify schemas, do not run migrations, do not commit or push until
   the owner explicitly authorizes execution. A separate execution session consumes
   `task.md`.
2. **Scope discipline.** Touch only the files listed in `task.md`. Never `git add -A`,
   never `git stash`, never `git checkout --`. Stage per explicit path. The working
   tree carries foreign workstreams (untracked Arsy/Baas/apps, modified web UI
   components, `packages/database` is a separate workstream's committed WIP). Leave
   all of that untouched.
3. **Classification policy is the gate.** Before moving any dataset, classify it:
   RECORD_DATA (move), CHART_SERIES / UI_CONFIG (never move), AUTH_SECRETS (never
   package, never seed as plaintext). "It is an array literal" is not a reason to
   extract. Re-read `spec.md` §4.
4. **Server seam is the default.** Record data flows through a `'use server'` action
   and arrives as props from a server page. A client widget importing
   `@galaxy/fake-db` directly is only allowed for the documented small stat tiles,
   and each one is recorded in `report.md`.
5. **Byte-identity before dedup.** Before pointing a widget at an existing fake-db
   slice, confirm the arrays are exactly equal (normalized diff). Never re-extract a
   duplicate — that bakes duplication into the package.
6. **JSX-in-data is blocked, not skipped.** Datasets embedding `ReactElement`
   (`browserIcon: <i/>`, `logo: <Pinterest/>`) are NOT valid targets until the icon
   field is refactored to a serializable identifier with a client-side lookup map.
   Do not force them through the action; do not silently drop them — flag them.
7. **Track 2 shape invariance.** The `get*Data()` return shape is the stable
   contract. When an action flips from static fake-db return to a DB repository
   query, the payload shape must not change; components are untouched (FR-006).
8. **Secrets.** `app/api/login/users.ts` plaintext demo credential stays web-local and
   env-overridable. Synthetic PAN/CVV and API-key-shaped values stay obviously fake,
   display metadata only, never seeded as real credentials.
9. **No slop.** Do not extract CHART_SERIES or UI_CONFIG as "cleanup". Do not add
   dependencies not listed in `task.md`. Do not drive-by refactor unrelated files.
   Do not disable linters/typecheck/CI to make a task pass.
10. **Verification is behavioral, not typecheck.** A green `tsc` is not proof the
    render is unchanged. For every extraction unit, do a real parity check (same
    rows/order) before merge, and confirm the rewired consumer actually reaches the
    new module — a rename that compiles but nothing imports it is a failure.
11. **Track 2 gating.** Track 2 (DB emulation) starts only when `@galaxy/database`
    exposes a stable committed public API and the owner confirms depth. Do not
    present Track 2 as satisfying any Arsy acceptance criterion.