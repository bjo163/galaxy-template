# Plan task checklist — Centralize shared UI from apps/web into packages/ui

**Goal:** Make `@galaxy/ui` the single source of truth for shared UI consumed by `apps/web`:
1. Remove thin re-export wrappers and 1:1 duplicates in `apps/web`; repoint all imports to `@galaxy/ui`.
2. Extract recurring app UI into `packages/ui` with tests.
3. Add package governance and verify with typecheck/lint/build + tests.
4. `apps/arsy` is out of scope (boundary audit only).

**Conventions:**
- Every task touches ≤ 3 explicitly listed files, except tasks marked `[sweep]`, which are one mechanical find-and-replace across all matched files (old → new string listed), verified with `grep` returning zero matches.
- Repoint imports **before** deleting wrapper files.
- `apps/arsy` must never be modified or imported.
- Sizes: S (small, ≤3 files, one session), M (medium), L (large sweep/build), XL (very large).
- Reference: `.plan/20261107-1210-plan-centralize-web-ui-components/{rule.md,spec.md,design.md}`.

**Source of truth inventory (`packages/ui` exports):** `Form`, `DirectionalIcon`, `TablePaginationComponent`, `ScrollToTop`, `StepperCustomDot`; dialogs `DialogCloseButton`, `OpenDialogOnElementClick`, `ConfirmationDialog`, `PermissionDialog`, `AddEditAddressDialog`, `EditUserInfoDialog`, `RoleDialog`, `TwoFactorAuthDialog`, `PricingDialog`, `ReferEarnDialog`, `BillingCardDialog`, `UpgradePlanDialog`, `PaymentMethodDialog`, `PaymentProvidersDialog`; `CustomAvatar`; `CustomTextField`, `CustomAutocomplete`, `CustomIconButton`, `CustomChip`, `CustomBadge`, `CustomTabList`; `OptionMenu`; `CustomInputHorizontal`, `CustomInputVertical`, `CustomInputImage`; card-statistics `CardStatsSquare`, `CustomerStats`, `Horizontal`, `HorizontalWithAvatar`, `HorizontalWithBorder`, `HorizontalWithSubtitle`, `StatsWithAreaChart`, `Vertical`; `StepperWrapper`, `tableStyles`; `Pricing`, `PlanDetails`.

---

## Phase P0 — Remove wrappers & 1:1 duplicates (source of truth = @galaxy/ui)

### T01 (S) — Repoint Form imports + delete wrapper
**Files:**
- `apps/web/src/views/pages/auth/TwoStepsV2.tsx` (edit: `import Form from '@galaxy/ui'`)
- `apps/web/src/views/forms/form-layouts/FormLayoutsIcons.tsx` (edit: `import Form from '@galaxy/ui'`)
- `apps/web/src/components/Form.tsx` (delete)
**Steps:**
1. Edit the two import sites above to import `Form` from `@galaxy/ui`.
2. Delete `apps/web/src/components/Form.tsx`.
**Acceptance:** `Form.tsx` removed; both sites import from `@galaxy/ui`; `pnpm --filter web typecheck` passes.
**Deps:** none

### T02 (S) — Repoint remaining Form imports
**Files:**
- `apps/web/src/views/pages/account-settings/notifications/index.tsx` (edit)
- `apps/web/src/views/apps/ecommerce/products/add/ProductPricing.tsx` (edit)
**Steps:** Change `import Form from '@components/Form'` → `import Form from '@galaxy/ui'`.
**Acceptance:** `grep -rn "@components/Form" apps/web/src` returns 0 matches.
**Deps:** T01

