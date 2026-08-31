# PROG-58 — PriceCalculationServiceTests canary with Rust flag on/off (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket asks to run the full nopCommerce `PriceCalculationServiceTests` suite twice — once with the Rust sidecar feature flag **off** (C# baseline) and once with the flag **on** (Rust path + sidecar running) — and fail if any expect differs between modes. That surface lives under `src/Tests/Nop.Tests/Nop.Tests.csproj` and depends on PROG-54 golden fixtures plus PROG-56 production wiring of the Rust `nop-round` sidecar. This workspace is the Grafana monorepo: there is no `Nop.Tests` host, no Rust flag / sidecar integration, and no `GetFinalPriceAsync` canary fixtures. Workspace rule **stay-in-this-repo** forbids cloning another repository to implement the ticket here. Do **not** invent a NUnit dual-mode harness or feature flag under Grafana.

Epic: **PROG-52**. Depends on: **PROG-54** (fixtures), **PROG-56** (sidecar wiring). Related prior findings on this checkout: **PROG-53** (PR #87), **PROG-54** (PR #88), **PROG-55** (PR #89), **NOP-12** (PR #84), **NOP-13** (PR #85).

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | PROG-58 |
| Summary | test: PriceCalculationServiceTests pass with Rust flag on and off |
| Ask | Run full `PriceCalculationServiceTests` with sidecar flag off (baseline) and on (Rust path); include `GetFinalPriceAsync` canary tests from PROG-54 fixtures; fail if any expect differs between modes |

### Acceptance criteria (webhook)

1. `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests` passes with flag **off**
2. Same command passes with flag **on** and sidecar running
3. Open a PR

### Context from ticket description

- The canary suite must pass with the Rust flag both on and off.
- A cent drift in either mode is a production regression.
- Include `GetFinalPriceAsync` canary tests from PROG-54 fixtures.
- Fail if any expect differs between modes.

## What was searched in this tree

Commands run from `/workspace` on `main` (branched as `agent/PROG-58-price-calc-canary-findings`):

| Search | Result |
| --- | --- |
| `PriceCalculationService` / `PriceCalculationServiceTests` | **0 matches** |
| `GetFinalPriceAsync` | **0 matches** |
| `Nop.Tests` / `Nop.Tests.csproj` | **absent** |
| `src/Tests/Nop.Tests/` | **absent** |
| Root `Cargo.toml` / `nop-round` | **absent** |
| nopCommerce-shaped roots: `src/Presentation/Nop.Web/`, `src/Libraries/Nop.Services/` | **absent** |

Note: the agent VM has `rustc` / `cargo` on `PATH`. That does **not** make Grafana the owning product for a nopCommerce price-calculation dual-mode canary. Scaffolding a fake `Nop.Tests` project or Rust feature flag here would not satisfy PROG-58 (no C# baseline, no PROG-54 fixtures, no PROG-56 sidecar wiring) and would pollute an unrelated monorepo.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| `dotnet test ...~PriceCalculationServiceTests` with Rust flag **off** | **Blocked** — no `Nop.Tests.csproj` / .NET nopCommerce test host |
| Same suite with flag **on** + sidecar running | **Blocked** — no feature flag, no sidecar binary / PROG-56 wiring |
| Include `GetFinalPriceAsync` canary tests from PROG-54 fixtures | **Blocked** — PROG-54 fixtures and `GetFinalPriceAsync` absent (see PR #88 findings) |
| Fail if expects differ between modes | **Blocked** — no dual-mode runner or shared expect matrix in tree |
| Open a PR | **Met** — findings PR on this checkout |

## What was not done (by design)

- Did **not** scaffold `src/Tests/Nop.Tests/`, a Rust feature flag, or a sidecar process under Grafana.
- Did **not** invent a dual-mode canary that compares C# vs Rust expects without the owning product.
- Did **not** clone a nopCommerce or bootcamp repository (**stay-in-this-repo**).
- Did **not** change Grafana product code, CI, frontend, or backend tests.
- Did **not** re-implement PROG-54 / PROG-55 / PROG-56 work here.

## How to complete PROG-58 (in the owning repo)

1. Open the nopCommerce / bootcamp checkout that owns `PriceCalculationServiceTests`, PROG-54 fixtures, and PROG-56 Rust sidecar wiring.
2. Ensure PROG-54 golden fixtures (including `GetFinalPriceAsync` canaries) are loaded by the suite.
3. Ensure PROG-56 exposes a feature flag that routes rounding / price calculation through the Rust sidecar when on, and through the C# baseline when off.
4. Run baseline: `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests` with the Rust flag **off**.
5. Start the sidecar, enable the Rust flag, and run the same filter again.
6. Assert identical expects across modes (cent-level); fail the job if any case drifts.
7. Record both runs (and any mode-diff failure) in the PR Test plan.

## Related findings

- PROG-54 — `GetFinalPriceAsync` golden fixtures (PR #88 / `contribute/findings/PROG-54.md`)
- PROG-55 — Rust `nop-round` crate (PR #89 / `contribute/findings/PROG-55.md`)
- PROG-53 / NOP-12 — `PriceCalculationService.Round` characterization (PR #87 / #84)
- NOP-13 — prior-key `GetFinalPriceAsync` fixtures (PR #85)
