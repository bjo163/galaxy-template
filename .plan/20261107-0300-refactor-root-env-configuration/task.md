# Tasks

- [x] [M] Configure root/app launch and migration to load the shared repository-root environment files; use a Windows-safe env loader for root `pnpm dev`. Acceptance: root startup no longer injects unsupported env-file flags into `NODE_OPTIONS` and starts Next successfully.
- [x] [S] Replace the app-local env example with root `.env.example` and create ignored root `.env.development`. Acceptance: all web/Arsy local variables are documented and template is ready to run.
- [x] [M] Use the root-configured Arsy URL across web authentication and registration. Acceptance: login and registration use `ARSY_API_URL`.
- [x] [S] Change `apps/web/src/app/api/login/route.ts` to proxy Arsy authentication rather than static fake users. Acceptance: the legacy API endpoint no longer authenticates mock-only users.
- [x] [S] Verify web typecheck and root startup behavior. Acceptance: typecheck passes; Next reports `Ready`; local env file is ignored by Git. Arsy health remains to be confirmed after full startup.
