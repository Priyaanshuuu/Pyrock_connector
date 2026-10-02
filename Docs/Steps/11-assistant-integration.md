# 11 — Selected assistant integration

**Depends on:** Step 10 and a selected assistant with usable connector documentation and test access. **Source:** [Solution stack](../02_Solution_Stack_and_Why.md) and [tradeoffs](../03_Tradeoffs.md).

**Selected demo client:** ChatGPT Plus in developer mode. OpenAI [documents MCP support for Plus](https://developers.openai.com/chatgpt); [Dots](https://learn.chatgpt.com/docs/dots) requires a different eligible plan and is deferred. The [plugin test guide](https://developers.openai.com/plugins/deploy/connect-chatgpt) requires a reachable HTTPS endpoint or Secure MCP Tunnel and in-client testing. Neither ChatGPT Plus nor Dots compatibility is verified yet.

## Scope

Select one client with the project owner, confirm its documented connector protocol and authentication requirements, then adapt the three existing tools to that protocol. Reuse the shared validation, access checks, and data logic. Test the complete connection and tool calls in the selected client before claiming compatibility.

Do not assume that MCP works in Muse, Dots, or another assistant without client-specific verification. Keep any credentials server-side and use the client's supported user delegation or authentication model. This step may require a narrower implementation plan once the client is known.

## Done when

- The selected client and its protocol are named in the documentation.
- Authentication and all three read-only tool calls are verified in that client.
- Denied site and evidence access are verified through the same path.
- Remaining client limitations are documented.

## Integration handoff

The prototype exposes three validated tools through [Next.js HTTP routes](../../connector/lib/http/README.md) and a local Streamable HTTP MCP endpoint at `/mcp`. The MCP endpoint advertises the three tools with read-only annotations and reuses the shared [contracts](../../connector/lib/contracts/README.md), [site access checks](../../connector/lib/access/README.md), and [tool logic](../../connector/lib/tools/README.md). Its fictional reviewer is selected only by the server's `PYROCK_DEMO_USER_ID` environment variable. The browser's signed demo cookie is unrelated to MCP. Neither mechanism is delegated assistant authentication. Do not publish the current anonymous sample MCP endpoint with customer data.

For a **fictional-only ChatGPT Plus demo**, set `PYROCK_DEMO_USER_ID=demo-owner` in the server process and run the connector. Expose `http://localhost:3000/mcp` through a temporary HTTPS forwarding service, using its public URL ending in `/mcp`. OpenAI also documents [Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels), but it requires separate Platform tunnel permissions and an API key. In ChatGPT, enable **Settings → Security and login → Developer mode**, then open **ChatGPT Plugins → +**, enter the HTTPS MCP URL, create the connection, and inspect the three discovered tools. Add the connection to a new chat from the tools menu. Developer mode availability may still depend on account or workspace policy. A locally working MCP endpoint alone cannot be reached by ChatGPT over `localhost`.

Ask: “For fictional Site A, what is the cement balance and what deliveries are still pending? Keep them separate.” Then ask for `evidence-a-message`, an owner-only Site B balance, and a nonexistent evidence ID. To test denied access, restart the server with `PYROCK_DEMO_USER_ID=demo-supervisor`, refresh or reconnect the plugin, and ask for Site B. Check units, timestamps, stale and missing-data warnings, and tool-call results. Record observed outputs below. The identity is fixed by the server for the whole demo; a ChatGPT prompt must never select a user ID. This anonymous sample connection must not be reused with customer data.

For a real Pyrock deployment, replace the hardcoded demo identity with delegated authentication, validate that identity, and recheck site permissions on every call. OpenAI's [authentication guide](https://developers.openai.com/plugins/build/auth) expects OAuth 2.1 for user-specific data.

Priyanshu accepted this fictional demo step on October 2, 2026, with the in-client verification criterion above deferred. The remaining client limitation is explicit: no result from a signed-in ChatGPT conversation has been reported. Dots can be evaluated separately once an eligible account is available.

Verification: the MCP endpoint passed local initialization, three-tool discovery, all three fictional calls, missing-stock handling, and denied site/evidence tests. The production build registered `/mcp`. On October 2, 2026, a temporary Cloudflare HTTPS tunnel to a local server returned MCP initialization, all three tool definitions, a 250-bag Site A balance, pending deliveries, and evidence; a nonexistent evidence ID returned `not_found`. The temporary URL is not a deployed service and may expire. No ChatGPT Plus or Dots in-client test has been reported.
