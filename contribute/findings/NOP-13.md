# NOP-13 — Golden fixtures for GetFinalPriceAsync (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket targets nopCommerce’s `GetFinalPriceAsync` regression canary (C# / NUnit) and JSON golden fixtures next to `PriceCalculationServiceTests` (or a shared fixtures dir for Wave 3 parity). Those paths and symbols do not exist in this Grafana monorepo.

Epic referenced on the ticket: **NOP-11**. Related prior findings: **NOP-12** (`PriceCalculationService.Round` / same `PriceCalculationServiceTests.cs` host), **NOP-10** (`PaymentServiceTests` / `IPaymentService` — also out of tree). Do not duplicate **NOP-10** or re-implement **NOP-12**.

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | NOP-13 |
| Summary | `test: golden fixtures for GetFinalPriceAsync` |
| Ask | Commit JSON fixtures for existing `GetFinalPriceAsync` cases (base price, qty tiers, additional fee, discount, customer-role tiers); keep fixtures next to `PriceCalculationServiceTests` or under a shared fixtures dir Wave 3 can reuse; do not change `GetFinalPriceAsync` control flow |

### Acceptance criteria (webhook)

1. Fixtures record `79.99`, `19`, `17`, `84.99`, `69.99` vs `79.99` without-discount, and role-tier `30/25/20/15`
2. `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests` passes and reads those fixtures
3. New tests fail if a fixture price changes by a cent
4. PR Test plan: **N/A — logic-only**
5. Open a PR

## What was searched in this tree

Commands run from `/workspace` on `main` (branched as `agent/NOP-13-get-final-price-fixtures-findings`):

| Search | Result |
| --- | --- |
| `GetFinalPriceAsync` | **0 matches** |
| `PriceCalculationService` / `PriceCalculationServiceTests` | **0 matches** |
| `BP_20_WSP` / `NK_ZSJ_MM` (SKU-coupled expects named on ticket) | **0 matches** |
| `src/Tests/Nop.Tests/` / `Nop.Tests.csproj` | **absent** |
| nopCommerce-shaped roots: `src/Presentation/Nop.Web/`, `src/Libraries/Nop.Services/` | **absent** |
| `*.cs` product sources | **none** (only unrelated `node_modules` tooling) |

Grafana has pricing/billing surfaces of its own (cloud/enterprise paths, panel pricing UX, etc.). Those are **not** nopCommerce `GetFinalPriceAsync` / SKU fixtures (`BP_20_WSP`, `NK_ZSJ_MM`) / role-tier canaries named in the ticket. Inventing fake C# fixtures under Grafana would not satisfy NOP-13 and would violate stay-in-this-repo.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| JSON fixtures for base / qty / fee / discount / role-tier expects (`79.99`, `19`, `17`, `84.99`, `69.99` vs `79.99`, role `30/25/20/15`) | **Blocked** — no `GetFinalPriceAsync` cases or fixture host here |
| Tests next to `PriceCalculationServiceTests` (or shared fixtures dir) read those fixtures | **Blocked** — `PriceCalculationServiceTests` / `Nop.Tests` absent |
| `dotnet test ...~PriceCalculationServiceTests` passes | **Blocked** — no `Nop.Tests.csproj` / .NET nopCommerce test host |
| Tests fail if a fixture price changes by a cent | **Blocked** — no fixture-driven NUnit path in this tree |
| Do not change `GetFinalPriceAsync` control flow | **N/A** — method not present; nothing to leave untouched |
| Do not duplicate NOP-10 | **Honored** — findings-only; no payment-service work |

## What was not done (by design)

- Did **not** scaffold `src/Tests/Nop.Tests/`, JSON price fixtures, or NUnit harness under Grafana.
- Did **not** clone a nopCommerce repository (workspace **stay-in-this-repo**).
- Did **not** change Grafana product code, CI, or frontend/backend tests.
- Did **not** change any `GetFinalPriceAsync` control flow (absent).
- Did **not** re-open or duplicate NOP-10 / NOP-12 beyond cross-reference.

## How to complete NOP-13 (in the owning repo)

1. Open the nopCommerce checkout that owns `GetFinalPriceAsync` and `PriceCalculationServiceTests`.
2. Extract the existing SKU-coupled expects (`BP_20_WSP`, `NK_ZSJ_MM`, etc.) into JSON fixtures recording at least: base `79.99`, qty tiers `19` / `17`, additional fee `84.99`, discount `69.99` vs without-discount `79.99`, and customer-role tiers `30` / `25` / `20` / `15`.
3. Place fixtures next to `PriceCalculationServiceTests` or under a shared fixtures directory Wave 3 Rust `Round` parity can reuse.
4. Wire `PriceCalculationServiceTests` to load those fixtures; assert cent-level equality so a one-cent fixture drift fails the suite.
5. Do **not** change `GetFinalPriceAsync` control flow; do **not** duplicate NOP-10.
6. Run: `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests`.

## Related findings

- NOP-12 — `PriceCalculationService.Round` / same `PriceCalculationServiceTests` host out of tree
- NOP-10 — `PaymentServiceTests` / `IPaymentService` out of tree (same nopCommerce test tree)
- NOP-1 / NOP-2 / NOP-5 — other nopCommerce surfaces out of tree
