# Tradeoffs

These are proposed design decisions, not claims about Pyrock's existing implementation.

| Decision | Benefit | Cost or limitation | Initial choice |
|---|---|---|---|
| Read-only versus write actions | Reads make permissions and correctness easier to demonstrate. | Cannot update records or contact suppliers. | Read-only first; evaluate approved actions later. |
| Synthetic versus live data | Can develop without customer access or credentials. | Does not prove fit with real records or APIs. | Label synthetic data prominently; validate a real adapter separately. |
| Direct API versus browser automation | Explicit contracts and scoped access are easier to operate. | Requires a suitable API from Pyrock. | Approved API; no private-app scraping workaround. |
| Live fetch versus local copy | Live fetch reduces duplicated sensitive data. | Depends on upstream latency and availability. | Fetch live in production; fail clearly when unavailable. |
| REST versus MCP or proprietary connector | REST gives a simple core; an adapter can support a selected assistant. | Multiple transports mean more maintenance. | One core service; one verified client adapter. |
| Cloudflare alignment versus portability | Fits advertised stack and gives a plausible handoff path. | Platform bindings create some coupling. | Keep domain logic independent of bindings. |
| Evidence-rich versus compact responses | Evidence makes results easier to inspect. | Adds payload size and may expose sensitive details. | Concise records with authorised evidence references. |
| Narrow tools versus generic SQL tool | Narrow tools are easier to validate and restrict. | Each new use case needs explicit work. | Three narrow read tools. |
| Delegated user access versus broad service credentials | User access preserves existing role boundaries. | More integration effort. | Require delegated or equivalent server-enforced access before real data. |
| Agent distribution versus owning the interface | Customers can use Pyrock through their chosen assistant. | Pyrock may lose direct interface visibility and depend on another platform. | Keep Pyrock's identity, evidence and authorisation visible in results. |

## Failure cases worth designing for

- Wrong site: resolve ambiguity instead of choosing a similarly named site.
- Missing records: report unavailable data; zero stock is a different result.
- Stale records: include as_of and freshness status; do not imply current physical stock.
- Access leak: check both the query and each evidence request against the authenticated identity.
- Upstream outage: return a retryable error; any cached result must be explicitly labelled with its age.
- Instructions hidden in evidence: treat documents as data. Their text must not grant permissions or change tool behaviour.
- Revoked permission: recheck access and invalidate relevant sessions/caches; possession of an old record ID is insufficient.

## Changes and approvals, if added later

Keep “prepare change” separate from “commit change.” An authorised person must approve the exact action and record version. Recheck permission and version at execution time. Reject changed or expired approvals. Record idempotency keys so retried requests do not create duplicate updates.

Do not imply this approval system already exists or must replace Pyrock's controls. Integrate with their established approval mechanism where available.

## What this project cannot guarantee

A connector cannot fix incorrect upstream records, prove material physically arrived, guarantee discovery inside an agent marketplace, or prevent customers from choosing another product. It also cannot guarantee hiring. Its value is a concrete demonstration of integration design, permissions, evidence handling and product judgment.

## Proceed or reconsider

Proceed to real integration if Pyrock identifies a user need, confirms a supported data-access path and agrees on permissions. If a connector already exists, contribute a missing tool, integration test or reliability fix. If customers do not use external agents, prioritise a workflow they actually request.
