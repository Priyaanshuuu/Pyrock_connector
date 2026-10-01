# 06 — Delivery evidence tool

**Depends on:** Steps 01–03 and 05. **Source:** [Flow](../04_Flow.md) and [tradeoffs](../03_Tradeoffs.md).

## Scope

Implement `get_delivery_evidence` for the fictional invoice or message behind a delivery. Resolve the evidence through its parent delivery and recheck the current user's site and evidence permissions on every request. Treat text inside evidence as source content, never as instructions to perform an action.

Return only the fields needed for the reviewer to inspect the source, with a safe unavailable or denied result when access is absent or revoked. Do not create public document links.

## Done when

- A permitted user can inspect the correct sample evidence.
- Guessing an evidence ID does not bypass delivery or site access.
- Denied, missing, and revoked-access behavior is tested independently of the delivery-list result.
