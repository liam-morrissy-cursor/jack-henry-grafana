# PROG-53 — Lock PriceCalculationService.Round banker's midpoints (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket targets nopCommerce’s `PriceCalculationService.Round` / `CanRound` banker's midpoint and cash-rounding coverage in `src/Tests/Nop.Tests/Nop.Services.Tests/Catalog/PriceCalculationServiceTests.cs`. Those paths and symbols do not exist in this Grafana monorepo.

Epic referenced on the ticket: **PROG-52**. Prior related findings on this checkout: **NOP-12** (`contribute/findings/NOP-12.md` / PR #84) covered the same `PriceCalculationService.Round` surface under a different key. Ticket text says do **not** duplicate NOP-12 work on the bootcamp repo — this findings note is for *this* Grafana checkout only. Do not scaffold nopCommerce under Grafana.

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | PROG-53 |
| Summary | `test: lock PriceCalculationService.Round banker's midpoints` |
| Ask | Assert ToEven midpoints under `Rounding001`; add missing cash-rounding midpoints; keep tests failing on banker's / cash midpoint regressions |

### Acceptance criteria (webhook)

1. `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests` passes
2. New tests fail if banker's rounding or cash midpoints regress
3. PR Test plan: **N/A — logic-only**
4. Open a PR

### Required asserts (webhook)

Under **`Rounding001`** (banker's / `MidpointRounding.ToEven`):

| Input | Expected |
| --- | --- |
| `1.225` | `1.22` |
| `2.005` | `2.00` |
| `2.015` | `2.02` |
| `12.365` | `12.36` |

Missing cash-rounding midpoints called out on the ticket:

| Rounding mode | Midpoint example |
| --- | --- |
| `Rounding005Down` | `12.35` |
| `Rounding01Up` / `Rounding01Down` | `12.05` |

Context: `Math.Round(value, 2)` uses `MidpointRounding.ToEven`. `CanRound` never locks banker's midpoints. A Rust port using `rust_decimal` defaults (away-from-zero) would silently drift catalog prices by a cent.

## What was searched in this tree

Commands run from `/workspace` on `main` (branched as `agent/PROG-53-price-rounding-findings`):

| Search | Result |
| --- | --- |
| `PriceCalculationService` (content + glob) | **0 matches / 0 files** |
| `PriceCalculationServiceTests` | **absent** |
| `Rounding001` / `Rounding005Down` / `Rounding01Up` / `Rounding01Down` / `CanRound` | **0 matches** |
| `src/Tests/Nop.Tests/` | **absent** |
| nopCommerce-shaped roots: `src/Presentation/Nop.Web/`, `src/Libraries/Nop.Services/` | **absent** |

Grafana has pricing/billing surfaces of its own. Those are **not** nopCommerce `PriceCalculationService.Round` / banker's midpoint / cash-rounding enums named in the ticket. Inventing a fake C# `PriceCalculationService` under Grafana would not satisfy PROG-53 and would violate stay-in-this-repo.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Extend `PriceCalculationServiceTests.cs` with `Rounding001` ToEven midpoints (`1.225→1.22`, `2.005→2.00`, `2.015→2.02`, `12.365→12.36`) | **Blocked** — source and test files do not exist |
| Add cash midpoint cases (`12.35` under `Rounding005Down`, `12.05` under `Rounding01Up`/`Rounding01Down`) | **Blocked** — no cash-rounding enum / `Round` implementation here |
| Tests fail if banker's or cash midpoints regress | **Blocked** — no NUnit host |
| `dotnet test ...~PriceCalculationServiceTests` passes | **Blocked** — no `Nop.Tests.csproj` / .NET nopCommerce test host |

## What was not done (by design)

- Did **not** scaffold `src/Tests/Nop.Tests/`, `PriceCalculationService`, or NUnit fixtures under Grafana.
- Did **not** clone a nopCommerce or bootcamp repository (workspace **stay-in-this-repo**).
- Did **not** change Grafana product code, CI, or frontend/backend tests.
- Did **not** re-implement NOP-12 asserts in another repo; this PR only records findings for PROG-53 on this checkout.

## How to complete PROG-53 (in the owning repo)

1. Open the nopCommerce checkout that owns `PriceCalculationService` and `PriceCalculationServiceTests.cs`.
2. Under `Rounding001`, assert ToEven midpoints: `1.225→1.22`, `2.005→2.00`, `2.015→2.02`, `12.365→12.36`.
3. Add cash-rounding midpoint coverage (e.g. `12.35` under `Rounding005Down`, `12.05` under `Rounding01Up` / `Rounding01Down`).
4. Confirm `CanRound` / `Round` stay on `MidpointRounding.ToEven` so a `rust_decimal` away-from-zero port cannot silently pass.
5. Run: `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests`.

## Related findings

- NOP-12 — same `PriceCalculationService.Round` / ToEven / cash-rounding surface (prior key; PR #84 on this repo)
- NOP-13 — `GetFinalPriceAsync` golden fixtures (same NUnit host; also out of tree)
- NOP-10 — `PaymentServiceTests` / `IPaymentService` out of tree
