# Build plan and current status

This is the technical appendix to my [proposal](../README.md). Steps 1–10 make up the fictional, read-only prototype. Step 11 adds a sample MCP endpoint for an assistant. Step 12 is the work needed to connect real Pyrock records.

The status column records what is built. It does not mean Pyrock has approved a live integration.

| Step | What it covers | Status |
| --- | --- | --- |
| [01](01-contracts-and-verification.md) | Define inputs, outputs, and tests | Complete |
| [02](02-sample-data-adapter.md) | Add fictional records and a replaceable data adapter | Complete |
| [03](03-identity-and-site-access.md) | Check demo reviewer and site access | Complete |
| [04](04-material-balance.md) | Calculate recorded stock | Complete |
| [05](05-pending-deliveries.md) | Keep open deliveries separate from stock | Complete |
| [06](06-delivery-evidence.md) | Check access to supporting evidence | Complete |
| [07](07-http-tool-endpoints.md) | Expose the tools through HTTP | Complete |
| [08](08-demo-interface.md) | Add the browser demo | Complete |
| [09](09-failures-and-logging.md) | Handle missing, old, and failed data | Complete |
| [10](10-prototype-verification.md) | Verify and document the prototype | Complete |
| [11](11-assistant-integration.md) | Add a sample MCP endpoint | Built; ChatGPT test pending |
| [12](12-live-pyrock-adapter.md) | Connect an approved Pyrock API | Waiting for API and access decisions |

## What a reviewer can try now

Run the app using [connector/README.md](../../connector/README.md). Choose the fictional owner, Site A, and Cement to see a recorded balance of 250 bags and a separate delivery with 50 bags still expected. Choose the supervisor and try Site B to see a denied request. Try Steel to see how missing stock records are shown.

## What comes next

First, agree with Pyrock on the customer use case and supported API. Then map real records and permissions in a test environment. Test an assistant connection in the selected client before describing it as a verified client integration. The prototype stays fictional until those checks are complete.
