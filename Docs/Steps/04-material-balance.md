# 04 — Material balance tool

**Depends on:** Steps 01–03. **Source:** [Tool list](../02_Solution_Stack_and_Why.md) and [calculation example](../04_Flow.md).

## Scope

Implement `get_material_balance` as plain TypeScript logic using the adapter and shared access check. For the fictional example, calculate opening stock plus confirmed receipts minus recorded usage. Include quantity, unit, site and material identifiers, last update time, and permitted source references.

Pending deliveries do not increase recorded balance. Keep missing records separate from a recorded zero. Do not assume this simplified demo formula covers live returns, transfers, or adjustments; those definitions belong to step 12.

## Done when

- The example returns 250 cement bags and excludes the pending 50 bags.
- Permission denial, missing records, and malformed record data are covered by tests.
- The result identifies its supporting records and update time.
