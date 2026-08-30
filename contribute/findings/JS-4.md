# JS-4 — Order-preview IDOR ownership check (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket targets an OWASP Juice Shop / SE bootcamp demo API route (`GET /rest/demo/gauntlet/order-previews/:id`) that must enforce `preview.ownerUserId` against the JWT subject. Those paths, flags (`isGetOwnershipEnforced`), and demo scripts (`npm run demo:exploit`, `demo:legitimate`, `demo:verify`, `rsn`) do not exist in this Grafana monorepo.

Webhook **Repo / start ref:** `liam-morrissy-cursor/se-bootcamp-juice-shop` (`demo/baseline` / `master`). This automation is bound to `liam-morrissy-cursor/grafana` and must not clone another repository (workspace **stay-in-this-repo**).

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | JS-4 |
| Summary | `IDOR: any logged-in user can GET another customer's order preview` |
| Ask | Enforce ownership on `GET /rest/demo/gauntlet/order-previews/:id` so Bender cannot read Jim’s preview `1001` |

### Acceptance criteria (webhook)

1. `isGetOwnershipEnforced()` is true
2. Attacker GET `1001` is 403
3. Owner GET `1001` is still 200
4. Attacker GET of own `2002` is still 200
5. Unknown id is 404
6. `npm run rsn` green
7. Do **not** flip `isNoteOwnershipEnforced`
8. Do **not** edit `routes/basket.ts`

### Verify (webhook)

- `npm run demo:exploit` → `BLOCKED`
- `npm run demo:legitimate` → `LEGITIMATE_OK`
- `npm run demo:verify`

## What was searched in this tree

Commands run from `/workspace` on `main` (no matches unless noted):

| Search | Result |
| --- | --- |
| `isGetOwnershipEnforced` / `isNoteOwnershipEnforced` | **0 matches** |
| `order-previews` / `order-preview` | **0 product matches** |
| `gauntlet` / `returnedOwnerEmail` / `express-jwt` (gauntlet context) | **0 matches** |
| `routes/basket.ts` | **absent** |
| Juice Shop / SE bootcamp demo scripts (`demo:exploit`, `demo:legitimate`, `demo:verify`, `demo:reset`, `rsn`) | **absent** from `package.json` / tree |
| Glob `*order*preview*`, `*gauntlet*`, `*juice*` (excluding `.git`) | **no product files** |

Closest Grafana surfaces (authz, HTTP APIs under `pkg/api/`) are unrelated to the Juice Shop gauntlet order-preview route and must not be patched to “satisfy” this ticket.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| `isGetOwnershipEnforced()` is true | **Blocked** — flag / helper does not exist |
| Attacker GET `1001` → 403 | **Blocked** — route does not exist |
| Owner GET `1001` → 200 | **Blocked** — route does not exist |
| Attacker GET own `2002` → 200 | **Blocked** — route does not exist |
| Unknown id → 404 | **Blocked** — route does not exist |
| `npm run rsn` green | **Blocked** — script does not exist |
| Do not flip `isNoteOwnershipEnforced` | **N/A** — symbol absent; nothing flipped |
| Do not edit `routes/basket.ts` | **N/A** — file absent; not edited |

## What was not done (by design)

- Did **not** scaffold Juice Shop / gauntlet order-preview routes under Grafana.
- Did **not** clone `liam-morrissy-cursor/se-bootcamp-juice-shop` (workspace **stay-in-this-repo**).
- Did **not** change Grafana product code, auth middleware, CI, or tests.
- Did **not** log credentials, tokens, or connection strings.

## How to complete JS-4 (in the owning repo)

1. Open `liam-morrissy-cursor/se-bootcamp-juice-shop` at `demo/baseline` (or `demo-prerun` + `npm run demo:reset`); base PRs on `master` as stated on the ticket.
2. On `GET /rest/demo/gauntlet/order-previews/:id`, after JWT auth, compare `preview.ownerUserId` to the authenticated user; return 403 on mismatch, keep owner 200 / own-id 200 / unknown 404.
3. Make `isGetOwnershipEnforced()` return true; leave `isNoteOwnershipEnforced` and `routes/basket.ts` untouched.
4. Re-run `npm run demo:exploit` (expect `BLOCKED`), `npm run demo:legitimate` (expect `LEGITIMATE_OK`), `npm run demo:verify`, and `npm run rsn`.

## Related findings pattern

Same class of out-of-tree webhook tickets previously handled as findings-only in this Grafana automation (NOP-*, Mattermost-shaped KAN-13/14/15/23).
