# @galaxy/fake-db

Centralized demo/data layer for the Galaxy platform. All `RECORD_DATA` datasets
(repeated objects with identity, optional relations) live here — one canonical
module per dataset — and are exposed to `apps/web` through a swappable emulation
seam: **static** (default) ↔ **db** (PGlite / `@galaxy/database`) ↔ **api**
(`fetch(API_URL + endpoint)`).

## Module layout

```
packages/fake-db/
├── src/apps/*.ts     # app-scoped datasets  (ecommerce, academy, logistics, roles, …)
├── src/pages/*.ts    # page-scoped datasets (accountSettings, frontPages, …)
├── src/navigation/*.ts
└── scripts/seed-db.ts # idempotent upsert fake-db → @galaxy/database tables
```

Each module exports a single `db` object typed from `@galaxy/types`:

```ts
export const db = {
  <entityKey>: [ { id, ...fields } ]
} satisfies <EntityType>
```

## Consuming from apps/web

Server actions in `apps/web/src/app/server/actions.ts` delegate to
`data-source.ts`:

```ts
export const getEcommerceData = async () =>
  loadModuleData(resolveDataSource(), {
    staticData: eCommerceData,
    endpointPath: '/apps/ecommerce',
  })
```

`resolveDataSource()` reads `process.env.DATA_SOURCE` (`static` | `db` | `api`,
default `static`).

- **static** — returns the bundled fake-db dataset (default, byte-identical to pre-plan behavior).
- **api** — `fetch(process.env.API_URL + endpointPath)`; same return shape as static.
- **db** — `repository.query().select()` via `@galaxy/database`; falls back to static until a
  `@galaxy/database` entity model + table exists for the pilot slice (gate G-1).

No component imports fake-db data modules directly. Data flows:
`get*Data()` action → server page → `data` prop → client widget.

## Classification (what goes in, what stays out)

| Class | Example | In fake-db? |
|-------|---------|-------------|
| RECORD_DATA | products, orders, users, notifications, vehicle tracking | Yes |
| CHART_SERIES | numeric chart `series`/`categories` | No — stays in code |
| UI_CONFIG | labels, steps, menus, icon/color maps, select options | No — stays in code |
| AUTH_SECRETS | credentials, tokens, PAN/CVV | Never — not in package, not in seed |

## Adding a new dataset

1. Add the type to `packages/types/src/apps/<name>Types.ts` (or reuse an existing one).
2. Create `packages/fake-db/src/apps/<name>.ts` (or `src/pages/<name>.ts`):

   ```ts
   import type { <EntityType> } from '@galaxy/types/apps/<name>Types'
   export const db = {
     <entityKey>: [ { id, ...fields } ]
   } satisfies <EntityType>
   ```

3. Register a `get<Entity>Data` server action in `apps/web/src/app/server/actions.ts`
   calling `loadModuleData(resolveDataSource(), { staticData: <db>, endpointPath: '<path>' })`.
4. Wire the server page to await the action and pass the slice as a `data` prop.
5. Add a parity test in `apps/web/src/app/server/__tests__/`.

## Environment

| Var | Values | Default | Meaning |
|-----|--------|---------|---------|
| `DATA_SOURCE` | `static` \| `db` \| `api` | `static` | Backend for the emulation seam |
| `API_URL` | base URL | (required for `api`) | Base for `api` mode fetches |

## Testing

- Parity tests: `apps/web/src/app/server/__tests__/fake-db.parity.test.ts` — every extracted module exports non-empty `db`.
- Emulation integration tests: `apps/web/src/app/server/__tests__/actions.emulation.test.ts` — static / db / api modes; shape invariant.
- Run with: `tsx src/app/server/__tests__/<file>.ts` (no vitest dependency; uses bundled `node:test`).

## Security

No credentials, PAN/CVV, or secrets in `packages/fake-db`, DB seed, or logs (R-2).
Fake payment method rows are obviously-fake display metadata only.

## Gates

- **G-1**: DB-emulation pilot slice (`@galaxy/database` entity model + table for ecommerce products)
  is owned by the `@galaxy/database` workstream. Until G-1 is met, `DATA_SOURCE=db` falls back to
  static data and static/api ship independently.
