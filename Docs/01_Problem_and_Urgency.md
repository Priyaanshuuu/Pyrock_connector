# Why I chose this idea

Construction teams need quick answers about what is on site and what is still on the way. Pyrock already works with construction updates, inventory, and follow-ups. I wanted to explore a simple way for a customer to ask an assistant a question and get an answer based on Pyrock records.

For example:

> How much cement is recorded at Site A, and which deliveries are still pending?

The assistant should return the recorded balance, keep pending deliveries separate, and show when the information was last updated. The user should also be able to check the source behind a delivery.

## Why I built a prototype

I think this could make existing records easier to use during a busy workday. I do not know yet whether Pyrock customers want to use an external assistant for this. A small demo gives us something concrete to review before committing to a live integration.

The demo uses fictional data for two sites and two reviewers. It shows the basic questions, source evidence, and a denied request for a site the reviewer cannot access. It does not represent Pyrock's actual records or inventory rules.

## What I would ask your team

- Do customers ask for stock and delivery answers outside the current Pyrock interface?
- Is there an existing API or connector I should build on?
- Which records define the official stock balance and delivery status?
- How should an assistant inherit a customer's site and evidence permissions?

If a connector is useful, I would start with one approved workflow and test it with your team. If you already have this covered, I would rather contribute to a gap you have identified.
