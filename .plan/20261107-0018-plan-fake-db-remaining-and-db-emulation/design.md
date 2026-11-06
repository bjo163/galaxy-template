# design.md – Architecture & Implementation Design

## 1. Module Layout (Track 1)

```
packages/fake-db/
├── src/
│   ├── apps/
│   │   ├── invoiceKPI.ts          // Invoice KPI cards (4 rows)
│   │   ├── invoicePreview.ts      // Invoice preview line items (4 rows)
│   │   ├── ecommerceOrderKPI.ts   // Order KPI cards (4 rows)
│   │   ├── userListCards.ts       // User list cards (4 rows)
│   │   └── ... (other KPI modules)
│   ├── icons/
│   │   └── iconMap.ts             // Map iconId → ReactElement for JSX refactors
│   └── scripts/
│       └── seed-db.ts             // DB seed script (Track 3)
│
├── pages/
│   ├── accountSettings.ts
│   ├── frontPages.ts
│   ├── userProfile.ts
│   ├── faq.ts
│   └── pricing.ts
│
└── navigation/
    ├── horizontalMenu.ts
    └── searchData.ts
```

## 2. Data Flow

1. **Extraction:**  
   - Identify hardcoded `const data = [...]` in component files (Task.md items 1‑4).  
   - Move data into a new module under `packages/fake-db/src/apps/`.  
   - Export `db` object with consistent shape (`<entity>: []`).

2. **Server Action:**  
   - Add a `'use server'` function in `apps/web/src/app/server/actions.ts` for each entity (e.g., `getInvoiceKPIData`).  
   - Action imports the module dynamically (`import('@/fake-db/apps/invoiceKPI').then(m => m.db)`).  

3. **Component Consumption:**  
   - Server page (e.g., `pages/widget-examples/statistics/page.tsx`) calls the action, awaits result, and passes it as a prop to the `'use client'` widget (e.g., `UserListCards`).  
   - Widget receives `data` prop, removes its local `const data = [...]` literal.

4. **JSX Refactor (Track 2):**  
   - For datasets with JSX icons, replace inline `ReactElement` with `iconId: 'user'`.  
   - Create `apps/web/src/app/client/iconMap.tsx` containing `const ICON_MAP = { 'user': <UserIcon />, ... }`.  
   - Components read `iconId` and render `ICON_MAP[iconId]`.

5. **DB Seed (Track 3):**  
   - Script `packages/fake-db/scripts/seed-db.ts` reads each `packages/fake-db/src/apps/*.ts` module, extracts `db.<entity>`, and upserts rows into `@galaxy/database` tables via repositories.  
   - Uses `ON CONFLICT DO UPDATE` to ensure idempotency.

6. **DB‑backed Action Flip (Track 4):**  
   - Choose a pilot entity (e.g., `ecommerce.products`).  
   - Implement `EcommerceProductRepository` extending `BaseRepository`.  
   - Modify `getEcommerceData` to return `await productRepo.listAll()` instead of `ecommerceData`.  
   - Ensure the JSON payload shape remains identical.

## 3. Integration Points

- **Server Actions:** All new actions are added to `apps/web/src/app/server/actions.ts`.  
- **Server Pages:** Update existing server pages (e.g., `pages/widget-examples/statistics/page.tsx`, `dashboards/crm/page.tsx`) to call the new actions and pass data as props.  
- **Client Widgets:** Remove local `const data = [...]` literals; consume data via props.  
- **Database:** Seed script runs once after extraction; DB tables are seeded from the fake‑db modules.  

## 4. Constraints & Assumptions

- **Classified Data:** Only `RECORD_DATA` (serializable arrays) are extracted. `CHART_SERIES`, `UI_CONFIG`, and `AUTH_SECRETS` remain in code.  
- **JSX Refactor:** Non‑serializable JSX must be replaced with an `iconId` before any extraction; this is a prerequisite, not a post‑extraction step.  
- **DB Compatibility:** `@galaxy/database` must expose a stable repository API (already committed). Seed script assumes `BaseRepository` interface.  
- **Bundle Impact:** All data stays server‑side; only permitted stat‑tile exceptions may be imported client‑side.  

## 5. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| JSX‑blocked datasets require refactor before extraction | Flag in `report.md`; do refactor as part of the same unit commit |
| DB schema mismatch with fake‑db shape | Use normalized diff; write integration test for payload equality |
| Contamination of other workstreams | Commit only files under `apps/web` and `packages/fake-db`; never `git add -A` |
| DB seed script breaks existing data | Run script in a temporary branch; verify byte‑identity before merge |

## 5.1 Track 2 Gate (DB Emulation)

- **Gate Condition:** `@galaxy/database` exposes a committed, stable repository API with at least `listAll()` and `findById()` methods.  
- **Gate Verification:** Read `packages/database/src/repositories/base-repository.ts` and confirm `findById` is present.  
- **Gate Status:** **CONDITIONALLY READY** (pending owner confirmation on API stability).  

## 5.2 Track 1 Readiness

- **Ready:** All fake‑db modules and server actions for Track 1 are already in place (see commit history).  
- **Remaining Work:** Extract 4 KPI datasets + refactor 7 JSX‑blocked datasets + DB seed + pilot DB action flip.  

## 5.3 Dependencies

- `@galaxy/database` package (committed, public API verified).  
- `apps/web/src/app/server/actions.ts` (already contains 22 server actions; new ones will be added).  
- `apps/web/src/app/[lang]/(dashboard)/(private)/pages/widget-examples/statistics/page.tsx` (server page awaiting `getDashboardData` for crm/analytics widgets).  

*End of design.md*