# Demo identity and site access

Step 03 supplies server-only access logic for the fictional adapter. `createDemoAccess(adapter)` reads `PYROCK_DEMO_USER_ID` on each call. Supported values are `demo-owner` and `demo-supervisor`; missing or unrecognised values produce `unauthenticated`. There is no default owner, browser-supplied identity, session, or production authentication.

For a server configured as the supervisor in PowerShell:

```powershell
$env:PYROCK_DEMO_USER_ID = "demo-supervisor"
npm run dev
```

This step does not add a UI or endpoint, so the generated page is unchanged. Later server handlers/tools can instantiate the access service and call:

```ts
const access = createDemoAccess(createSampleAdapter());
const result = await access.resolveSite({ siteId: "site-a" });
if (!result.ok) return result;
// Use result.site.id for the authorised site query in the same request.
```

`getIdentity()` returns only the demo user's ID/name. `listPermittedSites()` returns only currently permitted sites. `resolveSite()` accepts exactly one of `{ siteId }` or `{ siteName }`. Names match exactly after whitespace trimming and case folding; partial/fuzzy matches are not supported. Multiple permitted matches produce `ambiguous_site`; select a concrete ID from `listPermittedSites()`.

Requests cannot supply `userId` or their own permissions. The optional identity-provider argument to the factory is trusted server/test wiring and must never be connected directly to request arguments, unsigned cookies, or headers. A future browser demo selector will need a separate controlled server mechanism; production identity belongs to approved authentication.

The service reloads the current user and allowed site IDs on each call rather than caching access decisions. Forbidden and unknown sites return the same `access_denied` message, without requested names/IDs or other site details. A forbidden ID is rejected before looking up that site. Name resolution fetches only permitted site records. Deleted permitted sites are omitted, malformed adapter records fail closed with `data_unavailable`, and retrieval errors return a safe retryable `upstream_failure`.

The demo service refuses live adapters. It checks site access only; independent delivery/evidence checks are Step 06. Tools must call this service for each request and use its authorised site ID rather than trusting an earlier UI selection. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` from `connector/`.
