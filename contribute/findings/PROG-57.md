# PROG-57 — Shared Round fixtures for NUnit and cargo (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket asks for a single JSON oracle fixture (`{ value, roundingType, expected }` rows covering the PROG-53 matrix) consumed by both NUnit `PriceCalculationServiceTests` and Rust `cargo test` in the `nop-round` crate. This workspace is the Grafana monorepo: there is no `src/Tests/Nop.Tests/`, no `nop-round` crate / `tests/fixtures/`, and no PROG-53 Round matrix host to lock. Workspace rule **stay-in-this-repo** forbids cloning another repository to implement the ticket here. Do **not** scaffold a foreign shared Round fixture or NUnit/Cargo test harness under Grafana product paths.

Epic: **PROG-52**. Depends on: **PROG-53** (characterization matrix), **PROG-55** (`nop-round` crate). Related prior findings on this checkout: **PROG-53** (PR #87), **PROG-55** (PR #89), **PROG-59** (PR #92 — CI that depends on this slice), **NOP-12** (PR #84).

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | PROG-57 |
| Summary | test: shared Round fixtures for NUnit and cargo |
| Ask | Commit one JSON fixture with `{ value, roundingType, expected }` rows covering the PROG-53 matrix; NUnit loads and asserts it; Rust `#[test]` loads the same file from a relative path; fixture under `src/Tests/` or crate `tests/fixtures/` |

### Acceptance criteria (webhook)

1. `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests` passes
2. `cargo test` in `nop-round` passes against the same file
3. Open a PR

### Context from ticket description

Cross-language parity needs one oracle fixture file consumed by both NUnit and `cargo test`. Without shared fixtures, C# and Rust can drift independently.

### PROG-53 matrix the fixture must cover

Under banker's / `MidpointRounding.ToEven` (`Rounding001` baseline via `Math.Round(value, 2)`):

| Input | Expected |
| --- | --- |
| `1.225` | `1.22` |
| `2.005` | `2.00` |
| `2.015` | `2.02` |
| `12.365` | `12.36` |

Cash-rounding midpoints from PROG-53:

| Rounding mode | Midpoint example |
| --- | --- |
| `Rounding005Down` | `12.35` |
| `Rounding01Up` / `Rounding01Down` | `12.05` |

Full `RoundingType` enum (eight values): `Rounding001`, `Rounding005Up`, `Rounding005Down`, `Rounding01Up`, `Rounding01Down`, `Rounding05`, `Rounding1`, `Rounding1Up`.

## What was searched in this tree

Commands run from `/workspace` on `main` (branched as `agent/PROG-57-shared-round-fixtures-findings`):

| Search | Result |
| --- | --- |
| `PriceCalculationService` / `PriceCalculationServiceTests` / `RoundingType` / `roundingType` / `nop-round` | **0 matches** (excluding `node_modules`) |
| `src/Tests/Nop.Tests/` / `Nop.Tests.csproj` | **absent** |
| Root or nested `Cargo.toml` / `*.rs` / `tests/fixtures/` for `nop-round` | **absent** |
| nopCommerce-shaped roots: `src/Presentation/Nop.Web/`, `src/Libraries/Nop.Services/` | **absent** |
| Existing `contribute/findings/PROG-5*.md` on `main` | **absent** (prior findings live on feature branches only) |

Note: the agent VM has `rustc` / `cargo` on `PATH`. That does **not** make Grafana the owning product for a nopCommerce shared Round oracle. Adding an invented JSON fixture + fake NUnit/Rust loaders here would not satisfy PROG-57 (no C# `Round` host, no `nop-round` crate to consume the file) and would pollute an unrelated monorepo.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Single JSON fixture with `{ value, roundingType, expected }` covering PROG-53 matrix | **Blocked** — no nopCommerce / `nop-round` fixture host; not a Grafana deliverable |
| NUnit test loads and asserts against the fixture | **Blocked** — no `Nop.Tests` / `PriceCalculationServiceTests` |
| Rust `#[test]` loads the same file from a relative path | **Blocked** — no `nop-round` crate |
| Fixture under `src/Tests/` or crate `tests/fixtures/` | **Blocked** — both paths absent |
| `dotnet test …~PriceCalculationServiceTests` passes | **Blocked** — no `Nop.Tests.csproj` / .NET host |
| `cargo test` in `nop-round` passes against the same file | **Blocked** — no crate |
| Open a PR | **Met** — findings PR on this checkout |

## What was not done (by design)

- Did **not** scaffold `src/Tests/Nop.Tests/`, `nop-round/`, or a shared JSON Round fixture under Grafana.
- Did **not** invent NUnit or Rust test loaders without the owning C# / Cargo Round implementations.
- Did **not** clone a nopCommerce or bootcamp repository (**stay-in-this-repo**).
- Did **not** change Grafana product code, CI, frontend, or backend tests.
- Did **not** re-implement PROG-53 / PROG-55 work here.

## How to complete PROG-57 (in the owning repo)

1. Open the checkout that owns nopCommerce `PriceCalculationService` / `PriceCalculationServiceTests` and the Rust `nop-round` crate (PROG-55), with the PROG-53 Round matrix already characterized.
2. Add one JSON fixture file (e.g. under `src/Tests/…/fixtures/` **or** `nop-round/tests/fixtures/`) with rows shaped `{ "value", "roundingType", "expected" }` covering the PROG-53 banker's midpoints and cash-rounding midpoints for all eight `RoundingType` values needed by the epic.
3. Update NUnit `PriceCalculationServiceTests` to load that file and assert each row against `PriceCalculationService.Round` (or the existing Round helper under test).
4. Add a Rust `#[test]` in `nop-round` that loads the **same** file via a relative path (or a path agreed so both suites point at one oracle — do not duplicate and diverge).
5. Run both:
   - `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PriceCalculationServiceTests`
   - `cargo test` in `nop-round`
6. Leave CI wiring that runs both in one job to **PROG-59** (depends on this slice).

## Related findings

- PROG-53 — C# `PriceCalculationService.Round` banker's / cash midpoint characterization (PR #87 on this repo)
- PROG-55 — Rust `nop-round` crate for the RoundingType matrix (PR #89)
- PROG-59 — cargo/NUnit CI workflow that depends on PROG-55/56/57 (PR #92)
- PROG-54 — `GetFinalPriceAsync` golden fixtures (different oracle surface; PR #88)
- NOP-12 — same Round / ToEven / cash-rounding surface under a prior key (PR #84)
