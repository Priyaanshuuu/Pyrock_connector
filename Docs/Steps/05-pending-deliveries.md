# 05 — Pending deliveries tool

**Depends on:** Steps 01–03. **Source:** [Tool list](../02_Solution_Stack_and_Why.md) and [flow](../04_Flow.md).

## Scope

Implement `list_pending_deliveries` using the adapter and shared access check. Return open deliveries for an authorised site, including ordered or expected quantity, confirmed received quantity where represented, remaining quantity, unit, status, update time, and permitted evidence references.

Keep expected material separate from stock on hand. Do not describe a planned delivery as received. Define the result when there are no open deliveries without implying that stock records are complete.

## Done when

- The fictional 50-bag delivery appears as pending and does not affect the balance tool.
- Tests cover allowed and denied sites, partial receipt if modelled, and no open deliveries.
- Responses include only authorised site records.
