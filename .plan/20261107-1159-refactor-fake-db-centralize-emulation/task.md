# task.md — Execution checklist: centralize hardcode / fake-db / db data into packages/fake-db with DB & API emulation

## Precondition (VERIFIED)
- HEAD `c9a2166` on `main`; working tree clean. Predecessor plan `.plan/20261107-0018-plan-fake-db-remaining-and-db-emulation` items 1–4 done (commit `2121ebf`).
- `@galaxy/database` exports `createDatabase` + `BaseRepository` (query/findById/insert/patchById/deleteById; **no `listAll`**).
- Statistics page shows commented `fetch(${process.env.API_URL}/pages/widget-examples)` API pattern — basis for API emulation mode.
- Existing seam: `apps/web/src/app/server/actions.ts` (22 `get*Data` actions importing `@galaxy/fake-db`).
- plan-executor runs priorities P0→P1→P2→P3→P4 in listed order; within a priority, listed order is the dependency order. Tick `- [x]` as each item completes.

---

## P0 — Search & inventory (mencari hardcode / fakedb / db data)

- [ ] **T-01** [P0][S] Repo sweep: inventory remaining hardcoded record data
  - Files: `spec.md` (§6)
  - Steps: ripgrep `apps/web/src` for inline record literals (`const ... = [`, `const ...: Type[] = =`) under `views/`, `app/`, `pages/`; exclude `node_modules`, `.next`, `dist`, already-extracted `@galaxy/fake-db` modules; skip `CHART_SERIES`/`UI_CONFIG` per spec §4; classify `RECORD_DATA`/`CHART_SERIES`/`UI_CONFIG`/`AUTH_SECRETS`; note duplicate groups; record every candidate in spec §6 with file, dataset, ~rows, class, decision, target module.
  - Acceptance: spec §6 lists every candidate with a decision; zero `RECORD_DATA` candidate unaccounted for; sweep evidence appended to report.md.
  - Depends: none.

- [ ] **T-02** [P0][S] Verify @galaxy/database emulation surface
  - Files: none (read-only); record note in design.md D-008
  - Steps: read `packages/database/src/repositories/base-repository.ts` and `packages/database/src/database.ts`; confirm `query()`, `findById`, `insert`, `patchById`, `deleteById` exist; confirm no `listAll()`; record D-008 (DB list reads use `repository.query().select()`, no `BaseRepository` change) and gate G-1 (entity models/tables for pilot owned by `@galaxy/database` workstream).
  - Acceptance: design.md D-008/G-1 reflect verified API.
  - Depends: none.

---

## P1 — Centralize RECORD_DATA into packages/fake-db (modules)

- [ ] **T-03** [P1][S] StatisticsCard (widget-examples/statistics) → new fake-db module
  - Files: `packages/fake-db/src/pages/statisticsCard.ts` (new)
  - Steps: move `const data: DataType[]` (4 rows: Sales/Customers/Products/Revenue) from `apps/web/src/views/pages/widget-examples/statistics/StatisticsCard.tsx` into `export const db = { statisticsCard: [...] }`; type from `@galaxy/types` or inline type.
  - Acceptance: module typechecks; contains exactly the 4 original rows.
  - Depends: T-01.

- [ ] **T-04** [P1][S] wire StatisticsCard via statistics page + remove local literal
  - Files: `apps/web/src/app/[lang]/(dashboard)/(private)/pages/widget-examples/statistics/page.tsx`, `apps/web/src/views/pages/widget-examples/statistics/StatisticsCard.tsx`
  - Steps: page imports `getStatisticsCardData` action, awaits it, passes `data` prop to `<StatisticsCard data={...} />`; component deletes local `const data` and consumes prop.
  - Acceptance: rendered cards identical (AC-001); no local record literal in StatisticsCard.
  - Depends: T-03, T-12.

- [ ] **T-05** [P1][S] ecommerce dashboard Transactions + StatisticsCard + EarningReports → verify props / extract
  - Files: `apps/web/src/views/apps/ecommerce/dashboard/Transactions.tsx`, `apps/web/src/views/apps/ecommerce/dashboard/StatisticsCard.tsx`, `apps/web/src/views/apps/ecommerce/dashboard/EarningReports.tsx`
  - Steps: for each, confirm whether it renders with a `data` prop or uses the local `const data: DataType[] = [...]`; if local and prop-less → extract to fake-db module + wire; if prop-driven already → record as "wired" in spec §6 and skip.
  - Acceptance: each of the three is either prop-driven (wired) or extracted to a canonical module; no local record literal remains.
  - Depends: T-01, T-12.

