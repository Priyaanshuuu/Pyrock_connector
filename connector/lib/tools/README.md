# Read-only tools

Step 04 adds `getMaterialBalance(adapter, access, input)` as plain TypeScript logic. It validates the Step 01 input, resolves the site through the Step 03 access service, then reads movements for that authorised site and material. It uses the sample movement kinds: one opening quantity plus confirmed receipts minus recorded usage. Pending deliveries are not queried or counted.

The tool returns the shared `MaterialBalanceResult` contract: site and material IDs, a recorded quantity and unit or an explicit unavailable reason, movement source references, latest movement timestamp, and warnings. Sample results include the fictional-data label. Source labels contain the movement kind, quantity, and unit; source IDs and timestamps come from the records.

An empty movement list returns `state: "unavailable"` with `reason: "missing_records"`, `updatedAt: null`, and no sources. A nonempty set requires exactly one opening record and one consistent unit; otherwise it returns `reason: "incomplete_records"` without a quantity. A calculated zero is a recorded zero. A negative quantity remains visible as a discrepancy. The one-opening rule is a prototype structural check, not proof that every real-world movement was recorded.

Malformed movements, duplicate IDs, records for the wrong site or material, or a quantity that cannot be represented safely return `data_unavailable`. Adapter retrieval failures return a retryable `upstream_failure`. Access errors are passed through without reading movements. The tool does not fetch full deliveries or evidence.

The arithmetic is for fictional records only. Pyrock's definitions for returns, transfers, adjustments, completeness, unit conversion, and precision still need agreement before a live adapter can use it. This step has no HTTP route or browser interface. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` from `connector/`.

## Pending deliveries

Step 05 adds `listPendingDeliveries(adapter, access, input)`. It accepts a site ID and optional material ID, reuses the shared access check, validates the adapter's delivery records, and returns only records with `status: "open"`. Each result gives expected, confirmed received, and computed remaining quantities with a unit, status, update time, and supporting evidence IDs. Completed and cancelled deliveries are excluded from the output and source list. Pending quantities never enter the material balance calculation.

An empty result has `deliveries: []`, `sources: []`, `updatedAt: null`, and a warning that it says nothing about stock on hand. Sample results always include the fictional-data label. An open record with zero remaining quantity remains visible with a warning because its status may be stale. The source timestamp is the latest open delivery update, not an assertion that stock records are current.

The tool checks that each returned delivery belongs to the authorised site and requested material. It rejects malformed or duplicate delivery records. Before including an evidence ID, it retrieves and validates the evidence and checks that its parent is the open delivery. Missing, malformed, or failed evidence reads omit that reference and add a warning; the delivery quantity remains available. The delivery-evidence tool in Step 06 must check access again when opening a source. Evidence IDs are not permission grants.
