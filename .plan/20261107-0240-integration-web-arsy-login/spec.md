# Specification

## Requirements

- REQ-001: Web credential login must POST `{ email, password }` to Arsy `POST /api/v1/auth/login`.
- REQ-002: The successful Arsy response `{ account: { id, email, displayName }, accessToken, expiresAt }` must map to a NextAuth user with `id`, `email`, `name`, and Arsy token.
- REQ-003: NextAuth JWT/session must preserve the account identity and make the Arsy token available to authenticated server/client consumers.
- REQ-004: Invalid credentials must remain an authentication failure and show a safe, useful message.
- REQ-005: The Arsy API origin must be configured by `ARSY_API_URL`; no implicit demo endpoint or account fallback is allowed.

## API contract

- API-001 Request: `POST {ARSY_API_URL}/api/v1/auth/login`, JSON `{ email: string, password: string }`.
- API-002 Success: JSON `{ account: { id: string, email: string, displayName: string }, accessToken: string, expiresAt: string }`.
- API-003 Failure: non-2xx JSON problem/error response; web auth rejects it without exposing implementation details or secrets.

## Acceptance

With a mocked Arsy response, the provider returns the mapped user and stores `accessToken` in JWT/session. A mocked 401 rejects authentication with an invalid-credentials message. Missing `ARSY_API_URL` fails with a configuration-specific server error.
