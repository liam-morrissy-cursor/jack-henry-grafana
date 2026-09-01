# PROG-65 — Wire ParseSearchParams through a JSON sidecar behind a flag defaulting off (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket targets Mattermost-shaped Go model search wiring: a long-lived (or stdin-batched) C# JSON sidecar, a Go adapter under `server/public/model/`, and a `FeatureFlags` toggle (default **off**) so `ParseSearchParams` delegates to C# only when flagged — without rewriting `SearchPostsForUser` / `SearchFilesInTeamForUser` control flow. Those paths and symbols do not exist in this Grafana monorepo.

Epic referenced on the ticket: **PROG-61**. Depends on: **PROG-64**. Ticket says do not duplicate **PROG-52–60**. Related prior Mattermost-shaped findings in this checkout: **PROG-63**, **KAN-13** / **KAN-14** / **KAN-15** / **KAN-23**. Do not scaffold Mattermost `server/public/model` or a C# sidecar under Grafana.

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | PROG-65 |
| Summary | Wire ParseSearchParams through a JSON sidecar behind a flag defaulting off |
| Ask | Production must delegate to C# only when flagged; sidecar should be long-lived (or batched on stdin), not spawn-per-query |

### Requirements (webhook)

1. Add Go adapter in `server/public/model/` that calls the C# sidecar via JSON stdin/stdout
2. Add `FeatureFlags` entry (default **off**) to toggle C# vs Go in `ParseSearchParams`
3. Do not rewrite `SearchPostsForUser` / `SearchFilesInTeamForUser` control flow
4. Sidecar process started at server boot or lazily on first flagged request
5. Do not duplicate PROG-52–60

### Acceptance criteria (webhook)

1. `cd server/public && go test ./model -count=1 -run 'TestParseSearchParams'` passes with flag off (Go path)
2. Integration test passes with flag on (C# sidecar path)
3. Flag defaults off in `FeatureFlags.SetDefaults`
4. PR Test plan: **N/A — logic-only**
5. Open a PR

## What was searched in this tree

Commands run from `/workspace` on `main` (branched as `agent/PROG-65-parse-search-sidecar-findings`):

| Search | Result |
| --- | --- |
| `ParseSearchParams` | **0 matches** |
| `SearchPostsForUser` / `SearchFilesInTeamForUser` | **0 matches** |
| `FeatureFlags.SetDefaults` (Mattermost-shaped) | **absent** |
| `server/public/model/` / `server/public/` | **absent** |
| `search_params*.go` / C# `ParseSearchParams` sources | **absent** |
| JSON stdin/stdout search-params sidecar under this tree | **absent** |

Grafana has `pkg/services/featuremgmt` feature toggles and unrelated URL/location `SearchParams` helpers under `packages/grafana-data`. Those are **not** Mattermost `ParseSearchParams` / `FeatureFlags.SetDefaults` / C# JSON sidecar wiring named in the ticket. Inventing a fake `server/public/model` adapter or C# process under Grafana would not satisfy PROG-65 and would violate stay-in-this-repo.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Go adapter in `server/public/model/` calling C# sidecar via JSON stdin/stdout | **Blocked** — no `server/public/model` and no Mattermost sidecar host |
| `FeatureFlags` entry default off toggling C# vs Go in `ParseSearchParams` | **Blocked** — no Mattermost `FeatureFlags` / `ParseSearchParams` |
| Do not rewrite `SearchPostsForUser` / `SearchFilesInTeamForUser` | **N/A / honored** — those symbols are absent; no control-flow edits |
| Sidecar started at boot or lazily on first flagged request | **Blocked** — no Mattermost server boot / sidecar lifecycle here |
| `cd server/public && go test ./model -count=1 -run 'TestParseSearchParams'` (flag off) | **Blocked** — no `server/public` / `./model` package |
| Integration test with flag on (C# sidecar path) | **Blocked** — no C# sidecar or integration harness here |
| Flag defaults off in `FeatureFlags.SetDefaults` | **Blocked** — no Mattermost `FeatureFlags.SetDefaults` |
| Do not duplicate PROG-52–60 | **Honored** — findings-only; no nopCommerce / Mattermost scaffolding |
| PR Test plan: N/A — logic-only | **Honored** on this findings PR |

## What was not done (by design)

- Did **not** scaffold `server/public/model`, a C# sidecar binary, or Mattermost Go packages under Grafana.
- Did **not** clone a Mattermost (or other) repository (workspace **stay-in-this-repo**).
- Did **not** change Grafana product code, CI, or frontend/backend tests.
- Did **not** invent a feature flag or JSON process adapter against Grafana `featuremgmt` / URL `SearchParams` helpers (wrong API surface).
- Did **not** reopen or duplicate PROG-52–60 / PROG-63 / KAN-13–15 / KAN-23 beyond cross-reference.

## How to complete PROG-65 (in the owning repo)

1. Open the Mattermost (or bootcamp) checkout that owns `server/public/model` (`ParseSearchParams`, search APIs) and the PROG-64 C# sidecar surface.
2. Add a Go adapter under `server/public/model/` that speaks JSON over stdin/stdout to a **long-lived** (or stdin-batched) C# sidecar — not spawn-per-query.
3. Add a `FeatureFlags` entry defaulting **off** in `FeatureFlags.SetDefaults`; when off, keep the existing Go `ParseSearchParams` path.
4. When the flag is on, `ParseSearchParams` delegates to the sidecar; leave `SearchPostsForUser` / `SearchFilesInTeamForUser` control flow unchanged.
5. Start the sidecar at server boot or lazily on the first flagged request.
6. Avoid duplicating PROG-52–60 coverage; build on PROG-64.
7. Verify:
   - `cd server/public && go test ./model -count=1 -run 'TestParseSearchParams'` with flag off
   - Integration coverage with flag on (C# sidecar path)

## Related findings

- PROG-63 — Mattermost `ParseSearchParams` Unicode / quote golden fixtures out of tree
- KAN-13 — Mattermost epic / out-of-tree board surfaces
- KAN-14 — Mattermost `POST /api/v4/posts` out of tree
- KAN-15 — Mattermost `SiteURL` / local boot out of tree
- KAN-23 — Mattermost `published_modals` / `WebappUtils.modals` out of tree
