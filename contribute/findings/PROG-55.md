# PROG-55 — Implement nop-round crate for the RoundingType matrix (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket asks for a new Rust `nop-round` crate that ports nopCommerce `PriceCalculationService.Round` (all eight `RoundingType` values, banker's `ToEven` two-decimal baseline) with unit tests against the PROG-53 fixture matrix. This workspace is the Grafana monorepo: there is no nopCommerce C# source, no existing Rust workspace / Cargo package, and no PROG-53 fixture host to lock against. Workspace rule **stay-in-this-repo** forbids cloning another repository to implement the ticket here. Do **not** scaffold a foreign `nop-round` crate under Grafana product paths.

Epic: **PROG-52**. Depends on: **PROG-53** (characterization). Do not wire production (that is **PROG-56**). Related prior findings on this checkout: **PROG-53** (PR #87), **NOP-12** (PR #84).

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | PROG-55 |
| Summary | Implement nop-round crate for the full RoundingType matrix |
| Ask | Add `nop-round` (`Cargo.toml` + `src/lib.rs` + sidecar binary), `rust_decimal` with **ToEven** for the two-decimal baseline, port cash-rounding switch from `PriceCalculationService.cs` lines 617–681, unit-test the PROG-53 fixture matrix; do not wire production |

### Acceptance criteria (webhook)

1. `cargo test` in the crate passes
2. All `RoundingType` enum values covered (not happy-path only)
3. PR Test plan: **N/A — logic-only**
4. Open a PR

### Rounding surface called out on the ticket / PROG-53

Under banker's / `MidpointRounding.ToEven` (`Rounding001` baseline via `Math.Round(value, 2)`):

| Input | Expected |
| --- | --- |
| `1.225` | `1.22` |
| `2.005` | `2.00` |
| `2.015` | `2.02` |
| `12.365` | `12.36` |

Cash-rounding midpoints from PROG-53 (must be covered among the full eight `RoundingType` values):

| Rounding mode | Midpoint example |
| --- | --- |
| `Rounding005Down` | `12.35` |
| `Rounding01Up` / `Rounding01Down` | `12.05` |

Full enum (eight values): `Rounding001`, `Rounding005Up`, `Rounding005Down`, `Rounding01Up`, `Rounding01Down`, `Rounding05`, `Rounding1`, `Rounding1Up`.

## What was searched in this tree

Commands run from `/workspace` on `main` (branched as `agent/PROG-55-nop-round-findings`):

| Search | Result |
| --- | --- |
| `PriceCalculationService` / `RoundingType` / `Rounding001` / `nop-round` | **0 matches** (excluding `node_modules`) |
| `src/Libraries/Nop.Services/` / `PriceCalculationService.cs` | **absent** |
| Root or nested `Cargo.toml` / `*.rs` under repo (depth ≤ 3) | **absent** |
| PROG-53 fixture artifacts / `Nop.Tests` | **absent** |

Note: the agent VM has `rustc` / `cargo` on `PATH`. That does **not** make Grafana the owning product for a nopCommerce price-rounding sidecar. Adding an invented `nop-round` crate here would not satisfy PROG-55 (no C# lines 617–681 to port from, no PROG-53 golden host in-tree) and would pollute an unrelated monorepo.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Add `nop-round` crate (`Cargo.toml` + `src/lib.rs` + sidecar binary) | **Blocked** — no nopCommerce / sidecar Rust workspace; not a Grafana deliverable |
| `rust_decimal` **ToEven** two-decimal baseline matching `Math.Round(value, 2)` | **Blocked** — no crate / Round port target in tree |
| Port cash-rounding switch from `PriceCalculationService.cs` 617–681 | **Blocked** — C# source absent |
| Unit tests for all eight `RoundingType` values + PROG-53 fixture matrix | **Blocked** — no PROG-53 fixtures or `cargo test` package here |
| Do not wire production (PROG-56) | **N/A here** — nothing to wire; also no scaffolding performed |
| `cargo test` in the crate passes | **Blocked** — no crate |

## What was not done (by design)

- Did **not** scaffold `nop-round/`, a Cargo workspace, or Rust sidecar binaries under Grafana.
- Did **not** invent a `RoundingType` / Round implementation without the owning C# source and PROG-53 fixtures.
- Did **not** clone a nopCommerce or bootcamp repository (**stay-in-this-repo**).
- Did **not** change Grafana product code, CI, frontend, or backend tests.
- Did **not** start PROG-56 production wiring.

## How to complete PROG-55 (in the owning repo)

1. Open the checkout that owns the nopCommerce sidecar / Rust workspace (and the C# `PriceCalculationService.Round` oracle from PROG-53).
2. Add crate `nop-round` with `Cargo.toml`, `src/lib.rs`, and the sidecar binary entry the epic expects.
3. Implement Round with `rust_decimal` using **MidpointRounding::ToEven** (or equivalent) for the two-decimal baseline — not away-from-zero defaults.
4. Port the full cash-rounding `match` / switch for all eight `RoundingType` values from `src/Libraries/Nop.Services/Catalog/PriceCalculationService.cs` (≈617–681).
5. Add Rust unit tests covering the PROG-53 fixture matrix (banker's midpoints + cash midpoints) for every enum variant.
6. Run: `cargo test` inside the crate. Leave production wiring to **PROG-56**.

## Related findings

- PROG-53 — C# `PriceCalculationService.Round` banker's / cash midpoint characterization (PR #87 on this repo)
- PROG-54 — `GetFinalPriceAsync` golden fixtures (PR #88)
- NOP-12 — same Round / ToEven / cash-rounding surface under a prior key (PR #84)
- NOP-13 — `GetFinalPriceAsync` fixtures under a prior key (PR #85)
