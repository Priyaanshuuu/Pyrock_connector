# 07 — HTTP tool endpoints

**Depends on:** Steps 01–06. **Source:** [Solution stack](../02_Solution_Stack_and_Why.md) and [request flow](../04_Flow.md).

## Scope

Expose the three tools through Next.js Route Handlers. The handlers establish the server-controlled demo identity, validate arguments, invoke the shared TypeScript logic, and map results and errors to documented HTTP responses. The routes are a prototype transport; they do not by themselves claim MCP, Muse, or Dots compatibility.

Keep permission logic in the shared modules rather than duplicating it in each route. Use safe response shapes that do not disclose inaccessible site or evidence details.

## Done when

- Each tool can be called through an endpoint with documented request and response examples.
- API checks cover successful calls, validation errors, missing identity, and denied access.
- No endpoint accepts a caller-provided user ID as authority.
