# Example: a stock and delivery question

An owner asks: “How much cement do we have at Site A, and what is still coming?”

In the fictional demo, the flow is:

1. The user selects a demo reviewer and a permitted site.
2. The balance tool checks access and reads the cement records.
3. The delivery tool checks access and reads open deliveries.
4. The app shows the recorded balance and pending amount separately, with units and update times.
5. If the user opens supporting evidence, the server checks access again before returning it.

For a real assistant, the same tools would be called after Pyrock's approved sign-in and permission checks. The data adapter would then read the approved Pyrock API instead of fictional records.

## What the sample answer shows

| Fictional Site A record | Cement |
| --- | ---: |
| Opening stock | 100 bags |
| Confirmed receipt | 450 bags |
| Recorded usage | 300 bags |
| **Recorded balance** | **250 bags** |
| Separate delivery still expected | 50 bags |

The balance is 100 + 450 - 300 = **250 bags**. The 50 pending bags are not included. The demo also shows when its sources were updated; because the sample dates are fixed, they may now appear stale.

The other useful checks are straightforward: a supervisor cannot read Site B, a missing material balance is shown as unavailable, and an inaccessible evidence ID does not reveal another site's document.

## What I would test with a real API

I would check permitted and denied sites, stock units, partial deliveries, missing records, old records, API failures, and evidence access. I would also compare the results with Pyrock's own view of the same records before calling the integration ready.
