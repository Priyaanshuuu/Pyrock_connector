import { createDemoAccess } from "@/lib/access/demo-access";
import { createSampleAdapter } from "@/lib/data/sample-adapter";
import { readDemoIdentity } from "@/lib/demo/session";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json() as unknown;
  } catch {
    return Response.json({ ok: false, error: { code: "invalid_input", message: "Provide a site name.", retryable: false } }, {
      status: 400, headers: { "Cache-Control": "no-store" },
    });
  }
  const adapter = createSampleAdapter();
  const access = createDemoAccess(adapter, () => readDemoIdentity(request));
  const result = await access.resolveSite(body);
  const status = result.ok ? 200 : result.error.code === "unauthenticated" ? 401 :
    result.error.code === "access_denied" ? 403 : result.error.code === "ambiguous_site" ? 409 :
    result.error.code === "invalid_input" ? 400 : 503;
  return Response.json(result, { status, headers: { "Cache-Control": "no-store" } });
}