- [ ] **T-06** [P1][S] academy dashboard cards → `packages/fake-db/src/apps/academy.ts`
  - Files: `packages/fake-db/src/apps/academy.ts`, `apps/web/src/views/apps/academy/dashboard/{WelcomeCard,TopCourses,PopularInstructors,AssignmentProgress,UpcomingWebinar,InterestedTopics}.tsx`
  - Steps: add `welcomeCard`, `topCourses`, `popularInstructors`, `assignmentProgress`, `upcomingWebinar`, `interestedTopics` datasets to `academy.ts`; components read via props from module (no local literal).
  - Acceptance: one canonical `academy.ts` source; components de-hardcoded; parity AC-001.
  - Depends: T-01, T-12.

- [ ] **T-07** [P1][S] logistics delivery/performance → `packages/fake-db/src/apps/logistics.ts`
  - Files: `packages/fake-db/src/apps/logistics.ts`, `apps/web/src/views/apps/logistics/dashboard/LogisticsDeliveryPerformance.tsx`, `apps/web/src/views/apps/logistics/fleet/FleetSidebar.tsx`
  - Steps: add `deliveryPerformance`, `vehicleTracking` datasets; de-hardcode components.
  - Acceptance: components read `logistics.ts`; local literals removed.
  - Depends: T-01, T-12.

- [ ] **T-08** [P1][S] ecommerce settings tables → `packages/fake-db/src/apps/ecommerce.ts`
  - Files: `packages/fake-db/src/apps/ecommerce.ts`, `apps/web/src/views/apps/ecommerce/settings/ShippingDelivery.tsx`, `apps/web/src/views/apps/ecommerce/settings/Notifications.tsx`
  - Steps: add `shippingDomestic`, `shippingInternational`, `notifications` (customer/shipping/orders) datasets; de-hardcode.
  - Acceptance: no PAN/CVV/secret values; local literals removed.
  - Depends: T-01, T-12.

- [ ] **T-09** [P1][S] ecommerce product/order/customer detail cards → `packages/fake-db/src/apps/ecommerce.ts`
  - Files: `packages/fake-db/src/apps/ecommerce.ts`, `apps/web/src/views/apps/ecommerce/products/list/ProductCard.tsx`, `apps/web/src/views/apps/ecommerce/products/category/ProductCategoryTable.tsx`, `apps/web/src/views/apps/ecommerce/orders/details/OrderDetailsCard.tsx`, `apps/web/src/views/apps/ecommerce/settings/payments/PaymentMethodCard.tsx`, `apps/web/src/views/apps/ecommerce/customers/details/customer-right/address-billing/AddressBookCard.tsx`, `apps/web/src/views/apps/ecommerce/customers/details/customer-right/notification/index.tsx`
  - Steps: add `productCard`, `categoryData`, `orderDetails`, `paymentMethods`, `addressBook`, `customerNotifications` datasets; de-hardcode each component.
  - Acceptance: all six read canonical `ecommerce.ts` datasets; local literals removed.
  - Depends: T-08, T-12.

- [x] **T-10** [P1][L] Long-tail: extract remaining sweep findings
  - Files: one new module per dataset under `packages/fake-db/src/apps/<name>.ts` or `pages/<name>.ts`
  - Steps: for each `RECORD_DATA` candidate in spec §6 not covered by T-03–T-09, create `export const db = { <entity>: [...] }` and record target in spec §6.
  - Acceptance: spec §6 shows zero pending `RECORD_DATA`; every new module typechecks; no `CHART_SERIES`/`UI_CONFIG`/`AUTH_SECRETS` extracted.
  - Depends: T-01, T-03–T-09.

---

## P1 — Register server-action seam

- [x] **T-11** [P1][M] Register get*Data actions for all new modules
  - Files: `apps/web/src/app/server/actions.ts`
  - Steps: add one `'use server'` `get<Entity>Data` action per new module (dynamic-import pattern matching existing actions); unique names; each returns the module `db`.
  - Acceptance: every module from T-03–T-10 reachable via exactly one action; `grep -rn "get.*Data" apps/web/src/app/server/actions.ts` covers spec §6 module list.
  - Depends: T-03–T-10.

---

