# galaxy

A pnpm + Turborepo workspace containing the Galaxy web app, Arsy Fastify API,
and shared packages. Arsy is the self-hostable BaaS with tenant-scoped projects,
user-defined models, and declarative add-ons. PostgreSQL 17 and 18 are the
supported server majors and are exercised by the dedicated RLS CI matrix.
Current capabilities and production acceptance gaps are tracked separately.

## Layout

```
galaxy/
  apps/
    web/            # Next.js dashboard, independent of Arsy
    arsy/           # Fastify API and BaaS
  packages/
    utils/          # @galaxy/utils   pure, source-first helpers
    database/       # @galaxy/database: Knex, Objection, PGlite/PostgreSQL
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
Copy-Item .env.example .env.development   # PowerShell; creates ignored root dev config
pnpm dev          # starts the workspace development apps, including Arsy
```

Both apps load environment settings from the repository root. `pnpm dev` starts
a local PostgreSQL container, applies Arsy migrations, then starts the API and
web app. `.env.development` is ignored by Git and contains localhost-only
defaults; put private overrides in root `.env`. Create an Arsy account from the
web app's `/register` page.

## Commands (repo root)

| Command                       | Runs                                           |
| ----------------------------- | ---------------------------------------------- |
| `pnpm build`                  | `turbo run build`                              |
| `pnpm typecheck`              | `turbo run typecheck`                          |
| `pnpm lint` / `pnpm lint:fix` | `turbo run lint`                               |
| `pnpm dev`                    | Starts local PostgreSQL, migrates Arsy, then runs Turbo |
| `pnpm clean`                  | `turbo run clean` (rimraf-based, Windows-safe) |
| `pnpm format`                 | prettier on apps/web                           |

## How this workspace is wired

- **Isolated installs** (`.npmrc`): each package must declare its own
  dependencies. Boundaries are real, nothing leaks through hoisting.
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
3. Declare every dependency the package imports. Isolated mode will not hoist it for you.
4. In a consumer, add `"@galaxy/<name>": "workspace:*"` and (if pure/TS) list it in the
   consumer's Next `transpilePackages`.

## Arsy architecture goal

`@galaxy/database` is the static, code-first persistence layer for platform
tables. It is not the runtime model engine. The Arsy target uses a separate
metadata-driven model catalog and record API, with project isolation and
declarative add-ons. Arsy serves its own management console through Fastify-Vite
and uses its documented API. The console does not depend on `apps/web`.
Other dashboard pages still include template and demo-data functionality.

Track Arsy's remaining work, status, dependencies, and completion evidence in
the [canonical GitHub issue register](https://github.com/bjo163/galaxy-template/issues/1).

The historical infra-first extraction plan remains available at
`docs/superpowers/specs/2026-11-06-galaxy-monorepo-infra-first-design.md`. Its
old `@galaxy/db` / Prisma backend roadmap is superseded for Arsy.
