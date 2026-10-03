# 12 — Connect real Pyrock records

This step is a plan, not an implemented integration. The repository contains no live Pyrock API connection, customer credentials, or production sign-in flow.

## Information I need from Pyrock

- The supported API or other approved way to read sites, stock, deliveries, and evidence.
- How a signed-in customer is identified and which sites and evidence they may access.
- The official rules for receipts, usage, returns, transfers, adjustments, units, and partial deliveries.
- A test environment and sample accounts with both allowed and denied access.
- API limits, failure behavior, and any data handling requirements.

## How I would build it

I would map the approved records into the existing data adapter, keeping credentials on the server. Every tool call would check the current user's access. Evidence would get a separate check when opened. If records are incomplete, units conflict, or the API fails, the tool would return an unavailable result instead of guessing.

I would test the three tools against Pyrock's own results in the approved environment. That includes permitted and denied sites, missing stock, pending quantities, stale records, timeouts, and revoked evidence access. Only after those checks would I turn on a live mode.

The fictional balance example of 250 bags is useful for demonstrating the flow. It is not a formula I would apply to real Pyrock records without confirming the inventory rules.
