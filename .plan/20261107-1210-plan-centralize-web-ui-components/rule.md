# Hard rules — Centralize shared UI into packages/ui

1. **Layer boundary:** `apps/*` may import from `packages/*` only. `packages/ui` may import only `@galaxy/types`, `@galaxy/utils`, `@galaxy/config`.
2. **No upward imports:** `packages/ui` never imports from `apps/*` or `packages/database`.
3. **No cross-app:** Do not modify `apps/arsy` and do not import from it. This plan touches `apps/web` and `packages/ui` only.
4. **Dependency policy:** `@galaxy/ui` direct deps limited to `@galaxy/types` + `classnames`. MUI / tanstack-table / apexcharts / react / react-dom stay `peerDependencies`. Internal deps use `workspace:*`; critical externals pinned (no `^` or `*`).
5. **Single source of truth:** After extracting a component into `packages/ui`, delete the `apps/web` duplicate and repoint all imports. Never keep two copies.
6. **Component contract:** `'use client'` where browser APIs are used; props typed and exported; default export + named type exports; registered in `packages/ui/src/index.ts` barrel.
7. **Styling:** Tailwind; `packages/ui` keeps neutral base styling; `apps/web` keeps branding/theme overrides under `@core/theme`.
8. **Tests:** Vitest test co-located with every P1 extracted component (`*.test.tsx`).
9. **Quality gates:** Do not disable lint, type-checks, or CI gates. No secrets in source, commits, or logs.
10. **Commits:** Conventional Commits scoped per module (`feat(ui):`, `refactor(web):`, `test(ui):`, `chore:`); no unrelated WIP swept into one commit.
11. **Dedupe:** Run `pnpm dedupe` before committing.
12. **Atomic tasks:** Each task touches ≤ 3 explicitly listed files, except `[sweep]` tasks (one mechanical find-and-replace, grep-verified).
