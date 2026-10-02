# 09 — Failure handling and outcome logging

**Depends on:** Steps 01–08. **Source:** [Tradeoffs](../03_Tradeoffs.md) and [flow errors](../04_Flow.md).

## Scope

Make error behavior consistent across tools, HTTP responses, and the demo UI. Cover unavailable records, stale source timestamps, malformed data, denied or revoked access, and adapter failures. A stale threshold is a product choice to define and document during this step; always show the actual last-update time.

Record operational outcomes such as tool name, server-established user, site, status, and latency. Keep credentials and full evidence content out of logs. Use a simple logging mechanism suitable for the prototype; do not add a monitoring platform without a requirement.

For this fictional prototype, a known source timestamp becomes stale after **48 hours**. Results retain the actual timestamp and add a warning. Requests write one structured `tool_outcome` JSON line to server stdout; the site field is populated only from a successful authorised result. Details and limits are in the [tool notes](../../connector/lib/tools/README.md#freshness-and-failures) and [HTTP notes](../../connector/lib/http/README.md).

## Done when

- Tests verify that missing data is not reported as zero and denied access does not leak details.
- Adapter failures produce a clear retryable or non-retryable result as appropriate.
- Logs allow request outcomes to be checked without exposing document contents.
