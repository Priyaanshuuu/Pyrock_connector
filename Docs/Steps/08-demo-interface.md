# 08 — Sample-data demo interface

**Depends on:** Step 07. **Source:** [Solution stack](../02_Solution_Stack_and_Why.md) and [flow](../04_Flow.md).

## Scope

Replace the generated Next.js landing page with a small reviewer-facing demo. Provide a controlled way to choose a demo identity and permitted site, then inspect material balance, pending deliveries, and the evidence behind a delivery. Display units, timestamps, source references, and warnings returned by the tools.

Label every demo view as fictional sample data. The interface should make balance and pending quantities distinct. It does not need an LLM or free-form chat to demonstrate the tool flow.

## Done when

- A reviewer can exercise the allowed end-to-end path in the browser.
- Denied, unavailable, and ambiguous cases have understandable UI states.
- The page has accessible labels and remains usable at common mobile and desktop sizes.
