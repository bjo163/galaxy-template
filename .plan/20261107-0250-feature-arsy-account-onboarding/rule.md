# Rules

1. Keep passwords and access tokens out of logs and user-visible diagnostics.
2. Call Arsy from a same-origin Next.js route using server-only `ARSY_API_URL`.
3. Enforce the Arsy contract: display name, valid email, and password of at least 12 characters.
4. Do not create implicit demo accounts or weaken Arsy registration validation.
5. Preserve existing styling conventions and avoid unrelated auth changes.
6. Use repo-relative paths in this artifact.
