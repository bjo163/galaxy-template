# Galaxy `@galaxy/types` + `@galaxy/fake-db` extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `apps/web/src/fake-db` into a real workspace package `@galaxy/fake-db`, and give it a self-contained type layer by extracting the 13 `@/types` files that `fake-db` consumes into a new `@galaxy/types` package — with **zero reverse-dependencies from the packages back into `apps/web`**. The app keeps working through thin re-export shims so the 109 existing `@/types` consumers and the 15 `fake-db` call sites are not all rewritten in one blast.

**Architecture:** Dependency-inversion extraction. `@galaxy/types` owns the canonical definitions of the two `@core` symbols the type files need (`ThemeColor`, `CustomAvatarProps`). `apps/web`'s `@core/types.ts` and `@core/components/mui/Avatar.tsx` stop defining them and re-export from `@galaxy/types` instead, so their 143 / 102 existing consumers are untouched. The 13 moved `@/types` files become one-line `export *` shims. `@galaxy/fake-db` holds the 14 demo-data modules, imports `@galaxy/types` by subpath, and `apps/web`'s 15 call sites are re-pointed straight to `@galaxy/fake-db` (no shim, because this is the module the user asked to physically move). Both packages are source-first (consumed via Next `transpilePackages`, no build step), mirroring the proven `@galaxy/utils`.

**Tech Stack:** pnpm@10 workspaces (isolated), Turborepo v2, Next.js 16.1.1, React 19.2, TypeScript 5.9 (`moduleResolution: Bundler` → honors subpath `exports`), ESLint 8 (legacy `.eslintrc`), MUI 7.3.6, apexcharts 3.49.0, `@fullcalendar/core` 6.1.20.

**Spec / supersedes:** `docs/superpowers/specs/2026-11-06-galaxy-monorepo-infra-first-design.md`. This plan executes the "roadmap" item the prior README deferred, with one approved deviation: `types` moves **now** (not bundled with a full `@core` extraction) using dependency inversion for just the 2 symbols `@core` must keep serving. Owner approved scope: **"Ekstraksi penuh & bersih"** (full clean extraction).

## Global Constraints

- **Contamination-safe tree.** This checkout is shared with live foreign workstreams. Currently uncommitted and NOT ours: `apps/arsy/`, `apps/baas/`, `packages/ui/`, `packages/database/`, `M package.json`, `M pnpm-lock.yaml`, and these dirty web files: `apps/web/package.json`, `.gitignore`, `apps/web/src/components/{DirectionalIcon,Form,TablePaginationComponent}.tsx`, `apps/web/src/components/pricing/index.tsx`, `apps/web/src/components/dialogs/{DialogCloseButton,OpenDialogOnElementClick}.tsx`, `apps/web/src/components/stepper-dot/index.tsx`, `apps/web/src/views/ForgotPassword.tsx`. **Never** stage any of these unless the step explicitly owns the file. Never `git add -A` / `git add .` / `git stash` / `git checkout --` / `rm -rf`.
- **Commit only the task's own files.** For shared files the task must edit but foreign also dirties (`apps/web/package.json`, `apps/web/next.config.ts`), stage them via **index-blob** (build the intended blob = committed HEAD version + only your lines, `git update-index --cacheinfo`), never commit the foreign working-tree content. Reuse the Task-4 `package.json` index-blob procedure from `.superpowers/sdd/2026-11-06-galaxy-monorepo-infra-first/progress.md`.
- **Lockfile policy (carried).** Adding workspace packages requires `pnpm install`, which rewrites `pnpm-lock.yaml` — but that file is foreign-dirty and cannot be cleanly split. Follow the established convention: **do not commit `pnpm-lock.yaml`** in any task commit; install locally so gates run against a linked tree, and surface a single consolidated lockfile-refresh decision to the owner at handoff.
- **Scoped gates only.** Every turbo invocation is filtered to the packages this plan touches: `--filter=web --filter=@galaxy/types --filter=@galaxy/fake-db`. **Never** run unfiltered root `build`/`typecheck`/`lint` while foreign apps sit in the tree.
- **No version changes.** `@mui/material`, `apexcharts`, `@fullcalendar/core`, `@types/react` in the new packages use the exact versions already pinned in `apps/web/package.json`. Do not bump anything.
- **Behavior-preserving.** Type files and fake-db modules move verbatim except import specifiers. Runtime output of every route is unchanged. Definition of done per task: scoped `pnpm install` EXIT 0, scoped `typecheck` EXIT 0, scoped `lint --force` 0 errors, `build --filter=web` EXIT 0 (with `.next` populated, proving I-3 `ignorePatterns` still holds).
- Windows/Git-Bash: no bare `rm -rf`; use `rimraf`. `heredoc` commit messages and `$`-anchored greps are unreliable (CRLF) — verify diffs by reading files, not by regex-anchored grep.

