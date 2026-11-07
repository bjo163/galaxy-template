# design.md — Architecture & decisions: fake-db centralization with DB & API emulation

## 1. Context diagram

```
[client widget ('use client')]
        ↓ props
[server page / route handler]
        ↓ awaits
get<Entity>Data() server action        apps/web/src/app/server/actions.ts
        ↓ delegates to
resolveData(entity, staticData, apiPath)  apps/web/src/app/server/data-source.ts (NEW)
        ├─ static (default) ──► packages/fake-db/src/apps/*.ts, pages/*.ts  (export const db)
        ├─ db                   ──► repository.query().select() ──► @galaxy/database
        │                                          (Objection/Knex → PGlite local)
        └─ api                  ──► fetch(process.env.API_URL + endpointPath)
```

## 2. Module boundaries

| Layer | Path | Responsibility | May import |
|-------|------|----------------|------------|
| Data modules | `packages/fake-db/src/apps/*.ts`, `src/pages/*.ts`, `src/navigation/*.ts` | `export const db = {...}` record datasets | `@galaxy/types` only |
| Seed script | `packages/fake-db/scripts/seed-db.ts` | upsert module rows into `@galaxy/database` tables | `@galaxy/fake-db` modules, `@galaxy/database` repositories |
| Resolver + toggle | `apps/web/src/app/server/data-source.ts` (NEW) | `static`/`db`/`api` selection via `DATA_SOURCE` env; endpoint map | `server-only`, native fetch |
| Server actions | `apps/web/src/app/server/actions.ts` | `get*Data()` seam; one action per module; invariant shape | `@galaxy/fake-db`, `data-source.ts` |
| Server pages | `apps/web/src/app/[lang]/(dashboard)/(private)/{dashboards,apps,pages}/*/page.tsx` | await action, pass slices as props | `actions.ts` |
| Client widgets | `apps/web/src/views/**/*.tsx` | render props; `ICON_MAP[iconId]` for icons | `iconMap.tsx` |
| Icon map | `apps/web/src/app/client/iconMap.tsx` (NEW) | `iconId`/`logoId` → JSX.Element | MUI/tabler icons |

Layering per AGENTS.md §5: apps import packages only; packages/fake-db imports `@galaxy/types`; no upward imports; no cross-app imports.

## 3. Module map (target state)

```
packages/fake-db/
├── src/
│   ├── apps/
│   │   ├── dashboard.ts            // crm + analytics RECORD_DATA widgets (canonical)
│   │   ├── ecommerce.ts            // products + cartItems + savedAddresses
│   │   ├── academy.ts              // instructors / courses / assignments
│   │   ├── logistics.ts            // vehicles / deliveries / carriers
│   │   ├── roles.ts, userList.ts, reactTable.ts, invoice.ts, permissions.ts, userView.ts
│   │   ├── invoiceKPI.ts, invoicePreview.ts, ecommerceOrderKPI.ts, userListCards.ts
│   │   ├── invoiceKPI.ts, invoicePreview.ts, ecommerceOrderKPI.ts, userListCards.ts
│   │   └── activityTimeline.ts, invoiceKPI.ts (existing, extended as needed)
│   ├── pages/
│   │   ├── accountSettings.ts      // devices, connections, apiKeys (metadata), paymentMethods (fake)
│   │   ├── frontPages.ts           // reviews, team, faqs, pricing
│   │   ├── faq.ts, pricing.ts, userProfile.ts, branding.ts, widgetExamples.ts
│   │   └── widgetExamplesAdvanced.ts  // transactions, orders, browserStates, interestedTopics
│   └── scripts/
│       └── seed-db.ts              // idempotent upsert fake-db → tables
├── package.json (already: exports ./apps/*, ./pages/*)
└── ... (eslintrc, tsconfig unchanged)
apps/web/
├── src/app/server/actions.ts       // get*Data seam (extended, T-12)
├── src/app/server/data-source.ts   // NEW: resolver + DATA_SOURCE toggle + endpoint map
├── src/app/client/iconMap.tsx      // NEW: iconId → JSX map
└── src/views/**                    // de-hardcoded, prop-driven widgets
```

## 4. Design decisions

**D-001 — Fake-db first, emulation second.**
Rationale: Track 2 (emulation) needs one server-side boundary per dataset; today data is scattered inline. Consolidating first creates the boundary with zero new runtime, then emulation swaps the boundary's implementation. Reversal: none — ordering is the point.

**D-002 — Route record data through the server-action seam, not client imports.**
Rationale: matches the existing template intent (widget-examples page + commented fetch), keeps large arrays off the client bundle (NFR-001), and is the only shape a DB or API can later fill. Client-side fake-db import allowed only for documented tiny stat tiles.

