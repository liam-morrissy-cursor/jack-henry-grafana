# JS-9 — Unauthenticated login SQL injection (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket targets an OWASP Juice Shop–style storefront sink: unauthenticated `POST /rest/user/login` where `req.body.email` (and a hashed password) are concatenated into a raw `sequelize.query()` string in `routes/login.ts`, allowing authentication bypass via a tautology in the email predicate. That route, Sequelize login handler, and `afterLogin` JWT issuance path do not exist in this Grafana monorepo.

Workspace rule **stay-in-this-repo** forbids cloning or switching to another repository unless explicitly asked. Prior JS-* work in this automation owned the same class of product under `liam-morrissy-cursor/se-bootcamp-juice-shop`. Per automation guidance: when the code path is absent here, open a findings PR and stop.

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | JS-9 |
| Summary | `[CRITICAL] SQL injection in login authenticates as any user without a password` |
| Status at trigger | In Progress |
| Severity / CWE | Critical / CWE-89 |
| OWASP | A03:2021 Injection |
| Asset (webhook) | juice-shop-demo storefront |
| Endpoint | `POST /rest/user/login` |
| Location | `routes/login.ts` |
| Cited commit | `5d76b05c8c09a76186a72c8048554f3218e7f0c9` |
| Source | Scheduled AppSec review |
| Sibling finding | JS-8 (`routes/search.ts`) |

### Remediation asked (webhook)

1. Parameterize both predicates with Sequelize `replacements` or `bind` — do not interpolate user input into the SQL string. Keep hashing out of the query string.
2. Treat as the same anti-pattern class as JS-8 (`routes/search.ts`). Fix both in one sweep.
3. Add a regression test that this endpoint does not issue a session for injected email predicates.
4. Human review required before merge.

## What was searched in this tree

Commands run from `/workspace` on `main` @ `b5ab5f271c0` (branch `agent/JS-9-login-sqli-findings-v2`, re-verified 2026-08-30):

| Search | Result |
| --- | --- |
| `rest/user/login` / `afterLogin` / `sequelize` / `juice-shop` / `/rest/user` | **0 matches** |
| Glob / path `routes/login.ts` | **absent** |
| Glob `**/login.ts` (excluding `node_modules` / `.git`) | **absent** |
| Juice Shop Express login / product-search raw-query routes | **absent** |

Closest Grafana surfaces (`packages/grafana-sql`, `pkg/tsdb/`, Grafana auth / login handlers under `pkg/services/authn` and related) are unrelated to Juice Shop `sequelize.query` login and must not be patched to “satisfy” this ticket.

Related prior findings in this Grafana automation (same out-of-tree Juice Shop / SE bootcamp product):

- **JS-1** — order-preview object auth (`contribute/findings/JS-1.md`, PR #77)
- **JS-4** — GET order-preview IDOR (`contribute/findings/JS-4.md`, PR #78)
- **JS-5** — note PUT IDOR (`contribute/findings/JS-5.md`, PR #79)
- **JS-8** — product-search SQLi (`contribute/findings/JS-8.md`, PRs #80 / #82) — sibling of this ticket
- Prior JS-9 findings PR: https://github.com/liam-morrissy-cursor/grafana/pull/81

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Parameterize `POST /rest/user/login` (`routes/login.ts`) | **Blocked** — file / route do not exist |
| Sweep sibling raw-query sink in `routes/search.ts` (JS-8) | **Blocked** — file does not exist (see JS-8 findings) |
| Regression test: injected email predicates must not issue a session JWT | **Blocked** — endpoint and test harness absent |
| Human review before merge | **N/A for product fix here** — this PR is findings-only |

## What was not done (by design)

- Did **not** clone Juice Shop / `se-bootcamp-juice-shop` or scaffold `routes/login.ts` under Grafana.
- Did **not** change Grafana SQL, API, or auth code to simulate a Sequelize SQLi fix for a different product.
- Did **not** log credentials, tokens, connection strings, or reproduce authentication-bypass payloads.
- Did **not** merge any PR.

## How to complete JS-9 (in the owning Juice Shop tree)

1. Open the Juice Shop / SE bootcamp repo that contains `routes/login.ts` and mounts `login()` on `POST /rest/user/login` (prior JS-* automation context: `liam-morrissy-cursor/se-bootcamp-juice-shop`). Confirm the cited commit / branch before editing.
2. Stop interpolating `req.body.email` and password-hash material into the SQL string. Pass both predicates via Sequelize `replacements` / `bind` (or an equivalent parameterized API). Keep password hashing outside the query string construction.
3. Sweep `routes/search.ts` (JS-8) and other raw `sequelize.query` call sites for the same concatenation anti-pattern in one pass.
4. Add a regression test that a malicious `email` body value cannot cause `afterLogin` to issue a session JWT for an injected predicate.
5. Require human review before merge (ticket requirement).

## Related findings pattern

Same class of out-of-tree webhook tickets previously handled as findings-only in this Grafana automation (JS-1, JS-4, JS-5, JS-8, NOP-*, Mattermost-shaped KAN-13/14/15/23).