## P1 — Rewire consumers (server page → props → client widget)

- [ ] **T-12** [P1][S] account-settings tables → `packages/fake-db/src/pages/accountSettings.ts` + wire
  - Files: `packages/fake-db/src/pages/accountSettings.ts`, `apps/web/src/views/pages/account-settings/security/RecentDevicesTable.tsx`, `apps/web/src/views/pages/account-settings/connections/index.tsx`, `apps/web/src/views/pages/account-settings/security/ApiKeyList.tsx`
  - Steps: add `recentDevices`, `apiKeys` (metadata-only, masked), `connections`; `paymentMethods` as obviously-fake display metadata only (R-2 carve-out); components read via props; page threads `getAccountSettingsData`.
  - Acceptance: no PAN/CVV/secret values; parity AC-001.
  - Depends: T-01, T-11.

- [ ] **T-13** [P1][S] front-pages datasets → reconcile + wire (already mostly `db.*`; confirm no local literals)
  - Files: `packages/fake-db/src/pages/frontPages.ts`, `packages/fake-db/src/pages/pricing.ts`, `packages/fake-db/src/pages/faq.ts`
  - Steps: confirm `CustomerReviews/OurTeam/Pricing/Faqs/ProductStat/UsefulFeature/Articles/KeepLearning/KnowledgeBase` all read `db.landing.*`/`db.pricing.*`/`db.helpCenter.*`/`db.faq.*`; reconcile landing Pricing schema with `pricing.ts`; fold landing Faqs into `faq.ts`.
  - Acceptance: one canonical pricing shape + one FAQ source; no local record literals in front-pages.
  - Depends: T-01, T-11.

- [ ] **T-14** [P1][S] checkout StepCart + StepConfirmation + de-dupe shared tab pairs
  - Files: `packages/fake-db/src/apps/ecommerce.ts`, `apps/web/src/views/pages/wizard-examples/checkout/StepCart/**/*.tsx`, `apps/web/src/views/pages/wizard-examples/checkout/StepConfirmation/**/*.tsx`
  - Steps: add `cartItems`/`savedAddresses` to `ecommerce.ts`; re-point `apps/user` ↔ ecommerce shared tab pairs to canonical modules.
  - Acceptance: checkout reads `ecommerce.ts`; each duplicated dataset has exactly one source (spec §6 duplicate map).
  - Depends: T-08, T-09, T-11.

- [ ] **T-15** [P1][S] roles RoleCards → `packages/fake-db/src/apps/roles.ts`
  - Files: `packages/fake-db/src/apps/roles.ts`, `apps/web/src/views/apps/roles/RoleCards.tsx`
  - Steps: add `roleCards` dataset; de-hardcode RoleCards.
  - Acceptance: RoleCards reads `@galaxy/fake-db/apps/roles`; local literal removed.
  - Depends: T-01, T-11.

---

## P2 — JSX icon/logo refactors (iconId → client-side map)

- [x] **T-16** [P2][S] iconMap module + ActivityTimeline (CRM dashboard)
  - Files: `apps/web/src/app/client/iconMap.tsx` (new), `apps/web/src/views/dashboards/crm/ActivityTimeline.tsx`
  - Steps: create `ICON_MAP: Record<string, JSX.Element>`; ActivityTimeline renders `ICON_MAP[iconId]`; tabler `<i>` JSX removed from data flow.
  - Acceptance: rendered HTML identical (diff check); data serializable (no ReactElement in fake-db).
  - Depends: ActivityTimeline dataset extracted with iconId placeholder.

- [x] **T-17** [P2][S] ActivityTimeline (user-profile + widget-examples/advanced)
  - Files: `apps/web/src/views/pages/user-profile/profile/ActivityTimeline.tsx`, `apps/web/src/views/pages/widget-examples/advanced/ActivityTimeline.tsx`
  - Steps: same `ICON_MAP` pattern in both components.
  - Acceptance: HTML diff identical; iconMap entries present.
  - Depends: T-16.

- [x] **T-18** [P2][S] RecentDevicesTable browserIcon → iconId
  - Files: `apps/web/src/views/pages/account-settings/security/RecentDevicesTable.tsx`
  - Acceptance: `iconId` + `ICON_MAP[browserIconId]`; no JSX icon in data.
  - Depends: T-12.

