# Pyrock connector prototype

This is a **read-only demo with fictional sample data**. It shows how a site-scoped assistant connector could answer three questions: recorded material balance, pending deliveries, and supporting delivery evidence. It does not connect to a Pyrock API or any external assistant.

## Run the demo

Use Node.js 20.9 or newer. From this `connector/` directory:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Choose **Fictional owner**, **Fictional Site A**, and **Cement**. The recorded balance is **250 bags** (100 opening + 450 receipt − 300 usage). One open delivery has **50 bags still expected**; that quantity is separate from stock on hand. Open its fictional message evidence. Choose **Steel** to see an unavailable balance rather than a false zero. Choose **Fictional supervisor** and use **Try Site B access** to see a denied request; the owner can select Site B and see its 60-bag recorded balance.

The dated sample records are fixed at October 1, 2026. A result with a known latest source timestamp more than 48 hours old displays a stale warning and its original update time. A missing timestamp is shown as unavailable. All records and evidence are fictional; nothing here is a current site reading.

## API and contracts

The browser and direct clients use three `POST` endpoints. Send `Content-Type: application/json`; request bodies are limited to 8 KiB. The browser selects one of two fictional reviewers through `/api/demo/session`, which sets a signed, expiring, HttpOnly cookie. For direct local API calls without a cookie, set the server process variable `PYROCK_DEMO_USER_ID=demo-owner` or `demo-supervisor` before starting the server. A caller-supplied user ID does not establish identity.

| Tool endpoint | JSON input | Success data |
| --- | --- | --- |
| `/api/tools/get_material_balance` | `{"siteId":"site-a","materialId":"cement"}` | Recorded quantity and unit, or an explicit unavailable reason |
| `/api/tools/list_pending_deliveries` | `{"siteId":"site-a","materialId":"cement"}`; material ID optional | Open deliveries, expected/received/remaining quantities, and evidence IDs |
| `/api/tools/get_delivery_evidence` | `{"evidenceId":"evidence-a-message"}` | Permitted fictional evidence content and parent delivery ID |

Every successful tool result has `ok: true`, `data`, `sources`, `updatedAt` (possibly `null`), and `warnings`. Failures have `ok: false` and `error: {code, message, retryable}`. Missing movement records return a successful **unavailable** balance with no quantity. They never return numeric zero unless recorded movements calculate zero. Denied sites return `403`; missing and inaccessible evidence IDs share the same `404` response so an ID cannot reveal another site's records. Retrieval failures are retryable `502`; malformed or unsafe source data is non-retryable `503`. See the [full schemas](lib/contracts/README.md) and [HTTP status mapping](lib/http/README.md).

The server writes one JSON `tool_outcome` line per tool request with tool name, server-established user, authorized site when available, status, outcome, retryability, and latency. It omits cookies, request bodies, source labels, and evidence content. The [failure policy](lib/tools/README.md#freshness-and-failures) defines the 48-hour threshold.

## Verify

From `connector/` run:

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Tests cover sample arithmetic and zero versus missing records, separation of pending deliveries, two reviewer permissions, independent evidence authorization, malformed records, adapter failures, request validation, stale warnings, safe outcome logs, and signed demo sessions. A production build verifies that Next.js registers the page and routes. The [step checklist](../Docs/Steps/README.md) tracks reviewer acceptance separately from implementation.

## Boundaries and known limits

The [data adapter interface](lib/data/adapter.ts) separates retrieval from the plain TypeScript [access checks](lib/access/demo-access.ts) and [tool logic](lib/tools/README.md). The current [sample adapter](lib/data/README.md) returns validated copies of in-memory fictional records. A live adapter would need approved Pyrock endpoints, record definitions, permission enforcement, and authentication before these tools could operate on customer data. The current reviewer selector is public and is **not production authentication**. `PYROCK_DEMO_SESSION_SECRET` is generated at local startup if absent; set a stable private value when running multiple server instances so they can verify the same demo cookies.

The repository also contains a local, read-only Streamable HTTP MCP endpoint at `/mcp` for a ChatGPT Plus developer-mode demo. To test it locally, set `PYROCK_DEMO_USER_ID=demo-owner` in the server environment and start the app; point a Streamable HTTP MCP client at `http://localhost:3000/mcp`. To use it from ChatGPT, give the endpoint temporary public HTTPS reachability, then follow the [Step 11 connection instructions](../Docs/Steps/11-assistant-integration.md). The endpoint exposes only fictional sample records, has not been tested in ChatGPT or Dots, and does not implement delegated user authentication. It logs bounded tool outcomes without evidence text.

This prototype has no verified external assistant connection, live Pyrock connection, writes, record corrections, supplier messages, or approval actions. The fictional arithmetic does not define live rules for transfers, returns, adjustments, unit conversion, completeness, or precision. Source text is displayed as text and is not an instruction. A successful HTTP or MCP local test does not establish ChatGPT or Dots compatibility.
