# Why I’m proposing this connector

Proposal by Priyanshu Sinha · October 1, 2026

I spent some time looking into Pyrock because I wanted to propose something useful to your team. Your product already handles construction updates, inventory, material leakage and follow-ups through WhatsApp. I’d like to explore how that information could also become accessible through the AI assistants your customers may start using.

## What has changed

Dots and Muse are making ongoing tasks and connected business workflows easier to access. Meta’s Muse for Small Business announcement also includes custom connectors. That makes it worth asking how a construction owner’s preferred assistant could work with Pyrock. [1–2]

For example, an owner might ask:

> “Which deliveries are pending at Site A, and how much cement do we have left?”

If the assistant has no connection to Pyrock, the owner needs to open another interface or copy records across. I think a small connector could remove that extra step while keeping Pyrock responsible for the underlying information and access rules.

## Why I think it is worth exploring now

My concern is that customers may increasingly expect basic summaries and reminders from the assistants they already use. My proposal is to make Pyrock’s construction records useful within those workflows, so the assistant can answer from your data instead of relying on whatever the user manually uploads.

This is a possible opportunity, not evidence that customers are leaving Pyrock. I’d start with a small demonstration and use your feedback to decide whether a deeper integration is worth pursuing.

## Where I would add value

I would focus on three things: retrieving the right records, showing the evidence behind an answer, and enforcing the user’s site permissions. An answer should also show when the records were last updated, so a customer can judge how current it is.

I know you already advertise inventory and leakage detection, and your hiring material mentions reliability work and an agent evaluation harness. I’m proposing an integration around that existing work. [3–4]

## What I would like to confirm with you

- Do you already have a connector, MCP server or API for external assistants?
- Can an integration retrieve stock, pending deliveries and supporting evidence?
- How should it inherit your customer permissions?
- Are customers actually asking to use another assistant with Pyrock?

If you already have this on your roadmap, I’d be happy to contribute a missing tool or an integration test rather than duplicate it.

## What I would demonstrate first

I would use clearly labelled sample records for two sites and two demo users. The prototype would answer stock and delivery questions, show sources and update times, and reject requests for sites the user cannot access.

That would demonstrate the approach. Real customer usefulness would need to be checked with your team and, ideally, one customer.

## References

1. [OpenAI release notes — September 29](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
2. [Meta: Muse for Small Business](https://about.fb.com/news/2026/09/introducing-muse-small-business/)
3. [Pyrock website](https://pyrock.ai/)
4. [Pyrock careers and company posts](https://pyrock.ai/careers/) · [LinkedIn](https://in.linkedin.com/company/pyrock-ai)

This proposal uses public product descriptions. I have not inspected your private application or code.
