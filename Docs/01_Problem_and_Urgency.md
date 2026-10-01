# The problem and why to address it soon

Project: Pyrock construction-data connector  
Author: Priyanshu Sinha  
Planning date: October 1, 2026  
Status: Independent proposal; no Pyrock endorsement or private API access assumed.

## In simple words

Pyrock organises construction updates coming through WhatsApp. Our proposed connector would let an authorised external AI assistant ask Pyrock for that information. Pyrock would remain responsible for its records, access rules and approvals.

## What we know

Pyrock publicly advertises inventory, material-leakage detection, daily reports and WhatsApp follow-ups. Its recruitment material mentions message ordering, retries and an existing agent evaluation harness. These areas already belong to their product; we should not present them as newly discovered gaps. [1–3]

OpenAI announced Dots on September 29 as agents for ongoing work with connected apps. Meta announced Muse for Small Business on September 29, including business integrations and custom connectors. [4–5]

## The potential business problem

An owner may increasingly ask one assistant to organise their business. If construction records are inaccessible to that assistant, the owner must switch applications or manually copy information. They might consider simpler tools that connect more easily.

Our hypothesis is that a controlled connector could keep Pyrock useful within this changing workflow. There is no public evidence here of customers leaving Pyrock because of these launches, and a connector alone does not guarantee retention.

Example: an owner asks, “Which cement deliveries at Site A are pending?” A general assistant needs current, authorised operational data to answer accurately. A connector can provide the records, their update times and source references.

## Why explore it soon

- New agent launches make interoperability a timely customer-discovery question.
- A narrow prototype can test usefulness before committing to a broad integration.
- Establishing consistent tool responses and access rules can help later integrations.
- Early feedback can prevent building a connector customers do not need.

The urgency is to validate demand and feasibility. We have no basis to claim Pyrock faces an immediate survival deadline.

## What remains unknown

| Question | Why it matters |
|---|---|
| Does Pyrock already have an API, connector or MCP server? | Avoid duplicating existing work. |
| Can customer permissions be checked through that API? | Preserve access boundaries. |
| Are evidence links and update timestamps available? | Support verifiable answers. |
| Which agent do their customers actually use? | Choose the first integration based on demand. |
| What authentication and transport does that agent support? | A generic tool endpoint is not automatically compatible. |

## Initial success criteria

Demonstrate correct stock and pending-delivery answers on labelled sample data, working source references, visible freshness, and denial of requests outside a user's permitted sites. Measure usability and latency. Customer value must subsequently be tested with Pyrock and a willing customer.

## Sources reviewed for this proposal

1. [Pyrock product website](https://pyrock.ai/)
2. [Pyrock careers](https://pyrock.ai/careers/)
3. [Pyrock company posts](https://in.linkedin.com/company/pyrock-ai)
4. [OpenAI release notes — September 29](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
5. [Meta: Muse for Small Business](https://about.fb.com/news/2026/09/introducing-muse-small-business/)

Public descriptions establish advertised capabilities, not independently tested production behaviour.