### T03 (S) — Repoint DirectionalIcon imports (batch 1) + delete wrapper
**Files:**
- `apps/web/src/components/DirectionalIcon.tsx` (delete)
- `apps/web/src/views/pages/wizard-examples/property-listing/StepPropertyFeatures.tsx` (edit → `import { DirectionalIcon } from '@galaxy/ui'`)
- `apps/web/src/views/pages/wizard-examples/property-listing/StepPropertyDetails.tsx` (edit)
**Steps:** Repoint the two sites, then delete the wrapper.
**Acceptance:** wrapper deleted; 2 sites import from `@galaxy/ui`; typecheck passes.
**Deps:** none

### T04–T12 (S ×9) — Repoint DirectionalIcon imports (batches of 3)
**Remaining 27 sites:**
1. `views/pages/wizard-examples/property-listing/StepPropertyArea.tsx`
2. `views/pages/wizard-examples/property-listing/StepPriceDetails.tsx`
3. `views/pages/wizard-examples/property-listing/StepPersonalDetails.tsx`
4. `views/pages/wizard-examples/create-deal/StepReview.tsx`
5. `views/pages/wizard-examples/create-deal/StepDealUsage.tsx`
6. `views/pages/wizard-examples/create-deal/StepDealType.tsx`
7. `views/pages/wizard-examples/create-deal/StepDealDetails.tsx`
8. `views/pages/wizard-examples/create-deal/index.tsx`
9. `views/pages/wizard-examples/checkout/index.tsx`
10. `views/pages/auth/ResetPasswordV2.tsx`
11. `views/pages/auth/ResetPasswordV1.tsx`
12. `views/pages/wizard-examples/checkout/StepCart.tsx`
13. `views/front-pages/Payment.tsx`
14. `views/pages/front-pages/help-center/Questions.tsx`
15. `views/pages/front-pages/help-center/KnowledgeBase.tsx`
16. `views/pages/widget-examples/advanced/ActivityTimeline.tsx`
17. `views/forms/form-wizard/StepperCustomVertical.tsx`
18. `views/forms/form-wizard/StepperCustomHorizontal.tsx`
19. `views/forms/form-wizard/StepperAlternativeLabel.tsx`
20. `views/apps/email/MailDetails.tsx`
21. `views/apps/academy/my-courses/Courses.tsx`
22. `views/apps/academy/dashboard/AssignmentProgress.tsx`
23. `views/pages/pages/auth/register-multi-steps/StepPersonalInfo.tsx`
24. `views/pages/pages/auth/register-multi-steps/StepBillingDetails.tsx`
25. `views/pages/pages/auth/register-multi-steps/StepAccountDetails.tsx`
26. `views/pages/pages/auth/register-multi-steps/index.tsx`
27. `views/pages/auth/ForgotPasswordV2.tsx` (and `ForgotPasswordV1.tsx` — included in site count above via T04-T12 split as needed)
**Steps per batch:** edit 3 files to import `DirectionalIcon` from `@galaxy/ui`.
**Acceptance per batch:** 3 sites repointed; typecheck passes. After T12: `grep -rn "@components/DirectionalIcon" apps/web/src` = 0.
**Deps:** T03

### T13 (S) — Repoint TablePaginationComponent imports (batch 1) + delete wrapper
**Files:**
- `apps/web/src/components/TablePaginationComponent.tsx` (delete)
- `apps/web/src/views/react-table/KitchenSink.tsx` (edit → `import { TablePaginationComponent } from '@galaxy/ui'`)
- `apps/web/src/views/pages/account-settings/billing-plans/InvoiceListTable.tsx` (edit)
**Steps:** Repoint two sites, delete wrapper.
**Acceptance:** wrapper deleted; 2 sites repointed; typecheck passes.
**Deps:** none

