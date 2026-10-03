# 10 — Verify the prototype

I tested the sample calculation, pending delivery separation, site permissions, evidence access, missing records, malformed data, and failures. The browser and HTTP checks showed 250 recorded cement bags at Site A, 50 more bags pending, an unavailable Steel balance, and denied Site B access for the supervisor.

On October 2, 2026, with Node.js 24.19.0 on Windows, 84 tests passed. Type checking, linting, and the production build also passed. A local production server handled the demo routes and logged outcomes without evidence text. These checks cover the fictional prototype; they do not verify a live Pyrock connection or an assistant session.

The setup and test commands are in [connector/README.md](../../connector/README.md).
