---
name: mm-test-api
description: >-
  Diff-scoped API tests for api4 (and equivalent API client/handler test
  trees). Use when TestGuardian selects api4 changes. Never runs Playwright
  — api4-only diffs must stay on this skill alone.
---

# mm-test-api (api4)

Run **API-layer** tests for paths under `api4/` (Mattermost-style) or the
Grafana equivalents TestGuardian maps to that bucket. This skill exists so
API PRs stay fast and **do not** pull in browser e2e.

## Hard rule

If the changed-file set is **only** api4 (or only files classified as api4 by
TestGuardian), **do not** run Playwright, `yarn e2e:playwright`, or any
full-browser suite. API coverage is enough.

## When to use

- Diff includes `api4/**` or TestGuardian emitted `mm-test-api`.
- PR updates HTTP handlers / API client tests that the router classified as
  api4.

## Workflow

1. Confirm scope with the TestGuardian plan (or re-run the router):

```bash
node .cursor/agents/select-skills.mjs $(git diff --name-only origin/main...HEAD)
```

2. If the plan is **only** `mm-test-api`, skip frontend Jest and backend
   `make test-server` unless those skills are also listed.
3. Run the api4 (or mapped) test target for the touched packages. Prefer the
   narrowest command the tree documents for that package. Examples:

```bash
# Mattermost-style api4 tree (when present)
go test ./api4/...

# Grafana host mapping when api4/ is absent: targeted API package tests
go test -count=1 ./pkg/api/... -run 'Test' # only if the diff actually touches pkg/api
```

4. Never pad the plan with Playwright “for confidence” on an api4-only diff.
5. Report command + result in the PR Test plan. Call out explicitly:
   `Playwright: skipped (api4-only scope)`.

## Do not

- Trigger Playwright because “UI might be affected” when the diff is api4-only.
- Run the entire backend or frontend suite from this skill.