### T14–T19 (S ×6) — Repoint TablePaginationComponent imports (batches of 3)
**Remaining ~18 sites:**
`views/pages/account-settings/billing-plans/InvoiceListTable.tsx` (user view), `views/apps/user/view/user-right/overview/ProjectListTable.tsx`, `views/apps/user/view/user-right/overview/InvoiceListTable.tsx`, `views/apps/user/list/UserListTable.tsx`, `views/apps/permissions/index.tsx`, `views/apps/roles/RolesTable.tsx`, `views/apps/logistics/dashboard/LogisticsOverviewTable.tsx`, `views/apps/ecommerce/orders/list/OrderListTable.tsx`, `views/apps/ecommerce/products/list/ProductListTable.tsx`, `views/apps/ecommerce/products/category/ProductCategoryTable.tsx`, `views/apps/ecommerce/manage-reviews/ManageReviewsTable.tsx`, `views/apps/ecommerce/referrals/ReferredUsersTable.tsx`, `views/apps/ecommerce/dashboard/InvoiceListTable.tsx`, `views/apps/ecommerce/dashboard/OrderListTable.tsx`, `views/apps/ecommerce/dashboard/Transactions.tsx`, `views/apps/ecommerce/customers/list/CustomerListTable.tsx`, plus any stragglers found by grep.
**Steps per batch:** edit 3 files to import `TablePaginationComponent` from `@galaxy/ui`.
**Acceptance:** each batch 3 sites repointed; after T19: `grep -rn "@components/TablePaginationComponent" apps/web/src` = 0.
**Deps:** T13

### T20 (S) — Repoint stepper-dot imports (batch 1) + delete wrapper
**Files:**
- `apps/web/src/components/stepper-dot/index.tsx` (delete)
- `apps/web/src/views/forms/form-wizard/StepperVerticalWithoutNumbers.tsx` (edit → `import StepperCustomDot from '@galaxy/ui'`)
- `apps/web/src/views/forms/form-wizard/StepperVerticalWithNumbers.tsx` (edit)
**Steps:** Repoint two sites; delete wrapper.
**Acceptance:** wrapper deleted; 2 sites repointed; typecheck passes.
**Deps:** none

### T21 (S) — Repoint stepper-dot imports (batch 2)
**Files:**
- `apps/web/src/views/forms/form-wizard/StepperLinearWithValidation.tsx`
- `apps/web/src/views/pages/wizard-examples/checkout/index.tsx`
- `apps/web/src/views/pages/pages/auth/register-multi-steps/index.tsx`
**Steps:** Repoint `StepperCustomDot` import to `@galaxy/ui` in each.
**Acceptance:** 3 sites repointed.
**Deps:** T20

### T22 (S) — Repoint stepper-dot imports (batch 3)
**Files:**
- `apps/web/src/views/forms/form-wizard/StepperCustomVertical.tsx`
- `apps/web/src/views/forms/form-wizard/StepperCustomHorizontal.tsx`
- `apps/web/src/views/forms/form-wizard/StepperAlternativeLabel.tsx`
**Steps:** Repoint `StepperCustomDot` import to `@galaxy/ui` in each.
**Acceptance:** `grep -rn "@components/stepper-dot" apps/web/src` = 0.
**Deps:** T20

### T23 (S) — Repoint @core/styles/stepper imports (batch 1) + delete wrapper
**Files:**
- `apps/web/src/@core/styles/stepper.ts` (delete)
- `apps/web/src/views/pages/wizard-examples/property-listing/index.tsx` (edit → `import StepperWrapper from '@galaxy/ui'`)
- `apps/web/src/views/pages/wizard-examples/checkout/index.tsx` (edit)
**Steps:** Repoint two sites; delete wrapper.
**Acceptance:** wrapper deleted; 2 sites repointed; typecheck passes.
**Deps:** none

### T24 (S) — Repoint @core/styles/stepper imports (batch 2)
**Files:**
- `apps/web/src/views/pages/pages/auth/register-multi-steps/index.tsx`
**Steps:** Repoint `StepperWrapper` import to `@galaxy/ui`.
**Acceptance:** `grep -rn "@core/styles/stepper" apps/web/src` = 0.
**Deps:** T23

