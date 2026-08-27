# NOP-5 findings — AjaxCart & product-attribute combination tests (out of tree)

**Ticket:** NOP-5 — `[P1] Backfill AjaxCart and product-attribute combination tests`  
**Repo searched:** `liam-morrissy-cursor/grafana` (this workspace)  
**Date:** 2026-08-27  
**Branch:** `agent/NOP-5-ajaxcart-combinations-findings` (from `main`)

## Verdict

**Cannot implement in this tree.** NOP-5 targets nopCommerce storefront JS (`AjaxCart`, `public.combinationsbehavior.js`) and `ShoppingCartController` anonymous JSON. Those paths are not present in the Grafana monorepo. Per `stay-in-this-repo`, this run did not clone another repository.

## Acceptance criteria vs this tree

| Criterion | Status in Grafana tree |
| --- | --- |
| jsdom: `success_process` swaps top cart HTML, wishlist HTML, and flyout `replaceWith` for fixture payloads | **Blocked** — `wwwroot/js/public.ajaxcart.js` missing |
| jsdom: success vs error chooses popup vs bar notification from `usepopupnotifications` | **Blocked** — same |
| jsdom: `redirect` sets `location` | **Blocked** — same |
| jsdom: attribute combinations disable values not in fixture response; re-run after injecting catalog HTML | **Blocked** — `wwwroot/js/public.combinationsbehavior.js` missing |
| Playwright: add-to-cart from catalog and product details; header quantity and flyout update | **Blocked** — Nop.Web catalog/PDP + cart chrome missing |

## Searches performed

From `/workspace`:

- ripgrep (js/cs/ts/tsx/md): `AjaxCart`, `success_process`, `combinationsbehavior`, `ShoppingCartController`, `_ProductAttributes` → **0 matches**
- glob: `**/public.ajaxcart.js`, `**/public.combinationsbehavior.js` → **0 files**

No `src/Presentation/Nop.Web/`, no `wwwroot/js/public.*.js` cart scripts, and no `Controllers/ShoppingCartController.cs`.

## Out-of-tree targets named by the ticket

Implement only in a nopCommerce / Nop.Web checkout (not this repo):

- `wwwroot/js/public.ajaxcart.js` — `AjaxCart.success_process` (`.html()` / `.replaceWith()` on header selectors; popup vs bar via `usepopupnotifications`; `redirect` → `location`)
- `wwwroot/js/public.combinationsbehavior.js` — GET combinations; disable unavailable attribute values; re-bind after catalog HTML inject
- `Controllers/ShoppingCartController.cs` — anonymous JSON: `updatetopcartsectionhtml`, `updateflyoutcartsectionhtml`, `message`, `redirect`
- Product `_ProductAttributes` inline scripts / views calling `AjaxCart.*` from `onclick`
- Test stack: Vitest/jsdom (depends on NOP-2), Playwright (depends on NOP-3); epic NOP-1

## What this PR does / does not do

- **Does:** Record findings so NOP-5 is not mistaken for in-tree Grafana work.
- **Does not:** Add jsdom or Playwright coverage here, invent Nop.Web under Grafana, or change Grafana SQL/UI modules.

## Suggested next step (outside this automation)

Re-run NOP-5 against the nopCommerce repository that owns `Nop.Web`, with NOP-2/NOP-3 test harnesses available. Do not expect merges into `liam-morrissy-cursor/grafana` to satisfy the AjaxCart acceptance criteria.

## Related

- Epic: NOP-1  
- Dependencies: NOP-2 (jsdom), NOP-3 (browser)  
- Prior findings pattern: `contribute/findings/NOP-*.md` (NOP-1 / NOP-2 PRs on this fork)
