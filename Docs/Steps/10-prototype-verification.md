# 10 — Prototype verification and documentation

**Depends on:** Steps 01–09. **Source:** [Sharing checklist](../04_Flow.md) and [solution stack](../02_Solution_Stack_and_Why.md).

## Scope

Run the full prototype checks and address concrete failures. Verify the sample calculation, pending-delivery separation, both permitted and denied site access, independent evidence access, missing records, and failed requests. Replace the generated `connector/README.md` with setup instructions, sample-data disclosure, tool contracts, test commands, known limits, and the adapter boundary.

Use the project's lint, type, test, and build checks. Document any environment-dependent check that cannot run. Do not present a working HTTP demo as proof of compatibility with an external assistant.

## Done when

- The documented setup reproduces the sample demo.
- The required checks pass, or any remaining failure is explicitly reported for review.
- The README states what has and has not been integrated.