---

## Ground-truth dependency contract (verified this session)

- **fake-db = 14 files.** Imports across all of them: only the 13 `@/types/*` subpaths below, plus `@fullcalendar/core` in `apps/calendar.ts`. No sibling/relative imports, no faker/date libs. Each file is an independent leaf.
- **The 13 `@/types` files `fake-db` needs** (all under `apps/web/src/types/`):
  `apps/{academy,chat,ecommerce,email,invoice,kanban,logistics,permission,user}Types.ts`,
  `pages/{faq,pricing,profile,widget}Types.ts`.
- **The 2 `@/types` files that STAY in `apps/web`** (drag web-only deps — `calendarTypes` pulls `@fullcalendar/core` + `@reduxjs/toolkit`; `menuTypes` pulls `react` + `@mui/material/Chip` + `@menu/*`): `apps/calendarTypes.ts`, `menuTypes.ts`. `fake-db` does **not** import either.
- **Only 2 external symbols cross into the moved files**, both from `@core`:
  - `ThemeColor` (from `@core/types`) — used by `academy/chat/user/profile/widget` (5 files). It is a pure union: `'primary'|'secondary'|'error'|'warning'|'info'|'success'`. `@core/types.ts` otherwise imports only `react`.
  - `CustomAvatarProps` (from `@core/components/mui/Avatar`) — used by `widgetTypes` (1 file). Defined as `AvatarProps & { color?: ThemeColor; skin?: 'filled'|'light'|'light-static'; size?: number }` where `AvatarProps` comes from `@mui/material/Avatar`.
- **`widgetTypes` also imports** `ChipProps` (`@mui/material/Chip`) and `ApexOptions` (`apexcharts`) — both stay as external deps of `@galaxy/types`.
- **All 13 files export only `type`** (no interface/enum/const/default) → a pure-type re-export shim (`export * from ...`) and `export type *` both compile under `isolatedModules`. No export-name collisions across the 13 → subpath `exports` map is unambiguous.
- **No reverse dependency:** neither `calendarTypes.ts` nor `menuTypes.ts` nor anything under `@core`/`@menu` imports the 13 moving files → the move cannot strand a staying file.
- **Consumer counts:** 109 web files import `@/types/*` (→ kept working via 13 shims, not rewritten). 15 web files import `@/fake-db/*` (→ rewritten to `@galaxy/fake-db`; none of the 15 is a foreign-dirty file).

---

## File Structure

**New files — `@galaxy/types`**
- `packages/types/package.json` — `@galaxy/types`, subpath `exports` (`./*` → source), deps `@mui/material`, `apexcharts`; devDeps `@galaxy/tsconfig`, `@galaxy/eslint-config`, `@types/react`, `eslint`, `rimraf`, `typescript`.
- `packages/types/tsconfig.json` — extends `@galaxy/tsconfig/library.json`.
- `packages/types/.eslintrc.cjs` — `{ extends: ['@galaxy/eslint-config'] }` (mirror `packages/utils/.eslintrc.cjs`).
- `packages/types/src/base.ts` — canonical `ThemeColor` + `CustomAvatarProps` (the dependency-inversion source of truth).
- `packages/types/src/index.ts` — barrel (`export * from './base'` + all 13) for optional flat imports.
- `packages/types/src/apps/{academy,chat,ecommerce,email,invoice,kanban,logistics,permission,user}Types.ts` — copied from `apps/web/src/types/apps/*`, `@core/types`/`@core/components/mui/Avatar` specifiers rewritten to `'../base'`.
- `packages/types/src/pages/{faq,pricing,profile,widget}Types.ts` — copied from `apps/web/src/types/pages/*`, same specifier rewrite.

