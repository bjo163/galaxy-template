# AGENTS.md — project-level instructions for AI agents

This file is read by every AI agent (and human contributor) that works on this repository. It defines the non-negotiable conventions for planning and review outputs.

---

## 1. Plan & review output folder contract

Every `ultra-planner` plan and every `ultra-review` review **must** be written to a dedicated folder under `.plan/` at the repository root. Chat replies are not sufficient — the output must be a folder of artifacts that a smaller AI agent can pick up cold and execute.

### Folder naming

```
.plan/<YYYYMMDD-HHmm>-<scope>-<kebab-name>/
```

- `<YYYYMMDD-HHmm>` — local timestamp when the artifact is created (24h clock, no seconds).
- `<scope>` — `plan`, `blueprint`, `feature`, `refactor`, `migration`, `integration`, `remediation`, `greenfield`, `spec` for planner outputs; **`review`** for review outputs.
- `<kebab-name>` — kebab-case short name, 3–6 words, lowercase ASCII.

Examples:
- `.plan/20261107-1430-plan-postgres-rls-enforcement/`
- `.plan/20261107-1500-review-billing-package-security/`

If the folder already exists, append `-2`, `-3`, … — never overwrite.

### Required files

Every `.plan/` folder must contain these five files:

| File | Purpose |
|------|---------|
| `task.md` | **Executable checklist.** `- [ ]` items, each atomic (≤ 3 files), imperative, with exact file paths, step-by-step instructions, acceptance criteria, dependencies, size tag (`S`/`M`/`L`/`XL`). **A small AI must be able to execute a task by reading only this file.** |
| `rule.md` | Hard rules the implementer must obey (security, compatibility, quality, forbidden actions). Numbered, imperative. |
| `spec.md` | Technical specification: requirements (FR/NFR), data contracts, API contracts, state transitions, error scenarios, acceptance criteria. Stable IDs (`REQ-xxx`, `API-xxx`). |
| `design.md` | Architecture & decisions: context diagrams, module boundaries, chosen alternatives with rationale, trade-offs, open questions. |
| `report.md` | **Completion report.** Re-lists every `task.md` item with `[x]`/`[ ]`, summarizes what was actually built, records deviations, verification evidence, remaining risks, follow-ups. A plan/review is not "done" until this file is populated. |

### Lifecycle

1. **At creation:** write `task.md`, `rule.md`, `spec.md`, `design.md`. `report.md` starts as a stub.
2. **During execution:** tick `- [x]` in `task.md` as tasks complete.
3. **At completion:** fill `report.md` with evidence. Status → `COMPLETE`.

### Why this matters

- **Small AI agents** (limited context, less capable models) can execute `task.md` without re-reading the full blueprint or review.
- **Humans** can audit progress by reading one checklist.
- **Future agents** can pick up abandoned work by reading the folder cold.
- **Reviewers** can verify completion by diffing `task.md` against `report.md`.

### Execution

To execute a plan folder, use the `plan-executor` skill:

```
plan-executor .plan/<folder>/          # execute
plan-executor --resume .plan/<folder>/ # continue incomplete
```

It reads all five files, runs tasks in dependency order (P0→P1→P2→P3), ticks `task.md`, and fills `report.md` with verification evidence.

---

## 2. General agent rules

### Do

- Read `AGENTS.md`, `README.md`, and the relevant `.plan/` folder before starting work.
- Follow `rule.md` inside the active `.plan/` folder — those rules override general preferences for that task.
- Tick tasks in `task.md` as you complete them.
- Record deviations in `report.md`, not in code comments.
- Preserve existing tests; add regression tests for every P0/P1 fix.
- Use repo-relative paths in all documentation.

### Do not

- Do not start a plan or review without creating the `.plan/` folder first.
- Do not output a plan or review as a chat-only reply — it must live on disk.
- Do not overwrite an existing `.plan/` folder — append a numeric suffix.
- Do not delete files the active task does not tell you to delete.
- Do not add dependencies the active task does not list.
- Do not disable linters, type-checks, or CI gates to make a task pass.
- Do not push, deploy, or run production writes unless the task explicitly authorizes it.
- Do not do drive-by refactors — only change what the task requires.

### When in doubt

1. Re-read the task.
2. Check `spec.md` for the requirement.
3. Check `design.md` for the intent.
4. Check `rule.md` for constraints.
5. If still unclear: **stop and ask the owner.** A paused task is cheaper than a wrong implementation.

---

## 3. Conventions

- **Language:** Indonesian for chat with the owner; English for all artifacts in `.plan/`, code, commits, and PRs.
- **Branch naming:** `feat-*`, `fix-*`, `chore-*`, `refactor-*`.
- **Commit style:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- **Commit scope:** only the files the task requires — never sweep unrelated WIP into the same commit.
- **Tests:** every P0/P1 fix must add a regression test.
- **Secrets:** never in source, never in commits, never in logs.

---

## 4. Relationship to other planning artifacts

The `.plan/` folder is the **execution-facing** counterpart to other planning artifacts:

- `spec/blueprint/` (master blueprint) = the "what and why" at system scale.
- `.plan/<folder>/` = the "how, in which order, with which checklist" for a specific piece of work.

When both exist for the same work, `design.md` may summarize or point to the blueprint — it must not contradict it.

---

## 5. Monorepo Rules (pnpm + Turbo)

This is a pnpm monorepo with the following package layering:

```
apps/* (top layer — can import from packages/*)
  ↓
packages/ui, packages/fake-db (middle layer — can import from types, utils, config)
  ↓
packages/types, packages/utils, packages/config, packages/database (base layer)
```

### Boundary Rules

- **Apps** (`apps/*`) can import from `packages/*` only
- **UI** (`packages/ui`) can import from `@galaxy/types`, `@galaxy/utils`, `@galaxy/config` only
- **Database** (`packages/database`) can import from `@galaxy/types`, `@galaxy/config` only
- **Base packages** can only import from `@galaxy/types`
- **No cross-app imports** (arsy cannot import from web)
- **No upward imports** (ui cannot import from database)

### Version Alignment

- Use `workspace:*` for internal `@galaxy/*` packages
- Use fixed versions for external critical dependencies (no `*` or `^` for security-sensitive deps)
- Run `pnpm dedupe` before committing

### Before PR

Run monorepo validation:
```bash
pnpm turbo run typecheck lint build
node .scripts/validate-monorepo.mjs  # if generated
```

Use `monorepo-guardian` skill to audit boundaries, detect circular deps, and enforce version alignment.

## 7. Integration Skills

### regression-test-generator

After `ultra-review` produces findings in a `.plan/` folder, use this skill to generate regression tests:

```bash
# Generate tests from a review folder
regression-test-generator .plan/20261107-1500-review-billing-security/

# Verify pre-fix (tests should FAIL - RED phase)
regression-test-generator .plan/... --verify red

# After plan-executor applies fixes, verify post-fix (tests should PASS - GREEN phase)
regression-test-generator .plan/... --verify green
```

**Output:** Test files (Vitest, Playwright, Testcontainers) + `test-generation-report.md`

**Integration:**
- Reads `ultra-review` `spec.md` for finding details
- Generates one test per CRITICAL/HIGH/MEDIUM finding
- Test headers include finding ID for traceability
- Pre-fix tests MUST fail; post-fix tests MUST pass
- Tests become permanent regression guards

---

## 6. For the owner

If you want to change these rules, edit this file. Agents will pick up the new version on the next session.

</content>