### T25–T27 (S) — Repoint CustomAvatar imports from @core/components/mui/Avatar
**T25 files:** `views/apps/dashboards/crm/ProjectStatus.tsx`, `views/dashboards/analytics/WebsiteAnalyticsSlider.tsx`, `views/dashboards/analytics/TotalEarning.tsx`
**T26 files:** `views/dashboards/analytics/SourceVisits.tsx`, `views/dashboards/analytics/SupportTracker.tsx`, `views/dashboards/analytics/EarningReports.tsx`
**T27 files:** `views/dashboards/analytics/MonthlyCampaignState.tsx`, `views/components/layout/shared/NotificationsDropdown.tsx` (value + type import → `import { CustomAvatar } from '@galaxy/ui'` and `import type { CustomAvatarProps } from '@galaxy/ui'`)
**Steps:** Replace `import CustomAvatar from '@core/components/mui/Avatar'` → `import { CustomAvatar } from '@galaxy/ui'` (and type import for NotificationsDropdown).
**Acceptance:** each batch repointed; typecheck passes.
**Deps:** none

### T28 (S) — Delete mui/Avatar wrapper
**Files:** `apps/web/src/@core/components/mui/Avatar.tsx` (delete)
**Steps:** Delete after T25–T27 complete.
**Acceptance:** file gone; typecheck passes.
**Deps:** T25–T27

### T29 (S) — Delete dead mui wrappers (batch 1)
**Files:** `apps/web/src/@core/components/mui/Autocomplete.tsx`, `Chip.tsx`, `IconButton.tsx` (delete all)
**Steps:** Verify zero usage (`grep -rn "@core/components/mui/(Autocomplete|Chip|IconButton)" apps/web/src` = 0), then delete.
**Acceptance:** 3 files gone; no remaining imports.
**Deps:** none

### T30 (S) — Delete dead mui wrappers (batch 2)
**Files:** `apps/web/src/@core/components/mui/TabList.tsx`, `TextField.tsx` (delete all)
**Steps:** Verify zero usage (`grep -rn "@core/components/mui/(TabList|TextField)" apps/web/src` = 0), then delete.
**Acceptance:** 2 files gone; no remaining imports.
**Deps:** none

### T31 [sweep] (L) — Repoint custom-inputs/types imports
**Scope:** all `*.{tsx,ts}` under `apps/web/src`
**Old → New:** `@core/components/custom-inputs/types` → `@galaxy/ui/custom-inputs/types`
**Sites (8):** `components/theme/types.ts`, `views/front-pages/Payment.tsx`, `views/pages/wizard-examples/property-listing/StepPropertyDetails.tsx`, `views/pages/wizard-examples/property-listing/StepPersonalDetails.tsx`, `views/pages/wizard-examples/create-deal/StepDealType.tsx`, `views/pages/wizard-examples/checkout/StepAddress.tsx`, `views/forms/form-layouts/FormLayoutsCollapsible.tsx`, `views/pages/pages/auth/register-multi-steps/StepBillingDetails.tsx`
**Steps:** find-and-replace across scope; then `grep -rn "@core/components/custom-inputs" apps/web/src` must return 0.
**Acceptance:** 0 matches; typecheck passes.
**Deps:** none

### T32 (S) — Delete custom-inputs component duplicates
**Files:** `apps/web/src/@core/components/custom-inputs/Horizontal.tsx`, `Vertical.tsx`, `Image.tsx` (delete)
**Steps:** Delete after T31.
**Acceptance:** 3 files gone.
**Deps:** T31

### T33 (S) — Delete custom-inputs/types duplicate
**Files:** `apps/web/src/@core/components/custom-inputs/types.ts` (delete)
**Steps:** Delete after T31.
**Acceptance:** file gone.
**Deps:** T31

