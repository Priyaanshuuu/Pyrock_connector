# Proposal: a read-only Pyrock connector

**Prepared by Priyanshu Sinha | October 2026**

I built a small prototype to show how someone could ask an assistant about material stock and pending deliveries using Pyrock data. The prototype uses fictional records. I am sharing it to discuss whether this would be useful to Pyrock and what a real integration would require.

## Start here

1. [The problem and opportunity](01_Problem_and_Urgency.md) explains why I chose this idea.
2. [The proposed solution](02_Solution_Stack_and_Why.md) describes the three read-only tools and the technology behind the demo.
3. [Tradeoffs and safeguards](03_Tradeoffs.md) covers the limits and decisions I would make with your team.
4. [Example flow](04_Flow.md) shows what happens when someone asks about stock and deliveries.

The [build steps](Steps/README.md) are an optional technical appendix. The runnable app and setup instructions are in [connector/README.md](../connector/README.md).

## What is ready today

- A browser demo with two fictional sites and two fictional reviewers.
- Three read-only tools for material balance, pending deliveries, and delivery evidence.
- Server-side site checks, input validation, timestamps, warnings, and tests.
- An MCP endpoint that has been checked locally and through a temporary public HTTPS tunnel.

## What is still needed

The demo has no connection to Pyrock's live systems. It also has no production login or customer permission model. The MCP endpoint has not been tested inside my ChatGPT account. I would need Pyrock's agreement on the use case, an approved API and test environment, and the correct authentication and inventory rules before working with real records.

The next useful conversation is whether customers need this workflow and which existing Pyrock API or integration path I should use. If Pyrock already offers something similar, I can focus on a missing tool or a reliability gap instead.
