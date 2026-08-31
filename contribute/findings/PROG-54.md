# PROG-54 — Golden GetFinalPriceAsync fixtures (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket targets nopCommerce’s `GetFinalPriceAsync` regression canary (C# / NUnit) and committed golden JSON fixtures under `src/Tests/Nop.Tests/`. Those paths and symbols do not exist in this Grafana monorepo.

Epic referenced on the ticket: **PROG-52**. Prior related findings on this checkout: **NOP-13** (`contribute/findings/NOP-13.md` / PR #85) covered the same `GetFinalPriceAsync` golden-fixture surface under a different key; **PROG-53** / **NOP-12** cover `PriceCalculationService.Round` on the same `PriceCalculationServiceTests` host. Ticket text says do **not** duplicate NOP-13 on the bootcamp repo — this findings note is for *this* Grafana checkout only. Do not scaffold nopCommerce under Grafana.

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | PROG-54 |
| Summary | `test: golden GetFinalPriceAsync fixtures` |
| Ask | Replace magic-number expects with committed golden JSON under `src/Tests/Nop.Tests/`; fix the line-53 tautology (`finalPriceWithoutDiscounts.Should().Be(finalPriceWithoutDiscounts)`) by asserting `19M` without-discount at qty=2 on `BP_20_WSP`; add a fixture that locks the current `(float)` attribute-adjustment result as oracle; do not change production pricing code |

### Acceptance criteria (webhook)

1. `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests` passes
2. Fixtures are shared/readable (not inline magic numbers only)
3. PR Test plan: **N/A — logic-only**
4. Open a PR

### Context from ticket description

- `GetFinalPriceAsync` stays the C# regression canary.
- Current expects are magic numbers on SKUs `BP_20_WSP` / `NK_ZSJ_MM`.
- Line 53 is a tautology: `finalPriceWithoutDiscounts.Should().Be(finalPriceWithoutDiscounts)`.
- Attribute `%` adjustment uses `(float)` casts with no test — porting with pure `decimal` would change production prices; lock the current float-cast result via fixture, do not change production code.

## What was searched in this tree

Commands run from `/workspace` on `main` (branched as `agent/PROG-54-get-final-price-fixtures-findings`):

| Search | Result |
| --- | --- |
| `GetFinalPriceAsync` | **0 matches** |
| `PriceCalculationService` / `PriceCalculationServiceTests` | **0 matches** |
| `BP_20_WSP` / `NK_ZSJ_MM` | **0 matches** |
| `src/Tests/Nop.Tests/` / `Nop.Tests.csproj` | **absent** |
| nopCommerce-shaped roots: `src/Presentation/Nop.Web/`, `src/Libraries/Nop.Services/` | **absent** |
| Product `*.cs` sources (excluding tooling) | **none** |

Grafana has pricing/billing surfaces of its own. Those are **not** nopCommerce `GetFinalPriceAsync` / SKU fixtures (`BP_20_WSP`, `NK_ZSJ_MM`) / float attribute-adjustment canaries named in the ticket. Inventing fake C# fixtures under Grafana would not satisfy PROG-54 and would violate stay-in-this-repo.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Replace magic numbers with golden JSON under `src/Tests/Nop.Tests/` | **Blocked** — no `Nop.Tests` tree / fixture host |
| Fix line-53 tautology: assert `19M` without-discount at qty=2 on `BP_20_WSP` | **Blocked** — `PriceCalculationServiceTests` absent |
| Fixture locking current `(float)` attribute-adjustment oracle (no production change) | **Blocked** — no attribute-adjustment / `GetFinalPriceAsync` implementation here |
| `dotnet test ...~PriceCalculationServiceTests` passes | **Blocked** — no `Nop.Tests.csproj` / .NET nopCommerce test host |
| Fixtures shared/readable | **Blocked** — nothing to extract in this tree |
| Do not duplicate NOP-13 on bootcamp | **Honored** — findings-only on this Grafana checkout; no bootcamp clone |

## What was not done (by design)

- Did **not** scaffold `src/Tests/Nop.Tests/`, JSON price fixtures, or NUnit harness under Grafana.
- Did **not** clone a nopCommerce or bootcamp repository (workspace **stay-in-this-repo**).
- Did **not** change Grafana product code, CI, or frontend/backend tests.
- Did **not** change any production `(float)` attribute-adjustment path (absent).
- Did **not** re-implement NOP-13 asserts in another repo; this PR only records findings for PROG-54 on this checkout.

## How to complete PROG-54 (in the owning repo)

1. Open the nopCommerce checkout that owns `GetFinalPriceAsync` and `PriceCalculationServiceTests`.
2. Extract SKU-coupled magic expects (`BP_20_WSP`, `NK_ZSJ_MM`, etc.) into committed golden JSON under `src/Tests/Nop.Tests/` (or a shared fixtures dir next to those tests).
3. Replace the line-53 tautology with an assert that without-discount price is `19M` at qty=2 on `BP_20_WSP`.
4. Add a fixture that records the current `(float)` attribute-% adjustment result as the oracle; do **not** change production pricing to pure `decimal`.
5. Wire `PriceCalculationServiceTests` to load the fixtures; keep cent-level / float-oracle equality so drift fails the suite.
6. Do **not** duplicate NOP-13 work already done on the bootcamp repo if that landed separately.
7. Run: `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests`.

## Related findings

- NOP-13 — same `GetFinalPriceAsync` golden-fixture surface (PR #85 / `contribute/findings/NOP-13.md`)
- PROG-53 / NOP-12 — `PriceCalculationService.Round` / same `PriceCalculationServiceTests` host
- NOP-10 — `PaymentServiceTests` / `IPaymentService` (same nopCommerce test tree; do not duplicate)
