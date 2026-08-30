# JS-1 — Harden object-level auth on isolated order-preview API (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket targets a private Juice Shop copy (`liam-morrissy-cursor/se-bootcamp-juice-shop`) and the isolated demo routes `GET/PUT /rest/demo/gauntlet/order-previews/:id`. Those routes, ownership checks, and verify scripts (`npm run demo:verify`, `npm run rsn`) do not exist in this Grafana monorepo.

Workspace rule **stay-in-this-repo** forbids cloning or switching to another repository unless explicitly asked. Per automation guidance: when the code path is absent here, open a findings PR and stop.

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | JS-1 |
| Summary | Harden object-level auth on isolated order-preview API |
| Status at trigger | In Progress |
| Owning repo / base | `liam-morrissy-cursor/se-bootcamp-juice-shop`, `master` (live work from `demo/baseline` or `demo-prerun` + `npm run demo:reset`) |

### Acceptance criteria / scope (webhook)

1. Harden object-level authorization on checkout drafts at `GET/PUT /rest/demo/gauntlet/order-previews/:id` (login works; ownership is not always checked).
2. **Do not** patch `GET /rest/basket/:id` (scoring challenge).
3. **Out of scope:** public `juice-shop/juice-shop`, live customer data, the storefront cart UI.
4. **Verify:** `npm run demo:verify` and `npm run rsn` stay green.

## What was searched in this tree

Commands run from `/workspace` on `main` (branch `agent/JS-1-order-preview-auth-findings`):

| Search | Result |
| --- | --- |
| `order-preview` / `orderPreview` / `gauntlet` / `/rest/demo/` (content) | **0 matches** |
| Paths named `*juice*` or `*order-preview*` | **absent** |
| Juice Shop–style Express `/rest/` demo gauntlet routes | **absent** |
| `npm run demo:verify` / `npm run rsn` scripts | **not present** in Grafana `package.json` (Grafana uses `yarn` / `make` workflows) |

Closest Grafana surfaces (`pkg/api/`, auth middleware, org/folder permissions) are unrelated to Juice Shop order-preview ownership. Inventing a fake `/rest/demo/gauntlet/order-previews` handler under Grafana would not satisfy JS-1 and would risk confusing the scoring challenge surface named in the ticket.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Enforce ownership on `GET/PUT /rest/demo/gauntlet/order-previews/:id` | **Blocked** — routes do not exist |
| Leave `GET /rest/basket/:id` alone (scoring) | **N/A** — basket route also absent; no change required or possible |
| Keep `npm run demo:verify` and `npm run rsn` green | **Blocked** — scripts belong to se-bootcamp-juice-shop |

## What was not done (by design)

- Did **not** clone `liam-morrissy-cursor/se-bootcamp-juice-shop` or the public Juice Shop repo.
- Did **not** scaffold Juice Shop Express routes, order-preview models, or demo verify scripts under Grafana.
- Did **not** patch any Grafana auth/API handlers to simulate IDOR fixes for a different product.
- Did **not** touch `GET /rest/basket/:id` (explicitly out of scope / scoring; also not present here).

## How to complete JS-1 (in the owning repo)

1. Open `liam-morrissy-cursor/se-bootcamp-juice-shop` on `master` (or reset from `demo/baseline` / `demo-prerun` via `npm run demo:reset` as the ticket describes).
2. Locate handlers for `GET` and `PUT` `/rest/demo/gauntlet/order-previews/:id`.
3. Enforce object-level ownership: authenticated user may only read/update their own order-preview draft (consistent 403/404 for cross-user IDs). Do **not** change `GET /rest/basket/:id`.
4. Add or extend automated coverage for authorized vs unauthorized access to another user’s preview id.
5. Run `npm run demo:verify` and `npm run rsn` and confirm both stay green.

## Related findings pattern

Same automation outcome as other out-of-tree tickets handled in this Grafana clone (NOP-* nopCommerce, Mattermost-shaped KAN-13/14/15/23): document the miss, do not invent the foreign product tree here.
