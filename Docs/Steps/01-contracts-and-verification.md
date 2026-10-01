# 01 — Contracts and verification setup

**Source:** [Solution stack](../02_Solution_Stack_and_Why.md) and [flow](../04_Flow.md).

## Scope

Define TypeScript types and runtime schemas for sites, material records, deliveries, evidence references, tool arguments, and tool results. Establish a common result shape for data, sources, timestamps, and errors. Add Zod and a test runner suitable for the shared TypeScript logic.

Record the distinction between an actual recorded zero and unavailable data. Define unit handling and timestamp format; do not invent Pyrock's live inventory rules. Keep these contracts independent of Next.js route code.

## Done when

- The three proposed tools have explicit input and output contracts.
- Invalid inputs and malformed adapter results can be rejected at runtime.
- A small meaningful contract test runs through a documented command.
- No sample records, tool implementations, or API routes are added in this step.
