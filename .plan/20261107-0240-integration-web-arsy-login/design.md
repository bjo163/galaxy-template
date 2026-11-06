# Design

## Context

The web app uses NextAuth credentials in `apps/web/src/libs/auth.ts`. Arsy owns account registration and sessions at `/api/v1/auth/login`; its origin may differ from the web origin.

## Decision

Configure a server-only `ARSY_API_URL` origin, append `/api/v1/auth/login`, map Arsy `account` to the NextAuth user contract, and retain `accessToken` in the encrypted NextAuth JWT and session. Keep the existing UI and credential form unchanged.

## Boundaries and trade-offs

No cross-origin browser request is introduced; NextAuth server code calls Arsy. This provides a web session while the Arsy bearer token remains available for future authenticated API calls. Token refresh is not part of Arsy's current login contract.

## Open questions

Local Arsy host/port is determined by its `HOST` and `PORT` configuration; the example will use the documented local default unless repository config says otherwise.
