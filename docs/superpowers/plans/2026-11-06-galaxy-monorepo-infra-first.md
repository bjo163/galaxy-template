# Galaxy monorepo infra-first Implementation Plan (historical)

> This plan is retained as a record of the original web-template extraction.
> Its Prisma and `@galaxy/db` roadmap is not the backend plan for Arsy. Track
> Arsy's current work and status in the
> [canonical GitHub issue register](https://github.com/bjo163/galaxy-template/issues/1).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `galaxy` from a single Next.js app in a cosmetic pnpm workspace into a real multi-app-ready monorepo by adding shared tooling packages and a hardened workspace, then extracting only the clearly-reusable leaf `@galaxy/utils`.

**Architecture:** Infra-first. Phase 0 adds `packages/*` to the workspace and creates three config packages (`@galaxy/tsconfig`, `@galaxy/eslint-config`, `@galaxy/prettier-config`), flips hoisted→isolated installs, wires Turborepo, and replaces Windows-fragile `rm -rf` scripts. Phase 1 extracts the two dependency-free helpers into a source-first `@galaxy/utils` (no build step, consumed via Next `transpilePackages`).

**Tech Stack:** pnpm@10 workspaces, Turborepo v2, Next.js 16.1.1, React 19, TypeScript 5.9, ESLint 8 (legacy `.eslintrc`), Prettier 3, Prisma 6, MUI 7.

**Spec:** `docs/superpowers/specs/2026-11-06-galaxy-monorepo-infra-first-design.md`

## Global Constraints

- Do **not** upgrade any dependency version (next/react/MUI/tailwind/etc. stay pinned as today). New **dev** tools (`turbo`, `rimraf`) may be added; no runtime dep bumps.
- Do **not** extract `types`, `@core`, `@menu`, `@layouts`, `configs`, or `libs`. Deferred to roadmap. Only `@galaxy/utils` (string + getInitials) moves this plan.
- Do **not** delete `fake-db`, `demo-configs`, `remove-translation-scripts`, or `src/hooks`. Out of scope (feature change).
- Preserve current runtime/visual behavior exactly. Every phase's definition of done: `pnpm install` green, `tsc --noEmit` green, `next build` green, `pnpm dev` smoke of `/en/dashboards/crm` unchanged, `lint` green.
- All commands run from the repo root (`Z:\project\galaxy`) unless the step says a package dir.
- This is Windows/Git-Bash: never add bare `rm -rf` to any new script; use `rimraf`.

---

## File Structure

**New files**
- `packages/config/tsconfig/package.json` — `@galaxy/tsconfig` (tsconfig bundle)
- `packages/config/tsconfig/base.json` — shared strict compilerOptions
- `packages/config/tsconfig/next.json` — extends base + Next.js presets
- `packages/config/tsconfig/library.json` — extends base for pure TS packages
- `packages/config/eslint/package.json` — `@galaxy/eslint-config`
- `packages/config/eslint/index.js` — centralized ESLint legacy config (minus resolver)
- `packages/config/prettier/package.json` — `@galaxy/prettier-config`
- `packages/config/prettier/index.js` — centralized Prettier options
- `packages/utils/package.json` — `@galaxy/utils` (source-first)
- `packages/utils/tsconfig.json` — extends `@galaxy/tsconfig/library.json`
- `packages/utils/src/string.ts` — moved from `apps/web/src/utils/string.ts`
- `packages/utils/src/getInitials.ts` — moved from `apps/web/src/utils/getInitials.ts`
- `packages/utils/src/index.ts` — re-export barrel
- `turbo.json` — task graph
- `README.md` — repo-root layout + patterns

**Modified files**
- `pnpm-workspace.yaml` — add `packages/*`
- `package.json` (root) — turbo scripts, `rimraf`, add `typecheck`, devDeps `turbo`
- `.npmrc` — hoisted→isolated (Phase 0.3)
- `apps/web/tsconfig.json` — `extends` shared config, keep `paths`
- `apps/web/.eslintrc.js` — thin wrapper extending `@galaxy/eslint-config` + local resolver
- `apps/web/.prettierrc.json` — replaced by `apps/web/.prettierrc.cjs` requiring shared config
- `apps/web/package.json` — add `@galaxy/*` workspace deps + `typecheck`/`rimraf` scripts
- `apps/web/next.config.ts` — add `transpilePackages`
- `apps/web/src/utils/i18n.ts:5` + 11 view/component files — re-point to `@galaxy/utils`

---

## Pre-step: Git baseline (GATED — needs explicit user approval)

> Skip entirely if the user has not approved `git init`. If git is not present, drop the "Commit" step from every task and use the task's verification command as the checkpoint instead.

- [ ] **Step 1: Confirm the user approved git init.** Stop if not approved.

- [ ] **Step 2: Init and commit the untouched baseline**

```bash
cd Z:/project/galaxy
git init
git add -A
git commit -m "chore: baseline before monorepo infra refactor"
```
Expected: one commit containing the current state. All later tasks are revertable to here.

---

## Task 1: Add `packages/*` to the workspace + `@galaxy/tsconfig`

**Files:**
- Modify: `pnpm-workspace.yaml`
- Create: `packages/config/tsconfig/package.json`
- Create: `packages/config/tsconfig/base.json`
- Create: `packages/config/tsconfig/next.json`
- Create: `packages/config/tsconfig/library.json`
- Modify: `apps/web/tsconfig.json`
- Modify: `apps/web/package.json` (add `@galaxy/tsconfig` devDependency)

**Interfaces:**
- Consumes: nothing (first code task).
- Produces: `@galaxy/tsconfig/base.json`, `@galaxy/tsconfig/next.json`, `@galaxy/tsconfig/library.json` — later tasks reference these by `extends`.

- [ ] **Step 1: Add `packages/*` to the workspace**

`pnpm-workspace.yaml` becomes:
```yaml
packages:
  - apps/*
  - packages/*
```

- [ ] **Step 2: Create `packages/config/tsconfig/package.json`**

```json
{
  "name": "@galaxy/tsconfig",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json", "next.json", "library.json"]
}
```

- [ ] **Step 3: Create `packages/config/tsconfig/base.json`**

Shared strict options extracted verbatim from the current app compilerOptions minus Next-only keys (`jsx`, `plugins`, `incremental`):
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowJs": true,
    "downlevelIteration": true,
    "noEmit": true
  }
}
```

- [ ] **Step 4: Create `packages/config/tsconfig/next.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

