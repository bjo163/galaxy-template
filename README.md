# galaxy

A pnpm + Turborepo monorepo. Today it ships one app (`@galaxy`'s web dashboard) and a set of
shared workspace packages. The layout is intentionally multi-app-ready: add a second
`apps/*` or `packages/*` and it is picked up automatically.

## Layout

```
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
```

## Getting started

```bash
pnpm install
pnpm dev          # turbo fans out; starts apps/web
```

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
