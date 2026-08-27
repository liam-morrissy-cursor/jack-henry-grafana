# NOP-10 findings — out of tree

**Issue:** NOP-10 — Backfill IPaymentService process, capture, refund, and void tests  
**Repo checked:** `liam-morrissy-cursor/grafana` (this workspace)  
**Verdict:** Cannot implement here. Paths and types are nopCommerce, not Grafana.

## What the ticket asks for

Extend `src/Tests/Nop.Tests/Nop.Services.Tests/Payments/PaymentServiceTests.cs` so it drives `IPaymentService` through `Payments.TestMethod` / `TestPaymentMethod`, covering:

- `ProcessPaymentAsync` → successful `ProcessPaymentResult`
- `GetAdditionalHandlingFeeAsync` → non-negative `decimal`
- Capture / refund / void / partial-refund support toggles (`TestSupportCapture`, `TestSupportRefund`, `TestSupportPartiallyRefund`, `TestSupportVoid`) matching `OrderProcessingServiceTests`
- Unknown system name `Payments.DoesNotExist` without uncaught throws
- Green: `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter FullyQualifiedName~PaymentServiceTests`

Stack: NUnit, AwesomeAssertions, `ServiceTest`, `GetService<IPaymentService>()`.

## What we searched in this tree

| Target | Result |
| --- | --- |
| `src/Tests/Nop.Tests/.../PaymentServiceTests.cs` | Missing (`src/Tests` absent) |
| `IPaymentService`, `ProcessPaymentAsync`, `TestPaymentMethod` | No matches |
| `Payments.TestMethod` / `OrderProcessingServiceTests` | No matches |
| NUnit / `ServiceTest` payment fixtures | Not present (Grafana uses Go + Jest/Playwright) |

Only incidental string `PaymentService-Prod` appears in alerting test fixtures; unrelated.

## Acceptance criteria status

| Criterion | Status in this repo |
| --- | --- |
| `ProcessPaymentAsync` success path | **Blocked** — no `IPaymentService` |
| `GetAdditionalHandlingFeeAsync` decimal fee | **Blocked** |
| Capture support + `CaptureAsync` toggle | **Blocked** |
| Refund / void / partial-refund toggles | **Blocked** |
| Unknown `Payments.DoesNotExist` behavior | **Blocked** |
| `dotnet test ...PaymentServiceTests` green | **Blocked** — no `.csproj` / NUnit harness |

## Why no code change

Workspace rule **stay-in-this-repo** forbids cloning or switching to another repository unless explicitly asked. Scaffolding a fake Nop.Tests tree under Grafana would not satisfy NOP-10 and would pollute this monorepo.

## What completing NOP-10 requires

1. Open the **nopCommerce** repository that contains `src/Tests/Nop.Tests/` and `IPaymentService`.
2. Extend `PaymentServiceTests.cs` (single fixture) using the `TestPaymentMethod` flag pattern from `OrderProcessingServiceTests`.
3. Assert order id / `PaymentStatus` / result flags only — no live cards, PANs, or full account numbers.
4. Run the filtered `dotnet test` command from the ticket until green.

## Out of scope (unchanged)

Storefront JS, Playwright, new payment plugins, and `IOrderProcessingService` guard changes — as stated on the ticket.
