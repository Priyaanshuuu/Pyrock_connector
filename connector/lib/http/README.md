# Prototype HTTP tool endpoints

Step 07 exposes the three existing read-only tools as Next.js Route Handlers. These are JSON HTTP endpoints for the fictional sample demo. They are not MCP, Muse, Dots, or live Pyrock integrations. Every request creates the sample adapter and access service on the server. Without a demo session, the service reads `PYROCK_DEMO_USER_ID`; missing or invalid identity returns `401`. Step 08 adds a dedicated reviewer selector that issues a signed, expiring demo cookie. Tool request bodies, query parameters, and arbitrary user headers still cannot choose the user.

All endpoints require `POST` with `Content-Type: application/json` and a JSON body no larger than 8 KiB. They return the Step 01 tool result envelope and `Cache-Control: no-store`. Other HTTP methods receive Next.js's method response.

| Endpoint | JSON request |
| --- | --- |
| `/api/tools/get_material_balance` | `{ "siteId": "site-a", "materialId": "cement" }` |
| `/api/tools/list_pending_deliveries` | `{ "siteId": "site-a", "materialId": "cement" }`; `materialId` is optional |
| `/api/tools/get_delivery_evidence` | `{ "evidenceId": "evidence-a-message" }` |

For a local PowerShell session, run `cd connector`, set `$env:PYROCK_DEMO_USER_ID = "demo-owner"`, then run `npm run dev`. From a second terminal, for example:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/tools/get_material_balance -ContentType application/json -Body '{"siteId":"site-a","materialId":"cement"}'
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/tools/list_pending_deliveries -ContentType application/json -Body '{"siteId":"site-a"}'
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/tools/get_delivery_evidence -ContentType application/json -Body '{"evidenceId":"evidence-a-message"}'
```

The balance response is `200` with `ok: true`, `data.balance: { state: "recorded", quantity: 250, unit: "bags" }`, sources, update time, and the fictional-data warning. The pending response is `200` with one open delivery and `remainingQuantity: 50`. The evidence response is `200` with fictional message content. An empty pending list or unavailable stock records can still return `200` with their explicit data state and warnings.

| Condition | HTTP status | Envelope |
| --- | ---: | --- |
| Valid tool result | 200 | `ok: true` |
| Invalid JSON or tool arguments | 400 | `invalid_input` |
| Oversized body | 413 | `invalid_input` |
| Wrong content type | 415 | `invalid_input` |
| No server demo identity | 401 | `unauthenticated` |
| Forbidden site | 403 | `access_denied` |
| Missing or inaccessible evidence | 404 | `not_found` |
| Ambiguous site | 409 | `ambiguous_site` |
| Upstream retrieval failure | 502 | `upstream_failure` |
| Invalid or unavailable data | 503 | `data_unavailable` |

The response body always uses the same `ok` envelope regardless of status. Evidence missing and inaccessible IDs intentionally share `404` and the same safe message. The route helper validates the final tool result before sending it. Route modules contain only imports and shared handler wiring; tool validation and access checks remain in plain TypeScript.

Step 09 writes one JSON `tool_outcome` line to server stdout for each tool request. Fields are `tool`, server-established `userId` (or `null`), authorized `siteId` when the successful result includes one (otherwise `null`), HTTP `status`, `outcome`, `retryable`, and `latencyMs`. No request body, cookie, evidence content, source label, or exception text is logged. Evidence outcomes have `siteId: null` to avoid an extra record read; denied requests also have no authorized site. These lines are prototype operational logs, not an audit trail or monitoring platform.

These public prototype endpoints expose only fictional records. `PYROCK_DEMO_USER_ID` remains a server-process fallback for API checks; browser sessions are local demo state, not production authentication. Do not deploy them with customer data. The selected assistant and live API remain later steps.

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` from `connector/`. The HTTP tests invoke the exported Route Handlers with Web `Request` objects; the production build verifies that Next.js registers the three routes.
