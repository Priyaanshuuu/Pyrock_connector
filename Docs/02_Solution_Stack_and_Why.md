# What I built and how I would extend it

I built a read-only demo around three questions. It uses fictional records so the workflow can be reviewed without access to Pyrock's systems.

| Tool | What it returns |
| --- | --- |
| `get_material_balance` | The recorded amount of one material at a permitted site, with units and an update time. |
| `list_pending_deliveries` | Open deliveries and the amount still expected. |
| `get_delivery_evidence` | A permitted message or invoice linked to a delivery. |

These tools are implemented in the prototype. Their names and data model are my proposal; they are not claims about an existing Pyrock API.

## Why this setup

The demo uses Next.js for the page and HTTP routes, TypeScript for the shared logic, and Zod to check inputs and records. The sample data sits behind a small adapter. That lets me replace the fictional records with an approved Pyrock API later without rewriting the basic tool behavior.

There is no database because the demo does not need one. There is also no AI model inside the app. The stock calculation happens in code; an assistant would call the tools and explain their results.

I chose this setup to make the idea easy to run and review. It does not ask Pyrock to change its existing technology stack. A different hosting or assistant interface can be considered once the API and deployment requirements are known.

## What I would need for a live version

I would need an approved API or another supported data source, a way to identify the signed-in customer, and Pyrock's rules for stock, deliveries, and evidence access. The current demo calculation covers only its fictional records. I would use Pyrock's definitions for returns, transfers, adjustments, and units rather than assume the demo formula applies to real sites.

The first live version would still be read-only. I would test it in an approved environment before exposing customer records to an assistant.
