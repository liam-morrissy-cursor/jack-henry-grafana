# NOP-15 — Wire sidecar into PriceCalculationService.Round behind rollback flag (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket asks to route production `PriceCalculationService.Round` through an existing Rust/nop-round sidecar when a rollback feature flag is **on**, leaving `GetFinalPriceAsync` in C# (still calling `Round`) and leaving cart/order totals/tax/shipping alone. That production surface lives under `src/Libraries/Nop.Services/Catalog/PriceCalculationService.cs` and depends on NOP-12 (Round characterization) and NOP-14 (sidecar/adapter). This workspace is the Grafana monorepo: there is no `Nop.Services` catalog pricing code, no Round/sidecar adapter, and no nopCommerce feature-flag host. Workspace rule **stay-in-this-repo** forbids cloning another repository to implement the ticket here. Do **not** invent a C# price service, feature flag, or sidecar wiring under Grafana.

Epic: **NOP-11**. Depends on: **NOP-12**, **NOP-14**. Related prior findings on this checkout: **NOP-12** (PR #84), **NOP-13** (PR #85), **PROG-55** (PR #89), **PROG-58** (PR #90).

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | NOP-15 |
| Summary | Wire sidecar into PriceCalculationService.Round behind a rollback flag |
| Ask | Only production wiring in the epic: route `Round` through the sidecar when a rollback flag is on; flag defaults off; do not change `GetFinalPriceAsync` control flow / discount / tier logic; do not port cart, order totals, tax, or shipping |
| Size | M |

### Acceptance criteria (webhook)

1. Flag **off**: existing `PriceCalculationServiceTests` still pass (same as today)
2. Flag **on**: `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests` passes after NOP-12/NOP-13
3. New tests fail if the flag-on path skips the sidecar or returns a different cent
4. PR Test plan: **N/A — logic-only**
5. Open a PR

### Requirements (webhook)

- Wire the sidecar into `src/Libraries/Nop.Services/Catalog/PriceCalculationService.cs` `Round` **only**
- Feature flag defaults **off**; flag-on uses the sidecar
- Do not change `GetFinalPriceAsync` control flow, discount, or tier logic
- Do not port cart, order totals, tax, or shipping

## What was searched in this tree

Commands run from `/workspace` on `main` (branched as `agent/NOP-15-round-sidecar-wiring-findings`):

| Search | Result |
| --- | --- |
| `PriceCalculationService` / `PriceCalculationServiceTests` | **0 matches** (no `.cs` sources) |
| `GetFinalPriceAsync` | **0 matches** |
| `src/Libraries/Nop.Services/Catalog/PriceCalculationService.cs` | **absent** |
| `src/Tests/Nop.Tests/Nop.Tests.csproj` | **absent** |
| Root `Cargo.toml` / `nop-round` | **absent** |
| nopCommerce-shaped roots: `src/Presentation/Nop.Web/`, `src/Libraries/Nop.Services/` | **absent** |

Note: the agent VM may have `rustc` / `cargo` / `dotnet` available. That does **not** make Grafana the owning product for nopCommerce `Round` sidecar wiring. Scaffolding a fake `PriceCalculationService`, feature flag, or Rust adapter here would not satisfy NOP-15 (no C# baseline Round, no NOP-14 adapter, no NUnit host) and would pollute an unrelated monorepo.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Flag off: existing `PriceCalculationServiceTests` still pass | **Blocked** — no `Nop.Tests` / `PriceCalculationService` |
| Flag on: filtered `dotnet test ...~PriceCalculationServiceTests` passes | **Blocked** — no .NET nopCommerce test host or sidecar wiring |
| New tests fail if flag-on skips sidecar or returns a different cent | **Blocked** — no production Round path or flag to instrument |
| PR Test plan: N/A — logic-only | **Met** for this findings PR (no product behavior change) |
| Open a PR | **Met** — findings PR on this checkout |

## What was not done (by design)

- Did **not** scaffold `src/Libraries/Nop.Services/`, a Round feature flag, or a sidecar process under Grafana.
- Did **not** invent a C#→Rust Round adapter or mutate Grafana feature toggles to stand in for nopCommerce rollback flags.
- Did **not** clone a nopCommerce or bootcamp repository (**stay-in-this-repo**).
- Did **not** change Grafana product code, CI, frontend, or backend tests.
- Did **not** re-implement NOP-12 / NOP-13 / NOP-14 / PROG-55 / PROG-56 work here.

## How to complete NOP-15 (in the owning repo)

1. Open the nopCommerce / bootcamp checkout that owns `PriceCalculationService`, the NOP-14 sidecar/adapter, and `PriceCalculationServiceTests`.
2. Add a rollback feature flag that defaults **off**.
3. In `PriceCalculationService.Round` only: when the flag is on, call the sidecar/adapter; when off, keep the existing C# Round path.
4. Leave `GetFinalPriceAsync` control flow, discount, and tier logic unchanged (it should continue to call `Round`).
5. Do not port cart, order totals, tax, or shipping through the sidecar.
6. Verify flag off: existing suite behavior unchanged.
7. Verify flag on: `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests` passes (after NOP-12/NOP-13).
8. Add tests that fail if the flag-on path skips the sidecar or returns a different cent.
9. Record Test plan as **N/A — logic-only** with the commands above.

## Related findings

- NOP-12 — `PriceCalculationService.Round` characterization (PR #84 / `contribute/findings/NOP-12.md`)
- NOP-13 — `GetFinalPriceAsync` golden fixtures (PR #85 / `contribute/findings/NOP-13.md`)
- PROG-55 — Rust `nop-round` crate (PR #89 / `contribute/findings/PROG-55.md`)
- PROG-58 — dual-mode canary with Rust flag on/off (PR #90 / `contribute/findings/PROG-58.md`)
