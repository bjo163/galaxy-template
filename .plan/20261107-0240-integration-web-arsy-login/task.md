# Tasks

- [x] [M] Update `apps/web/src/libs/auth.ts` to authenticate credentials against the Arsy API `POST /api/v1/auth/login`, map the returned account to the NextAuth user shape, retain the Arsy access token in the JWT, and expose it through the session. Accept an `ARSY_API_URL` base URL and return readable auth errors. Acceptance: credentials are posted to the Arsy login route and the successful NextAuth session contains account identity and Arsy token.
- [x] [S] Update `apps/web/.env.example` with the Arsy API base URL and correct local NextAuth URL guidance. Acceptance: example config documents `ARSY_API_URL` as the Arsy origin, without credentials.
- [ ] [M] Add or update focused auth tests for successful mapping and rejected credentials, using the repository's existing web test conventions if present. Acceptance: tests verify endpoint, response mapping and 401 handling without a live Arsy service.
- [x] [S] Verify the web typecheck and focused tests. Acceptance: checks complete successfully or report any pre-existing blockers in `report.md`.
