# 11 — Sample assistant connection

I added a read-only MCP endpoint at `/mcp` so an assistant can call the same three tools as the demo. It returns fictional stock, delivery, and evidence records. The endpoint was checked locally and through a temporary public HTTPS tunnel: initialization, tool discovery, sample tool calls, missing evidence, and denied site access worked in those checks.

I have **not** verified the connection inside my ChatGPT account. I would do that before claiming ChatGPT compatibility. I have not tested Muse or Dots.

For a fictional ChatGPT demo, the server can set `PYROCK_DEMO_USER_ID=demo-owner` and expose `/mcp` over HTTPS. The identity is fixed for the whole server, so this is only suitable for sample data. The browser's demo reviewer selector is separate from the MCP endpoint.

A live assistant connection would need Pyrock-approved user authentication. It must identify the person making each request and apply that person's current site and evidence permissions. The sample endpoint must never be used with customer data as it stands.
