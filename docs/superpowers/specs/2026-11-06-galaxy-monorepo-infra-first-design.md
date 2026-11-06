# Galaxy monorepo — infra-first extraction

- **Date:** 2026-11-06
- **Status:** Approved design, pending spec review
- **Path taken:** Architectural (brainstorming → this spec → writing-plans)
- **Chosen approach:** A — infra-first, extract only clearly-reusable leaves

## 1. Goal & end-state

Turn `galaxy` from a single Next.js app wrapped in a cosmetic pnpm workspace into a
**real multi-app-ready pnpm monorepo**, by extracting only code that is genuinely
reusable and low-risk, done gradually. The repo must end up structurally ready for a
second app **without creating speculative packages** that no second consumer uses yet.

"Boilerplate" here means: clean, documented repo structure + centralized tooling, so a
new app can be added by following an existing pattern. It does **not** mean republishing
the commercial template (see §8 licensing).

## 2. Current state (verified)

- Root `package.json`: name `galaxy-monorepo` v5.0.1, `license: Commercial`, `private`,
  `packageManager: pnpm@10.0.0`. All scripts are thin `pnpm --filter web …` wrappers.
  `pnpm.overrides` pin react/react-dom 19.2.3, eslint 8.57.1, eslint-config-next 15.1.2.
- `pnpm-workspace.yaml`: `packages: [apps/*]` — **only one package exists** (`apps/web`).
  No `packages/*`, no shared package, no real module boundary.
- `.npmrc`: `auto-install-peers=true`, `shamefully-hoist=true`, `node-linker=hoisted`.
  Hoisting makes package boundaries leaky (a package can import an undeclared dep).
- `apps/web`: the **Layers** Next.js admin template v5.0.1. Stack: next 16.1.1,
  react 19.2.3, @mui/material 7.3.6 (+ emotion), tailwindcss 4.1.17, next-auth 4.24.13,
  @prisma/client 6.19.1 / prisma 6.19.0 (schema at `./src/prisma/schema.prisma`),
  typescript 5.9.3, eslint 8.57.1 (`.eslintrc.js`). All app code lives under `src/`.
- `apps/web/tsconfig.json`: paths `@/*, @core/*, @layouts/*, @menu/*, @assets/*,
  @components/*, @configs/*, @views/*` (Layers convention). `moduleResolution: Bundler`,
  `noEmit`, `strict`.
- `apps/web/next.config.ts`: `basePath`, i18n redirects, **no `transpilePackages`** yet.
- Largest `src` dirs by size: `views` 2.6M, `components` 463K, `@core` 392K,
  `fake-db` 324K, `app` 311K, `@menu` 238K.
- **Not a git repository.** No test runner present.

## 3. Purity findings that shaped the scope

The two "obvious leaf" candidates are **not** clean leaves:

- `src/utils/`: only `string.ts` and `getInitials.ts` are pure. `i18n.ts` imports the
  runtime `i18n` from `@configs/i18n` and `ensurePrefix` from `@/utils/string`;
  `getDictionary.ts` imports `Locale` from `@configs/i18n`. `@configs` is app-owned and
  is **not** extracted, so the `utils` folder as a whole would point back into the app.
- `src/types/`: every file is dependency-entangled via `import type` from
  `@core/types`, `@core/components/mui/Avatar`, `@menu/*`, `@mui/material/Chip`,
  `@reduxjs/toolkit`, `@fullcalendar/core`, `apexcharts`. A standalone `@galaxy/types`
  would need peer types that live in app-internal `@core`/`@menu`.

**Consequence:** `@galaxy/types` is deferred to the design-system phase (it must move
*together with* `@core`, not before it). `@galaxy/utils` is scoped down to only the two
pure files.

## 4. Target layout

```
galaxy/
  pnpm-workspace.yaml        # apps/*  +  packages/*
  turbo.json                 # minimal task graph (build, lint, typecheck, dev)
  .npmrc                     # isolated install (+ targeted public-hoist carve-outs)
  package.json               # root scripts via turbo / pnpm -r
  README.md                  # repo layout + how to add a package/app
  apps/
    web/                     # the Next.js app (only consumer this scope)
  packages/
    utils/                   # @galaxy/utils   (pure: string, getInitials)
    config/
      tsconfig/              # @galaxy/tsconfig       (base + next + library presets)
      eslint/                # @galaxy/eslint-config
      prettier/              # @galaxy/prettier-config
  # deferred (roadmap §7): core/ ui/ types/ db/ auth/ configs/
```

## 5. Committed scope

### Phase 0 — infra (makes the repo multi-app-ready)
1. Add `packages/*` to `pnpm-workspace.yaml`.
2. Create the three tooling packages — these are the **first real packages** and prove
   the whole workspace mechanic (declared deps, `exports`, tsconfig `extends`, turbo
   task graph) **without touching tangled app code**:
   - `@galaxy/tsconfig`: `base.json` (strict, `moduleResolution: Bundler`, shared
     options extracted from the current app tsconfig) + a `next` preset + a `library`
     preset. App and packages `extends` these instead of hand-rolling config.
   - `@galaxy/eslint-config` and `@galaxy/prettier-config`: centralize current rules;
     behavior preserved, not rewritten.
