# NOP-1 findings: out of tree

**Issue:** NOP-1 — Frontend test backfill for jQuery → TypeScript  
**Status in this repo:** Cannot implement here.

## Verdict

NOP-1 describes a nopCommerce storefront/admin client test harness (Vitest/jsdom + Playwright characterization of `wwwroot/js`, AjaxCart HTML fragments, OPC `update_section`, admin DataTables, unobtrusive validation, CSRF, cascade selects). This workspace is the Grafana monorepo (`liam-morrissy-cursor/grafana`). None of those paths or products exist in this tree.

## What was checked

| Ticket target | Present in `/workspace`? |
| --- | --- |
| `src/Presentation/Nop.Web/wwwroot/js` | No |
| AjaxCart / OPC `update_section` contracts | No matches |
| nopCommerce / `Nop.Web` / `TESTING_GAPS` | No matches |
| jQuery → TypeScript migration canvas for nopCommerce | No |

Repo root is Grafana (Go backend, React frontend, `packages/grafana-*`, `public/app/`, etc.).

## Acceptance criteria (from webhook) vs this tree

| Criterion | This tree |
| --- | --- |
| Vitest/jsdom beside `dotnet test` | No .NET / nopCommerce solution |
| Playwright smokes on current jQuery as migration gate | No nopCommerce `wwwroot/js` |
| P0 checkout/cart + one admin grid coverage | No checkout/cart/admin grid JS under test |

## Recommended next step

Re-home or retarget NOP-1 to the nopCommerce repository that owns `src/Presentation/Nop.Web/`. Do not add a Grafana-side Vitest/Playwright harness for that product — it would be dead code in this monorepo.

## What this PR does not change

No Grafana runtime, SQL, Explore, or frontend package behavior. Documentation-only findings note under `contribute/findings/`.
