# spec.md – Technical Specification for Remaining Hardcoded Data Migration & DB Emulation

## FR‑001 Extract KPI Card Datasets (Invoice, Preview, Order, UserList)
- **Scope:** Move each hard‑coded `const data = [...]` array from the listed component files into a dedicated module under `packages/fake-db/src/apps/`.
- **Export:** `export const db = { <entityName>: [...] }` where `<entityName>` matches the component's prop name.
- **Action:** Add a `'use server'` function in `apps/web/src/app/server/actions.ts` returning the new module’s `db`.
- **Acceptance:** Rendering of the component before and after migration is byte‑identical (row order, values). No client bundle size increase beyond a permitted tiny‑stat‑tile exception.

## FR‑002 Refactor JSX‑Embedded Icons (ActivityTimeline, RecentDevicesTable, CustomerReviews, IconStepsCard)
- **Scope:** Replace any `ReactElement` values inside record objects with a serializable identifier (e.g. `iconId: 'user'`).
- **Client‑side map:** Create a constant map `const ICON_MAP: Record<string, JSX.Element>` in a new `apps/web/src/app/client/iconMap.tsx` and reference it in the component (`ICON_MAP[iconId]`).
- **Acceptance:** The visual output is unchanged; a diff of the rendered HTML must be identical.

## FR‑003 DB Seed Script
- **Scope:** A Node script `packages/fake-db/scripts/seed-db.ts` that imports every `packages/fake-db/src/apps/*.ts` module, iterates over its exported `db` objects, and upserts rows into corresponding tables via `@galaxy/database` repositories.
- **Idempotent:** Running the script multiple times does not duplicate rows (use `ON CONFLICT DO UPDATE`).
- **Acceptance:** After script execution, a query through a repository returns exactly the same dataset as the static fake‑db export.

## FR‑004 DB‑backed Action Flip (Pilot Slice)
- **Scope:** Choose a pilot entity (e.g. `ecommerce.products`). Implement a repository class for the table, then modify the associated `getEcommerceData` action to return `await repository.listAll()` instead of the static fake‑db export.
- **Invariant:** The returned JSON shape must match the original fake‑db shape (`Array<{…}>`). No component code changes.
- **Acceptance:** End‑to‑end test that renders the component with the DB‑backed action and asserts JSON equality with the previous static response.

## NFR‑001 Bundle Impact
- Data must stay server‑side; only the tiny‑stat‑tile exception may import a tiny static slice client‑side (documented in `rule.md`).

## NFR‑002 Type Safety
- All new modules use existing `@galaxy/types` definitions. The TypeScript compiler must emit no errors.

## NFR‑003 Security
- No secret values (passwords, PAN, API keys) are ever stored in `@galaxy/fake-db` or seeded into the DB. Demo credentials remain web‑local with env overrides.

## NFR‑004 Reversibility
- Each extraction unit is a single commit that can be reverted without affecting other code.

## Traceability
- FR‑001 ↔ `task.md` items 1‑4
- FR‑002 ↔ `task.md` items 5‑8
- FR‑003 ↔ `task.md` item 9
- FR‑004 ↔ `task.md` item 10
- NFR‑001 ↔ `rule.md` item 2
- NFR‑002 ↔ `rule.md` item 3
- NFR‑003 ↔ `rule.md` item 8
- NFR‑004 ↔ `rule.md` item 9