- [ ] **Step 5: Create `packages/config/tsconfig/library.json`**

For dependency-free TS packages; DOM dropped since helpers are pure:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "types": []
  }
}
```

- [ ] **Step 6: Replace `apps/web/tsconfig.json` compilerOptions with the shared extend**

Keep `paths`, `include`, `exclude` exactly as today; only the inlined compilerOptions collapse into `extends`. `paths` remain relative to `apps/web/` (TypeScript resolves child-config `paths` against the child file), so `./src/*` still maps correctly:
```json
{
  "extends": "@galaxy/tsconfig/next.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@core/*": ["./src/@core/*"],
      "@layouts/*": ["./src/@layouts/*"],
      "@menu/*": ["./src/@menu/*"],
      "@assets/*": ["./src/assets/*"],
      "@components/*": ["./src/components/*"],
      "@configs/*": ["./src/configs/*"],
      "@views/*": ["./src/views/*"]
    }
  },
  "include": [
    "next.config.ts",
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 7: Register the package as an app devDependency**

In `apps/web/package.json` add under `devDependencies`:
```json
"@galaxy/tsconfig": "workspace:*",
```

- [ ] **Step 8: Link the workspace and verify typecheck is unchanged**

Run: `pnpm install`
Then: `pnpm --filter web exec tsc --noEmit`
Expected: PASS — same 0 errors as before the change (extends resolves; paths still work).

- [ ] **Step 9: Verify the app still builds**

Run: `pnpm --filter web build`
Expected: PASS — production build succeeds; behavior unchanged.

- [ ] **Step 10: Commit**

```bash
git add pnpm-workspace.yaml packages/config/tsconfig apps/web/tsconfig.json apps/web/package.json
git commit -m "build: add packages/* to workspace and centralize tsconfig in @galaxy/tsconfig"
```

---

## Task 2: `@galaxy/prettier-config` and `@galaxy/eslint-config`

**Files:**
- Create: `packages/config/prettier/package.json`
- Create: `packages/config/prettier/index.js`
- Create: `packages/config/eslint/package.json`
- Create: `packages/config/eslint/index.js`
- Delete: `apps/web/.prettierrc.json`
- Create: `apps/web/.prettierrc.cjs`
- Modify: `apps/web/.eslintrc.js` (becomes a thin wrapper)
- Modify: `apps/web/package.json` (add `@galaxy/eslint-config`, `@galaxy/prettier-config` devDeps; remove now-moved eslint plugin devDeps)

**Interfaces:**
- Consumes: `@galaxy/tsconfig` (from Task 1) is unrelated; this task only touches lint/format.
- Produces: `@galaxy/prettier-config` (JS object), `@galaxy/eslint-config` (ESLint legacy config object **without** the import-resolver override). Apps that extend the eslint config MUST re-add the resolver pointing at their own `tsconfig.json`.

- [ ] **Step 1: Create `packages/config/prettier/package.json`**

```json
{
  "name": "@galaxy/prettier-config",
  "version": "0.0.0",
  "private": true,
  "main": "index.js"
}
```

- [ ] **Step 2: Create `packages/config/prettier/index.js`**

Exact options from the current `apps/web/.prettierrc.json`:
```js
module.exports = {
  arrowParens: 'avoid',
  bracketSpacing: true,
  htmlWhitespaceSensitivity: 'css',
  insertPragma: false,
  bracketSameLine: false,
  jsxSingleQuote: true,
  printWidth: 120,
  proseWrap: 'preserve',
  quoteProps: 'as-needed',
  requirePragma: false,
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none',
  useTabs: false
}
```

- [ ] **Step 3: Point the app at the shared prettier config**

Delete `apps/web/.prettierrc.json`. Create `apps/web/.prettierrc.cjs`:
```js
module.exports = require('@galaxy/prettier-config')
```
Add to `apps/web/package.json` `devDependencies`:
```json
"@galaxy/prettier-config": "workspace:*",
```

- [ ] **Step 4: Create `packages/config/eslint/package.json`**

The plugins the current config `extends`/`requires` become this package's own dependencies so resolution is correct in any install mode. `eslint` itself is a peer (provided by each consuming app):
```json
{
  "name": "@galaxy/eslint-config",
  "version": "0.0.0",
  "private": true,
  "main": "index.js",
  "peerDependencies": {
    "eslint": "8.57.1"
  },
  "dependencies": {
    "eslint-config-next": "15.1.2",
    "eslint-config-prettier": "9.1.0",
    "eslint-plugin-import": "2.31.0",
    "@typescript-eslint/eslint-plugin": "8.46.2",
    "@typescript-eslint/parser": "8.46.2",
    "eslint-import-resolver-typescript": "3.7.0"
  }
}
```

- [ ] **Step 5: Create `packages/config/eslint/index.js`**

Copy the current `apps/web/.eslintrc.js` body verbatim (extends, ignorePatterns, rules, settings, overrides), with ONE deliberate change: drop `settings['import/resolver']` entirely (it hardcodes `__dirname + '/tsconfig.json'`, which would wrongly point at the shared package). The resolver is re-added per-app in Step 6.
```js
module.exports = {
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'plugin:import/recommended', 'prettier'],
  ignorePatterns: ['next-env.d.ts', '.next/**', 'node_modules/**'],
  rules: {
    'jsx-a11y/alt-text': 'off',
    'react/display-name': 'off',
    'react/no-children-prop': 'off',
    '@next/next/no-img-element': 'off',
    '@next/next/no-page-custom-font': 'off',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    'import/no-named-as-default': 'off',
    'lines-around-comment': [
      'error',
      { beforeBlockComment: true, beforeLineComment: true, allowBlockStart: true, allowObjectStart: true, allowArrayStart: true }
    ],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'any', prev: 'export', next: 'export' },
      { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
      { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
      { blankLine: 'always', prev: '*', next: ['function', 'multiline-const', 'multiline-block-like'] },
      { blankLine: 'always', prev: ['function', 'multiline-const', 'multiline-block-like'], next: '*' }
    ],
    'newline-before-return': 'error',
    'import/newline-after-import': ['error', { count: 1 }],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', ['internal', 'parent', 'sibling', 'index'], ['object', 'unknown']],
        pathGroups: [
          { pattern: 'react', group: 'external', position: 'before' },
          { pattern: 'next/**', group: 'external', position: 'before' },
          { pattern: '~/**', group: 'external', position: 'before' },
          { pattern: '@/**', group: 'internal' }
        ],
        pathGroupsExcludedImportTypes: ['react', 'type'],
        'newlines-between': 'always-and-inside-groups'
      }
    ]
  },
  settings: {
    react: { version: 'detect' },
    'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] }
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', 'src/iconify-bundle/*'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ]
}
```

- [ ] **Step 6: Turn `apps/web/.eslintrc.js` into a thin wrapper**

It extends the shared config and re-adds the resolver pointing at the app's OWN tsconfig (the `__dirname` that now correctly resolves to `apps/web`):
```js
module.exports = {
  extends: ['@galaxy/eslint-config'],
  settings: {
    'import/resolver': {
      node: {},
      typescript: { project: __dirname + '/tsconfig.json' }
    }
  }
}
```

- [ ] **Step 7: Register deps in the app**

In `apps/web/package.json`:
- Add to `devDependencies`: `"@galaxy/eslint-config": "workspace:*"`.
- Remove the now-centralized plugin devDeps that the shared package owns: `eslint-config-next`, `eslint-config-prettier`, `eslint-plugin-import`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-import-resolver-typescript`.
- Keep in the app: `eslint`, `prettier`, `stylelint` and their plugins (stylelint is NOT part of this plan).

- [ ] **Step 8: Verify lint behaves exactly as before**

Run: `pnpm install`
Then: `pnpm --filter web lint`
Expected: PASS — same result as baseline. To prove the resolver still works, confirm zero new `import/*` resolution errors appear (they would if the resolver `project` path were wrong).

- [ ] **Step 9: Verify prettier picks up the shared config**

Run: `pnpm --filter web exec prettier --check src/utils/getInitials.ts`
Expected: PASS (file already conforms; config resolves through `.prettierrc.cjs` → `@galaxy/prettier-config`).

- [ ] **Step 10: Commit**

```bash
git add packages/config/eslint packages/config/prettier apps/web/.eslintrc.js apps/web/.prettierrc.cjs apps/web/package.json
git add -u apps/web/.prettierrc.json
git commit -m "build: centralize eslint and prettier config into @galaxy shared packages"
```

---

## Task 3: Flip hoisted → isolated install (highest-risk, gated)

**Files:**
- Modify: `.npmrc`

**Interfaces:**
- Consumes: Tasks 1 & 2 (packages now exist and must declare their own deps, which isolated mode enforces).
- Produces: honest module boundaries — a package can no longer resolve an undeclared dependency from the root.

- [ ] **Step 1: Make the install isolated**

Replace `.npmrc` (currently `auto-install-peers=true`, `shamefully-hoist=true`, `node-linker=hoisted`) with:
```
auto-install-peers=true
```
This drops hoisting to pnpm's isolated default. pnpm's built-in `public-hoist-pattern` already exposes `*eslint*` and `*prettier*` at the root, so tooling keeps resolving.

- [ ] **Step 2: Reinstall and run the full gate**

Run: `pnpm install`
Then run all four, each expecting PASS:
```bash
pnpm --filter web exec tsc --noEmit
pnpm --filter web build
pnpm --filter web lint
```
Then smoke: `pnpm --filter web dev` and load `http://localhost:3000/en/dashboards/crm` (stop the server after).
Expected (baseline): all green, unchanged behavior.

- [ ] **Step 3: Resolve breakage with the SMALLEST possible carve-out (only if Step 2 fails)**

If a build/lint step reports `Cannot find module` / `module not found`, add a narrowly-scoped public-hoist entry for exactly that package and re-run Step 2. Do not blanket re-hoist. Likely candidates if they surface: `@prisma/client`/`prisma` generated resolution.
Example (add ONLY the line that a real failure demands):
```
public-hoist-pattern[]=*prisma*
```
Repeat reinstall + the three checks until green. If no failure occurs, skip this step entirely.

- [ ] **Step 4: Confirm no regression from the flip**

Re-run the Step 2 four checks once more after any Step 3 change. All must be green together (no partial pass).

- [ ] **Step 5: Commit**

```bash
git add .npmrc
git commit -m "build: switch workspace to isolated install for honest package boundaries"
```

---

## Task 4: Turborepo task graph + Windows-safe scripts + root typecheck

**Files:**
- Create: `turbo.json`
- Modify: `package.json` (root) — scripts + `turbo`/`rimraf` devDeps
- Modify: `apps/web/package.json` — `clean`/`clear` via `rimraf`, add `typecheck`

**Interfaces:**
- Consumes: workspace `packages/*` (Tasks 1-3) — turbo discovers them via `pnpm-workspace.yaml`.
- Produces: root scripts `build` / `lint` / `typecheck` / `dev` that fan out over the workspace; per-package `typecheck` scripts.

- [ ] **Step 1: Add dev tools**

In root `package.json` `devDependencies`:
```json
"turbo": "^2.3.3",
"rimraf": "5.0.7"
```
(Keep the existing `pnpm.overrides` block, which already pins `rimraf` 5.0.7 — so `rimraf` versions stay consistent across the workspace.)

- [ ] **Step 2: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "lint": {},
    "lint:fix": { "cache": false },
    "typecheck": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true },
    "start": { "cache": false },
    "clean": { "cache": false }
  }
}
```

- [ ] **Step 3: Rewrite root scripts to route through turbo (Windows-safe, no `rm -rf`)**

Root `package.json` `scripts` become:
```json
{
  "dev": "turbo run dev",
  "build": "turbo run build",
  "start": "turbo run start",
  "lint": "turbo run lint",
  "lint:fix": "turbo run lint:fix",
  "typecheck": "turbo run typecheck",
  "format": "pnpm --filter web format",
  "build:icons": "pnpm --filter web build:icons",
  "migrate": "pnpm --filter web migrate",
  "removeI18n": "pnpm --filter web removeI18n",
  "clean": "turbo run clean",
  "clear": "rimraf -g **/node_modules **/.next node_modules"
}
```
Rationale: the four cross-package commands (`dev`/`build`/`lint`/`typecheck`) use turbo; single-app helpers stay `--filter web` wrappers (unchanged behavior). `clear` drops the old `pnpm -r exec rm -rf … && rm -rf …` for a `rimraf` one-liner that works on Windows.

- [ ] **Step 4: Make the app scripts turbo/rimraf-ready**

In `apps/web/package.json` `scripts`, change:
```json
"clean": "rimraf .next",
"clear": "rimraf node_modules .next",
"typecheck": "tsc --noEmit",
```
and add to `apps/web` `devDependencies`:
```json
"rimraf": "5.0.7"
```
(Leave all other web scripts untouched, including the pre-existing `postinstall`.)

- [ ] **Step 5: Verify the graph builds end-to-end**

Run: `pnpm install`
Then: `pnpm build`
Then force a clean run to prove caching isn't masking anything: `pnpm turbo build --force`
Expected: PASS both — turbo builds `web`, reports `Tasks: N successful`.

- [ ] **Step 6: Verify typecheck and lint fan out**

Run: `pnpm typecheck`
Then: `pnpm lint`
Expected: both green across the workspace (currently just `web`, plus any package that later adds a `typecheck` script — `@galaxy/utils` gains one in Task 5).

- [ ] **Step 7: Verify a clean `rimraf`-based clear works on Windows**

Run: `pnpm clean`
Expected: PASS — `.next` removed with no `rm: command not found` (the old script would fail on Windows).

- [ ] **Step 8: Commit**

```bash
git add turbo.json package.json apps/web/package.json
git commit -m "build: wire Turborepo task graph, root typecheck, and rimraf-based clean scripts"
```

---

## Task 5: Extract `@galaxy/utils` (Phase 1 — first real shared leaf)

**Files:**
- Create: `packages/utils/package.json`
- Create: `packages/utils/tsconfig.json`
- Create: `packages/utils/src/string.ts` (content moved from `apps/web/src/utils/string.ts`)
- Create: `packages/utils/src/getInitials.ts` (content moved from `apps/web/src/utils/getInitials.ts`)
- Create: `packages/utils/src/index.ts`
- Delete: `apps/web/src/utils/string.ts`
- Delete: `apps/web/src/utils/getInitials.ts`
- Modify: `apps/web/next.config.ts` (add `transpilePackages`)
- Modify: `apps/web/package.json` (add `@galaxy/utils` dependency)
- Modify: `apps/web/src/utils/i18n.ts:5`
- Modify (11 files, import line only):
  - `apps/web/src/components/layout/shared/NotificationsDropdown.tsx:41`
  - `apps/web/src/views/apps/chat/AvatarWithBadge.tsx:19`
  - `apps/web/src/views/apps/chat/ChatLog.tsx:21`
  - `apps/web/src/views/apps/chat/SidebarLeft.tsx:33`
  - `apps/web/src/views/apps/ecommerce/customers/list/CustomerListTable.tsx:50`
  - `apps/web/src/views/apps/ecommerce/orders/details/CustomerDetailsCard.tsx:18`
  - `apps/web/src/views/apps/ecommerce/orders/list/OrderListTable.tsx:49`
  - `apps/web/src/views/apps/invoice/list/InvoiceListTable.tsx:53`
  - `apps/web/src/views/apps/roles/RolesTable.tsx:52`
  - `apps/web/src/views/apps/user/list/UserListTable.tsx:55`
  - `apps/web/src/views/pages/account-settings/billing-plans/InvoiceListTable.tsx:53`

**Interfaces:**
- Consumes: `@galaxy/tsconfig/library.json` (Task 1); the `@galaxy/*` + turbo workspace (Tasks 1-4).
- Produces: package `@galaxy/utils` exporting named functions `ensurePrefix(str: string, prefix: string): string`, `withoutSuffix(str: string, suffix: string): string`, `withoutPrefix(str: string, prefix: string): string`, `getInitials(string: string): string`. Consumers import from `@galaxy/utils`.

- [ ] **Step 1: Create the package manifest (source-first, no build)**

`packages/utils/package.json`:
```json
{
  "name": "@galaxy/utils",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "clean": "rimraf .turbo"
  },
  "devDependencies": {
    "@galaxy/tsconfig": "workspace:*",
    "@galaxy/eslint-config": "workspace:*",
    "eslint": "8.57.1",
    "rimraf": "5.0.7",
    "typescript": "5.9.3"
  }
}
```

- [ ] **Step 2: Create `packages/utils/tsconfig.json`**

```json
{
  "extends": "@galaxy/tsconfig/library.json",
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Move `string.ts`**

Create `packages/utils/src/string.ts` with the exact current content:
```ts
export const ensurePrefix = (str: string, prefix: string) => (str.startsWith(prefix) ? str : `${prefix}${str}`)
export const withoutSuffix = (str: string, suffix: string) =>
  str.endsWith(suffix) ? str.slice(0, -suffix.length) : str
export const withoutPrefix = (str: string, prefix: string) => (str.startsWith(prefix) ? str.slice(prefix.length) : str)
```
Delete `apps/web/src/utils/string.ts`.

- [ ] **Step 4: Move `getInitials.ts`**

Create `packages/utils/src/getInitials.ts` with the exact current content:
```ts
// Returns initials from string
export const getInitials = (string: string) =>
  string.split(/\s/).reduce((response, word) => (response += word.slice(0, 1)), '')
```
Delete `apps/web/src/utils/getInitials.ts`.

- [ ] **Step 5: Create the barrel `packages/utils/src/index.ts`**

```ts
export * from './string'
export * from './getInitials'
```

- [ ] **Step 6: Let Next transpile the workspace package**

In `apps/web/next.config.ts`, add `transpilePackages` to the `nextConfig` object (keep `basePath` and `redirects` unchanged):
```ts
const nextConfig: NextConfig = {
  transpilePackages: ['@galaxy/utils'],
  basePath: process.env.BASEPATH,
  redirects: async () => {
    /* unchanged */
  }
}
```

- [ ] **Step 7: Register the package in the app**

In `apps/web/package.json` `dependencies`, add:
```json
"@galaxy/utils": "workspace:*",
```

- [ ] **Step 8: Re-point the 12 import sites**

In `apps/web/src/utils/i18n.ts`, change line 5:
```ts
// from:
import { ensurePrefix } from '@/utils/string'
// to:
import { ensurePrefix } from '@galaxy/utils'
```
In each of the 11 files listed under **Files**, change:
```ts
// from:
import { getInitials } from '@/utils/getInitials'
// to:
import { getInitials } from '@galaxy/utils'
```
Use the exact current line numbers above. No other line in those files changes.

- [ ] **Step 9: Verify nothing still references the deleted alias**

Run: `pnpm install`
Then: `pnpm --filter web exec tsc --noEmit`
Expected: PASS. Then prove the old paths are gone — run
`rg "@/utils/(string|getInitials)" apps/web/src`
Expected: **0 matches** (all re-pointed).

- [ ] **Step 10: Verify workspace typecheck + build**

Run: `pnpm typecheck` (turbo now also runs `@galaxy/utils`'s own `tsc --noEmit`)
Then: `pnpm build`
Expected: both PASS — `@galaxy/utils` typechecks standalone AND the app builds consuming it.

- [ ] **Step 11: Smoke the extracted behavior in the running app**

Run: `pnpm --filter web dev` and load `/en/dashboards/crm`, then one avatar-heavy route (e.g. `/en/apps/chat` and `/en/apps/ecommerce/orders/list`).
Expected: initials in avatars render exactly as before the move (confirms `getInitials` works through the package). Stop the server after.

- [ ] **Step 12: Commit**

```bash
git add packages/utils apps/web/next.config.ts apps/web/package.json apps/web/src/utils/i18n.ts
git rm apps/web/src/utils/string.ts apps/web/src/utils/getInitials.ts
git add apps/web/src/components/layout/shared/NotificationsDropdown.tsx apps/web/src/views
git commit -m "feat(web): extract pure string/getInitials helpers into @galaxy/utils workspace package"
```

---

## Task 6: Root README — layout + patterns

**Files:**
- Create: `README.md` (repo root)

**Interfaces:**
- Consumes: final workspace shape from Tasks 1-5.
- Produces: documentation only. No code, no behavior change. This is the "boilerplate" artifact — it tells a future contributor how to add a package/app.

- [ ] **Step 1: Create `README.md`**

```markdown
# galaxy

