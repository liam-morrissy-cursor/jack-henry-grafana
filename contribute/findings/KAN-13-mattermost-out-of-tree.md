# KAN-13 findings: Mattermost demo sprint out of tree

**Issue:** KAN-13 — Mattermost Cursor 201 — local demo sprint  
**Status in this repo:** Cannot implement here.

## Verdict

KAN-13 is a Mattermost Cursor 201 demo backlog epic (`experiments/mattermost`, `/api/v4`, `server/channels/api4`, `webapp/channels`, Playwright against a local Mattermost instance). This workspace is the Grafana monorepo (`liam-morrissy-cursor/grafana`). Those Mattermost paths and the local Mattermost product surface do not exist in this tree.

## What was checked

| Ticket target | Present in `/workspace`? |
| --- | --- |
| `experiments/mattermost` | No (`experiments/` directory missing) |
| `server/channels/api4` | No |
| `webapp/channels` | No |
| Mattermost `/api/v4` handlers | No matches |
| `mattermost` / Mattermost product strings in tree | No matches |

Repo root is Grafana (Go backend, React frontend, `packages/grafana-*`, `public/app/`, etc.).

## Acceptance criteria (from webhook) vs this tree

| Criterion | This tree |
| --- | --- |
| Board populated / filterable by label `mattermost` | Jira board hygiene — not a Grafana code change |
| Highest-priority production-shaped bug for Sentry automation beat | Requires Mattermost server/webapp surfaces — absent here |
| Tickets name concrete Mattermost paths (`server/channels/api4`, `webapp/channels`, Playwright) | Paths are Mattermost-owned; not present under Grafana |
| Implementable against local Mattermost (`./dev-start.sh`) | No Mattermost checkout or `dev-start.sh` in this monorepo |

## Recommended next step

Re-home or retarget KAN-13 (and any child Mattermost tickets) to the Mattermost repository / `experiments/mattermost` checkout that owns `server/channels/api4` and `webapp/channels`. Do not scaffold a fake Mattermost tree under Grafana — it would be dead code in this monorepo.

In-tree Grafana demo board work remains the existing KAN-* SQL / Explore tickets (e.g. KAN-6–KAN-12).

## What this PR does not change

No Grafana runtime, SQL, Explore, or frontend package behavior. Documentation-only findings note under `contribute/findings/`. Credentials from the ticket local-dev context are intentionally omitted from this note.
