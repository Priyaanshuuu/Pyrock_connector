# Connector build steps

This folder is the implementation plan for the read-only connector proposed in [the solution](../02_Solution_Stack_and_Why.md), [tradeoffs](../03_Tradeoffs.md), and [flow](../04_Flow.md). The current `connector/` project has a generated Next.js interface plus Step 01 contracts and verification setup in [`lib/contracts`](../../connector/lib/contracts/README.md). Step 02 adds fictional records and a server-side adapter in [`lib/data`](../../connector/lib/data/README.md). Step 03 adds server-controlled demo identity and site access in [`lib/access`](../../connector/lib/access/README.md), pending review. Tool behavior and HTTP endpoints are not implemented. The checklist records reviewer acceptance, not the presence of implementation files.

## How to use this checklist

- Start a step only when Priyanshu explicitly asks to start it. Work on one step at a time and show the code and verification results for review.
- Do not begin the next step automatically. Priyanshu reviews and commits each accepted change.
- Tick a box only after Priyanshu confirms that step is accepted or completed. This checklist is the single source of truth for step status; do not infer completion from files or Git history alone.
- If implementation reveals a needed change of scope, update the relevant step description and get it reviewed before treating the added work as part of that step.
- Keep fictional demo data visibly labelled. Do not describe the prototype as a live Pyrock or named-assistant integration until that integration has been tested.

## Prototype steps

- [x] **01 — [Contracts and verification setup](01-contracts-and-verification.md)**: define shared data and tool contracts, validation, and the test setup.
- [x] **02 — [Sample records and data adapter](02-sample-data-adapter.md)**: add fictional two-site, two-user data behind a replaceable adapter.
- [ ] **03 — [Demo identity and site access](03-identity-and-site-access.md)**: establish the demo user on the server and enforce site permissions.
- [ ] **04 — [Material balance tool](04-material-balance.md)**: calculate recorded stock with units, timestamps, and sources.
- [ ] **05 — [Pending deliveries tool](05-pending-deliveries.md)**: return open deliveries and quantities still expected.
- [ ] **06 — [Delivery evidence tool](06-delivery-evidence.md)**: independently authorise and display supporting sample evidence.
- [ ] **07 — [HTTP tool endpoints](07-http-tool-endpoints.md)**: expose the shared tool logic through Next.js Route Handlers.
- [ ] **08 — [Sample-data demo interface](08-demo-interface.md)**: build reviewable stock, delivery, and evidence views.
- [ ] **09 — [Failure handling and outcome logging](09-failures-and-logging.md)**: make missing, stale, denied, and failed requests clear and record safe operational outcomes.
- [ ] **10 — [Prototype verification and documentation](10-prototype-verification.md)**: verify the full flow and document setup, contracts, and limits.

## Integration steps requiring external decisions or access

- [ ] **11 — [Selected assistant integration](11-assistant-integration.md)**: implement the selected client's documented connector format and test it in that client.
- [ ] **12 — [Approved Pyrock data adapter](12-live-pyrock-adapter.md)**: connect the approved Pyrock API and permission model to the same tools.

Steps 11 and 12 are separate because the docs do not establish a target assistant, its connector requirements, or access to a Pyrock API. Their prerequisites must be confirmed before those steps start. The prototype in steps 1–10 needs neither live customer data nor an LLM.

## Rules that apply throughout

- The first version is read-only: no record corrections, supplier messages, or approval actions.
- Identity comes from server-controlled authentication or demo identity, never from an assistant-supplied user ID. Site IDs and evidence references are never permission grants.
- Validate inputs and returned data. Restrict every result to the user's allowed fields and sites; check evidence access again when it is opened.
- Keep pending deliveries separate from received stock. Missing records must not be reported as zero stock. Include units, source references, and last-update times where available.
- Keep business rules and access checks in plain TypeScript modules so the Next.js transport and UI can be changed independently.
- Do not put live credentials in browser code, publish customer evidence as public links, or copy full documents into logs by default.
