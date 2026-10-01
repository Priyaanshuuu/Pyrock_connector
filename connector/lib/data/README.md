# Fictional sample data adapter

Step 02 provides internal server-side retrieval for fictional construction records. It is not a live Pyrock connection, authentication mechanism, or tool implementation.

`adapter.ts` defines the asynchronous `DataAdapter` interface. `sample-adapter.ts` exposes `createSampleAdapter()`, which validates the dataset at creation and returns validated independent copies on each read. A future approved API adapter can implement the same retrieval methods; its demo-user lookup can return `null` because live identity must come from approved authentication.

The fixtures, validation module, and adapter carry Next.js's `server-only` marker. Import them only from server code, and use type-only imports for the interface. The Vitest configuration replaces that marker only inside Node tests with Next.js's empty server implementation. No dataset is passed to the current interface or exposed through an endpoint.

## Sample records

| Record | Fictional values |
| --- | --- |
| Sites | `site-a`, `site-b` |
| Owner | `demo-owner`, allowed Site A and Site B |
| Supervisor | `demo-supervisor`, allowed Site A only |
| Site A cement movements | 100 opening bags + 450 received bags − 300 used bags |
| Site A pending delivery | 50 expected bags, none received |
| Site B cement movements | 80 opening bags − 20 used bags |
| Site B pending delivery | 40 expected bags, none received |
| Evidence | Fictional receipt invoice and delivery messages, linked to their parent deliveries |

Each movement and delivery has an ID and timezone-qualified timestamp for later source references. Evidence also has a title and timestamp. The 450-bag receipt is a movement supporting the balance and a completed delivery supporting invoice lookup; later balance logic must use movements rather than count it twice. The pending quantities are not movements.

## Retrieval and validation boundaries

- `listSites`, `getSite`, and `getDemoUser` provide records for the later identity/access layer.
- `listMaterialMovements` filters by site and material; `listDeliveries` filters by site and optional material and includes all statuses. Step 05 will select open deliveries.
- `getDelivery` allows the later evidence tool to resolve `getEvidence` through its parent site's permissions.
- Missing singular records return `null`; missing lists return `[]`. An empty movement list does not mean zero stock or prove record completeness.
- Validation rejects malformed Step 01 records, duplicate IDs, unknown sites, duplicate permissions/references, and broken evidence relationships in either direction.
- These internal methods do not authorise users. Step 03 must establish identity and enforce site access before records are used in tool results. A requested site or evidence ID is never an access grant.
- Unit compatibility, completeness, stock arithmetic, freshness, and safe source/result projection belong to the later shared tools.

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` from `connector/`. Adapter tests verify the illustrative quantities, differing user permissions, filtering, evidence links, malformed records, and mutation isolation.
