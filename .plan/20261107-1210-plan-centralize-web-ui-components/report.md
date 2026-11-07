# Completion report — Centralize shared UI into packages/ui

**Status:** `PLANNED` (not yet executed)

**Task checklist (from task.md):**
- [ ] P0: T01–T43 (wrapper removal + import repoints)
- [ ] P1: T101–T109 (extractions into packages/ui)
- [ ] P2: T201–T204 (governance)
- [ ] P3: T301–T303 (verification)

**Built:** none yet

**Deviations:** none yet

**Verification evidence:** none yet

**Remaining risks:**
- Sweep tasks touch many import sites with one pattern (mitigated by ordered repoint-before-delete and grep verification in T43).
- `pnpm --filter web build` (Next.js) may be slow; treat T301 as XL if needed.
- `apps/arsy` not covered by web/ui typecheck; adoption path documented but not executed.

**Follow-ups:**
- Execute P0 starting with T01.
- On completion, update this file with evidence, mark `[x]` in task.md, set status to `COMPLETE`.