**D-003 — The action's return shape is the stable contract.**
Rationale: enables `static` ↔ `db` ↔ `api` swap "without touching components" (FR-006). DB rows are mapped back into the exact object/array shape widgets already expect. Redesigning to a normalized record API is deferred to the Arsy console work.

**D-004 — Consolidate duplicates into canonical modules before/while extracting.**
Rationale: ~12 datasets are copies; extracting in place would enshrine duplication. Small prop-shape reconciliations (e.g. landing Pricing vs `pricing.ts`) are done inside the extraction unit.

**D-005 — Do not extract CHART_SERIES or UI_CONFIG.**
Rationale: presentation, not state; moving them adds indirection with no persistence benefit. Reviewers are pointed to §4 classification, not raw array counts.

**D-006 — Auth secrets carve-out.**
Rationale: `app/api/login/users.ts` plaintext demo credential and PAN/CVV values stay web-local, env-overridable, never packaged or seeded as plaintext (Arsy spec §7: verifiers, not raw secrets).

**D-007 — Three-way static / db / api toggle via `DATA_SOURCE` env.**
Rationale: the user wants operation via database emulation **or** API emulation. One resolver behind `get*Data` supports both; `static` remains the default and fallback. API mode reuses the template's already-documented `fetch(${process.env.API_URL}/...)` pattern (statistics page). Trade-off: DB emulation gives local relational fidelity and a seed source of truth but is gated on `@galaxy/database` entity models (G-1); API emulation needs zero DB work and is shippable immediately.

**D-008 — No `BaseRepository` change; list reads use `repository.query().select()`.**
Rationale: `@galaxy/database` `BaseRepository` exposes `query/findById/insert/patchById/deleteById` but no `listAll()`. Adding `listAll()` would touch another package's base layer; `query().select()` achieves the same without it. Per-entity repository classes (pilot: `ProductRepository`) live under `packages/database/src/repositories/`.

**D-009 — `iconId` placeholders in P1 modules; client map wired in P2.**
Rationale: datasets with inline JSX icons (`ActivityTimeline`, `RecentDevicesTable`, `CustomerReviews`, `IconStepsCard`) cannot be serialized into fake-db as-is. Extract rows with `iconId`/`logoId` strings in P1, replace with `ICON_MAP[iconId]` in P2 so extraction is not blocked by icon refactors.

## 5. Trade-offs considered

| Decision | Alternative | Why rejected |
|----------|-------------|--------------|
| Seam = server actions + props | Client imports `@galaxy/fake-db` in widgets | Bundles demo data into client bundle; breaks the DB/API seam (R-3) |
| DB emulation now for all entities | Pilot slice only | `@galaxy/database` entity models/tables are external WIP (G-1); pilot products slice validates the design without blocking the whole plan |
| API emulation as separate action per endpoint | Single generic `/api/proxy` | Endpoint map mirroring existing `app/api/*` routes keeps contracts explicit and typed |
| Add `listAll()` to `BaseRepository` | `query().select()` in repository/actions | Avoids modifying the database package base layer (D-008) |

## 6. Open questions

1. **Depth of DB track now** — pilot products slice only (recommended), or full entity set? Track 2 stays gated on G-1 either way.
2. **Dashboard hosting** — single `getDashboardData` for crm+analytics, or one action per widget? Recommendation: one grouped action (fewer seams to flip later).
3. **API endpoint ownership** — who defines/publishes `process.env.API_URL` paths consumed by `data-source.ts`?
4. **Who commits `@galaxy/database` entity models** for the pilot slice — this plan or the database workstream? Blocks T-38 until answered.

## 7. Risks

| Risk | Mitigation |
|------|------------|
| Schema reconciliation (landing Pricing vs `pricing.ts`, roles vocabulary) breaks rendering | Shape fix inside the same extraction unit with parity check (AC-001) |
| Nested/JSX-in-data (timeline, devices with `browserIcon`) resists clean extraction | `iconId` placeholder in P1 (D-009), icon map in P2; HTML diff verification |
| Over-extraction of CHART_SERIES/UI_CONFIG as "cleanup" | Enforce §4 classification; count records, not arrays (R-1) |
| Contaminating foreign workstreams | Per-file staging (R-6); commit only listed paths |
| G-1 unresolved → DB emulation blocked | `static`/`api` modes ship independently; DB task deferred and recorded |

## 8. Relation to predecessor plan

This plan is the continuation of `.plan/20261107-0018-plan-fake-db-remaining-and-db-emulation`. Its task items 1–4 are done (`2121ebf`); items 5–11 (JSX refactors, seed script, pilot DB flip, integration tests) are absorbed here as P2/P3/P4 tasks, extended with the API-emulation track (T-37) and the repo-wide sweep (T-01). Nothing in this plan contradicts the predecessor's spec/design; where it extends (three-way toggle), it supersedes the static-only assumption with explicit fallback behavior.