- [x] **T-19** [P2][S] CustomerReviews logos → logoId
  - Files: `apps/web/src/views/front-pages/landing-page/CustomerReviews.tsx`
  - Acceptance: `logoId` strings; logos rendered via `ICON_MAP`/`LOGO_MAP`; HTML diff identical.
  - Depends: T-13.

- [x] **T-20** [P2][S] IconStepsCard SVG icons → iconId
  - Files: `apps/web/src/views/apps/ecommerce/referrals/IconStepsCard.tsx`
  - Acceptance: SVG icons from `ICON_MAP` keyed by `iconId`; local literal removed from data flow.
  - Depends: T-08/T-09.

---

## P3 — Emulation layer: DB emulation atau API emulation behind the seam

- [ ] **T-21** [P3][M] Data-source resolver + DATA_SOURCE toggle (static | db | api)
  - Files: `apps/web/src/app/server/data-source.ts` (new), `apps/web/src/app/server/actions.ts`
  - Steps: create `resolveData<T>(entity, staticData, apiPath?)` selecting source by `process.env.DATA_SOURCE` (`static` default | `db` | `api`); `api` mode does `fetch(`${process.env.API_URL}${apiPath}`)`; endpoint map entity→path mirrors existing `app/api/*` routes; refactor all `get*Data` actions to call `resolveData` with their static fallback.
  - Acceptance: `DATA_SOURCE=static` byte-identical to before; `api` mode reachable via env; no component changes.
  - Depends: T-11.

- [ ] **T-22** [P3][L] Pilot DB slice: ecommerce products via @galaxy/database (GATED)
  - Files: `packages/database/src/repositories/product-repository.ts` (new), `apps/web/src/app/server/data-source.ts`
  - Steps: GATE G-1 — requires `@galaxy/database` to expose an Objection model + table for pilot entity (e.g. `Product`); if absent, defer, record in report.md, ship static/api only. Create `ProductRepository extends BaseRepository`; db mode of `getEcommerceData` returns `repository.query().select()` mapped to fake-db shape.
  - Acceptance: with `DATA_SOURCE=db` and PGlite local, products view renders seeded rows with unchanged props; static fallback unchanged.
  - Depends: T-21, G-1.

- [ ] **T-23** [P3][M] Seed script: fake-db modules → tables (idempotent)
  - Files: `packages/fake-db/scripts/seed-db.ts` (new)
  - Steps: script iterates `packages/fake-db/src/apps/*.ts` + `pages/*.ts`, upserts each `db.<entity>` into corresponding `@galaxy/database` table via repositories (`ON CONFLICT DO UPDATE`); CLI entity filter; runs against PGlite local by default.
  - Acceptance: repeatable run yields identical row sets; no duplicates on re-run (AC-008).
  - Depends: T-22 (repository entities), T-03–T-10.

---

## P4 — Tests & hardening

- [x] **T-24** [P4][S] Parity tests for each extracted dataset
  - Files: `apps/web/src/app/server/__tests__/get*.data.test.ts` (one per module, vitest)
  - Steps: assert module output deep-equals the original inline rows (captured before deletion); run under `DATA_SOURCE=static`.
  - Acceptance: every T-03–T-10 module has a passing parity test.
  - Depends: T-03–T-10.

- [x] **T-25** [P4][S] Integration tests per get*Data action (all modes)
  - Files: `apps/web/src/app/server/__tests__/actions.emulation.test.ts`
  - Steps: `static` returns module data; `api` mode with mocked `fetch` returns endpoint JSON; `db` mode (when G-1 met) returns repository rows; shape invariant across modes.
  - Acceptance: all modes pass; components never changed.
  - Depends: T-21, T-22 (db sub-cases gated).

- [x] **T-26** [P4][S] Boundary hygiene checks
  - Files: none (checks)
  - Steps: `grep -rn "@galaxy/fake-db" apps/web/src/views --include=*.tsx` → only documented stat-tile exceptions; grep for remaining `RECORD_DATA` literals in targeted views → zero; scoped Turbo gates green.
  - Acceptance: rule R-1/R-3/R-7 satisfied.
  - Depends: T-12–T-15.

- [x] **T-27** [P4][S] README documentation update
  - Files: `packages/fake-db/README.md` (new or updated), `apps/web/README.md` notes
  - Steps: document which datasets are static vs DB-backed vs API-emulatable, env `DATA_SOURCE`, endpoint map, how to add a new dataset.
  - Acceptance: docs match implemented state; no stale claims.
  - Depends: T-11–T-23.