**New files — `@galaxy/fake-db`**
- `packages/fake-db/package.json` — `@galaxy/fake-db`, subpath `exports`, deps `@galaxy/types` (workspace), `@fullcalendar/core`; devDeps mirror utils (+ `@types/react`).
- `packages/fake-db/tsconfig.json` — extends `@galaxy/tsconfig/library.json`.
- `packages/fake-db/.eslintrc.cjs` — `{ extends: ['@galaxy/eslint-config'] }`.
- `packages/fake-db/src/index.ts` — optional barrel of the 14 modules.
- `packages/fake-db/src/apps/{academy,calendar,chat,ecommerce,email,invoice,kanban,logistics,permissions,userList}.ts` — copied from `apps/web/src/fake-db/apps/*`, `@/types/*` specifiers → `@galaxy/types/*`.
- `packages/fake-db/src/pages/{faq,pricing,userProfile,widgetExamples}.ts` — copied from `apps/web/src/fake-db/pages/*`, same specifier rewrite.

**Modified files**
- `apps/web/src/types/apps/{academy,chat,ecommerce,email,invoice,kanban,logistics,permission,user}Types.ts` and `apps/web/src/types/pages/{faq,pricing,profile,widget}Types.ts` (13) → replaced with one-line `export *` shims. (`calendarTypes.ts`, `menuTypes.ts` untouched.)
- `apps/web/src/@core/types.ts` — `ThemeColor` definition → re-export from `@galaxy/types/base`.
- `apps/web/src/@core/components/mui/Avatar.tsx` — local `CustomAvatarProps` definition → import + re-export from `@galaxy/types/base`.
- `apps/web/package.json` — add `@galaxy/types`, `@galaxy/fake-db` workspace deps (index-blob; do not touch the foreign `@galaxy/ui` line).
- `apps/web/next.config.ts` — `transpilePackages` += `@galaxy/types`, `@galaxy/fake-db`.
- 15 web files under `apps/web/src/app/api/**` and `apps/web/src/redux-store/slices/**` — `@/fake-db/*` → `@galaxy/fake-db/*`.

**Deferred / out of scope (foreign or feature work, NOT this plan)**
- `apps/web/src/types/apps/calendarTypes.ts`, `apps/web/src/types/menuTypes.ts` and their `@/types` consumers stay put.
- `pnpm-lock.yaml` consolidation, `@galaxy/ui`/`apps/arsy`/`apps/baas`/`packages/database` — foreign.

---

## Design decisions (with rationale)

1. **Subpath `exports` (`"./apps/*": "./src/apps/*.ts"`), not a single barrel**, for both packages. Rationale: preserves the exact old module identity (`@/types/apps/academyTypes` ↔ `@galaxy/types/apps/academyTypes`) so the web shims are trivial 1:1 and the 15 fake-db re-points are a pure prefix swap. Bundler `moduleResolution` honors wildcard `exports`. (A barrel would force rewriting all 109 consumer subpaths to flat names — far larger and riskier.)
2. **Re-export shims for `@/types` (13 files) but real rewire for `@/fake-db` (15 files).** Rationale: 109 vs 15. Rewiring 109 files in a shared contaminated tree is unacceptable churn; 15 clean files is a small, safe, verifiable diff — and it satisfies the literal request to *move* `fake-db` (nothing fake-db-shaped is left in `apps/web`). This asymmetry is deliberate, not accidental.
3. **Dependency inversion for `ThemeColor` / `CustomAvatarProps`.** The canonical definitions move to `@galaxy/types/base`; `@core` re-exports them. This avoids a 143-file and 102-file rewire while keeping `@galaxy/types` free of any `apps/web` import. `apps/web → @galaxy/types` is one-directional; no cycle.
4. **Source-first, `transpilePackages`, no build task** — proven for `@galaxy/utils`. Adding a compiled `build` step now would pull tsc project references + `rimraf dist` churn for no consumer benefit (only `apps/web` consumes these).
5. **`@mui/material` + `apexcharts` + `@fullcalendar/core` become real `dependencies` of the new packages** (not peers), at the exact app-pinned versions, because isolated installs require the package to declare what it imports for `tsc --noEmit` to resolve the types.

