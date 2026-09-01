# PROG-59 — Add cargo test and sidecar spawn to CI for this slice (out of tree)

## Verdict

**Cannot implement in `liam-morrissy-cursor/grafana`.** The ticket asks to extend `.github/workflows/dotnet.yml` on branch `progressive` so CI installs Rust (rustup), runs `cargo test` in the `nop-round` crate, spawns the Rust sidecar, and runs filtered NUnit (`--filter FullyQualifiedName~PriceCalculationServiceTests`) in the same job — while keeping net10.0 SDK alignment and adding `progressive` alongside `develop` as a workflow trigger branch. This workspace is the Grafana monorepo: there is no `.github/workflows/dotnet.yml`, no `develop`/`progressive` nopCommerce CI surface, no `nop-round` Cargo crate, and no NUnit `PriceCalculationServiceTests` host. Workspace rule **stay-in-this-repo** forbids cloning another repository to implement the ticket here. Do **not** invent a foreign `.NET`/Cargo CI workflow under Grafana.

Epic: **PROG-52**. Depends on: **PROG-55**, **PROG-56**, **PROG-57**. Related prior findings on this checkout: **PROG-55** (PR #89 — `nop-round` crate), **PROG-58** (PR #90 — dual-mode canary), **PROG-53** / **NOP-12** (Round characterization).

## Ticket summary (from webhook)

| Field | Value |
| --- | --- |
| Key | PROG-59 |
| Summary | Add cargo test and sidecar spawn to CI for this slice |
| Ask | Extend `.github/workflows/dotnet.yml`: install Rust (rustup), `cargo test` in `nop-round`, spawn sidecar + filtered NUnit `PriceCalculationServiceTests`; add `progressive` to trigger branches with `develop`; keep net10.0 SDK alignment |

### Acceptance criteria (webhook)

1. CI workflow passes on a PR touching this slice
2. Both `cargo test` and filtered NUnit run in the same job
3. Open a PR

### Context from ticket description

- CI currently runs only `dotnet test` on `develop`.
- This branch is `progressive`. No `cargo test` step exists — a green .NET job would not catch a sidecar miss.
- Depends on PROG-55 / PROG-56 / PROG-57 (crate + wiring + prior CI slice).

## What was searched in this tree

Commands run from `/workspace` on `main` (branched as `agent/PROG-59-dotnet-ci-findings`):

| Search | Result |
| --- | --- |
| `.github/workflows/dotnet.yml` | **absent** |
| Workflows matching `dotnet` / `cargo` / `rust` / `nop` / `progressive` under `.github/workflows/` | **0 matches** |
| `PriceCalculationService` / `PriceCalculationServiceTests` / `nop-round` / `net10.0` (repo content, excluding node_modules) | **0 matches** |
| Root or nested `Cargo.toml` (depth ≤ 4) | **absent** |
| `Nop.Tests.csproj` / `src/Tests/Nop.Tests/` | **absent** |
| nopCommerce-shaped roots: `src/Presentation/Nop.Web/`, `src/Libraries/Nop.Services/` | **absent** |

Note: the agent VM has `rustc` / `cargo` 1.83.0 on `PATH`. That does **not** make Grafana the owning product for a nopCommerce progressive CI job. Adding an invented `dotnet.yml` that calls rustup / `cargo test` / NUnit here would not satisfy PROG-59 (no `nop-round` crate, no sidecar binary, no NUnit project, no `develop`/`progressive` .NET pipeline) and would pollute an unrelated monorepo.

## Acceptance criteria status here

| Criterion | Status in this repo |
| --- | --- |
| Extend `.github/workflows/dotnet.yml` (rustup, `cargo test` in `nop-round`, sidecar + filtered NUnit) | **Blocked** — workflow and targets absent |
| Add `progressive` trigger branch alongside `develop` | **Blocked** — no `develop`/`progressive` .NET workflow to extend |
| Keep net10.0 SDK alignment | **Blocked** — no .NET SDK / `global.json` / csproj surface for this slice |
| Both `cargo test` and filtered NUnit in the same job | **Blocked** — no crate / NUnit host / job to compose |
| CI workflow passes on a PR touching this slice | **Blocked** — cannot exercise the missing workflow |
| Open a PR | **Met** — findings PR on this checkout |

## What was not done (by design)

- Did **not** add `.github/workflows/dotnet.yml` or any Grafana CI job that installs Rust / runs NUnit for a foreign product.
- Did **not** scaffold `nop-round/`, a Cargo workspace, or a sidecar spawn script under Grafana.
- Did **not** invent a filtered `PriceCalculationServiceTests` NUnit step without `Nop.Tests`.
- Did **not** clone a nopCommerce or bootcamp repository (**stay-in-this-repo**).
- Did **not** change Grafana product code, frontend, backend, or existing Grafana workflows beyond this findings note.
- Did **not** re-implement PROG-55 / PROG-56 / PROG-57 / PROG-58 work here.

## How to complete PROG-59 (in the owning repo)

1. Open the nopCommerce / progressive checkout that owns `.github/workflows/dotnet.yml`, the `nop-round` crate (PROG-55), sidecar wiring (PROG-56), and prior CI slice work (PROG-57).
2. On branch `progressive`, extend `dotnet.yml`:
   - Keep the existing net10.0 SDK setup aligned with the repo.
   - Install Rust via rustup (stable toolchain sufficient unless the crate pins otherwise).
   - Run `cargo test` in the `nop-round` crate directory.
   - Spawn the sidecar process the suite expects, then run filtered NUnit: `dotnet test … --filter FullyQualifiedName~PriceCalculationServiceTests` in the **same** job.
3. Add `progressive` to `on.push` / `on.pull_request` branches alongside `develop`.
4. Open a PR that touches this slice and confirm the job is green with both Rust and NUnit steps visible in the logs.

## Related findings

- PROG-55 — Rust `nop-round` crate (PR #89 / `contribute/findings/PROG-55.md`)
- PROG-58 — dual-mode `PriceCalculationServiceTests` canary (PR #90 / `contribute/findings/PROG-58.md`)
- PROG-53 / NOP-12 — `PriceCalculationService.Round` characterization (PR #87 / #84)
- PROG-54 / NOP-13 — `GetFinalPriceAsync` fixtures (PR #88 / #85)
