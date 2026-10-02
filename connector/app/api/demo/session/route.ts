import { createDemoAccess } from "@/lib/access/demo-access";
import { createSampleAdapter } from "@/lib/data/sample-adapter";
import {
  createDemoSession,
  demoIdentityChoices,
  demoIdentitySchema,
  readDemoIdentity,
} from "@/lib/demo/session";
import { z } from "zod";

const selectionSchema = z.strictObject({ identity: demoIdentitySchema });
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

async function view(identity: () => unknown) {
  const adapter = createSampleAdapter();
  const access = createDemoAccess(adapter, identity);
  const current = await access.getIdentity();
  if (!current.ok && current.error.code === "unauthenticated") {
    return { status: 200, body: { identity: null, sites: [], choices: demoIdentityChoices, sampleLabel: adapter.label } };
  }
  if (!current.ok) return { status: 503, body: current };
  const sites = await access.listPermittedSites();
  if (!sites.ok) return { status: 503, body: sites };
  return {
    status: 200,
    body: { identity: current.user, sites: sites.sites, choices: demoIdentityChoices, sampleLabel: adapter.label },
  };
}

export async function GET(request: Request): Promise<Response> {
  const result = await view(() => readDemoIdentity(request));
  return Response.json(result.body, { status: result.status, headers });
}

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (origin !== null && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Identity selection must come from this demo." }, { status: 403, headers });
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return Response.json({ error: "Content-Type must be application/json." }, { status: 415, headers });
  }
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 1024) {
      return Response.json({ error: "Request body is too large." }, { status: 413, headers });
    }
    body = JSON.parse(raw) as unknown;
  } catch {
    return Response.json({ error: "Provide valid JSON." }, { status: 400, headers });
  }
  const selected = selectionSchema.safeParse(body);
  if (!selected.success) {
    return Response.json({ error: "Choose one of the two fictional reviewers." }, { status: 400, headers });
  }
  const result = await view(() => selected.data.identity);
  if (result.status !== 200) return Response.json(result.body, { status: result.status, headers });
  try {
    const cookie = createDemoSession(selected.data.identity, request);
    return Response.json(result.body, { status: 200, headers: { ...headers, "Set-Cookie": cookie } });
  } catch {
    return Response.json({ error: "Demo session is unavailable." }, { status: 503, headers });
  }
}
