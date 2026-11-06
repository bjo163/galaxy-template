# Tasks

- [x] [M] Remove Arsy console startup from `apps/arsy/src/server.ts` and delete `apps/arsy/src/frontend/register-console.ts`, its test, and `apps/arsy/console/**`. Acceptance: API starts directly and Arsy serves no console UI at `/`.
- [x] [S] Remove Vite console configuration from `apps/arsy/package.json`, `apps/arsy/vite.config.ts`, and `apps/arsy/tsconfig.console.json`. Acceptance: Arsy build/typecheck scripts cover only the API and no Vite dependency remains in the Arsy package.
- [x] [M] Add `docker-compose.dev.yml` and update root `package.json`, `.env.example`, and `.env.development` to start local PostgreSQL, wait for readiness, apply Arsy migrations, then start dev apps. Acceptance: root `pnpm dev` uses PostgreSQL and local database credentials are documented for localhost only.
- [x] [S] Remove stale app-local environment files and keep the single root env source. Acceptance: `apps/web/.env` and `apps/arsy/.env.example` are absent; root env loader supplies runtime configuration.
- [x] [S] Update `README.md` and `apps/arsy/README.md` for API-only Arsy and PostgreSQL local setup. Acceptance: instructions match commands and URLs.
- [x] [S] Verify TypeScript build and API startup/health when available. Acceptance: checks pass or external database/runtime blockers are recorded.
