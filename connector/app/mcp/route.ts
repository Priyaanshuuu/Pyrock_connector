import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createSampleMcpServer } from "@/lib/mcp/server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const server = createSampleMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    maxRequestBodySize: 64 * 1024,
  });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return Response.json({ jsonrpc: "2.0", error: { code: -32603, message: "MCP request failed." }, id: null }, { status: 500 });
  } finally {
    await server.close();
  }
}

export function GET(): Response {
  return new Response("Stateless MCP server does not support a GET stream.", { status: 405 });
}
