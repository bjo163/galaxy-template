# Specification

## Requirements

- REQ-001: `/register` must create an account through Arsy `POST /api/v1/auth/register`.
- REQ-002: The form collects display name, email, and password; it validates a valid email and password length >= 12 before sending.
- REQ-003: A same-origin Next.js API route proxies the registration request to configured `ARSY_API_URL`.
- REQ-004: On successful creation, the user is signed in with NextAuth credentials and redirected to the localized dashboard.
- REQ-005: Duplicate email, validation, service unavailable, and configuration errors are shown in a readable form.

## API contracts

- API-001 Browser request: `POST /api/register`, JSON `{ displayName, email, password }`.
- API-002 Arsy request: `POST {ARSY_API_URL}/api/v1/auth/register`, same JSON shape.
- API-003 Arsy success: HTTP 201 with account and access token; browser route returns only non-secret account identity and status, never the token.

## Acceptance criteria

New user can register, then NextAuth login establishes a web session. Duplicate email and invalid input produce actionable messages. Missing Arsy configuration and unavailable Arsy are handled without exposing internals.
