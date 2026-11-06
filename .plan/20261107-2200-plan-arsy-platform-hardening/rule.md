# Hard Rules

1. Do not push changes directly to `main`; work only on `feat-arsy-issues-12-31` and submit a reviewable pull request.
2. Preserve Arsy's existing stack: Fastify 5, PostgreSQL, Knex/Objection, and the current monorepo package boundaries.
3. Do not add a new dependency unless a concrete requirement cannot be met with existing packages and the dependency is documented in this plan.
4. Never weaken PostgreSQL RLS, runtime least privilege, session security, input validation, rate limits, or error redaction to make tests pass.
5. Do not claim PostgreSQL behavior based only on PGlite tests; use the real PostgreSQL workflow for RLS, DDL, query plans, and migration claims.
6. Do not execute dynamic SQL identifiers from user input. Derive and validate identifiers from trusted model metadata and quote them safely.
7. Keep index DDL outside transactions when PostgreSQL concurrent index operations require it; make jobs idempotent and observable.
8. Keep audit records append-only to application actors; redact secrets and avoid storing unrestricted payload copies.
9. Use opaque, bounded pagination cursors. Bind cursors to authenticated project, model, filter, and sort context.
10. Keep metrics labels bounded; never label metrics with raw tenant IDs, emails, tokens, record IDs, or arbitrary user values.
11. Keep production secrets out of source, logs, tests, and artifacts. Development defaults must be clearly local-only.
12. Preserve API compatibility where possible; version any intentional breaking contract and document migration behavior.
13. Add regression tests for every security and correctness fix. Do not disable lint, typecheck, CI, or existing tests.
14. Avoid drive-by refactors. Change only files needed for issues #12–#31 and this execution artifact.
15. Do not close an issue until its acceptance criteria have direct implementation and test evidence.