A pnpm + Turborepo monorepo. Today it ships one app (`@galaxy`'s web dashboard) and a set of
shared workspace packages. The layout is intentionally multi-app-ready: add a second
`apps/*` or `packages/*` and it is picked up automatically.

## Layout

\`\`\`
galaxy/
  apps/
    web/            # Next.js 16 admin app (MUI 7 + Tailwind 4 + Prisma + next-auth)
  packages/
    utils/          # @galaxy/utils   pure, source-first helpers
    config/
      tsconfig/     # @galaxy/tsconfig       base + next + library presets
      eslint/       # @galaxy/eslint-config  shared ESLint (legacy .eslintrc)
      prettier/     # @galaxy/prettier-config shared Prettier options
  turbo.json        # task graph: build / lint / typecheck / dev / start / clean
  pnpm-workspace.yaml
\`\`\`

## Getting started

\`\`\`bash
pnpm install
pnpm dev          # turbo fans out; starts apps/web
\`\`\`

## Commands (repo root)

| Command | Runs |
| --- | --- |
| `pnpm build` | `turbo run build` |
| `pnpm typecheck` | `turbo run typecheck` |
| `pnpm lint` / `pnpm lint:fix` | `turbo run lint` |
| `pnpm dev` | `turbo run dev` |
| `pnpm clean` | `turbo run clean` (rimraf-based, Windows-safe) |
| `pnpm format` | prettier on apps/web |

## How this workspace is wired

- **Isolated installs** (`.npmrc`): each package must declare its own dependencies —
  boundaries are real, nothing leaks through hoisting.
- **Shared tooling**: extend `@galaxy/tsconfig`, `@galaxy/eslint-config`,
  `@galaxy/prettier-config` instead of hand-rolling config.
  Note: `@galaxy/eslint-config` deliberately omits the `import/resolver` `project` path;
  each app re-adds it pointing at its own `tsconfig.json` (see `apps/web/.eslintrc.js`).
- **Source-first leaf packages** (e.g. `@galaxy/utils`): consumed directly as TypeScript
  via Next `transpilePackages`, no build step. Add a build only when a package must ship
  to a non-Next consumer.

## Adding a shared package

1. Create `packages/<name>/package.json` with `"name": "@galaxy/<name>"` and `"private": true`.
2. Add a `tsconfig.json` that `extends` `@galaxy/tsconfig/library.json` (or `next.json`).
3. Declare every dependency the package imports — isolated mode will not hoist it for you.
4. In a consumer, add `"@galaxy/<name>": "workspace:*"` and (if pure/TS) list it in the
   consumer's Next `transpilePackages`.

## Roadmap (not yet extracted)

`@core`, `@layouts`, `@menu`, `components`, and `types` still live in `apps/web`.
They are planned as a design-system phase (`@galaxy/core` + `@galaxy/ui`) once a second
app actually consumes them; `types` moves with `@core`, not before it. `@galaxy/db` /
`@galaxy/auth` come when a non-web backend app exists. See
`docs/superpowers/specs/2026-11-06-galaxy-monorepo-infra-first-design.md`.
```

- [ ] **Step 2: Sanity check the fenced inner code blocks**

Run: `rg -n '```' README.md`
Expected: an even count of triple-backtick fences (the outer markdown block nests two fenced
code samples — make sure they render as written, not as one broken block). If the nesting is
ambiguous, switch the inner fences to indented code or four-backtick fences.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add root README describing monorepo layout and package patterns"
```

---

## Self-Review (author ran against spec)

**1. Spec coverage**
- Workspace `packages/*` → Task 1. `@galaxy/tsconfig` → Task 1. `@galaxy/eslint-config` → Task 2. `@galaxy/prettier-config` → Task 2. hoisted→isolated + carve-out gate → Task 3. Turborepo minimal → Task 4. `rm -rf`→rimraf → Task 4 (root `clear`, app `clean`/`clear`). root `typecheck` → Task 4. README → Task 6. `@galaxy/utils` (string+getInitials only, source-first, transpilePackages, import sites) → Task 5. All covered.
- Spec "do NOT extract types/@core/configs" and "no version upgrades" → enforced in Global Constraints; no task touches them.
- Spec deferred `@galaxy/utils` lint — resolved by scoping the package lint to its own `.eslintrc.cjs` (Task 5 Step 1), keeping turbo `lint` green.

**2. Placeholder scan** — no TBD/TODO; every code step has literal content; the 12 import sites are enumerated with exact paths+line numbers from the grep.

**3. Type consistency** — exported symbols `ensurePrefix`/`withoutSuffix`/`withoutPrefix`/`getInitials` match `string.ts`/`getInitials.ts` and are consumed with the same names in Step 8. `@galaxy/utils` name is used identically in the package `exports`, app `dependencies`, and `transpilePackages`.

**4. Scope check** — one coherent subsystem (infra + one leaf). Kept as a single plan; `@galaxy/types`/design-system explicitly excluded.

---

## Handoff

Execution order is strictly linear: Pre-step (git, optional) → 1 → 2 → 3 → 4 → 5 → 6. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, two-stage review between tasks.
2. **Inline Execution** — run tasks in this session via executing-plans with checkpoints.
