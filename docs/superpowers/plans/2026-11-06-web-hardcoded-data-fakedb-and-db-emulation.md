# Web hardcoded data → fake-db consolidation & DB emulation

- **Date:** 2026-11-06
- **Mode:** ultra-planner — DEEP PLAN
- **Status:** CONDITIONALLY READY (Track 1 ready; Track 2 gated on `@galaxy/database` and Arsy open decisions)
- **Scope:** the remaining hardcoded datasets living inline in `apps/web/src/views` (and a few `app/` files), and how they should (a) be consolidated into `@galaxy/fake-db` and (b) later be emulated as real database tables.
- **Plan only.** No source files, schemas, dependencies, migrations, commits, or pushes were produced by this document.
- **Related:** [canonical Arsy GitHub issue register](https://github.com/bjo163/galaxy-template/issues/1), [fake-db/types extraction plan](./2026-11-06-galaxy-fake-db-types-extraction.md).

---

## 1. Why this plan exists

The monorepo already moved 14 demo-data modules into `@galaxy/fake-db` and rewired `apps/web` onto them. But that extraction was **partial**: the template (a Vuexy-style Next.js dashboard) still carries a large amount of hardcoded data written directly inside view components — table rows, transaction lists, stat tiles, chart series, FAQ/pricing copies, testimonial and device lists. The user's request is precisely to find what else can move into fake-db or be *emulated with a real database*, with emphasis on the hardcoded data.

Two different end-states are being conflated in that ask, and the plan keeps them separate on purpose:

- **Track 1 — fake-db consolidation (code organization, zero new runtime).** Move the remaining inline *record* datasets out of components into `@galaxy/fake-db`, routed through the existing server-action seam. Behavior stays identical; the win is removing duplication and making every dataset flow through one replaceable boundary.
- **Track 2 — DB emulation (architecture, introduces a runtime).** Back a *subset* of those datasets with real relational tables in `@galaxy/database` (Knex/Objection; PGlite locally, PostgreSQL in prod), seeded from fake-db, and re-point the same server actions to query a repository instead of returning a static array. This is the bridge toward using `apps/web` as the Arsy management console.

Track 2 cannot be done cleanly without Track 1 first, because Track 1 is what funnels all demo data through the seam that Track 2 later swaps.

---

## 2. Evidence & current state

### 2.1 The established data seam (VERIFIED)

`@galaxy/fake-db` modules export a `db` object. A `'use server'` action returns it; a **server** page awaits the action and passes slices down as props to **`'use client'` widgets**:

```
'use server'  getStatisticsData()  ->  returns db from @galaxy/fake-db/pages/widgetExamples
      (apps/web/src/app/server/actions.ts:18, 56-58)
   ->  server page awaits  ->  props  ->  'use client' widget
      (apps/web/src/app/[lang]/(dashboard)/(private)/pages/widget-examples/statistics/page.tsx:50, 58, 79-107)
```

The template author explicitly left the seam open for a future backend swap. In that same page (lines 31-46) there is commented-out code that replaces the server action with a `fetch(${API_URL}/pages/widget-examples)` call. **Track 2 is the formalization of exactly that comment.** This is the single most important fact for the whole plan: the replacement boundary already exists and is intended to be swapped.

### 2.2 The half-finished boundary (VERIFIED — the core problem)

On the *same* statistics page, some widgets receive `statsData.*` props (already extracted) while sibling widgets receive **nothing** and still hardcode their arrays locally (`StatisticsCard`, `SubscribersOrders`, `UserListCards`, `DistributedBarChartOrder`, `LineChartProfit`, …). So the current state is not "all inline" or "all extracted" — it is **inconsistently split**, and the inconsistency is spread across dashboards and widget examples. This is what "hardcode-hardcode banyak" refers to.

The dashboard host pages are **server components** that currently await **no action** (`dashboards/crm/page.tsx`, `dashboards/analytics/page.tsx`) — their widgets are all `'use client'` with local literals. So for dashboards, Track 1 must both create the fake-db module **and** introduce the `getDashboardData`-style action + prop threading that the template author skipped.

### 2.3 `@galaxy/database` is foreign, uncommitted WIP (VERIFIED on disk, NOT committed)

`packages/database/` exists with `models/`, `repositories/`, `database.ts`, `migrations.ts` and is described by the Arsy spec as Knex + Objection with PGlite/PostgreSQL adapters. It is currently **untracked** (`?? packages/database/`) and belongs to another workstream. Consequence: **Track 2 has an external dependency this plan does not own.** It must be treated as a contract to align with, not a stable library, and Track 2 start is gated on that package reaching a usable public API. This is also a contamination constraint (see §11).

---

## 3. Hardcoded-data inventory (the answer to "what else can move")

Approximate volumes are from per-file inspection of the three inventory sweeps; they are order-of-magnitude, not a build-time census. Classification legend in §4.

### 3.1 RECORD_DATA — primary Track 1 + Track 2 candidates

| Area | File(s) | Dataset | ~Rows | Notes / duplication |
| --- | --- | --- | --- | --- |
| react-table | `views/react-table/data.ts` | employee/record dataset, standalone module | **52** | Cleanest possible extraction: already a data-only file, 5 client importers (`BasicDataTables`, `ColumnVisibility`, `EditableDataTables`, `KitchenSink`, `RowSelection`). Top Track 1 priority. |
| crm dashboard | `views/dashboards/crm/LastTransaction.tsx` | card transactions | 5 | relational; `statusObj` map is UI_CONFIG |
| | `ActiveProjects.tsx` | active projects + progress | 6 | dup with widget-examples `ActiveProjects` |
| | `SalesByCountries.tsx` | sales by country | 6 | **exact dup** with analytics + widget versions |
| | `ProjectStatus.tsx`, `ActivityTimeline.tsx` | earnings cats / activity feed | 2 / 3 | timeline authored in JSX — needs data/markup split |
| analytics dashboard | `SourceVisits.tsx`, `MonthlyCampaignState.tsx`, `EarningReports.tsx`, `TotalEarning.tsx`, `SupportTracker.tsx`, `WebsiteAnalyticsSlider.tsx` | traffic / campaign / earnings / ticket / slide metrics | 2-6 each | several duplicated verbatim in `widget-examples/charts/*` |
| widget-examples/advanced | `Transactions.tsx` | wallet/bank/paypal transactions | 7 | relational |
| | `Orders.tsx` | staged orders w/ sender+receiver | 6 | **nested relational** — best Track 2 modeling exercise |
| | `PopularProducts.tsx` | product cards | 6 | **duplicates** `fake-db/apps/ecommerce.ts` products |
| | `PopularInstructors.tsx`, `TopCourses.tsx`, `AssignmentProgress.tsx` | academy entities | 4-6 each | **duplicates** `fake-db/apps/academy.ts` domain |
| | `VehicleCondition.tsx`, `VehicleOverview.tsx`, `DeliveryPerformance.tsx`, `CarrierPerformance.tsx` | logistics entities | 3-6 | logistics domain (cf. `fake-db/apps/logistics.ts`) |
| | `BrowserStates.tsx`, `InterestedTopics.tsx` | browser share / topic split | 3-5 | |
| account-settings | `security/RecentDevicesTable.tsx` | login devices | 6 | new entity table |
| | `security/ApiKeyList.tsx` | API keys | 3 | new entity; secret-shaped values — see §9 |
| | `connections/index.tsx` | connected + social accounts | 10 | new entity |
| | `billing-plans/PaymentMethod.tsx` | saved cards | 2 | synthetic PAN/CVV-shaped — see §9 |
| apps/user ↔ ecommerce customers (**copy-pasted pairs**) | `user/view/…/billing-plans/PaymentMethod`, `security/RecentDevice`, `connections`, `overview/ProjectListTable`, `ecommerce/customers/details/customer-right/*` | cards / devices / connections / projects | 3-7 each | **the same datasets are duplicated between `apps/user` and `ecommerce` customer views** — biggest dedup win; normalize into one module each |
| apps/roles | `views/apps/roles/RoleCards.tsx` | role summary cards | 5 | role vocabularies differ from `permissions.ts`/`userList.ts` — normalize on extraction |
| front-pages | `landing-page/CustomerReviews.tsx` | testimonials | 10 | **new entity, no existing table** |
| | `landing-page/OurTeam.tsx` | team members | 4 | new entity |
| | `help-center/KnowledgeBase.tsx` | grouped article tree | 36 | overlaps `faq.ts` schema; reconcile |
| | `landing-page/Pricing.tsx`, `pricing/Plans.tsx` | plan tiers + feature matrix | 3 + 8 | **incompatible schema** with `fake-db/pages/pricing.ts` — unify |
| | `landing-page/Faqs.tsx`, `pricing/Faqs.tsx` | FAQ accordions | 4 / 5 | fold into `faq.ts` |
| wizard/checkout | `wizard-examples/checkout/StepCart/StepConfirmation/StepAddress` | cart items + saved addresses | 2-3 each | dup StepCart≈StepConfirmation; maps to `ecommerce.ts` + a user-addresses entity |

### 3.2 CHART_SERIES — mostly NOT extracted (by design)

`views/charts/apex/*` (~11 files) and `views/charts/recharts/*` (~6 files) are a **chart-library showcase**; their literals are chart config, not app data. The same is true of the `series`/`categories` sparklines inside dashboards and widget charts. Recommendation: **leave in place.** They carry no identity, no relations, no CRUD — moving them into fake-db or a table would be slop. The only borderline ones are the multi-key row arrays in `RechartsBarChart/AreaChart/RadarChart` (entity-shaped but still demo chart data); keep them, revisit only if a real metrics table is ever wanted.

### 3.3 UI_CONFIG — explicitly OUT of scope for extraction

`statusObj`/`userRoleObj` color-icon maps, form-wizard `steps` arrays, stepper labels, select option lists (`Languages`, `regionArray`, `furnishingArray`, `offeredItemsArray`, deal-type/role radios), landing `feature`/`ProductStat`/`UsefulFeature`, checkout `steps`/`dataIcons`. These are presentation, not records. The only mild exception is the six near-identical form-wizard `steps` blocks — that is a **component-deduplication** concern (share one labels module inside web), not a fake-db concern. Do not move these into the data package.

### 3.4 AUTH_SECRETS — carve-out, never in the shared bundle

`app/api/login/users.ts`: one demo user `admin@vuexy.com` with **plaintext password `'admin'`** (file already warns "remove in production"). Rule: this must **not** be relocated into `@galaxy/fake-db` (which is a consumable package) or seeded into any DB-emulation table as a plaintext credential. Keep it a dev-only, web-local fixture behind an env override; if a DB track needs a demo account, store a hashed verifier only (Arsy spec §7: credentials store verifiers, not raw secrets).

### 3.5 Sizing summary

≈ **55 record datasets / ~400-450 demo rows** are genuine Track 1 candidates; of those ≈ **35 are also reasonable Track 2 table candidates**. ≈ **40 chart-series configs** stay as code. ≈ **30 UI-config literals** stay in code. **1 auth secret fixture** is carved out. ≈ **12 datasets are outright duplicates** (SalesByCountries ×3, PopularProducts→ecommerce, PopularInstructors/TopCourses→academy, vehicle/orders→logistics, user↔ecommerce tab pairs, landing Faqs→faq, landing/plan Pricing→pricing) and should be **consolidated to one source, not extracted N times**.

---

## 4. Classification policy (the rule that prevents slop)

| Class | Test | Track 1 (fake-db)? | Track 2 (DB table)? |
| --- | --- | --- | --- |
| **RECORD_DATA** | repeated objects w/ identity, fields, optional relations; a user could imagine adding/editing a row | **Yes** — move to a fake-db module behind the server-action seam | **Yes** if it has stable identity and/or relations |
| **CHART_SERIES** | numeric array consumed directly as chart `series`/`categories` | Optional; default **No** (keep as code) | **No** — it is derived/presentation, not a persisted entity (unless a real metrics table is explicitly wanted) |
| **UI_CONFIG** | labels, steps, menus, status→color/icon maps, select options | **No** — never a data module | **No** |
| **AUTH_SECRETS** | credentials, tokens, PAN-shaped values | **No** — never into the package | Only as hashed/env dev fixtures |

Decision rule for each candidate: classify first, then apply the row. A dataset is only extracted when it clears the RECORD_DATA test; "it's an array literal" is not by itself a reason to extract.

---

## 5. Requirements

### 5.1 Functional

- **FR-001** Every RECORD_DATA dataset from §3.1 lives in exactly one `@galaxy/fake-db` module and is reachable only through a `get*Data()` server action (or route handler) — no component imports the literal directly.
- **FR-002** Client widgets keep their current rendering; data arrives via props from the server page, matching the widget-examples pattern already in place.
- **FR-003** Duplicated datasets (§3.5) collapse to a single canonical module; the duplicate consumers import from it.
- **FR-004** CHART_SERIES and UI_CONFIG are **not** moved into fake-db.
- **FR-005** Track 2 defines one persistence repository per emulated entity with `list/getById` at minimum, seeded from the fake-db module.
- **FR-006** The `get*Data()` action can be toggled between "static fake-db return" and "DB query return" without changing any component or prop shape (the seam is the contract).
- **FR-007** The auth demo user and secret-shaped sample values remain outside the package and are never seeded as plaintext.

### 5.2 Non-functional / security

- **NFR-001 Bundle weight:** Track 1 must not push large demo datasets into client bundles. Because data flows through the server action, the array stays server-side; the commented API-fetch pattern is the proof. (If a tiny stat tile is imported client-side for pragmatism, it must be small and explicitly accepted.)
- **NFR-002 Type safety:** extracted modules reuse `@galaxy/types` entities already created; the 13 `@/types` shims stay as the compatibility surface.
- **NFR-003 No silent behavior change:** each Track 1 unit must render identically (same rows/order) before merge.
- **NFR-004 Isolation honesty (Track 2):** DB emulation is scoped to *this web app's demo* via `@galaxy/database`/PGlite; it does **not** implement Arsy tenancy/RLS. Full tenant isolation remains in the Arsy spec and is out of this plan.
- **NFR-005 Reversibility:** each extraction/seed is a small, independently revertible unit.

---

## 6. Target architecture

### 6.1 Track 1 — fake-db consolidation

```
packages/fake-db/src/
  apps/    reactTable.ts, roles.ts, dashboard.ts (crm+analytics widgets),
           (extend existing ecommerce/academy/logistics for the duplicated cards)
  pages/   accountSettings.ts, helpCenter.ts, frontLanding.ts, checkout.ts
```

Pattern per module (mirrors `widgetExamples.ts`):

```
// packages/fake-db/src/apps/roles.ts
export const db = { roleCards: [...], /* ... */ }
```
```
// apps/web/src/app/server/actions.ts
export const getRolesData = async () => (await import('@galaxy/fake-db/apps/roles')).db
```
```
// apps/web/src/app/.../apps/roles/page.tsx  (server component)
const rolesData = await getRolesData()
return <RoleCards data={rolesData.roleCards} />
```

`RoleCards.tsx` becomes `'use client'` presentational, local literal removed.

**Client/server boundary decision (D-002 below):** default is server-action + props, not client-side fake-db import, because the DB seam requires the data to originate server-side.

### 6.2 Track 2 — DB emulation

```
server action  getEcommerceData()
   ->  Repository (in @galaxy/database)   [was: return fake-db static]
         ->  Objection model  Product, Order, Customer, Transaction, Project, Review, ...
               ->  Knex table  seeded FROM the fake-db module at migration time
                     ->  PGlite (dev) / PostgreSQL (prod)
```

- fake-db modules become the **seed source of truth**; a seed script upserts their rows into tables. Track 1 therefore doubles as the Track 2 fixture layer — this is why the ordering matters.
- The action keeps the **same return shape** (D-003), so components are untouched when the body flips from static → query.
- Entities worth modeling (relational, high row count, or referenced by others): products, orders, order-parties, customers, users, roles/permissions, transactions, projects, reviews/testimonials, devices, addresses, api-keys (metadata only), faqs, pricing plans+features. Chart series and UI config are **not** modeled.
- Arsy relationship: `@galaxy/database` tables here are **static platform/demo tables** (Objection classes), per Arsy AD-001 — not the dynamic JSONB model engine. This track is a stepping stone to using web as the console, but does not by itself satisfy any Arsy acceptance criterion.

---

## 7. Design decisions & alternatives

**D-001 — Two tracks, fake-db first.**
Rationale: Track 2 needs a single server-side boundary per dataset; today data is scattered inline. Consolidating first creates that boundary with zero new runtime, then Track 2 swaps the boundary's implementation. Alternative: jump straight to a DB. Rejected — it would query data still hardcoded in client components, forcing component rewrites twice. Reversal: none; ordering is the point.

**D-002 — Route record data through the server-action seam, not client imports.**
Rationale: matches the existing template intent (widget-examples, commented fetch), keeps large arrays off the client bundle (NFR-001), and is the only shape that a DB can later fill. Alternative: `import { db } from '@galaxy/fake-db/…'` directly inside the `'use client'` widget. Rejected as default (bundles data, breaks the DB seam); allowed only for tiny static stat tiles where a server round-trip is pointless — decided case-by-case and recorded.

**D-003 — The action's return shape is the stable contract.**
Rationale: enabling static→DB swap "without touching components" (FR-006) requires the payload shape to be invariant. Consequence: when emulating, map DB rows back into the exact object/array shape the widget already expects. Alternative: redesign payloads to a normalized record API shape now. Deferred to the Arsy console work; too invasive for this plan.

**D-004 — Consolidate duplicates into canonical modules before/while extracting.**
Rationale: ~12 datasets are copies. Extracting each in place would enshrine the duplication into fake-db. Rejected alternative: one module per consumer. Consequence: a few consumers need small prop-shape reconciliation (e.g. landing `pricingPlans` vs `pricing.ts` schema) — do it in the extraction unit, not as a separate refactor.

**D-005 — Do not extract CHART_SERIES or UI_CONFIG.**
Rationale: they are presentation, not state; moving them adds indirection with no reuse or persistence benefit (antislop). Consequence: a reviewer expecting "all arrays moved" must be pointed to the classification policy (§4), not the raw count.

**D-006 — Auth demo user stays a web-local dev fixture; secret-shaped data never enters the package.**
Rationale: security + the package is consumable. Alternative considered and rejected: move `login/users.ts` into fake-db for symmetry. Reversal condition: if Track 2 needs a demo account, introduce it as a hashed verifier via env, not plaintext.

---

## 8. Phased roadmap

Each unit is independently verifiable and revertible; keep them small (repo convention: SDD, task-by-task commits with scoped gates).

### Phase 0 — Baseline & coordination (no product code)
- **Objective:** lock the inventory and the external dependency reality.
- **Deliverables:** this plan; confirm `@galaxy/database` public API/owner status; confirm which dashboard hosts are server components (VERIFIED: crm/analytics pages are server components awaiting nothing).
- **Exit:** Track 1 candidate list frozen; Track 2 dependency state recorded (READY / BLOCKED).
- **Risk:** starting Track 2 against uncommitted foreign `packages/database`. → Do not.

### Phase 1 — Track 1 quick wins (highest value, lowest coupling)
- **Objective:** prove the seam on the cleanest datasets.
- **Scope:** `react-table/data.ts` → `apps/reactTable.ts` (+ rewire 5 importers, keep them `'use client'`, data via page props or a documented small client import decision); `apps/roles.ts` (RoleCards + role-vocabulary normalization); dashboards → single `apps/dashboard.ts` for the ~10 crm/analytics RECORD_DATA widgets + introduce `getDashboardData`.
- **Deliverables:** fake-db modules, new `get*Data` actions, server pages threaded, components de-hardcoded.
- **Exit:** those views render identical data with zero local record literals; `typecheck`/`lint` green on touched files; no client bundle growth beyond accepted stat tiles.

### Phase 2 — Track 1 dedup & breadth
- **Objective:** finish the RECORD_DATA surface.
- **Scope:** account-settings tables; apps/user ↔ ecommerce shared tab pairs (normalize once, import twice); widget-examples advanced entities; front-pages (reviews, team, KnowledgeBase↔faq, pricing↔pricing unification, checkout cart/addresses→ecommerce).
- **Deliverables:** consolidated modules; duplicate consumers re-pointed.
- **Exit:** §3.1 has no remaining inline RECORD_DATA except explicitly-accepted exceptions; duplicates resolved.

### Phase 3 — Track 2 seam + first vertical slice
- **Objective:** emulate a *few* entities end-to-end to validate the design, not all of them.
- **Deliverables:** seed script (fake-db → tables) for one vertical slice (e.g. products + orders + customers); `getEcommerceData` flipped to a repository behind a flag/env while the static path remains default; integration check that props are unchanged.
- **Exit:** ecommerce views work off `@galaxy/database`/PGlite with the same UI; static path still available.
- **Gate:** blocked until `@galaxy/database` exposes a stable repository/model API.

### Phase 4 — Selective Track 2 expansion + normalization
- **Objective:** extend emulation to entities with real relational value (transactions, projects, reviews, devices, roles/permissions, faqs/pricing).
- **Deliverables:** per-entity tables + seeds + repository + action flip; a migration/versioning story consistent with `@galaxy/database`.
- **Exit:** a documented subset of web reads from DB; the rest intentionally remain fake-db-static (chart/UI data).
- **Explicit non-goal:** no Arsy tenancy/RLS/dynamic-model work here (Arsy §3, §15 open decisions govern that separately).

### Phase 5 — Hardening & docs
- **Objective:** make the boundary safe for the console direction.
- **Deliverables:** update fake-db / actions README notes; document which datasets are static vs DB-backed vs intentionally-inline; reconcile the transitional `@/types` shims now that consumers moved; record the leftover carry-forwards from the prior extraction.

---

## 9. Security & data-safety carve-outs

- `app/api/login/users.ts` (D-006): plaintext dev credential; keep web-local, env-overridable, never packaged or DB-seeded as plaintext.
- Synthetic PAN/CVV (account-settings `PaymentMethod`, apps/user `PaymentMethod`): keep obviously fake; do not connect to any payment path; if emulated, store as display metadata only.
- `ApiKeyList` / connection tokens: mask values; if they ever become DB rows, store identifiers not secrets.
- These rules also satisfy Arsy's "verifiers not raw secrets" stance for any later auth integration.

---

## 10. Verification & acceptance (Track 1, per unit)

- **AC-001** For each extracted dataset: the consuming view renders the same rows/order as before (visual/JSON parity check; not a typecheck alone).
- **AC-002** No `const … = [ {…} ]` record literal remains in the targeted component; the only remaining literals are classified CHART_SERIES/UI_CONFIG (verifiable by grep against §3.2/§3.3).
- **AC-003** `get*Data()` is the sole access path; grep shows no component importing a fake-db data module directly except the documented stat-tile exceptions.
- **AC-004** Duplicates collapse: e.g. `SalesByCountries` reads one module, not three copies; landing/plan pricing reconcile onto one shape.
- **AC-005** Scoped Turbo gates pass on touched surfaces only — `pnpm exec turbo run typecheck lint --filter=web --filter=@galaxy/fake-db --filter=@galaxy/types` — never the unfiltered root (foreign apps would pollute results).
- **AC-006 (Track 2 slice)** with the DB flag on, the ecommerce views show seeded rows with unchanged props; with it off, static behavior is byte-identical to Phase 1/2 output.

Verification discipline carried from prior work in this repo: **a green typecheck is not proof of a correct render** — do a real browser/JSON parity check; and **verify the extracted module is actually reachable by the rewired consumer**, don't trust a rename that compiles.

---

## 11. Risk register

| ID | Risk | Impact | Mitigation |
| --- | --- | --- | --- |
| R-1 | `@galaxy/database` is foreign uncommitted WIP; its API may churn | Track 2 rework / blocked | Gate Track 2 on a stable public API; keep fake-db as fallback source; align ownership before Phase 3 |
| R-2 | Client widgets importing fake-db server-side data leaks arrays into client bundle | perf | Default to server-action + props (D-002); bound accepted client imports |
| R-3 | Schema reconciliation (landing pricing vs `pricing.ts`, roles vocab) breaks rendering | visual regressions | Do the shape fix inside the same extraction unit with a parity check (AC-001) |
| R-4 | Nested/JSX-in-data (timeline, devices w/ `browserIcon`) resists clean extraction | refactoring effort | Pre-step: key-ify JSX (icon→name + lookup map) before moving the rows |
| R-5 | Over-extraction of CHART_SERIES/UI_CONFIG as "cleanup" | added indirection, no value | Enforce classification policy §4; reviewer counts records not arrays |
| R-6 | Contaminating foreign uncommitted work (`apps/arsy`, `apps/baas`, `packages/ui`, `packages/database`, root `package.json`, `pnpm-lock.yaml`, the dirty web component set) | lost other workstreams | Inherited constraint: commit only this task's own files by explicit path; never `git add -A`/`stash`/`checkout --`; per-file staging |
| R-7 | Tracking "done" by count of moved arrays | misleading | Done = §3.1 record surface + dedup + parity checks, not a total |

**Contamination constraint (from repo history):** the working tree currently carries another workstream's edits (untracked Arsy/BaaS/apps + modified web files). All execution here must commit only its own paths and leave the rest untouched — the same discipline used in the fake-db/types extraction.

---

## 12. Out of scope

- Arsy control-plane, tenancy, RLS, dynamic model catalog, add-ons, credentials (Arsy spec governs those; §15 open decisions unresolved).
- Rewiring the dashboard data to a **live** third-party API (only the internal fake-db→DB seam is planned).
- Moving CHART_SERIES or UI_CONFIG into the data package.
- Converting the transitional `@/types` shims to real rewires (a documented carry-forward, separate concern).
- Any commit, push, deploy, or schema migration execution (this is plan-only).

---

## 13. Implementation-readiness gate

**Track 1 (fake-db consolidation): READY.** The seam, the pattern, the module conventions, and the candidate list are all verified against the repo; no external dependency.

**Track 2 (DB emulation): CONDITIONALLY READY.** Prerequisites to clear first:
1. `@galaxy/database` exposes a stable, committed public model/repository API (currently foreign untracked WIP).
2. A seed strategy from fake-db modules to tables is chosen.
3. The static↔DB toggle mechanism is picked (env flag vs per-action branch) so components never change.
4. Arsy's identity decision (Arsy §15.1) is acknowledged if the console direction is being prepared in parallel.

Do not start Phase 3 until 1-3 resolve; do not present Track 2 as satisfying any Arsy acceptance criterion.

---

## 14. Open questions for the owner

1. **Depth of Track 2 wanted now** — full DB emulation across entities, or just the seam + one vertical slice to prove the architecture? (Recommend: seam + one slice; expand later.)
2. **Consolidation appetite** — should duplicated datasets (SalesByCountries, PopularProducts/Instructors, user↔ecommerce tab pairs, pricing/faq variants) be **merged into one canonical source** in this pass (more prop-shape churn) or **extracted in place** (faster, keeps duplication)? (Recommend: merge — otherwise we bake the duplication into the package.)
3. **Dashboard hosting** — introduce a single `getDashboardData` action for crm+analytics, or one action per widget? (Recommend: one grouped action; fewer seams to flip later.)
4. **`@galaxy/database` coordination** — who owns it, and is its API stable enough for a Phase 3 slice, or should Track 2 be deferred and this plan executed as Track 1 only for now?
5. **Bundle policy** — confirm tiny stat tiles may use a documented client-side import, or enforce the server seam everywhere without exception.

---

## 15. Traceability map (candidate → phase → decision)

- `react-table/data.ts` → P1 → D-001/D-002 · `apps/roles.ts` → P1 → D-004 · dashboards → P1 → D-002 (new `getDashboardData`)
- account-settings / apps-user / ecommerce-shared → P2 → D-004 (dedup), R-4 (JSX key-ify)
- widget-examples advanced · front-pages (reviews/team/kb/pricing/faq/checkout) → P2 → D-003 (shape stability), D-004
- products/orders/customers slice → P3 → D-003, NFR-004 · remaining relational entities → P4 · docs + `@/types` shim reconciliation → P5
- `login/users.ts`, PAN/CVV, api-keys → §9 carve-outs → D-006 · charts & form-wizard steps → §3.2/§3.3 → **not extracted** (D-005)
