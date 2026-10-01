# 11 — Selected assistant integration

**Depends on:** Step 10 and a selected assistant with usable connector documentation and test access. **Source:** [Solution stack](../02_Solution_Stack_and_Why.md) and [tradeoffs](../03_Tradeoffs.md).

## Scope

Select one client with the project owner, confirm its documented connector protocol and authentication requirements, then adapt the three existing tools to that protocol. Reuse the shared validation, access checks, and data logic. Test the complete connection and tool calls in the selected client before claiming compatibility.

Do not assume that MCP works in Muse, Dots, or another assistant without client-specific verification. Keep any credentials server-side and use the client's supported user delegation or authentication model. This step may require a narrower implementation plan once the client is known.

## Done when

- The selected client and its protocol are named in the documentation.
- Authentication and all three read-only tool calls are verified in that client.
- Denied site and evidence access are verified through the same path.
- Remaining client limitations are documented.