### T34 [sweep] (L) — Repoint option-menu imports
**Scope:** all `*.{tsx,ts}` under `apps/web/src`
**Old → New:** `@core/components/option-menu` → `@galaxy/ui` (import `OptionMenu`)
**Sites (~60):** dashboards crm/analytics, widget-examples (advanced/charts/statistics), apps ecommerce/user/email/invoice/kanban/logistics/academy/permissions/chat, user-profile pages (full list in `design.md` sweep scope).
**Steps:** find-and-replace across scope; `grep -rn "@core/components/option-menu" apps/web/src` must return 0.
**Acceptance:** 0 matches; typecheck passes.
**Deps:** none

### T35 (S) — Delete option-menu duplicates
**Files:** `apps/web/src/@core/components/option-menu/index.tsx`, `types.ts` (delete)
**Steps:** Delete after T34.
**Acceptance:** 2 files gone.
**Deps:** T34

### T36 (S ×5) — Delete dialog re-export wrappers (all except `create-app/*`)
**Batches (3 files each):**
1. `dialogs/DialogCloseButton.tsx`, `dialogs/OpenDialogOnElementClick.tsx`, `dialogs/confirmation-dialog/index.tsx`
2. `dialogs/add-edit-address/index.tsx`, `dialogs/billing-card/index.tsx`, `dialogs/edit-user-info/index.tsx`
3. `dialogs/payment-method/index.tsx`, `dialogs/payment-providers/index.tsx`, `dialogs/permission-dialog/index.tsx`
4. `dialogs/pricing/index.tsx`, `dialogs/refer-earn/index.tsx`, `dialogs/role-dialog/index.tsx`
5. `dialogs/two-factor-auth/index.tsx`, `dialogs/upgrade-plan/index.tsx`, `dialogs/share-project/index.tsx`
**Steps:** Delete wrapper directories/files. Do NOT touch `dialogs/create-app/*` (app-specific wizard).
**Acceptance per batch:** 3 wrapper files gone; `dialogs/create-app/*` untouched.
**Deps:** none

### T37 [sweep] (L) — Repoint dialog imports
**Scope:** all `*.{tsx,ts}` under `apps/web/src`
**Old → New:** `@components/dialogs/<name>` → named imports from `@galaxy/ui`
  - `confirmation-dialog` → `{ ConfirmationDialog }`
  - `add-edit-address` → `{ AddEditAddressDialog }`
  - `billing-card` → `{ BillingCardDialog }`
  - `edit-user-info` → `{ EditUserInfoDialog }`
  - `payment-method` → `{ PaymentMethodDialog }`
  - `payment-providers` → `{ PaymentProvidersDialog }`
  - `permission-dialog` → `{ PermissionDialog }`
  - `pricing` → `{ PricingDialog }`
  - `refer-earn` → `{ ReferEarnDialog }`
  - `role-dialog` → `{ RoleDialog }`
  - `two-factor-auth` → `{ TwoFactorAuthDialog }`
  - `upgrade-plan` → `{ UpgradePlanDialog }`
  - `share-project` → (app-specific example dialog; check if re-export exists in ui — if not, keep in web or propose addition)
  - `DialogCloseButton` → `{ DialogCloseButton }`, `OpenDialogOnElementClick` → `{ OpenDialogOnElementClick }`
**Exclusion:** `dialogs/create-app/*` stays in web.
**Steps:** find-and-replace across scope; `grep -rn "@components/dialogs/" apps/web/src` must match only `create-app/*`.
**Acceptance:** only create-app imports remain; typecheck passes.
**Deps:** T36

### T38 (S ×3) — Delete card-statistics re-export wrappers
**Batches:**
1. `components/card-statistics/CardStatsSquare.tsx`, `CustomerStats.tsx`, `Horizontal.tsx`
2. `components/card-statistics/HorizontalWithAvatar.tsx`, `HorizontalWithBorder.tsx`, `HorizontalWithSubtitle.tsx`
3. `components/card-statistics/StatsWithAreaChart.tsx`, `Vertical.tsx`
**Steps:** Delete wrappers (all are `export { X as default } from '@galaxy/ui'`).
**Acceptance per batch:** files gone.
**Deps:** none

