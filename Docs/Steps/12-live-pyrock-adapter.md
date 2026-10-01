# 12 — Approved Pyrock data adapter

**Depends on:** Step 10, an approved Pyrock API, authentication details, and permission definitions. It can be scheduled independently of step 11 once those prerequisites exist. **Source:** [Solution stack](../02_Solution_Stack_and_Why.md), [tradeoffs](../03_Tradeoffs.md), and [flow](../04_Flow.md).

## Scope

Map the approved API's sites, stock records, pending deliveries, and evidence into the existing data-adapter contracts. Follow Pyrock's own definitions for receipts, usage, returns, transfers, adjustments, statuses, and freshness. Enforce the approved user and site permission model on the server; do not treat a caller-supplied company or site ID as authority.

Handle upstream timeouts and revoked access, and avoid durable copies of customer records unless explicitly required and approved. Do not put credentials or evidence links in browser code. This step needs a detailed API-specific plan after the contract is available.

## Done when

- The live adapter passes the shared tool and access tests against an approved test environment.
- Inventory calculations and evidence access agree with Pyrock's definitions.
- A reviewer can distinguish live-data mode from the fictional sample demo.
- Any unverified API or permission behavior is recorded as an open limitation.
