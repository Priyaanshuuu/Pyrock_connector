# Shared connector contracts

`index.ts` contains the runtime Zod schemas and inferred TypeScript types for records and the three proposed read-only tools. These are plain TypeScript contracts; they do not expose HTTP routes or implement tool behavior.

- Tool inputs contain site, material, or evidence identifiers only. The caller cannot set the authenticated user through a tool argument.
- Quantities are finite numbers. Record and delivery quantities cannot be negative. A material balance may be signed so a later data adapter can report a discrepancy rather than silently clamp it.
- Units are explicit strings on quantity-bearing records and results. A calculation must check that its source units agree; these schemas do not perform unit conversion.
- Timestamps are ISO 8601 strings with `Z` or a numeric timezone offset. `updatedAt: null` means no update time is available; it does not imply fresh data.
- A balance with `state: "recorded"` and `quantity: 0` is a recorded zero. A balance with `state: "unavailable"` has a reason and no quantity.
- Successful tool results carry data, source references, an update time, and warnings. Failed results carry a code, safe message, and retryability flag. Evidence references contain identifiers, not public URLs.
- The movement kinds and balance arithmetic are for the fictional prototype. Pyrock's live inventory definitions must be confirmed before a live adapter is built.
- Pending deliveries require `status: "open"`, received quantity no greater than expected quantity, and remaining quantity equal to expected minus received. Equality allows floating-point roundoff; it does not round quantities or convert units. An empty pending list makes no claim about stock completeness.
- These schemas validate individual payloads. Later adapters and tools must check site/material ownership, evidence-to-delivery relationships, permissions, compatible units, and record completeness. Parsing an identifier never grants access.

## Tool contracts

| Tool | Input schema | Result schema |
| --- | --- | --- |
| `get_material_balance` | `materialBalanceInputSchema`: site and material IDs | `materialBalanceResultSchema`: recorded balance or explicit unavailable reason |
| `list_pending_deliveries` | `pendingDeliveriesInputSchema`: site ID, optional material ID | `pendingDeliveriesResultSchema`: open deliveries with quantities, units, status, and evidence IDs |
| `get_delivery_evidence` | `deliveryEvidenceInputSchema`: evidence ID | `deliveryEvidenceResultSchema`: invoice/message content and parent delivery ID |

All results use `ok` to distinguish success from failure. Success includes `data`, `sources`, nullable `updatedAt`, and `warnings`; failure includes `error.code`, `error.message`, and `error.retryable`. Types are inferred from schemas to keep compile-time and runtime contracts aligned.

## Verification

From `connector/`, install locked dependencies with `npm ci`, then run:

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Tests cover zero versus unavailable balances, strict inputs, malformed records, pending-quantity consistency, evidence metadata, and shared failure responses. Values inside tests are contract test cases, not a sample-data adapter. This step adds no tool implementations or API routes.