### T39 [sweep] (L) — Repoint card-statistics imports
**Scope:** all `*.{tsx,ts}` under `apps/web/src`
**Old → New:** `@components/card-statistics/<file>` → named import from `@galaxy/ui` (e.g. `CardStatHorizontal`, `CardStatsWithAreaChart`, ...)
**Steps:** verify usage first (`grep -rn "@components/card-statistics"`); if unused beyond barrel, skip repoint; find-and-replace otherwise; `grep` must return 0.
**Acceptance:** 0 matches (or confirmed unused and wrappers already deleted).
**Deps:** T38

### T40 (S) — Delete pricing re-export wrappers
**Files:** `apps/web/src/components/pricing/index.tsx`, `components/pricing/PlanDetails.tsx` (delete)
**Steps:** Delete wrappers.
**Acceptance:** 2 files gone.
**Deps:** none

### T41 [sweep] (L) — Repoint pricing imports
**Scope:** all `*.{tsx,ts}` under `apps/web/src`
**Old → New:** `@components/pricing` → named imports from `@galaxy/ui` (`Pricing`, `PlanDetails`)
**Steps:** find-and-replace; `grep -rn "@components/pricing" apps/web/src` = 0.
**Acceptance:** 0 matches; typecheck passes.
**Deps:** T40

### T42 (S) — scroll-to-top wrapper: decide and act
**Files:** `apps/web/src/@core/components/scroll-to-top/index.tsx`
**Steps:** `grep -rn "@core/components/scroll-to-top\|ScrollToTop" apps/web/src`. If only re-export sites exist, repoint to `@galaxy/ui` and delete wrapper; if unused, delete outright.
**Acceptance:** decision recorded in `report.md`; no dangling imports.
**Deps:** none

### T43 (M) — Final P0 grep verification
**Scope:** all `apps/web/src`
**Steps:** Run grep for every removed path: `@components/Form`, `@components/DirectionalIcon`, `@components/TablePaginationComponent`, `@components/stepper-dot`, `@core/styles/stepper`, `@core/components/mui/*`, `@core/components/custom-inputs/*`, `@core/components/option-menu`, `@components/card-statistics`, `@components/pricing`, `@components/dialogs/` (allow only `create-app/*`). All must return 0 (except the create-app allowance).
**Acceptance:** zero dangling imports; `pnpm --filter web typecheck` passes.
**Deps:** T01–T42

---

## Phase P1 — Extract recurring UI into packages/ui

Each P1 task: create component + typed props + barrel export in `packages/ui/src/` + Vitest test (`*.test.tsx`) + repoint `apps/web` imports to `@galaxy/ui` + delete web duplicate. P1 depends on T43.

### T101 (M) — Layout dropdowns + Logo
**Create:** `packages/ui/src/layout/UserDropdown.tsx`, `LanguageDropdown.tsx`, `ModeDropdown.tsx`, `layout/Logo.tsx` (+ types, `index.ts` exports)
**Web changes:** repoint imports from `components/layout/shared/*` and `components/layout/*`; delete web duplicates.
**Acceptance:** web imports layout kit from `@galaxy/ui`; duplicates removed; tests pass; typecheck passes.
**Deps:** T43

### T102 (M) — Search kit
**Create:** `packages/ui/src/layout/search/` (`DefaultSuggestions`, `NoResult`, search input)
**Web changes:** repoint `components/layout/shared/search/*` imports; delete web duplicates.
**Acceptance:** tests pass; typecheck passes.
**Deps:** T43

### T103 (M) — NotificationsDropdown + ShortcutsDropdown
**Create:** `packages/ui/src/layout/NotificationsDropdown.tsx`, `ShortcutsDropdown.tsx`
**Web changes:** repoint imports; delete web duplicates.
**Acceptance:** tests pass; typecheck passes.
**Deps:** T43

