# Completion Report

**Status:** IN PROGRESS  
**Branch:** `feat-arsy-issues-12-31`  
**Scope:** GitHub issues #12–#31

## Completed in this branch
- [x] #12 — Credential actor resolution no longer imposes read scope globally; routes retain explicit per-operation scope checks. Read-only/write-only API regression coverage added.
- [x] #13 — Project-user role now maps to distinct data-plane scopes (admin, developer, member).
- [x] #21 — Record payload complexity budgets added and unit regression coverage added.
- [x] #25 — PostgreSQL pool min/max and acquire/idle/create timeouts configurable and validated.

## Verification evidence
- Repository instructions and previous Arsy API/account onboarding plans reviewed.
- Changes committed to the feature branch; automated tests/typecheck/build have not yet been run.
- Real PostgreSQL RLS, index, and migration verification remains outstanding.

## Remaining work
Issues #14–#20, #22–#24, and #26–#31 remain in progress. Do not close any issue until CI/runtime evidence is recorded.
