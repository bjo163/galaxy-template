# Technical specification — Centralize shared UI into packages/ui

## Requirements

| ID | Requirement | Type |
|----|-------------|------|
| FR-01 | Remove all thin re-export wrappers and 1:1 duplicates in `apps/web` (§3 of plan); every import resolves to `@galaxy/ui`. | Functional |
| FR-02 | Extract P1 recurring UI into `packages/ui` with tests; `apps/web` imports them from `@galaxy/ui`. | Functional |
| FR-03 | `apps/arsy` remains unchanged (boundary audit only). | Functional |
| NFR-01 | `pnpm --filter @galaxy/ui typecheck lint` green; `pnpm --filter web typecheck lint build` green. | Non-functional |
| NFR-02 | Zero remaining imports of deleted paths (grep-enforced, task T43). | Non-functional |
| NFR-03 | Bundle impact neutral or positive (fewer duplicate files in `apps/web`). | Non-functional |

## Contracts

**UI package contract:** `packages/ui` exports only shared, app-agnostic UI. It imports only `@galaxy/types`, `@galaxy/utils`, `@galaxy/config` plus peerDeps (MUI, tanstack-table, apexcharts, react, react-dom).

**Component contract (per extracted component):**
- Named default export + named `Props` type export.
- `'use client'` when using browser APIs/hooks.
- Tailwind classes consistent with neutral design tokens (no web-specific branding).
- Registered in `packages/ui/src/index.ts` barrel.
- Co-located Vitest test (`*.test.tsx`).

**Import mapping examples:**
- `@components/Form` → `import Form from '@galaxy/ui'`
- `@components/DirectionalIcon` → `import { DirectionalIcon } from '@galaxy/ui'`
- `@components/TablePaginationComponent` → `import { TablePaginationComponent } from '@galaxy/ui'`
- `@components/stepper-dot` → `import StepperCustomDot from '@galaxy/ui'`
- `@core/styles/stepper` → `import StepperWrapper from '@galaxy/ui'`
- `@core/components/mui/Avatar` → `import { CustomAvatar } from '@galaxy/ui'`
- `@core/components/custom-inputs/types` → `import type { ... } from '@galaxy/ui/custom-inputs/types'`
- `@core/components/option-menu` → `import { OptionMenu } from '@galaxy/ui'`
- `@components/dialogs/<name>` → named dialog import from `@galaxy/ui`
- `@components/card-statistics/<file>` → named card-statistics import from `@galaxy/ui`
- `@components/pricing` → `import { Pricing, PlanDetails } from '@galaxy/ui'`

## Error scenarios

| Scenario | Detection | Mitigation |
|----------|-----------|------------|
| Missing re-export after wrapper deletion | `tsc --noEmit` fails at build | Repoint imports before deletion (task ordering); T43 grep verification |
| Peer-dep version mismatch (MUI v7) | Runtime MUI warning; `typecheck` may fail | Pin MUI `7.3.6` in web; peer `^7.0.0` in ui; verify alignment in T203 |
| Barrel export missing | `typecheck` fails on import | Add export to `packages/ui/src/index.ts` in same task as component creation |

## Acceptance criteria

| ID | Criterion | Verified by |
|----|-----------|-------------|
| AC-01 | All P0 wrapper files deleted; zero imports of removed paths | T43 grep + `typecheck` |
| AC-02 | All shared `apps/web` UI imports resolve to `@galaxy/ui` | T43, T301 |
| AC-03 | P1 components exist in `packages/ui` with tests and barrel exports | T101–T109 |
| AC-04 | P2 governance artifacts present; `pnpm dedupe` clean | T201–T203 |
| AC-05 | `apps/arsy` untouched; audit note recorded | T204 |
| AC-06 | `pnpm --filter @galaxy/ui typecheck lint` and `pnpm --filter web typecheck lint build` green | T301 |
| AC-07 | Regression tests pass | T302 |
