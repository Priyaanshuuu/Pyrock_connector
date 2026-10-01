# 03 — Demo identity and site access

**Depends on:** Steps 01–02. **Source:** [Flow](../04_Flow.md) and [tradeoffs](../03_Tradeoffs.md).

## Scope

Establish a controlled demo identity on the server. Add shared access logic that resolves a site only among that user's permitted sites. Support an unambiguous site selection or an explicit ambiguity result when a name matches more than one permitted site.

Treat demo identity as a prototype mechanism, not production authentication. The caller cannot gain access by supplying a user ID or a guessed site ID. Avoid responses that reveal details about inaccessible sites.

## Done when

- Both permitted and denied site requests are tested for each demo user.
- Missing identity, ambiguous names, and inaccessible sites produce distinct safe outcomes where appropriate.
- Tool logic can use the shared access check without depending on the demo UI.
