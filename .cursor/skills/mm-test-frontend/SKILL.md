---
name: mm-test-frontend
description: >-
  Diff-scoped frontend unit tests via Jest. Use when TestGuardian (or a PR
  checklist) selects frontend webapp changes — TS/TSX/JS under public/app,
  packages/*/src, or webapp — and not when the diff is api4-only or
  backend-only.
---

# mm-test-frontend (Jest)

Run **targeted** frontend unit/component tests for the files in the current
diff. Do **not** launch full Playwright / `yarn e2e:playwright` from this
skill.

## When to use

- Diff touches frontend sources or co-located `*.test.ts(x)` / `*.spec.ts(x)`
  outside Playwright suites.
- TestGuardian listed `mm-test-frontend` in its plan.

## When not to use

- Diff is **api4-only** → use `mm-test-api` instead (never Playwright).
- Diff is backend Go / server-only → use `mm-test-backend`.
- Diff is Playwright e2e specs only → follow `add-e2e-tests`, not this skill.

## Workflow

1. List changed frontend files from `git diff --name-only` (merge-base…HEAD or
   the PR range TestGuardian already computed).
2. Prefer the co-located test file next to each changed module
   (e.g. `Foo.test.tsx` beside `Foo.tsx`).
3. Run Jest once and exit (no watch):

```bash
# Login shell so nvm-pinned Node is on PATH (Cloud Agent PATH gotcha)
bash -lc 'yarn jest --no-watch -- <path-to-test> [<more-tests>...]'
```

4. If no co-located test exists and the change is behavior, add one in the
   neighboring style, then re-run.
5. Report command + pass/fail in the PR Test plan.

## Do not

- Run the full frontend suite unless the diff is truly broad and targeted
  runs are impractical.
- Invoke Playwright from this skill.
- Disable or skip existing tests to go green.
