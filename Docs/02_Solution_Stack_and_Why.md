# What I would build and why I’d use this stack

Proposal by Priyanshu Sinha · October 1, 2026

I’d build a small connector that lets an authorised assistant query construction records and return an answer with supporting evidence. For the prototype, I’d use Next.js for both the demo interface and API endpoints. This keeps the first version in one project and lets me spend more time on the actual workflow.

## The first three tools

| Tool I would expose | What it answers |
|---|---|
| get_material_balance | How much of a material is recorded at a site, and when was it updated? |
| list_pending_deliveries | Which deliveries are open, and how much is still expected? |
| get_delivery_evidence | Which permitted invoice or message supports this delivery record? |

These are proposed tool names, not endpoints I know exist in Pyrock.

I’d keep the first version read-only. That gives us a useful starting point without needing to design record changes or supplier messaging immediately.

## The stack I would use

| Component | Choice | Why I would use it |
|---|---|---|
| Interface | Next.js App Router + Tailwind | A simple demo with stock, deliveries and evidence views. |
| Backend | Next.js Route Handlers | Host connector endpoints in the same project. |
| Language | TypeScript | Keep tool inputs, records and results consistent across the application. |
| Validation | Zod | Check request arguments and response data at runtime. |
| Initial data | Server-side sample fixtures | Show the workflow without requiring your private API or a database setup. |
| Persistent storage, if needed | Hosted SQL database | Store related sites, deliveries and evidence when persistence becomes useful. |
| Data access | A separate TypeScript adapter | Replace sample records with an approved Pyrock API later. |
| Tests | Vitest + API checks | Check access boundaries, expected answers and failure handling. |
| Demo hosting | Vercel, if deployment is feasible | Publish the Next.js sample demo for easy review. |

I would start with sample fixtures, so a database is not required for the first demonstration. If persistence is added, I would choose storage supported by the deployment environment; local SQLite files should not be treated as durable storage on a serverless deployment.

Next.js gives me routing, server-side code and API endpoints. The connector itself comes from the tool contracts, permission checks and data adapter I build around it.

## Keeping the implementation easy to integrate

I’d keep the stock queries, permission checks and tool logic in plain TypeScript modules. Next.js would provide the HTTP entry point and interface. That way, if you prefer to host the service on Cloudflare Workers, the business logic can be reused while the hosting layer is adapted and tested.

Your recruitment material mentions Cloudflare technologies. I’m choosing Next.js for the first prototype because it fits my experience and keeps delivery simple; this does not require your team to change its existing stack. [1]

## Where the data comes from

Initially, a sample-data adapter would return fictional records. With your approval and access, a Pyrock adapter would call your supported API using your inventory definitions and permissions.

The tools would receive the same kind of structured result from either adapter. I would keep a visible sample-data label on the prototype so it cannot be mistaken for a live customer integration.

## How I would connect an assistant

I would first prove the tools through the demo and API. Then I would add the selected assistant’s documented connector format. MCP is an option if that client supports it; a generic MCP endpoint does not establish compatibility with every assistant.

Meta documents custom connectors, but actual Muse and Dots integration still needs account access, authentication details and testing in the chosen client. [2]

The core connector does not need an LLM to calculate stock. If I add natural-language interaction to the demo, the model would select these restricted tools and explain their results. Its credentials would stay server-side.

## What I could share first

A GitHub repository, a small sample-data prototype and a live link if deployment works. As discussed in my email, I would aim to share that by October 2 morning if you approve the direction. A real Pyrock integration would follow once the supported access path is agreed.

## References

1. [Pyrock junior-role post](https://www.linkedin.com/posts/pyrock-ai_we-are-hiring-a-junior-full-stack-developer-activity-7505316304485158914-fyRN)
2. [Meta: How Muse works with connectors](https://www.meta.com/en-gb/help/artificial-intelligence/1687253048996149/)
