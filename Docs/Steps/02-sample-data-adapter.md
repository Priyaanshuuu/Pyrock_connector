# 02 — Sample records and data adapter

**Depends on:** Step 01. **Source:** [Solution stack](../02_Solution_Stack_and_Why.md) and [flow example](../04_Flow.md).

## Scope

Create clearly fictional server-side records for two sites and two demo users, including different site permissions, material movements, an open delivery, and evidence. Include the flow document's illustrative cement example: 100 opening bags + 450 confirmed receipt bags − 300 used bags = 250 recorded bags; 50 additional bags remain pending.

Put retrieval behind a TypeScript data-adapter interface so a later approved API can replace the fixtures. Include enough timestamps and source references to support the planned responses. Fixtures must not be exposed directly to the browser as a full dataset.

## Done when

- The adapter returns validated fictional records through the contracts from step 01.
- The two users have materially different site access for later denial tests.
- The sample records support balance, pending-delivery, and evidence flows.
- Fixture and adapter tests cover key relationships and the example quantities.
