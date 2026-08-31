# PROG-63 — Golden fixtures for ParseSearchParams Unicode / quote splits (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket targets Mattermost-shaped Go model search parsing: golden fixtures in `search_params_test.go` for `ParseSearchParams` / `splitWords` (Unicode quote splits, CJK hashtags, accented tags, emoji in quotes), verified with `cd server/public && go test ./model ...`. Those paths and symbols do not exist in this Grafana monorepo.

Epic referenced on the ticket: **PROG-61**. Ticket says do not duplicate **PROG-52–60**. Related prior Mattermost-shaped findings in this checkout: **KAN-13** / **KAN-14** / **KAN-15** / **KAN-23**. Do not scaffold Mattermost `server/public/model` under Grafana.

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | PROG-63 |
| Summary | `test: golden fixtures for ParseSearchParams Unicode and quote splits` |
| Ask | Add golden fixtures to `search_params_test.go` for `ParseSearchParams` and `splitWords`; cover quoted multi-byte strings, CJK hashtags (`#日本語`), accented tags, emoji in quotes; assert full `[]*SearchParams` output (not just term counts) |

### Acceptance criteria (webhook)

1. `cd server/public && go test ./model -count=1 -run 'TestParseSearchParams|TestSplitWords|TestParseSearchFlags2'` passes
2. New tests fail if Unicode quote-split or hashtag bucketing regresses
3. PR Test plan: **N/A — logic-only**
4. Open a PR
5. Do not duplicate PROG-52–60

## What was searched in this tree

Commands run from `/workspace` on `main` (branched as `agent/PROG-63-parse-search-params-findings`):

| Search | Result |
| --- | --- |
| `ParseSearchParams` | **0 matches** |
| `splitWords` / `validHashtag` / `TestSplitWords` / `TestParseSearchFlags2` | **0 matches** |
| `search_params_test.go` / `search_params.go` | **absent** |
| `server/public/` / `server/channels/` | **absent** |
| Mattermost-shaped roots named by related tickets | **absent** |

Grafana has URL / location `SearchParams` helpers under `packages/grafana-data` and many Playwright suites that mention “search” in UI flows. Those are **not** Mattermost `ParseSearchParams` / `splitWords` / hashtag bucketing / `[]*SearchParams` goldens named in the ticket. Inventing fake `server/public/model` tests under Grafana would not satisfy PROG-63 and would violate stay-in-this-repo.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Golden fixtures in `search_params_test.go` for quoted multi-byte / CJK hashtag / accented tags / emoji-in-quotes | **Blocked** — no `search_params_test.go` or `ParseSearchParams` / `splitWords` |
| Assert full `[]*SearchParams` output (not just term counts) | **Blocked** — no Mattermost `SearchParams` model type here |
| `cd server/public && go test ./model -count=1 -run 'TestParseSearchParams\|TestSplitWords\|TestParseSearchFlags2'` | **Blocked** — no `server/public` / `./model` package |
| New tests fail on Unicode quote-split or hashtag bucketing regression | **Blocked** — no Unicode search-params goldens host in this tree |
| Do not duplicate PROG-52–60 | **Honored** — findings-only; no nopCommerce / Mattermost scaffolding |
| PR Test plan: N/A — logic-only | **Honored** on this findings PR |

## What was not done (by design)

- Did **not** scaffold `server/public/model`, `search_params_test.go`, or Mattermost Go packages under Grafana.
- Did **not** clone a Mattermost (or other) repository (workspace **stay-in-this-repo**).
- Did **not** change Grafana product code, CI, or frontend/backend tests.
- Did **not** invent Unicode/quote-split fixtures against Grafana URL `SearchParams` helpers (wrong API surface).
- Did **not** reopen or duplicate PROG-52–60 / KAN-13–15 / KAN-23 beyond cross-reference.

## How to complete PROG-63 (in the owning repo)

1. Open the Mattermost (or bootcamp) checkout that owns `server/public/model` (`ParseSearchParams`, `splitWords`, `validHashtag`).
2. Add golden fixtures to `search_params_test.go` covering:
   - quoted multi-byte / CJK strings
   - CJK hashtags such as `#日本語`
   - accented tags
   - emoji inside quotes
3. Assert the full `[]*SearchParams` slice (terms, flags, hashtag buckets), not only term counts — so UTF-8 vs UTF-16 quote-split or hashtag bucketing regressions fail.
4. Avoid duplicating PROG-52–60 coverage.
5. Run: `cd server/public && go test ./model -count=1 -run 'TestParseSearchParams|TestSplitWords|TestParseSearchFlags2'`.

## Related findings

- KAN-13 — Mattermost epic / out-of-tree board surfaces
- KAN-14 — Mattermost `POST /api/v4/posts` out of tree
- KAN-15 — Mattermost `SiteURL` / local boot out of tree
- KAN-23 — Mattermost `published_modals` / `WebappUtils.modals` out of tree
