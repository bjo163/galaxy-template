# spec.md — Centralize hardcode / fake-db / db data into packages/fake-db with DB & API emulation

## 1. Source and context

- Predecessor plan: `.plan/20261107-0018-plan-fake-db-remaining-and-db-emulation` (items 1–4 done, commit `2121ebf`; HEAD `c9a2166` on `main`).
- This plan continues the work: sweep remaining hardcode, centralize `RECORD_DATA` into `packages/fake-db` (`/packages/fake-db`), and expose each dataset through a swappable seam: **static fake-db** (default) ↔ **DB emulation** (`@galaxy/database`, PGlite locally) ↔ **API emulation** (`fetch(process.env.API_URL + endpoint)`).
- Existing seam: `apps/web/src/app/server/actions.ts` with 22 `get*Data` server actions importing `@galaxy/fake-db` modules that export a `db` object.

## 2. Requirements (FR)

| ID | Requirement |
|----|-------------|
| FR-001 | Every `RECORD_DATA` dataset from §6 lives in exactly one `packages/fake-db` module and is reachable only via a `get*Data()` server action or route handler — no component imports the literal directly. |
| FR-002 | Client widgets render identically; data arrives via props from the server page. |
| FR-003 | Duplicate datasets collapse to a single canonical module; duplicate consumers import it (dedupe map in §6). |
| FR-004 | `CHART_SERIES` and `UI_CONFIG` are **not** moved into fake-db. |
| FR-005 | Auth secrets and secret-shaped values stay out of the package and out of any DB seed (R-2). |
| FR-006 | The `get*Data()` seam toggles `static` ↔ `db` ↔ `api` without component or prop changes; the payload shape is invariant (D-003). |
| FR-007 | DB mode is backed by `@galaxy/database` repositories (PGlite locally), seeded idempotently from fake-db modules (FR-008 seed). |
| FR-008 | API mode fetches `process.env.API_URL + endpoint` from the endpoint map; same return shape as static. |
| FR-009 | Each extraction is a single, revertible unit; scoped Turbo gates pass on touched filters only. |

## 3. Non-functional requirements (NFR)

| ID | Requirement |
|----|-------------|
| NFR-001 | Bundle weight: large demo arrays stay server-side; no client widget imports fake-db data modules except documented stat tiles (R-1/R-3). |
| NFR-002 | Type safety: modules reuse `@galaxy/types`; `tsc --noEmit` clean on touched filters. |
| NFR-003 | Security: no credentials, PAN/CVV, or secrets in `packages/fake-db`, DB seed, or logs (R-2). |
| NFR-004 | Reversibility: each extraction unit is independently revertible (R-9). |
| NFR-005 | Isolation: this is demo/platform emulation only — no Arsy tenancy/RLS/dynamic-model work here. |

## 4. Classification policy

| Class | Test | Track: centralize to fake-db? | Track: emulation table? |
|-------|------|-------------------------------|-------------------------|
| RECORD_DATA | repeated objects w/ identity, fields, optional relations; imaginable add/edit row | **Yes** | Yes, if stable identity and/or relations |
| CHART_SERIES | numeric array consumed as chart `series`/`categories` | No (stay in code) | No |
| UI_CONFIG | labels, steps, menus, color/icon maps, select options | No | No |
| AUTH_SECRETS | credentials, tokens, PAN-shaped values | No — never in package | Only hashed/env dev fixtures |

Decision rule: classify first, then apply the row. "It's an array literal" is not by itself a reason to extract.

## 5. Data contracts

**fake-db module shape** (`packages/fake-db/src/apps/<name>.ts` or `src/pages/<name>.ts`):
```ts
import type <EntityType> from '@galaxy/types/...'
export const db: <EntityType> = {
  <entityKey>: [ { id, ...fields } ]
}
```

**Server action shape** (`apps/web/src/app/server/actions.ts`):
```ts
export const get<Entity>Data = async (): Promise<DbShape> => resolveData('<entity>', <staticDb>, '/api/path')
```

**Resolver contract** (`apps/web/src/app/server/data-source.ts` — new):
```ts
type DataSource = 'static' | 'db' | 'api'
resolveData<T>(entity: string, staticData: T, apiPath?: string): Promise<T>
```
- `static` (default): return `staticData`.
- `db`: `repository.query().select()` mapped back to the exact fake-db object/array shape (D-003); no `BaseRepository` change (D-008).
- `api`: `fetch(`${process.env.API_URL}${apiPath}`)` then `.json()`; errors propagate (existing fetch pattern in statistics page).

**API endpoint map**: entity → path mirroring existing `apps/web/src/app/api/*/route.ts` routes (e.g. `/apps/ecommerce`, `/pages/widget-examples`).

