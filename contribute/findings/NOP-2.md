# NOP-2 findings — cannot implement in this tree

**Issue:** NOP-2 — [P0] Add Vitest and jsdom for first-party JavaScript  
**Repo checked:** `liam-morrissy-cursor/grafana` (this workspace)  
**Verdict:** Out of scope for this repository. No code change applied.

## Why

NOP-2 targets the **nopCommerce** front-end package:

| Ticket path | Present here? |
| --- | --- |
| `src/Presentation/Nop.Web/package.json` | No |
| `src/Presentation/Nop.Web/wwwroot/js/public.common.js` (`addAntiForgeryToken`, `htmlEncode` / `htmlDecode`) | No |
| Nop.Web Gulp / frontend test runner | No |

A workspace search found **zero** matches for `Nop.Web`, `addAntiForgeryToken`, or `NOP-2`. This monorepo is Grafana (Go + React/Yarn), not nopCommerce.

Workspace rule **stay-in-this-repo** requires implementing tickets only in this tree and forbids cloning another repository unless explicitly asked. Therefore this automation opens a findings PR instead of scaffolding a fake Nop.Web tree under Grafana.

## Acceptance criteria (ticket) vs status

| Criterion | Status in this tree |
| --- | --- |
| Vitest (or equivalent) is a devDependency of Nop.Web and can run locally | **Blocked** — Nop.Web package missing |
| At least one test covers `addAntiForgeryToken` reading `__RequestVerificationToken` from a DOM fixture | **Blocked** — `public.common.js` missing |
| At least one test covers `htmlEncode` / `htmlDecode` | **Blocked** — source missing |
| CI runs this suite alongside `dotnet test` and fails the build on failure | **Blocked** — no `dotnet` / Nop.Web CI surface here |

## What would be needed to complete NOP-2

1. Point the automation (or a human) at the **nopCommerce** repository that contains `src/Presentation/Nop.Web/`.
2. There: add Vitest + jsdom to Nop.Web `package.json`, write the sample tests against `public.common.js`, and add a CI job next to `dotnet test`.
3. Do **not** add Vitest for Nop.Web inside Grafana — that would be a false implementation and would not satisfy the ticket.

## What did not change

- No Grafana packages, CI workflows, or frontend test config were modified.
- No secrets, tokens, or connection strings were logged or committed.
