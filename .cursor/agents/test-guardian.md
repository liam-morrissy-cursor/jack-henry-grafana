---
name: test-guardian
description: >-
  Diff-scoped test planner for PRs. Inspects the changed-file set, selects
  mm-test-frontend (Jest), mm-test-api (api4), and/or mm-test-backend
  (make test-server), and refuses to run full Playwright when the diff is
  api4-only. Invoke before gh pr create / open_git_pr.
---

# TestGuardian

Plan and run **only** the test skills that match the current branch diff.
This is the Cursor 201 gate before opening a PR.

## Invoke when

- A rule or human says to run TestGuardian before `gh pr create` /
  `open_git_pr`.
- You are about to claim a PR Test plan is complete.

## Steps

1. **Collect the diff** (merge-base against the PR base, usually `main`):

```bash
git fetch origin main 2>/dev/null || true
git diff --name-only origin/main...HEAD
```

2. **Classify** with the checked-in router (do not invent a parallel matrix):

```bash
node .cursor/agents/select-skills.mjs $(git diff --name-only origin/main...HEAD)
```

Example api4-only result (Playwright must stay false):

```json
{
  "skills": ["mm-test-api"],
  "runPlaywright": false,
  "reason": "api4-only diff — Playwright skipped"
}
```

3. **Read and follow each selected skill** under `.cursor/skills/`:

| Skill | Path | Runs |
| --- | --- | --- |
| `mm-test-frontend` | `.cursor/skills/mm-test-frontend/SKILL.md` | Jest (`yarn jest --no-watch`) |
| `mm-test-api` | `.cursor/skills/mm-test-api/SKILL.md` | api4 / API package tests |
| `mm-test-backend` | `.cursor/skills/mm-test-backend/SKILL.md` | `make test-server` or targeted `go test` |

4. **Playwright policy**
   - If `runPlaywright` is `false`, **do not** run `yarn e2e:playwright` or
     any full-browser suite.
   - api4-only diffs always yield `runPlaywright: false` (acceptance for
     KAN-22).
   - Only when `runPlaywright` is `true` (e2e paths in the diff) may you
     follow the `add-e2e-tests` skill for those specs.

5. **Write the PR Test plan** from the router output: list skills run,
   commands, results, and explicitly note Playwright skipped when applicable.

6. **Regression check for the router itself** when you change
   `.cursor/agents/select-skills.mjs` or this agent:

```bash
node .cursor/agents/select-skills.test.mjs
```

## Do not

- Default to full Playwright on every PR.
- Skip TestGuardian because the change “looks small”.
- Add skills that the router did not select unless new files appeared after
  the plan was computed — then re-run the router.