## 6. Hardcode inventory (verified by T-01, 2026-11-07)

Columns: file | dataset | ~rows | class | decision | target module.

### 6.1 Already wired via @galaxy/fake-db (no action needed)
These components already read `db.*` from `@galaxy/fake-db` modules; data flows through `get*Data()` server actions or route handlers:
- `views/front-pages/landing-page/{CustomerReviews,OurTeam,Pricing,Faqs,ProductStat,UsefulFeature}.tsx` → `db.landing.*`
- `views/front-pages/help-center/{Articles,KeepLearning,KnowledgeBase}.tsx` → `db.helpCenter.*`
- `views/front-pages/pricing/Plans.tsx` → `db.pricing.features`, `db.pricing.plans`
- `views/pages/wizard-examples/checkout/StepAddress.tsx` → `db.checkout.addresses`, `db.checkout.deliveryOptions`
- `views/pages/wizard-examples/property-listing/{StepPropertyFeatures,StepPropertyDetails,StepPersonalDetails}.tsx` → `db.propertyListing.*`
- `views/pages/wizard-examples/create-deal/StepDealType.tsx` → `db.createDeal.dealTypes`
- `views/forms/form-layouts/FormLayoutsCollapsible.tsx` → `db.formLayouts.shippingOptions`
- `views/front-pages/Payment.tsx` → `db.payment.methods`
- `views/dashboards/crm/{LastTransaction,ActiveProjects,SalesByCountries,ProjectStatus,ActivityTimeline}.tsx` — prop-driven via `getDashboardData()`/`getActivityTimelineData()`
- `views/dashboards/analytics/{SourceVisits,MonthlyCampaignState,EarningReports,TotalEarning,SupportTracker,WebsiteAnalyticsSlider,SalesOverview}.tsx` — prop-driven via `getDashboardData()`/`getProfileData()`

### 6.2 RECORD_DATA with LOCAL literal — extraction candidates
Components that define a local record array and either render without props or shadow props. Verify prop usage in each task before extracting:
| File | Dataset | ~rows | Decision |
| `views/pages/widget-examples/statistics/StatisticsCard.tsx` | `const data: DataType[]` (Sales/Customers/Products/Revenue) | 4 | EXTRACT — renders `<StatisticsCard />` without props → new module + `getStatisticsCardData` + wire statistics page |
| `views/apps/ecommerce/dashboard/Transactions.tsx` | `const data: DataType[]` | ? | verify props → extract or re-point |
| `views/apps/ecommerce/dashboard/StatisticsCard.tsx` | `const data: DataType[]` | ? | verify props |
| `views/apps/ecommerce/dashboard/EarningReports.tsx` | `const data: DataType[]` | ? | verify props |
| `views/apps/logistics/dashboard/LogisticsDeliveryPerformance.tsx` | `const deliveryData: dataTypes[]` | ? | verify props |
| `views/apps/ecommerce/settings/ShippingDelivery.tsx` | `domesticTableData`, `internationalTableData` | ? | verify props |
| `views/apps/ecommerce/settings/Notifications.tsx` | `customerData`, `shippingData`, `ordersData` | ? | verify props |
| `views/apps/academy/dashboard/{WelcomeCard,TopCourses,PopularInstructors,AssignmentProgress,UpcomingWebinar,InterestedTopics}.tsx` | `const data: DataType[]` / data1/data2 | 3–6 each | verify props → academy.ts |
| `views/apps/logistics/fleet/FleetSidebar.tsx` | `vehicleTrackingData` | ? | verify props → logistics.ts |
| `views/apps/ecommerce/products/list/ProductCard.tsx` | `data` | ? | verify props → ecommerce.ts |
| `views/apps/ecommerce/products/category/ProductCategoryTable.tsx` | `categoryData` | ? | verify props |
| `views/apps/ecommerce/orders/details/OrderDetailsCard.tsx` | `orderData` | ? | verify props |
| `views/apps/ecommerce/settings/payments/PaymentMethodCard.tsx` | `data` | ? | verify props |
| `views/apps/ecommerce/customers/details/customer-right/address-billing/AddressBookCard.tsx` | `propData` | ? | verify props |
| `views/apps/ecommerce/customers/details/customer-right/notification/index.tsx` | `tableData` | ? | verify props |
| `views/pages/wizard-examples/create-deal/StepDealDetails.tsx` | `offeredItemsArray` | ? | candidate |

