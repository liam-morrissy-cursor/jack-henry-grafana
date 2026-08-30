# JS-5 — Order-preview note PUT IDOR (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket targets an OWASP Juice Shop / SE bootcamp write path (`PUT /rest/demo/gauntlet/order-previews/:id/note`) that must reuse `decideNoteWriteAccess` and flip `isNoteOwnershipEnforced()` so a non-owner (Bender) cannot overwrite Jim’s fulfillment note on preview `1001`. Those helpers, routes, flags, and demo scripts (`npm run demo:verify`, `npm run rsn`) do not exist in this Grafana monorepo.

Webhook **Repo / start ref:** `liam-morrissy-cursor/se-bootcamp-juice-shop` (`demo/capstone` / `master`). This automation is bound to `liam-morrissy-cursor/grafana` and must not clone another repository (workspace **stay-in-this-repo**). Prompt contract referenced: `demo/gauntlet/capstone/CONTRACT.md` (in the Juice Shop tree only).

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | JS-5 |
| Summary | `IDOR: any logged-in user can PUT a note on someone else's order preview` |
| Ask | After GET ownership is on, enforce note write ownership on `PUT /rest/demo/gauntlet/order-previews/:id/note` so Bender cannot overwrite Jim’s note on `1001` |

### Acceptance criteria (webhook)

1. Reuse `decideNoteWriteAccess` in `lib/demoGauntlet/ownership.ts`
2. `isNoteOwnershipEnforced()` is true
3. Attacker PUT `1001` is 403
4. Owner PUT still 200
5. GET ownership stays enforced
6. `npm run rsn` green
7. Do **not** edit `routes/basket.ts`

### Verify (webhook)

- `npm run demo:verify`
- API assertion that cross-user PUT is 403

## What was searched in this tree

Commands run from `/workspace` on `main` (branch `agent/JS-5-order-preview-note-put-idor-findings`):

| Search | Result |
| --- | --- |
| `decideNoteWriteAccess` / `isNoteOwnershipEnforced` / `isGetOwnershipEnforced` | **0 matches** |
| `order-previews` / `order-preview` / `/note` (gauntlet) | **0 product matches** |
| `demoGauntlet` / `lib/demoGauntlet/ownership.ts` | **absent** |
| `routes/basket.ts` | **absent** |
| Juice Shop / SE bootcamp demo scripts (`demo:verify`, `demo:exploit`, `rsn`) | **absent** from `package.json` / tree |
| Glob / content for `gauntlet`, Juice Shop Express `/rest/demo/` | **no product files** |

Closest Grafana surfaces (authz, HTTP APIs under `pkg/api/`) are unrelated to the Juice Shop gauntlet note PUT route and must not be patched to “satisfy” this ticket.

Related prior findings in this Grafana automation (same owning repo, still out of tree):

- **JS-1** — overall order-preview object auth (`contribute/findings/JS-1.md`, PR #77)
- **JS-4** — GET IDOR / `isGetOwnershipEnforced` (`contribute/findings/JS-4.md`, PR #78)

JS-5 is the **write-path** counterpart (note PUT / `isNoteOwnershipEnforced`); it still cannot be implemented here.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Reuse `decideNoteWriteAccess` in `lib/demoGauntlet/ownership.ts` | **Blocked** — module does not exist |
| `isNoteOwnershipEnforced()` true | **Blocked** — flag / helper does not exist |
| Attacker PUT `1001` → 403 | **Blocked** — route does not exist |
| Owner PUT → 200 | **Blocked** — route does not exist |
| GET ownership stays enforced | **Blocked** — GET gauntlet route also absent here |
| `npm run rsn` green | **Blocked** — script does not exist |
| Do not edit `routes/basket.ts` | **N/A** — file absent; not edited |

## What was not done (by design)

- Did **not** scaffold Juice Shop / gauntlet order-preview note routes under Grafana.
- Did **not** clone `liam-morrissy-cursor/se-bootcamp-juice-shop` (workspace **stay-in-this-repo**).
- Did **not** change Grafana product code, auth middleware, CI, or tests.
- Did **not** log credentials, tokens, or connection strings.
- Did **not** edit `routes/basket.ts` (absent; also forbidden by the ticket).

## How to complete JS-5 (in the owning repo)

1. Open `liam-morrissy-cursor/se-bootcamp-juice-shop` from ref `demo/capstone` (ticket: work off that ref; base PRs on `master`). Follow `demo/gauntlet/capstone/CONTRACT.md`.
2. On `PUT /rest/demo/gauntlet/order-previews/:id/note`, call `decideNoteWriteAccess` from `lib/demoGauntlet/ownership.ts` so non-owners get 403 and owners still get 200 when applying `req.body.note`.
3. Make `isNoteOwnershipEnforced()` return true; keep GET ownership enforced; do **not** edit `routes/basket.ts`.
4. Re-run `npm run demo:verify` and assert cross-user PUT is 403; keep `npm run rsn` green.

## Related findings pattern

Same class of out-of-tree webhook tickets previously handled as findings-only in this Grafana automation (JS-1, JS-4, NOP-*, Mattermost-shaped KAN-13/14/15/23).