3. **Hoisting → isolated (single gated step).** Switch `.npmrc` off
   `shamefully-hoist`/`node-linker=hoisted` toward isolated install so boundaries are
   honest. Re-add `public-hoist-pattern` entries **only** for tools that need root
   resolution (expected: eslint plugins, `prisma`, `@next/*`, react/react-dom).
   Acceptance gate: full `pnpm install` + `next build` + `turbo typecheck` green.
4. Add minimal Turborepo (`turbo.json` + `devDependency`) with tasks
   `build`, `lint`, `typecheck`, `dev`; wire root scripts to `turbo`.
5. Concrete safe fixes: replace root/app `clear`/`clean` `rm -rf` scripts with `rimraf`
   (Windows-safe); add a root `typecheck` script.
6. Write root `README.md` documenting layout and the add-a-package/add-an-app pattern.

### Phase 1 — first genuine shared leaf
7. Extract `@galaxy/utils` containing **only** `string.ts` and `getInitials.ts`.
   - `package.json` with `exports: { ".": "./src/index.ts" }` (source-first, **no build
     step**), `name: "@galaxy/utils"`.
   - Add `@galaxy/utils` to `apps/web` `next.config.ts` `transpilePackages`.
   - Update the (few) import sites to `@galaxy/utils`. For this tiny slice, direct
     package imports are cleaner than alias re-pointing; the re-point-alias principle is
     reserved for the large future design-system extraction.
   - `i18n.ts` and `getDictionary.ts` stay in `apps/web` (they depend on `@configs`).

## 6. Non-goals for this scope

- No dependency version upgrades (next/react/MUI/etc. stay pinned as today).
- No auth, Prisma/db, `@configs`, or i18n extraction.
- No UI/behavior change; no deletion of `fake-db` / `demo-configs` /
  `remove-translation-scripts` (see open items §9).
- No new runtime features.
- No `@galaxy/types`/`@core`/`@menu` extraction (deferred — §3/§7).

## 7. Roadmap (documented, NOT approved scope)

- **Phase 3 — design-system:** extract `@galaxy/core` + `@galaxy/ui` (from `@core`,
  `@layouts`, `@menu`, `components`, `libs`) as one unit, **bringing `types` with them**
  because `types` depends on `@core`/`@menu` peer types. This phase likely needs real
  package builds (tsup) and careful MUI/React peer-dep wiring. Justified only when a
  second consumer is real.
- **Phase 4 — shared backend:** `@galaxy/db` (Prisma schema/client) + `@galaxy/auth`
  when a non-web app (API/worker) actually exists; next-auth is web-coupled today.

## 8. Licensing caution

Template `license` is `Commercial`. This plan keeps the code **private/internal** and
does not publish or redistribute the template as a boilerplate. If "boilerplate" later
means *sharing externally*, the template's license must be reviewed first — flagged, not
assumed.

## 9. Open items (decide separately, later)

- **Demo-scrub pass:** removing `fake-db`, `demo-configs`, `remove-translation-scripts`,
  and `src/hooks` (only a single `useIntersection.ts`) — a feature/behavior change
  needing its own approval.
- **Test harness (Vitest):** currently none; this spec relies on typecheck + build +
  smoke as the safety net. Adding real tests is a separate decision.
- **Git:** repo is not version-controlled. **Recommended pre-step:** `git init` + baseline
  commit before Phase 0, so each phase is independently revertable. Needs approval.

## 10. Definition of Done (per phase)

- Phase 0: `pnpm install` green (isolated); `pnpm turbo build` (apps/web) green;
  `pnpm typecheck` green across workspace; `pnpm dev` smoke renders a key route
  (e.g. `/en/dashboards/crm`); no runtime/visual behavior change; tooling packages
  consumed by app via `extends`/`import`.
- Phase 1: app still passes install + `turbo build` + `typecheck`; `string`/`getInitials`
  imported from `@galaxy/utils`; no import of the two pure helpers left from `@/utils`
  in app; dev smoke unchanged.

## 11. Risks & mitigations

- **Isolated install breaks Next/eslint/prisma resolution** (biggest risk). Mitigate: do
  it as one gated step, verify `next build`, add minimal `public-hoist-pattern`, never a
  blanket re-hoist.
- **Turborepo stale-cache masking breakage.** Mitigate: verify one clean
  `pnpm turbo build --force` at the end of Phase 0.
- **Peer-type breakage if utils ever pulls typed deps.** Mitigate: keep `@galaxy/utils`
  runtime-pure; if a helper needs app types, it stays in the app.
