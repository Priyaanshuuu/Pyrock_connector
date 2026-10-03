# 07 — Make the tools callable

I exposed the three tools as Next.js HTTP routes. Each route checks the request, establishes the demo reviewer on the server, calls the shared tool logic, and returns a clear result or error.

These routes support the browser demo and direct testing. By themselves, HTTP routes do not establish compatibility with any assistant.