### T104 (M) — Chart wrappers
**Create:** `packages/ui/src/charts/ApexCharts.tsx`, `Recharts.tsx`, `ReactPlayer.tsx` (+ neutral base styles)
**Web changes:** `src/libs/*` wrappers keep only theme overrides; base imports from `@galaxy/ui/charts/*`.
**Acceptance:** tests pass; typecheck passes.
**Deps:** T43

### T105 (M) — Toast wrapper
**Create:** `packages/ui/src/toast/ToastProvider.tsx` (react-toastify)
**Acceptance:** test passes; typecheck passes.
**Deps:** T43

### T106 (M) — EmptyState + Skeleton + AvatarGroup
**Create:** `packages/ui/src/EmptyState.tsx`, `Skeleton.tsx`, `AvatarGroup.tsx`
**Acceptance:** tests pass; typecheck passes.
**Deps:** T43

### T107 (M) — FileDropzone + DateRange + CopyButton
**Create:** `packages/ui/src/inputs/FileDropzone.tsx`, `inputs/DateRange.tsx`, `CopyButton.tsx`
**Acceptance:** tests pass; typecheck passes.
**Deps:** T43

### T108 (M) — Currency / number display
**Create:** `packages/ui/src/display/Currency.tsx`, `NumberFormat.tsx`
**Acceptance:** tests pass; typecheck passes.
**Deps:** T43

### T109 (M) — Base data table
**Create:** `packages/ui/src/table/DataTable.tsx` (react-table + `TablePaginationComponent`)
**Acceptance:** test passes; typecheck passes; web table pages may adopt incrementally.
**Deps:** T43

---

## Phase P2 — Package governance

### T201 (S) — Reorganize packages/ui barrel
**Files:** `packages/ui/src/index.ts`
**Steps:** Group exports by domain (dialogs, mui, inputs, card-statistics, layout, charts, table, display, layout); separate type exports; keep default exports.
**Acceptance:** all named exports resolve; `pnpm --filter @galaxy/ui typecheck` passes.
**Deps:** P1 complete

### T202 (S) — Package guidelines
**Files:** `packages/ui/README.md`, `packages/ui/UI_PACKAGE_GUIDELINES.md`
**Steps:** Document naming, `'use client'` rule, peerDeps, barrel rules, mandatory tests, no upward imports, what belongs in `ui` vs `web`.
**Acceptance:** files exist and are consistent with `rule.md`.
**Deps:** P1 complete

### T203 (S) — Version alignment & dedupe
**Files:** `packages/ui/package.json`, `apps/web/package.json`
**Steps:** `pnpm dedupe`; verify `workspace:*` for all `@galaxy/*` deps; pinned versions for critical externals.
**Acceptance:** `pnpm dedupe` clean; no `^`/`*` on security-sensitive deps.
**Deps:** P1 complete

### T204 (S) — arsy boundary audit (read-only)
**Steps:** Confirm `apps/arsy/package.json` has no `@galaxy/ui` dependency; document adoption path in `report.md`. No code changes to `arsy`.
**Acceptance:** audit note recorded.
**Deps:** P1 complete

---

## Phase P3 — Verification

### T301 (L) — Typecheck, lint, build
**Steps:** `pnpm --filter @galaxy/ui typecheck lint`; `pnpm --filter web typecheck lint build`.
**Acceptance:** all green.
**Deps:** P2 complete

### T302 (M) — Regression tests
**Steps:** Run Vitest for `packages/ui` and affected `apps/web` views.
**Acceptance:** all tests pass; new tests from P1 present.
**Deps:** P1 complete

### T303 (S) — Commits
**Steps:** Commit per module (`feat(ui): ...`, `refactor(web): ...`, `test(ui): ...`, `chore: ...`); Conventional Commits; scoped commits, no unrelated WIP.
**Acceptance:** clean git log for this change set.
**Deps:** T301, T302

---