# Tasks

- [x] [M] Add a server-side registration API route at `apps/web/src/app/api/register/route.ts` that validates registration input, calls Arsy `POST /api/v1/auth/register`, and safely forwards status/errors. Acceptance: browser requests stay same-origin and Arsy secrets/tokens are not logged.
- [x] [L] Replace the mock form in `apps/web/src/views/Register.tsx` with a validated interactive registration form that creates an Arsy account, signs in through NextAuth, and redirects to the dashboard. Acceptance: name/email/password are required, password minimum is 12 characters, loading/errors are visible, and successful registration establishes a web session.
- [x] [S] Update login/register copy and link behavior in `apps/web/src/views/Login.tsx` and `apps/web/src/views/Register.tsx` for Arsy account onboarding. Acceptance: users are told registration creates an Arsy account and can navigate between forms.
- [x] [S] Verify web typecheck and inspect the final diff. Acceptance: typecheck passes and only onboarding-related files are changed.
