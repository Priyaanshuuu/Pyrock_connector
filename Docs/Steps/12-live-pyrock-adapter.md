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

## Integration intake and current status

Step 12 is active. Priyanshu chose a fictional integration plan for now. This repository contains only fictional records and no Pyrock API specification, test environment, service credential, delegated login flow, or permission definitions. No endpoint names or record mappings have been assumed to be real. The following approved information is needed before a live adapter can be implemented and verified:

| Area | Required source details | Existing contract to map |
| --- | --- | --- |
| API access | Test base URL, authentication method, credential scope, rate limits, pagination, timeout and retry rules | Server-only `DataAdapter`; no credential in browser or assistant arguments |
| Identity and permissions | How a signed-in user is established, how permitted sites are listed, and whether evidence needs separate permission | Replace `createDemoAccess`, which intentionally rejects `mode: "live"` |
| Sites and materials | Stable IDs, names, material identifiers, and any tenant boundary | `Site`, tool site/material IDs, and site access checks |
| Inventory | Authoritative balance or complete movement feed; meanings of opening, receipts, usage, returns, transfers, adjustments, units, and as-of timestamps | `MaterialMovement` currently supports only opening, receipt, and usage; the sample balance arithmetic is not a live rule |
| Deliveries | Status meanings, expected and received quantities, partial receipts, cancellation, units, and update timestamps | `DeliveryRecord` and `list_pending_deliveries` |
| Evidence | Retrieval endpoint, relation to delivery, permission check at open time, safe text/URL handling, and retention | `EvidenceRecord` and `get_delivery_evidence` |

Once the approved contract is supplied, first record exact field and status mappings and any necessary shared-contract changes. Then implement server-side identity and site authorization, the API adapter with bounded requests and validation, and separate live-mode configuration. Test allowed and denied sites, revoked access, missing and incomplete inventory, pending quantity, evidence access, timeouts, malformed upstream data, and the approved test environment before enabling live mode. Keep the sample mode usable throughout.

## Fictional reference flow for review

The paths below are **invented examples**, not claims about Pyrock's API. They show the minimum upstream operations the current three tools would need:

| Order | Illustrative upstream operation | Connector behavior |
| --- | --- | --- |
| 1 | `GET /example/me` and `GET /example/me/sites` with a server-held delegated token | Establish the user and current permitted sites on every request; do not accept an assistant-supplied user ID or site grant. |
| 2 | `GET /example/sites/{siteId}/materials/{materialId}/movements` | Retrieve all pages and an as-of/completeness marker; calculate a balance only after the approved inventory rules and compatible units are confirmed. |
| 3 | `GET /example/sites/{siteId}/deliveries` | Map approved open/partial statuses and expected versus received quantities; do not add pending amounts to stock. |
| 4 | `GET /example/evidence/{evidenceId}` plus its parent delivery | Recheck current user, parent delivery, site, and evidence permission before returning content; conceal inaccessible IDs as unavailable. |

For example, a fictional owner permitted at Sites A and B can ask for Site A cement and receive 250 recorded bags from an opening of 100, a receipt of 450, and usage of 300. A separate open delivery has 50 bags remaining. A fictional Site A supervisor asking for Site B receives a denial. These are existing sample fixtures, not a proposed Pyrock stock formula.

The implementation must fail closed when the upstream record set is incomplete, pagination fails, units differ, an access grant is revoked, or a status or movement kind is unknown. A timeout or upstream `5xx` maps to a retryable retrieval failure; malformed records map to non-retryable unavailable data. Missing movements remain **unavailable**, not zero. Evidence content stays server-side until permission is rechecked and is never logged in tool outcomes.

This planning deliverable does not satisfy the live-adapter completion criteria above. The unresolved decisions are the real endpoints and schemas, inventory rules, delegated authentication, site and evidence authorization, test credentials, and an approved test environment. No live-data mode should be enabled from this fictional reference alone.
