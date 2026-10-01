# The choices I would make, and their tradeoffs

Proposal by Priyanshu Sinha · October 1, 2026

I want the first version to be small enough to review and useful enough to test. These are the choices I would make to get there.

| My choice | What we gain | What we give up or need to check |
|---|---|---|
| Next.js for the interface and APIs | One project to develop and deploy. | Your team may prefer a different hosting layer; I’d keep core logic separate. |
| Sample records first | I can demonstrate the workflow without customer credentials. | It does not prove compatibility with your actual records or API. |
| Three read-only tools | Clear scope and straightforward permission tests. | Users cannot correct records or message suppliers through the prototype. |
| Approved API access for live data | Explicit contracts and controlled access. | A suitable API and authentication method need to be available. |
| Fetch current records when queried | Fewer duplicated customer records in the connector. | Answers depend on the upstream service’s availability and speed. |
| One assistant integration first | Less maintenance and a clear acceptance test. | Other clients may need separate adapters. |
| Evidence and timestamps in responses | Customers can inspect an answer and judge its freshness. | Evidence adds payload size and requires its own access controls. |
| Explicit tools instead of unrestricted SQL | Requests are easier to validate and limit. | New questions may require an additional tool. |

## The main limitation

This connector can expose records, but it cannot make an incorrect record true. If a receipt is missing or a site update is old, I would return that limitation clearly. “No records available” must remain different from “zero stock.”

I also would not describe a sample-data demo as a working Muse or Dots integration. I’d use that description only after testing the connector in the named client.

## How I would protect customer access

For real data, I’d use the authentication approach agreed with your team and check permissions on the server. The assistant cannot grant itself access by sending a company or site ID.

I’d check evidence access separately, keep credentials out of the browser and avoid public links to customer documents. Instructions inside a document would be treated as document content, not permission to perform an action.

## What I would do when something fails

- If a site name is ambiguous, ask the user to choose from authorised matches.
- If records are missing, report that instead of inventing an answer.
- If the source is stale, show the last update time.
- If your API times out, return a clear retryable error.
- If access is revoked, deny subsequent requests and invalidate relevant sessions or cached access.

## If we add actions later

I would first integrate with your existing approval mechanism. The user would see the exact proposed change and evidence before an authorised reviewer approves it. The server would recheck permission and record version before applying it, and repeated requests would need duplicate protection.

That work would be a later stage. The first prototype would only retrieve information.

## The business tradeoff

Allowing another assistant to present Pyrock’s records could reduce direct use of your interface. It could also make your product easier to use in the customer’s existing workflow. I would keep Pyrock identified as the data source and evaluate the idea with customer feedback rather than assume it will improve retention.

If you already have a connector, I’d focus on a missing tool or reliability test. If customers do not need external-agent access, I’d rather work on a problem your team knows they have.
