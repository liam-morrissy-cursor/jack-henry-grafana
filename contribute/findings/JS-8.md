# JS-8 — Unauthenticated product-search SQL injection (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket targets an OWASP Juice Shop–style storefront sink: unauthenticated `GET /rest/products/search?q=` where `req.query.q` is concatenated into a raw `sequelize.query()` string in `routes/search.ts`. That route, Sequelize product-search handler, and sibling `routes/login.ts` raw-query surface do not exist in this Grafana monorepo.

Workspace rule **stay-in-this-repo** forbids cloning or switching to another repository unless explicitly asked. Prior JS-* work in this automation owned the same class of product under `liam-morrissy-cursor/se-bootcamp-juice-shop`. Per automation guidance: when the code path is absent here, open a findings PR and stop.

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | JS-8 |
| Summary | `[CRITICAL] Unauthenticated SQL injection in product search dumps user credentials` |
| Status at trigger | In Progress |
| Severity / CWE | Critical / CWE-89 |
| Asset (webhook) | juice-shop-demo storefront |
| Endpoint | `GET /rest/products/search?q=` |
| Location | `routes/search.ts` |
| Cited commit | `5d76b05c8c09a76186a72c8048554f3218e7f0c9` |
| Source | Scheduled AppSec review |

### Remediation asked (webhook)

1. Parameterize the query with Sequelize `replacements` or `bind` — do not interpolate user input into the SQL string.
2. Sweep sibling raw-query sinks (same anti-pattern cited in `routes/login.ts`).
3. Add a regression test that this endpoint does not return user emails or password hashes.
4. Human review required before merge.

## What was searched in this tree

Commands run from `/workspace` on `main` (branch `agent/JS-8-product-search-sqli-findings`):

| Search | Result |
| --- | --- |
| `products/search` / `searchProducts` / `juice-shop` | **0 matches** |
| Glob `**/routes/search.ts` | **absent** |
| `sequelize` / `/rest/products` | **0 matches** |
| Juice Shop Express product-search / login raw-query routes | **absent** |

Closest Grafana surfaces (`packages/grafana-sql`, `pkg/tsdb/`, Explore SQL editors) are unrelated to Juice Shop `sequelize.query` product search and must not be patched to “satisfy” this ticket.

Related prior findings in this Grafana automation (same out-of-tree Juice Shop / SE bootcamp product):

- **JS-1** — order-preview object auth (`contribute/findings/JS-1.md`, PR #77)
- **JS-4** — GET order-preview IDOR (`contribute/findings/JS-4.md`, PR #78)
- **JS-5** — note PUT IDOR (`contribute/findings/JS-5.md`, PR #79)

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Parameterize `GET /rest/products/search` (`routes/search.ts`) | **Blocked** — file / route do not exist |
| Sweep sibling raw-query sink in `routes/login.ts` | **Blocked** — file does not exist |
| Regression test: search response must not leak user emails / password hashes | **Blocked** — endpoint and test harness absent |
| Human review before merge | **N/A for product fix here** — this PR is findings-only |

## What was not done (by design)

- Did **not** clone Juice Shop / `se-bootcamp-juice-shop` or scaffold `routes/search.ts` under Grafana.
- Did **not** change Grafana SQL, API, or auth code to simulate a Sequelize SQLi fix for a different product.
- Did **not** log credentials, tokens, connection strings, or reproduce credential-dumping payloads.
- Did **not** merge any PR.

## How to complete JS-8 (in the owning Juice Shop tree)

1. Open the Juice Shop / SE bootcamp repo that contains `routes/search.ts` and mounts `searchProducts()` on `GET /rest/products/search` (prior JS-* automation context: `liam-morrissy-cursor/se-bootcamp-juice-shop`). Confirm the cited commit / branch before editing.
2. Stop interpolating `req.query.q` (or derived `criteria`) into the SQL string. Pass user input via Sequelize `replacements` / `bind` (or an equivalent parameterized API).
3. Sweep `routes/login.ts` and other raw `sequelize.query` call sites for the same concatenation anti-pattern.
4. Add a regression test that a malicious `q` cannot cause the search JSON to include `Users` emails or password hashes.
5. Require human review before merge (ticket requirement).

## Related findings pattern

Same class of out-of-tree webhook tickets previously handled as findings-only in this Grafana automation (JS-1, JS-4, JS-5, NOP-*, Mattermost-shaped KAN-13/14/15/23).
