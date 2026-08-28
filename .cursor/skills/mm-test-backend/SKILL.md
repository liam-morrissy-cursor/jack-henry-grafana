---
name: mm-test-backend
description: >-
  Diff-scoped backend/server tests via make test-server (Mattermost-style) or
  the Grafana Go unit equivalent. Use when TestGuardian selects server/Go
  changes outside api4-only scope.
---

# mm-test-backend (`make test-server`)

Run **server/backend** unit tests for the packages touched by the diff.

## Primary command

```bash
make test-server
```

That is the Mattermost-style entrypoint named in the TestGuardian skills.
When this Makefile target is **missing** (Grafana host tree), use a targeted
Go unit run instead — do not invent a full Playwright pass:

```bash
# Prefer package-scoped tests for the changed paths
go test -count=1 ./pkg/path/touched/...
```

## When to use

- Diff touches Go / server code and TestGuardian listed `mm-test-backend`.
- Not api4-only (those stay on `mm-test-api`).

## Workflow

1. Derive changed backend packages from the diff.
2. Prefer package-scoped `go test` when the change is narrow; use
   `make test-server` when that target exists and the diff is broad across
   server packages.
3. Do **not** run Playwright unless the same plan also selected an e2e skill
   because Playwright specs themselves changed.
4. Report command + result in the PR Test plan.

## Do not

- Substitute Playwright for backend coverage.
- Run `make test-server` against unrelated packages “just in case” when a
  single-package `go test` already covers the change.