---

## Task 1 — Create `@galaxy/types` (additive, zero blast radius on the app)

This task only **creates** `packages/types/**`. `apps/web` is not modified, so its typecheck/build stays green regardless. Do the `@core` redirect and web shims in Task 2.

**Files:**
- Create: `packages/types/package.json`, `packages/types/tsconfig.json`, `packages/types/.eslintrc.cjs`, `packages/types/src/base.ts`, `packages/types/src/index.ts`, and the 13 copied type files.

**Interfaces:**
- Consumes: nothing (self-contained).
- Produces: `@galaxy/types` with subpaths `./base`, `./apps/<X>Types`, `./pages/<X>Types`, and `./index`. Task 2 and Task 3 import these.

- [ ] **Step 1: Create `packages/types/package.json`**

```json
{
  "name": "@galaxy/types",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./base": "./src/base.ts",
    "./apps/*": "./src/apps/*.ts",
    "./pages/*": "./src/pages/*.ts"
  },
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "clean": "rimraf .turbo"
  },
  "dependencies": {
    "@mui/material": "7.3.6",
    "apexcharts": "3.49.0"
  },
  "devDependencies": {
    "@galaxy/tsconfig": "workspace:*",
    "@galaxy/eslint-config": "workspace:*",
    "@types/react": "19.2.7",
    "eslint": "8.57.1",
    "rimraf": "5.0.7",
    "typescript": "5.9.3"
  }
}
```

- [ ] **Step 2: Create `packages/types/tsconfig.json`**

```json
{
  "extends": "@galaxy/tsconfig/library.json",
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Create `packages/types/.eslintrc.cjs`**

```js
module.exports = { extends: ['@galaxy/eslint-config'] }
```

- [ ] **Step 4: Create `packages/types/src/base.ts`** (canonical, dependency-inverted symbols)

```ts
// MUI Imports
import type { AvatarProps } from '@mui/material/Avatar'

export type ThemeColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