### 6.3 UI_CONFIG / CHART_SERIES — stay in code (skip)
- Chart `series`/`data` in `dashboards/*`, `charts/*`, `widget-examples/charts/*` (apex/recharts)
- `tabData` (TabType[]), `regionArray`, `countries`, `languageData`, `uniqueLabels`, step/wizard arrays, form options, `statusObj` (LastTransaction color map)
- Static stat tiles with hardcoded numbers (`SalesOverview` $42.5k, etc.)

### 6.4 Duplicate map (from verified prior inventory)
- `SalesByCountries` appears in crm + analytics (+ widget-examples copies) → canonical `apps/dashboard.ts`
- `EarningReports` duplicated across dashboards/ecommerce/widget-examples → canonical
- Academy instructor/course/assignment cards duplicated in widget-examples/advanced → `apps/academy.ts`
- Vehicle/delivery/carrier widgets → `apps/logistics.ts`
- User ↔ ecommerce tab pairs (cards/devices/connections/projects) → one canonical module each

T-01 complete: inventory verified against working tree. Paths confirmed per-task in task.md.

## 7. API contracts

**Existing server actions** (unchanged signatures, bodies delegate to resolver): `getEcommerceData`, `getInvoiceData`, `getAcademyData`, `getLogisticsData`, `getUserData`, `getPermissionsData`, `getProfileData`, `getFaqData`, `getPricingData`, `getStatisticsData`, `getReactTableData`, `getRolesData`, `getDashboardData`, `getEcommerceDashboardData`, `getBrandingData`, `getHeaderShortcuts`, `getHeaderNotifications`, `getUserViewData`, `getAccountSettingsData`, `getFrontPagesData`, `getWidgetExamplesAdvancedData`, `getWidgetExamplesChartsData`, plus KPI/preview/timeline actions. New actions added in T-12 follow `get<Entity>Data`.

**Route handlers** under `apps/web/src/app/api/*/route.ts` remain valid server-side consumers of `@galaxy/fake-db` (FR-001 allows route handlers).

**API emulation endpoints**: `process.env.API_URL` + map path; contract = JSON body identical to the static `db` export shape.

## 8. State transitions (emulation toggle)

```
DATA_SOURCE=static (default)  →  get*Data returns fake-db module db (current behavior)
DATA_SOURCE=db                →  get*Data returns repository.query().select() mapped to db shape (PGlite local; G-1 gated)
DATA_SOURCE=api               →  get*Data returns fetch(API_URL + endpointPath).json()
```
Components never change (FR-006).

**Error scenarios**:
- API unreachable in `api` mode → error propagates (existing `fetch` !res.ok throw pattern); operator falls back to `static` via env.
- DB unavailable in `db` mode → error propagates; static remains default and always available.
- Missing entity model/table (G-1 not met) → `db` mode is a documented no-op/deferred task; static/api unaffected.

## 9. Acceptance criteria

| ID | Criterion | Verified by |
|----|-----------|-------------|
| AC-001 | Each extracted view renders identical rows/order vs before (visual/JSON parity, not typecheck alone) | T-13–T-31 |
| AC-002 | No `const … = [...]` record literal remains in targeted components; only CHART_SERIES/UI_CONFIG literals left | T-42 |
| AC-003 | `get*Data()` is sole access path; no component imports a fake-db data module directly except documented stat tiles | T-42 |
| AC-004 | Duplicates collapse: `SalesByCountries` reads one module; landing/plan pricing reconciled onto one shape | T-03/T-04/T-29 |
| AC-005 | Scoped Turbo gates green: `--filter=web --filter=@galaxy/fake-db [--filter=@galaxy/database]` | T-42 |
| AC-006 | `DATA_SOURCE=static` byte-identical to pre-plan behavior | T-37/T-41 |
| AC-007 | `DATA_SOURCE=api` with mocked fetch returns endpoint JSON with invariant shape | T-41 |
| AC-008 | Seed script idempotent: repeated runs produce identical row sets, no duplicates | T-39 |
| AC-009 | (Gated) `DATA_SOURCE=db` pilot shows seeded rows with unchanged props | T-38/T-41 |
| AC-010 | Every extracted module has a passing parity test; every action has per-mode integration test | T-40/T-41 |
| AC-011 | No secrets/PAN/CVV in `packages/fake-db` or seed output | T-06/T-42 |
| AC-012 | Docs (`packages/fake-db/README.md`) describe static/db/api modes and how to add datasets | T-43 |

Traceability: FR-001→T-03–T-11, FR-002→T-13–T-31, FR-003→T-03–T-09, FR-004→R-1/T-42, FR-005→R-2/T-06, FR-006→T-37, FR-007→T-38, FR-008→T-37, FR-009→R-9/T-43; NFR-001→R-3, NFR-002→R-10, NFR-003→R-2, NFR-004→R-9, NFR-005→§8.