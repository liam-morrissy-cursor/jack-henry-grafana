# KAN-23 — Jest coverage for published `WebappUtils.modals` (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket targets Mattermost’s published webapp contract (`published_modals.ts` → `window.WebappUtils.modals`) and a co-located `published_modals.test.tsx`. Those paths and symbols do not exist in this Grafana monorepo.

Epic referenced on the ticket: **KAN-13** (Mattermost Cursor 201 demo sprint — also out of tree; see `contribute/findings/KAN-13-mattermost-out-of-tree.md` on prior findings PRs).

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | KAN-23 |
| Summary | `[Test] Jest coverage for published WebappUtils.modals` |
| Ask | Add Jest coverage for `window.WebappUtils.modals` published contract (`published_modals.ts`) |

### Acceptance criteria (webhook)

1. New/changed modal utils have a unit test in `published_modals.test.tsx`
2. Contract `Assert*` types still fail `tsc` on drift

## What was searched in this tree

Commands run from `/workspace` on `main` (no matches unless noted):

| Search | Result |
| --- | --- |
| `published_modals` (glob + content) | **0 files / 0 matches** |
| `WebappUtils` / `WebappUtils.modals` | **0 matches** |
| `published_modals.test.tsx` | **absent** |
| Mattermost-shaped roots: `webapp/channels`, `experiments/mattermost`, `server/channels/api4` | **absent** (same as KAN-13/14/15) |

Closest Grafana surface: `window.grafanaBootData` (boot config), which is unrelated to Mattermost’s `window.WebappUtils.modals` plugin/plugin-host modal API.

Grafana does ship its own modal UI (`@grafana/ui` `Modal`, `public/app/core/context/ModalsContextProvider.tsx`, etc.). Those are **not** the published `WebappUtils.modals` contract named in the ticket, and inventing a fake `published_modals.ts` under Grafana would not satisfy KAN-23.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Unit test in `published_modals.test.tsx` for new/changed modal utils | **Blocked** — source file and test file do not exist |
| Contract `Assert*` types still fail `tsc` on drift | **Blocked** — no `Assert*` contract types for this surface |

## What was not done (by design)

- Did **not** scaffold `webapp/channels`, `published_modals.ts`, or a Mattermost-like `WebappUtils` global under Grafana.
- Did **not** clone another repository (workspace **stay-in-this-repo**).
- Did **not** change Grafana product code, CI, or Jest config.

## How to complete KAN-23 (in the owning repo)

1. Open the Mattermost (or `experiments/mattermost`) checkout that owns `published_modals.ts` / `window.WebappUtils.modals`.
2. Add or extend `published_modals.test.tsx` for any new/changed modal utils on that published surface.
3. Keep the existing `Assert*` TypeScript contract so `tsc` fails on API drift; run the package typecheck after the test change.
4. Re-run the ticket’s Jest target for that package.

## Related findings

- KAN-13 — Mattermost demo sprint epic out of tree
- KAN-14 — `POST /api/v4/posts` / `server/channels/api4` out of tree
- KAN-15 — Mattermost `SiteURL` / local boot out of tree
