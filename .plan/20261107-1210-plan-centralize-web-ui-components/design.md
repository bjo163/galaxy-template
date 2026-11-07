# Architecture & design — Centralize shared UI into packages/ui

## Module boundary diagram (text)

```
apps/*  (top layer — may import from packages/* only)
  ↓
packages/ui, packages/fake-db  (middle layer — may import from types, utils, config)
  ↓
packages/types, packages/utils, packages/config, packages/database  (base layer — types only)

Rule: packages/ui → @galaxy/types, @galaxy/utils, @galaxy/config + peerDeps only.
Rule: no upward imports (ui → apps or database forbidden).
Rule: no cross-app imports (arsy ← web forbidden).
```

## Before / After import map

| Component | Before (apps/web) | After |
|-----------|-------------------|-------|
| Form | `import Form from '@components/Form'` (wrapper) | `import Form from '@galaxy/ui'` |
| DirectionalIcon | `import DirectionalIcon from '@components/DirectionalIcon'` | `import { DirectionalIcon } from '@galaxy/ui'` |
| TablePaginationComponent | wrapper import | `import { TablePaginationComponent } from '@galaxy/ui'` |
| StepperCustomDot | `@components/stepper-dot` | `import StepperCustomDot from '@galaxy/ui'` |
| StepperWrapper | `@core/styles/stepper` | `import StepperWrapper from '@galaxy/ui'` |
| CustomAvatar | `@core/components/mui/Avatar` | `import { CustomAvatar } from '@galaxy/ui'` |
| custom-inputs/types | `@core/components/custom-inputs/types` | `@galaxy/ui/custom-inputs/types` |
| OptionMenu | `@core/components/option-menu` | `import { OptionMenu } from '@galaxy/ui'` |
| Dialogs | `@components/dialogs/<name>` | named dialog import from `@galaxy/ui` |
| card-statistics | `@components/card-statistics/*` | named import from `@galaxy/ui` |
| Pricing | `@components/pricing` | `import { Pricing, PlanDetails } from '@galaxy/ui'` |

## New `packages/ui` structure (P1 target)

```
src/
  index.ts                 # barrel (grouped by domain, type exports separated)
  Form.tsx
  DirectionalIcon.tsx
  TablePaginationComponent.tsx
  ScrollToTop.tsx
  stepper-dot/             # StepperCustomDot
  dialogs/                 # 14 existing dialogs (+ types)
  mui/                     # CustomTextField, CustomAutocomplete, CustomIconButton, CustomChip, CustomBadge, CustomTabList
  option-menu/             # OptionMenu (+ types)
  custom-inputs/           # Horizontal, Vertical, Image (+ types)
  card-statistics/         # 8 existing stats cards
  styles/                  # StepperWrapper, table.module.css
  pricing/                 # Pricing, PlanDetails
  layout/                  # P1: UserDropdown, LanguageDropdown, ModeDropdown, Logo, NotificationsDropdown, ShortcutsDropdown, NavToggle
  layout/search/           # P1: DefaultSuggestions, NoResult, search input
  charts/                  # P1: ApexCharts, Recharts, ReactPlayer wrappers
  toast/                   # P1: react-toastify provider wrapper
  EmptyState.tsx           # P1
  Skeleton.tsx             # P1
  AvatarGroup.tsx          # P1
  inputs/                  # P1: FileDropzone, DateRange, CopyButton
  display/                 # P1: Currency, NumberFormat
  table/                   # P1: DataTable (react-table + TablePaginationComponent)
```

Kept in `apps/web` (app-specific, NOT extracted): `@menu/*`, `@layouts/*`, `components/layout/*` shells, `components/brand/*`, `dialogs/create-app/*` wizard, `@core/theme/*` branding overrides, front-page/landing-page views.

## Alternatives considered

| Alternative | Verdict | Rationale |
|-------------|---------|-----------|
| Keep thin re-export wrappers in web | Rejected | Two sources of truth; drift risk; wrappers add indirection with no value |
| Extract everything in one PR | Rejected | Too large/risky; phased P0→P3 is reviewable and reversible per module |
| Move theme overrides into packages/ui | Rejected | Branding belongs to `apps/web`; `ui` keeps neutral base only |
| Barrel index vs direct imports | Barrel chosen | Consistent with existing `packages/ui/src/index.ts`; discoverable API surface |
| peerDeps vs direct deps for MUI | peerDeps | Avoids duplicate MUI copies; web already pins `7.3.6` |

## Trade-offs

- Sweep `[sweep]` tasks rename many import sites with one pattern — reviewable as a uniform diff, verified by `grep` = 0 after each sweep.
- Deleting wrappers before repointing would break the build; tasks are ordered repoint-then-delete.
- `packages/ui` has no build script (source shipped via `exports`/`types`); validation is `typecheck` + `lint`.

## Open questions

1. i18n: Should shared extracted components use translation keys or inline English text? Decide per component during P1 (web keeps `getDictionary`; ui components should stay language-neutral or accept labels as props).
2. `apps/arsy` adoption timeline for `@galaxy/ui` — audit only in this plan; no arsy code changes.
3. MUI v7 peer range `^7.0.0` vs web's pinned `7.3.6` — verify compatibility in T301.
4. `share-project` dialog: no `@galaxy/ui` equivalent exists; decide whether to add to `packages/ui/dialogs` or keep in web.
