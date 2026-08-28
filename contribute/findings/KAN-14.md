# KAN-14 findings — out of tree

**Issue:** KAN-14 — `[API] POST /api/v4/posts returns 500 on empty message instead of 400`  
**Repo checked:** `liam-morrissy-cursor/grafana` (this workspace)  
**Verdict:** Cannot implement here. Handler and API surface are Mattermost-shaped, not Grafana.

## What the ticket asks for

Production-shaped 500 for the Cursor 201 Sentry → Cloud Agent → TestGuardian beat.

Requirements from the webhook:

- Reproduce `POST /api/v4/posts` returning **500** instead of **400** on invalid payload (empty `message` and missing `channel_id`).
- Handler lives under `server/channels/api4`.
- Add a failing API test first, then return a proper `AppError`.

Acceptance criteria:

- Invalid create-post payloads return **400** with a stable error id, never **500**
- Existing valid post create still returns **201**
- TestGuardian API skill covers this path

Epic: KAN-13

## What we searched in this tree

| Target | Result |
| --- | --- |
| `server/channels/api4` | Missing (no `server/channels` tree) |
| `POST /api/v4/posts` / create-post handler | No matches |
| `AppError` create-post validation (empty `message`, missing `channel_id`) | No Mattermost-style API4 handlers |
| TestGuardian API skill / posts API tests | Not present |

Grafana exposes its own HTTP API under `pkg/api/` (and related services). There is no `/api/v4/posts` Mattermost Channels API4 surface in this monorepo.

## Acceptance criteria status

| Criterion | Status in this repo |
| --- | --- |
| Invalid create-post → 400 + stable error id (never 500) | **Blocked** — no `/api/v4/posts` handler |
| Valid create-post → 201 | **Blocked** — no create-post endpoint |
| TestGuardian API skill covers this path | **Blocked** — path and skill targets are out of tree |
| Failing API test under `server/channels/api4` | **Blocked** — directory absent |

## Why no code change

Workspace rule **stay-in-this-repo** forbids cloning or switching to another repository unless explicitly asked. Scaffolding a fake `server/channels/api4` tree under Grafana would not satisfy KAN-14 and would pollute this monorepo.

## What completing KAN-14 requires

1. Open the **Mattermost** (or other) repository that contains `server/channels/api4` and `POST /api/v4/posts`.
2. Add a failing API test for empty `message` and missing `channel_id` (expect 400 + stable error id).
3. Change the create-post handler to return a proper `AppError` (400) instead of panicking / 500 on invalid payload.
4. Confirm valid create-post still returns 201.
5. Ensure the TestGuardian API skill exercises this path.

## Out of scope (unchanged)

Grafana `pkg/api/`, SQL Expressions, `packages/grafana-sql`, and any Influx dotted-identifier work.
