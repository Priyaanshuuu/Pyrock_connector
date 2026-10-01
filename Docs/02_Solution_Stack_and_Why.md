# The solution, stack and reasons

## Proposed solution

Build a small gateway between an external assistant and Pyrock's authorised construction records. The assistant translates a question into a tool request. The gateway checks access, queries the records and returns structured results with evidence and freshness.

Simple explanation: assistant sawaal poochega; connector permission check karega; Pyrock ke records se jawaab aayega.

This proposal focuses on a connector. Building a new WhatsApp ingestion system or replacing Pyrock's inventory engine is outside the initial scope.

## First prototype

Use clearly labelled synthetic records for two sites and two demo users with different permissions. Implement three read-only tools:

| Proposed tool | Inputs | Output |
|---|---|---|
| get_material_balance | site_id, material_id | Recorded quantity, unit, as_of time, evidence references, warnings |
| list_pending_deliveries | site_id, optional due_before, cursor | Authorised open deliveries, expected dates, received/remaining quantities, next cursor |
| get_delivery_evidence | delivery_id | Permitted source records and revision references |

Derive tenant and user identity from verified authentication. Never trust an assistant-supplied tenant_id as proof of access. Tool names are our proposed contract, not existing Pyrock endpoints.

An example result should say “450 bags recorded received; 50 pending; records updated at 10:30” rather than imply physical stock has been independently verified.

## Recommended stack

| Part | Proposed choice | Why |
|---|---|---|
| Language | TypeScript | Fits the user's skills and Pyrock's advertised hiring stack. |
| Demo interface | React + Vite | Simple question/result interface and trace viewer. |
| Gateway | Cloudflare Worker | Small authenticated API with a deployment path aligned to their advertised stack. |
| Input validation | Zod | Validate tool arguments and response contracts at runtime. |
| Demo records | D1/SQLite | Relational sample records with explicit site and delivery relationships. |
| Sample attachments | R2, only if needed | Store synthetic bills; return authorised short-lived access. |
| Data access | Adapter interface | Switch from synthetic data to an approved Pyrock API without rewriting tools. |
| Verification | Vitest and API-level checks | Exercise permissions, contracts, pagination and failure behaviour. |

Pyrock's junior hiring material names React, TypeScript, Workers, Durable Objects, D1/SQLite, R2 and Workflows. It does not establish that every component is required for this connector. [1]

Start without queues, vector search, Durable Objects or an autonomous agent loop. The proposed reads are narrow database/API operations. Add durable orchestration only if later workflows require it.

## Assistant integration strategy

Keep business tools separate from transport. First prove the API and a local/demo tool caller. Then implement the selected client's documented connector format. An MCP adapter is an option if the chosen client supports it; do not assume Muse and Dots share an identical protocol.

Meta documents custom connectors. We still need to verify the selected account's availability, authentication requirements and exact integration procedure. Dots compatibility also remains a separate acceptance check. [2]

The connector itself does not require an LLM to calculate stock. Natural-language interpretation belongs in the assistant or an optional demo layer. If a demo layer uses an LLM, label it and use the same restricted tools rather than giving it direct SQL access.

## Authentication and production boundary

For synthetic demonstration only, use two server-managed demo identities and clearly visible sample-data labels. Do not embed production credentials in the browser.

Before accessing real data, use Pyrock-approved delegated authentication, server-side permission checks, token expiry/revocation and restricted evidence access. Store secrets on the server. A successful synthetic demonstration does not prove a production integration.

## Delivery sequence

1. Define sample records, permissions and expected answers.
2. Implement the three tools and a mock-data adapter.
3. Build a minimal question/result and request-trace interface.
4. Verify allowed and denied cases, stale records and upstream failures.
5. Publish a repository with setup instructions; deploy a synthetic demo if feasible.
6. Following Pyrock feedback and access, add the real adapter and one verified client integration.

The tomorrow-morning commitment should cover a small synthetic prototype, repository and optionally a live demo. Live Pyrock/Muse/Dots integration depends on access and cannot be promised unconditionally.

## Sources

1. [Pyrock junior-role description](https://www.linkedin.com/posts/pyrock-ai_we-are-hiring-a-junior-full-stack-developer-activity-7505316304485158914-fyRN)
2. [Meta: How Muse works with connectors](https://www.meta.com/en-gb/help/artificial-intelligence/1687253048996149/)
