# NOP-12 — Characterize PriceCalculationService.Round midpoints and cash rounding (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket targets nopCommerce’s `PriceCalculationService.Round` / `CanRound` behavior and NUnit coverage in `src/Tests/Nop.Tests/Nop.Services.Tests/Catalog/PriceCalculationServiceTests.cs`. Those paths and symbols do not exist in this Grafana monorepo.

Epic referenced on the ticket: **NOP-11**. Related prior findings: **NOP-10** (`PaymentServiceTests` / `IPaymentService` — also out of tree). Do not duplicate NOP-10.

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | NOP-12 |
| Summary | `test: characterize PriceCalculationService.Round midpoints and cash rounding` |
| Ask | Lock ToEven midpoints (`1.225 → 1.22`, `2.225 → 2.22`) for `Rounding001`, keep cash-rounding cases, fix tautology in `GetFinalPrice` qty=2 |

### Acceptance criteria (webhook)

1. `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests` passes
2. New tests fail if `Round(1.225, Rounding001)` returns `1.23` / `1.23M` instead of `1.22`
3. PR Test plan: **N/A — logic-only**
4. Open a PR

## What was searched in this tree

Commands run from `/workspace` on `main` (branched as `agent/NOP-12-price-rounding-findings`):

| Search | Result |
| --- | --- |
| `PriceCalculationService` (content + glob) | **0 matches / 0 files** |
| `PriceCalculationServiceTests` | **absent** |
| `Rounding001` / `Rounding005Up` / `CanRound` | **0 matches** |
| `src/Tests/Nop.Tests/` | **absent** |
| nopCommerce-shaped roots: `src/Presentation/Nop.Web/`, `src/Libraries/Nop.Services/` | **absent** |

Grafana has pricing/billing surfaces of its own (cloud/enterprise paths, panel pricing UX, etc.). Those are **not** nopCommerce `PriceCalculationService.Round` / banker’s midpoint / cash-rounding enums named in the ticket. Inventing a fake C# `PriceCalculationService` under Grafana would not satisfy NOP-12 and would violate stay-in-this-repo.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Extend `PriceCalculationServiceTests.cs` with ToEven midpoint + cash-rounding asserts | **Blocked** — source and test files do not exist |
| Midpoint `1.225 → 1.22` fails if implementation returns `1.23` | **Blocked** — no `Round(..., Rounding001)` implementation here |
| Fix tautology so `GetFinalPrice` qty=2 compares to expected value | **Blocked** — no `GetFinalPrice` under Nop.Services here |
| `dotnet test ...~PriceCalculationServiceTests` passes | **Blocked** — no `Nop.Tests.csproj` / .NET nopCommerce test host |

## What was not done (by design)

- Did **not** scaffold `src/Tests/Nop.Tests/`, `PriceCalculationService`, or NUnit fixtures under Grafana.
- Did **not** clone a nopCommerce repository (workspace **stay-in-this-repo**).
- Did **not** change Grafana product code, CI, or frontend/backend tests.
- Did **not** re-open or duplicate NOP-10 payment-service findings beyond cross-reference.

## How to complete NOP-12 (in the owning repo)

1. Open the nopCommerce checkout that owns `PriceCalculationService` and `PriceCalculationServiceTests.cs`.
2. Assert ToEven midpoints for `Rounding001` (at least `1.225 → 1.22`, `2.225 → 2.22`, plus other known midpoints).
3. Keep existing cash-rounding cases (`Rounding005Up` through `Rounding1Up`) green.
4. Replace the tautology at the `GetFinalPrice` qty=2 assert so `finalPrice` is compared to the real expected value (not to itself).
5. Run: `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests`.

## Related findings

- NOP-10 — `PaymentServiceTests` / `IPaymentService` out of tree (same nopCommerce test tree)
- NOP-1 / NOP-2 / NOP-5 — other nopCommerce surfaces out of tree
