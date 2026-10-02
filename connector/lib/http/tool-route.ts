import "server-only";
import type { z } from "zod";
import { toolFailureSchema, type ToolFailure } from "../contracts";
import { createDemoAccess, type DemoAccess } from "../access/demo-access";
import { createSampleAdapter } from "../data/sample-adapter";
import type { DataAdapter } from "../data/adapter";
import { readDemoIdentity } from "../demo/session";

const maxBodyBytes = 8192;
const invalidBody = Symbol("invalid body");
const oversizedBody = Symbol("oversized body");

function failure(code: ToolFailure["error"]["code"], message: string): ToolFailure {
  return toolFailureSchema.parse({ ok: false, error: { code, message, retryable: false } });
}

function statusFor(result: { ok: boolean; error?: ToolFailure["error"] }): number {
  if (result.ok) return 200;
  switch (result.error?.code) {
    case "invalid_input": return 400;
    case "unauthenticated": return 401;
    case "access_denied": return 403;
    case "not_found": return 404;
    case "ambiguous_site": return 409;
    case "upstream_failure": return 502;
    case "data_unavailable": return 503;
    default: return 503;
  }
}

function jsonResponse(result: unknown, status: number): Response {
  return Response.json(result, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

async function readJsonBody(request: Request): Promise<unknown | typeof invalidBody | typeof oversizedBody> {
  if (!request.body) return invalidBody;
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBodyBytes) {
        await reader.cancel();
        return oversizedBody;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text) as unknown;
  } catch {
    return invalidBody;
  } finally {
    reader.releaseLock();
  }
}

type Tool = (adapter: DataAdapter, access: DemoAccess, input: unknown) => Promise<unknown>;

export function createToolPostHandler(tool: Tool, resultSchema: z.ZodType) {
  return async function POST(request: Request): Promise<Response> {
    const contentType = request.headers.get("content-type") ?? "";
    if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
      return jsonResponse(failure("invalid_input", "Content-Type must be application/json."), 415);
    }
    const body = await readJsonBody(request);
    if (body === oversizedBody) {
      return jsonResponse(failure("invalid_input", "JSON request body is too large."), 413);
    }
    if (body === invalidBody) {
      return jsonResponse(failure("invalid_input", "Provide a valid JSON request body."), 400);
    }

    try {
      // The browser sends only an opaque session token; identity stays on the server.
      const adapter = createSampleAdapter();
      const access = createDemoAccess(adapter, () => readDemoIdentity(request));
      const result = await tool(adapter, access, body);
      const parsed = resultSchema.safeParse(result);
      if (!parsed.success) {
        const invalidResult = failure("data_unavailable", "Tool result could not be validated.");
        return jsonResponse(invalidResult, statusFor(invalidResult));
      }
      const envelope = parsed.data as { ok: boolean; error?: ToolFailure["error"] };
      return jsonResponse(parsed.data, statusFor(envelope));
    } catch {
      const unavailable = failure("data_unavailable", "Tool result could not be produced.");
      return jsonResponse(unavailable, statusFor(unavailable));
    }
  };
}
