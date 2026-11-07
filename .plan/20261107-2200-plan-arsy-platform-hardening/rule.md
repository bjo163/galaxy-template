# Hard Rules
1. Work only on `feat-arsy-issues-12-31`; do not push to `main`.
2. Preserve Fastify 5, PostgreSQL, Knex/Objection, and monorepo package boundaries.
3. Never weaken RLS, least privilege, auth, validation, error redaction, or CI to pass checks.
4. Do not claim PostgreSQL behavior based only on PGlite tests.
5. Never interpolate user-controlled SQL identifiers; derive identifiers from validated model metadata.
6. Keep concurrent PostgreSQL index DDL outside transactions when required; make jobs idempotent.
7. Keep audit history append-only to application actors; redact secrets and avoid raw payload snapshots.
8. Use opaque, bounded cursors bound to project/model/filter/sort context.
9. Keep metrics labels bounded; never use raw tenant IDs, emails, tokens, record IDs, or user input.
10. Keep production secrets out of source, logs, tests, and artifacts.
11. Add regression tests for security and correctness changes.
12. Avoid unrelated refactors and dependencies not justified by this plan.
13. Do not close issues until acceptance criteria have direct implementation and test evidence.