export type CustomAvatarProps = AvatarProps & {
  color?: ThemeColor
  skin?: 'filled' | 'light' | 'light-static'
  size?: number
}
```

- [ ] **Step 5: Copy the 13 type files into `packages/types/src/{apps,pages}/`**

Copy each verbatim from `apps/web/src/types/<rel>`, then apply these **exact, only** specifier edits:
- Replace `from '@core/types'` → `from '../base'` (files under `src/apps/*` and `src/pages/*` are one level below `src/base.ts`, so `'../base'`).
- Replace `from '@core/components/mui/Avatar'` → `from '../base'` (only `pages/widgetTypes.ts`).
- Leave `from '@mui/material/Chip'` and `from 'apexcharts'` unchanged.
- Touch no other line, reorder nothing.

Concretely, the specifier rewrites land on: `apps/academyTypes.ts`, `apps/chatTypes.ts`, `apps/userTypes.ts` (`@core/types` → `'../base'`), `pages/profileTypes.ts` (`@core/types` → `'../base'`), and `pages/widgetTypes.ts` (both `@core/types` and `@core/components/mui/Avatar` → `'../base'`). The other 8 files copy byte-for-byte.

- [ ] **Step 6: Create `packages/types/src/index.ts`** (barrel; safe — no cross-file name collisions)

```ts
export * from './base'
export * from './apps/academyTypes'
export * from './apps/chatTypes'
export * from './apps/ecommerceTypes'
export * from './apps/emailTypes'
export * from './apps/invoiceTypes'
export * from './apps/kanbanTypes'
export * from './apps/logisticsTypes'
export * from './apps/permissionTypes'
export * from './apps/userTypes'
export * from './pages/faqTypes'
export * from './pages/pricingTypes'
export * from './pages/profileTypes'
export * from './pages/widgetTypes'
```

- [ ] **Step 7: Link the new workspace package**

Run: `pnpm install` (from repo root).
Expected: EXIT 0. Creates `packages/types` symlink + installs `@mui/material`/`apexcharts`/`@types/react` into it. `pnpm-lock.yaml` changes — **do not stage it** (Global Constraints).

- [ ] **Step 8: Gate — the package typechecks and lints standalone**

Run: `pnpm exec turbo run typecheck --filter=@galaxy/types`
Then: `pnpm exec turbo run lint --force --filter=@galaxy/types`
Expected: both EXIT 0. `tsc --noEmit` resolves `@mui/material/Avatar` (`AvatarProps`) + `@mui/material/Chip` (`ChipProps`) + `apexcharts` (`ApexOptions`) from the package's own deps. If a React-namespace type inside MUI fails to resolve, add `"@types/react-dom"` (match `apps/web`) to devDeps and re-run — that is the only expected deviation.
Then run the **dead-rule check** (memory: verify a gate actually fires): `pnpm exec tsc --noEmit -p packages/types` must genuinely read `packages/types/src` (confirm `node_modules/.bin` resolution, not an empty include glob). Sanity: temporarily nothing — the build of Task 2 proves consumption.

- [ ] **Step 9: Commit (only `packages/types`)**

```bash
git add packages/types
git commit -m "feat(types): add @galaxy/types package with the 13 fake-db type modules + canonical ThemeColor/CustomAvatarProps"
```

Before committing, verify the commit is additive and contains no foreign path:
Run: `git show --stat HEAD`
Expected: only `packages/types/**` files; nothing under `apps/`, no `package.json`, no `pnpm-lock.yaml`.

---

## Task 2 — Redirect `apps/web` onto `@galaxy/types` (shims + `@core` dependency inversion + wiring)

Now the app consumes the package. 109 `@/types` consumers keep working through 13 shims; `@core` keeps serving `ThemeColor`/`CustomAvatarProps` through re-exports.

**Files:**
- Modify: the 13 `apps/web/src/types/{apps,pages}/*Types.ts` → shims.
- Modify: `apps/web/src/@core/types.ts`, `apps/web/src/@core/components/mui/Avatar.tsx`.
- Modify (index-blob): `apps/web/package.json`, `apps/web/next.config.ts`.

**Interfaces:**
- Consumes: `@galaxy/types` subpaths from Task 1.
- Produces: `apps/web` compiles against `@galaxy/types`; `@/types/*` and `@core` symbols resolve to the package.

- [ ] **Step 1: Replace each of the 13 `@/types` files with a one-line re-export shim**

For each moving file at `apps/web/src/types/<rel>.ts`, replace the entire content with:
```ts
export * from '@galaxy/types/<rel>'
```
e.g. `apps/web/src/types/apps/academyTypes.ts` → `export * from '@galaxy/types/apps/academyTypes'`; `apps/web/src/types/pages/widgetTypes.ts` → `export * from '@galaxy/types/pages/widgetTypes'`.
Do **not** touch `apps/web/src/types/apps/calendarTypes.ts` or `apps/web/src/types/menuTypes.ts` (they stay real).

- [ ] **Step 2: Dependency-invert `ThemeColor` in `@core/types.ts`**

In `apps/web/src/@core/types.ts`, delete the line
`export type ThemeColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'`
and replace it with
```ts
export type { ThemeColor } from '@galaxy/types/base'
```
Everything else in the file (the other 8 aliases, the `react` `ReactNode` import, `ChildrenType`) stays exactly as-is.

- [ ] **Step 3: Dependency-invert `CustomAvatarProps` in `@core/components/mui/Avatar.tsx`**

Remove the local block:
```ts
export type CustomAvatarProps = AvatarProps & {
  color?: ThemeColor
  skin?: 'filled' | 'light' | 'light-static'
  size?: number
}
```
and, in the Type Imports area, change `import type { ThemeColor } from '@core/types'` to:
```ts
import type { CustomAvatarProps } from '@galaxy/types/base'
export type { CustomAvatarProps }
```
The rest of `Avatar.tsx` (the `styled(MuiAvatar)<CustomAvatarProps>(...)` usage, `forwardRef`, default export) is unchanged — `CustomAvatarProps` and `AvatarProps` remain in scope. Keep `import type { AvatarProps } from '@mui/material/Avatar'` (still used by the `styled<...>`? — verify; if `AvatarProps` is now only used by the deleted type, remove that import too; it is not referenced elsewhere in the file).

- [ ] **Step 4: Add the workspace dependency (index-blob `apps/web/package.json`)**

Target: `dependencies` gains `"@galaxy/types": "workspace:*"` alongside the existing `"@galaxy/utils"`. Build the blob as `git show HEAD:apps/web/package.json` + this one added line only. Stage it, leaving the foreign working-tree edits (incl. the `@galaxy/ui` line) untouched:
```bash
git update-index --cacheinfo 100644 "$(git hash-object -w apps/web/package.json.staged.tmp)" apps/web/package.json
```
(Write `apps/web.package.json.staged.tmp` = HEAD content + only the `@galaxy/types` line; hash and stage it; delete the temp. Reuse the exact mechanism recorded for root `package.json` in the prior plan's Task 4.)

- [ ] **Step 5: Add `transpilePackages` (index-blob `apps/web/next.config.ts`)**

`transpilePackages: ['@galaxy/utils']` → `transpilePackages: ['@galaxy/utils', '@galaxy/types']`. Blob = HEAD version + only this edit. Stage via the same `update-index --cacheinfo` pattern.

- [ ] **Step 6: Link + gate**

Run: `pnpm install` (EXIT 0; do not stage lockfile).
Then: `pnpm exec turbo run typecheck --filter=web --filter=@galaxy/types`
Then: `pnpm exec turbo run build --filter=web` (populates `apps/web/.next`)
Then: `pnpm exec turbo run lint --force --filter=web --filter=@galaxy/types`
Expected: typecheck EXIT 0, build EXIT 0, lint EXIT 0 / 0 errors. The `.next`-populated lint with 0 errors re-confirms I-3 still holds. Zero `@/types/*` or `@core` symbol regressions across the 109 consumers (proven by `web` typecheck).
Dead-rule sanity (memory: verify a gate fires): confirm at least one previously-`@core/types` consumer still type-resolves `ThemeColor` — e.g. it must fail if you (temporarily) point the shim at a wrong path; a correct green web typecheck over 143 `@core` consumers is itself the proof.

- [ ] **Step 7: Commit (only the 13 shims + 2 `@core` files + the 2 index-blobbed config files)**

```bash
git add apps/web/src/types/apps/academyTypes.ts apps/web/src/types/apps/chatTypes.ts apps/web/src/types/apps/ecommerceTypes.ts apps/web/src/types/apps/emailTypes.ts apps/web/src/types/apps/invoiceTypes.ts apps/web/src/types/apps/kanbanTypes.ts apps/web/src/types/apps/logisticsTypes.ts apps/web/src/types/apps/permissionTypes.ts apps/web/src/types/apps/userTypes.ts apps/web/src/types/pages/faqTypes.ts apps/web/src/types/pages/pricingTypes.ts apps/web/src/types/pages/profileTypes.ts apps/web/src/types/pages/widgetTypes.ts
git add apps/web/src/@core/types.ts apps/web/src/@core/components/mui/Avatar.tsx
git add apps/web/package.json apps/web/next.config.ts   # already index-blobbed staged blobs, not working tree
git commit -m "refactor(web): redirect @/types and @core ThemeColor/CustomAvatarProps onto @galaxy/types"
```
Verify: `git show --stat HEAD` = exactly 17 files (13 shims + 2 @core + package.json + next.config). `git status --short` must still show `M package.json` (root), `M pnpm-lock.yaml`, `?? apps/arsy|baas|packages/ui|packages/database` and the foreign-dirty web component files **unchanged**.

---

## Task 3 — Create `@galaxy/fake-db`, move the 14 modules, re-point the 15 consumers

**Files:**
- Create: `packages/fake-db/{package.json,tsconfig.json,.eslintrc.cjs,src/index.ts,src/apps/*,src/pages/*}`.
- Delete (git rm): `apps/web/src/fake-db/**` (all 14).
- Modify: 15 web consumer files under `apps/web/src/app/api/**` + `apps/web/src/redux-store/slices/**` (specifier swap).
- Modify (index-blob): `apps/web/package.json` (+`@galaxy/fake-db`), `apps/web/next.config.ts` (+`@galaxy/fake-db`).

**Interfaces:**
- Consumes: `@galaxy/types` subpaths; `@fullcalendar/core`.
- Produces: `@galaxy/fake-db` subpaths `./apps/<X>`, `./pages/<X>`; `apps/web` imports fake-db only from the package.

- [ ] **Step 1: Scaffold `packages/fake-db`** — `package.json`, `tsconfig.json`, `.eslintrc.cjs` (identical shape to Task 1, with):

```json
{
  "name": "@galaxy/fake-db",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./apps/*": "./src/apps/*.ts",
    "./pages/*": "./src/pages/*.ts"
  },
  "types": "./src/index.ts",
  "scripts": { "typecheck": "tsc --noEmit", "lint": "eslint src --ext .ts", "clean": "rimraf .turbo" },
  "dependencies": {
    "@galaxy/types": "workspace:*",
    "@fullcalendar/core": "6.1.20"
  },
  "devDependencies": {
    "@galaxy/tsconfig": "workspace:*",
    "@galaxy/eslint-config": "workspace:*",
    "@types/react": "19.2.7",
    "eslint": "8.57.1",
    "rimraf": "5.0.7",
    "typescript": "5.9.3"
  }
}
```

- [ ] **Step 2: Copy the 14 fake-db modules into `packages/fake-db/src/{apps,pages}/`**

Copy each verbatim, applying the **only** specifier change: `@/types/<rel>` → `@galaxy/types/<rel>` (prefix swap; the `<rel>` after `@/types/` is identical to the one now exported by the package, e.g. `@/types/apps/academyTypes` → `@galaxy/types/apps/academyTypes`). Keep `@fullcalendar/core` unchanged in `apps/calendar.ts`. Preserve each file's existing `export default`/named data exports exactly.

- [ ] **Step 3: Create `packages/fake-db/src/index.ts`** (optional barrel of the 14; keep if consumers ever import flat, harmless otherwise).

- [ ] **Step 4: Remove the fake-db directory from the app and re-point the 15 consumers**

`git rm -r apps/web/src/fake-db`
For each of the 15 files (the list is fixed in Ground-truth above), swap `from '@/fake-db/` → `from '@galaxy/fake-db/` in their import lines only.
Run: `grep -rn "@/fake-db" apps/web/src --include=*.ts --include=*.tsx` → Expected: **0 matches**.
Run: `grep -rn "@/types" apps/web/src/fake-db 2>/dev/null` → Expected: no such dir (removed).

- [ ] **Step 5: Add the workspace dep + transpile entry (index-blob `apps/web/package.json`, `apps/web/next.config.ts`)**

`@galaxy/fake-db: "workspace:*"` into `dependencies`; `transpilePackages: ['@galaxy/utils', '@galaxy/types', '@galaxy/fake-db']`. Same index-blob mechanism as Task 2 Step 4-5.

- [ ] **Step 6: Link + full scoped gate matrix**

Run: `pnpm install` (EXIT 0; lockfile unstaged).
Then: `pnpm exec turbo run typecheck --filter=web --filter=@galaxy/fake-db --filter=@galaxy/types`
Then: `pnpm exec turbo run build --filter=web` (populates `.next`)
Then: `pnpm exec turbo run lint --force --filter=web --filter=@galaxy/fake-db --filter=@galaxy/types`
Expected: all EXIT 0, lint 0 errors. Proves `@galaxy/fake-db` compiles standalone AND `apps/web` builds consuming fake-db + types through `transpilePackages`, with `.next` ignored (I-3 re-confirms).
Behavior check (light): the moved modules are pure data/typing; route output is unchanged by construction. Do not start a dev server unless the owner asks (memory: user runs the app).

- [ ] **Step 7: Commit**

```bash
git add packages/fake-db
git rm -r apps/web/src/fake-db   # already staged in Step 4
git add apps/web/src/app/api/apps/academy/route.ts apps/web/src/app/api/apps/ecommerce/route.ts apps/web/src/app/api/apps/invoice/route.ts apps/web/src/app/api/apps/logistics/route.ts apps/web/src/app/api/apps/permissions/route.ts apps/web/src/app/api/apps/user-list/route.ts apps/web/src/app/api/pages/faq/route.ts apps/web/src/app/api/pages/pricing/route.ts apps/web/src/app/api/pages/profile/route.ts apps/web/src/app/api/pages/widget-examples/route.ts apps/web/src/app/server/actions.ts apps/web/src/redux-store/slices/calendar.ts apps/web/src/redux-store/slices/chat.ts apps/web/src/redux-store/slices/email.ts apps/web/src/redux-store/slices/kanban.ts
git add apps/web/package.json apps/web/next.config.ts   # index-blobbed staged blobs
git commit -m "feat(fake-db): extract demo-data modules into @galaxy/fake-db workspace package"
```
Verify `git show --stat HEAD`: adds `packages/fake-db/**`, deletes `apps/web/src/fake-db/**`, edits the 15 consumers + the 2 config files. No foreign path, no lockfile.

---

## Task 4 — README roadmap correction (docs, optional)

- [ ] Update `README.md` "Layout" + "Roadmap" so `@galaxy/types` and `@galaxy/fake-db` are listed as extracted, and the "types moves with `@core`" line reflects the dependency-inversion reality. Commit `README.md` only.

---

## Whole-branch review + fix round (SDD closeout)

After Tasks 1-4 commit: broad review over `BASE=dd23a8f..HEAD` scoped to this plan's diffs. Expected verification matrix:

| Gate (scoped) | Must be |
| --- | --- |
| `turbo typecheck --filter=web --filter=@galaxy/types --filter=@galaxy/fake-db` | EXIT 0 |
| `turbo build --filter=web` | EXIT 0, `.next` populated |
| `turbo lint --force --filter=web --filter=@galaxy/types --filter=@galaxy/fake-db` | 0 errors, 0 `.next` files flagged |
| `grep -rn "@/fake-db" apps/web/src` | 0 matches |
| `grep -rL "@galaxy/types" apps/web/src/types/pages/widgetTypes.ts` (shim present) | file references the package |
| `git status` after each commit | foreign paths still uncommitted & untouched |

Then one fix dispatch + one scoped re-review (the established final-loop pattern), and stop before push (push gated on owner approval — memory).

## Carry-forwards to surface at handoff

1. **`pnpm-lock.yaml`** now must record `@galaxy/types` + `@galaxy/fake-db` importers, but the file is foreign-dirty and was deliberately left uncommitted per the standing convention. Owner decision required: a consolidated lockfile refresh (ideally after foreign workstreams settle) before the branch is CI-reproducible.
2. **`@galaxy/types` runtime cost**: `apexcharts` + `@mui/material` are declared deps but used only for **types** (type-only imports, erased at build). If a future consumer imports `@galaxy/types` for non-type symbols, revisit whether these belong as `peerDependencies`.
3. **Shims are transitional**: the 13 `@/types` re-export files are a deliberate compatibility layer, not the final shape. A later hygiene pass may re-point the 109 consumers directly to `@galaxy/types` and drop the shims once the tree is clean of foreign churn.
