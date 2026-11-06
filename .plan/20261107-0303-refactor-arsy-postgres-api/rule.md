# Rules

1. Keep Arsy account registration and login owned by the Arsy API; web remains the onboarding UI.
2. Do not delete or rewrite the existing PGlite data directory; preserve it as-is.
3. Use Docker PostgreSQL defaults only for local development; do not reuse them in production.
4. Keep application secrets and real database credentials out of tracked files.
5. Do not remove API routes or unrelated UI from `apps/web`.
6. Use repo-relative paths in this artifact.
