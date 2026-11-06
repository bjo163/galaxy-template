# Design

## Context

Arsy already implements `POST /api/v1/auth/register`, enforces password length >= 12, creates an active account, and returns a bearer session. The web `/register` form is currently a nonfunctional template.

## Decision

Add a same-origin Next.js registration route that calls Arsy with server-only `ARSY_API_URL`. Strip the Arsy access token from the proxy response. After successful registration, call the existing NextAuth credentials provider to establish the web session.

## Boundaries

The browser does not contact Arsy directly. Account/session creation remains owned by Arsy; NextAuth owns the web session. The returned Arsy registration token is not needed because credentials sign-in immediately creates a separate Arsy session.

## Trade-offs and risks

Registration and subsequent sign-in are two requests; if the second fails, the account still exists and can sign in on the login page. No automatic workspace/project provisioning is part of this onboarding slice.
