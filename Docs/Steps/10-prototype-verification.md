# 10 — Prototype verification and documentation

**Depends on:** Steps 01–09. **Source:** [Sharing checklist](../04_Flow.md) and [solution stack](../02_Solution_Stack_and_Why.md).

## Scope

Run the full prototype checks and address concrete failures. Verify the sample calculation, pending-delivery separation, both permitted and denied site access, independent evidence access, missing records, and failed requests. Replace the generated `connector/README.md` with setup instructions, sample-data disclosure, tool contracts, test commands, known limits, and the adapter boundary.

Use the project's lint, type, test, and build checks. Document any environment-dependent check that cannot run. Do not present a working HTTP demo as proof of compatibility with an external assistant.

## Done when

- The documented setup reproduces the sample demo.
- The required checks pass, or any remaining failure is explicitly reported for review.
- The README states what has and has not been integrated.

## Verification record — 2026-10-02

On Windows with Node.js 24.19.0, `npm test` passed 84 tests across 9 files; `npm run typecheck`, `npm run lint`, and `npm run build` passed. The production build registered the demo page, two demo-session routes, and all three tool routes.

A local production-server HTTP check selected owner and supervisor sessions through the browser-facing cookie flow. It observed two owner sites and one supervisor site; Site A cement balance of 250 bags; 50 bags still expected on an open delivery; permitted Site A evidence; steel balance `unavailable`; Site B denial `403` for the supervisor; and hidden Site B evidence `404`. Server stdout emitted structured `tool_outcome` lines for success, missing records, denial, and hidden evidence without evidence text. Unit and route tests also cover malformed data, adapter failures, stale warnings, zero versus missing stock, and revoked or denied evidence access.

The checks ran with installed local dependencies. Dependency installation from a clean checkout was not repeated; the README gives the lockfile-based `npm ci` setup. External assistant compatibility and a live Pyrock adapter cannot be verified in this prototype because neither integration is present.
