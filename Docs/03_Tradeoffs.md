# Decisions and limits

I kept the first version small so the useful part is easy to judge: can someone get a clear answer, see its source, and stay within their site permissions?

| Choice | Reason | Limit |
| --- | --- | --- |
| Fictional records | The demo is safe to share and does not need private access. | It cannot prove the real API or inventory rules work the same way. |
| Read-only tools | Stock, deliveries, and evidence can be reviewed without changing records. | The user cannot correct a record or message a supplier. |
| One shared data adapter | The tool logic is separate from where records come from. | A live adapter still needs an approved API and field mapping. |
| Source details and update times | The user can check what an answer is based on. | Old or incomplete records still need a clear warning. |

## Access to customer data

The fictional reviewer selector is useful for the demo, but it is not a customer login. For a live version, the server must identify the real user and check their current site permissions on every request. Opening evidence needs its own permission check. A site ID or evidence ID supplied by an assistant cannot grant access by itself.

Customer credentials would stay on the server. I would avoid public links to private evidence and keep document contents out of routine logs.

## When an answer is uncertain

The connector should say when a record is missing, old, or unavailable. Missing records must not be reported as zero stock. A delivery that is still expected must not be counted as material already on site. If the source API fails, the user should see that the answer could not be fetched.

## What I would decide with Pyrock

Before using live data, I would confirm the inventory rules, authentication method, API limits, and whether customers actually want this workflow. If the idea proves useful, we could then decide which assistant to support first. Actions such as changing stock or sending messages would need a separate design and approval process.
