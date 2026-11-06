# Rules

1. Keep Arsy account passwords and access tokens out of logs and client-visible error messages.
2. Send login requests only to the explicitly configured `ARSY_API_URL`; do not silently fall back to mock demo users.
3. Preserve the existing NextAuth credentials flow and JWT session strategy.
4. Do not change Arsy authentication rules or weaken account password requirements.
5. Do not add dependencies or alter unrelated UI behavior.
6. Use repository-relative paths in this plan and report.
