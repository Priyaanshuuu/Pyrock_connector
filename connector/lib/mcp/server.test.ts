import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../app/mcp/route";

afterEach(() => vi.unstubAllEnvs());

async function call(method: string, params: Record<string, unknown> = {}, id = 1) {
  const response = await POST(new Request("http://localhost:3000/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-11-25",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  }));
  return { status: response.status, body: await response.json() };
}

describe("sample MCP transport", () => {
  it("advertises the three read-only tools", async () => {
    const initialized = await call("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "local-test", version: "1.0.0" } });
    expect(initialized.body.result.serverInfo.name).toBe("pyrock-sample-connector");
    const result = await call("tools/list");
    expect(result.status).toBe(200);
    expect(result.body.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      "get_material_balance", "list_pending_deliveries", "get_delivery_evidence",
    ]);
    expect(result.body.result.tools.every((tool: { annotations: { readOnlyHint: boolean } }) => tool.annotations.readOnlyHint)).toBe(true);
    expect(result.body.result.tools.every((tool: { inputSchema: unknown; outputSchema: unknown }) => tool.inputSchema && tool.outputSchema)).toBe(true);
  });

  it("uses server identity for stock, pending delivery, and evidence calls", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "demo-owner");
    const balance = await call("tools/call", { name: "get_material_balance", arguments: { siteId: "site-a", materialId: "cement" } });
    const pending = await call("tools/call", { name: "list_pending_deliveries", arguments: { siteId: "site-a" } });
    const evidence = await call("tools/call", { name: "get_delivery_evidence", arguments: { evidenceId: "evidence-a-message" } });
    expect(balance.body.result.structuredContent.result.data.balance.quantity).toBe(250);
    expect(pending.body.result.structuredContent.result.data.deliveries[0].remainingQuantity).toBe(50);
    expect(evidence.body.result.structuredContent.result.data.id).toBe("evidence-a-message");
  });

  it("hides denied sites and evidence from a supervisor", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "demo-supervisor");
    const denied = await call("tools/call", { name: "get_material_balance", arguments: { siteId: "site-b", materialId: "cement" } });
    const evidence = await call("tools/call", { name: "get_delivery_evidence", arguments: { evidenceId: "evidence-b-message" } });
    expect(denied.body.result).toMatchObject({ isError: true, structuredContent: { result: { error: { code: "access_denied" } } } });
    expect(evidence.body.result).toMatchObject({ isError: true, structuredContent: { result: { error: { code: "not_found" } } } });
    expect(JSON.stringify(evidence.body)).not.toContain("Site B delivery message");
  });

  it("distinguishes missing stock and rejects calls without a server identity", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "demo-owner");
    const missing = await call("tools/call", { name: "get_material_balance", arguments: { siteId: "site-a", materialId: "steel" } });
    expect(missing.body.result.structuredContent.result.data.balance).toEqual({ state: "unavailable", reason: "missing_records" });
    vi.stubEnv("PYROCK_DEMO_USER_ID", "");
    const unauthenticated = await call("tools/call", { name: "list_pending_deliveries", arguments: { siteId: "site-a", userId: "demo-owner" } });
    expect(unauthenticated.body.result.isError).toBe(true);
    expect(unauthenticated.body.result.structuredContent).toBeUndefined();
    const validInput = await call("tools/call", { name: "list_pending_deliveries", arguments: { siteId: "site-a" } });
    expect(validInput.body.result.structuredContent.result.error.code).toBe("unauthenticated");
  });

  it("logs a bounded evidence outcome without source content", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "demo-owner");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      await call("tools/call", { name: "get_delivery_evidence", arguments: { evidenceId: "evidence-a-message" } });
      expect(log).toHaveBeenCalledOnce();
      const outcome = JSON.parse(String(log.mock.calls[0][0]));
      expect(outcome).toMatchObject({ event: "tool_outcome", transport: "mcp", tool: "get_delivery_evidence", userId: "demo-owner", siteId: null, outcome: "ok" });
      expect(JSON.stringify(outcome)).not.toMatch(/FICTIONAL SAMPLE|content|cookie/i);
    } finally {
      log.mockRestore();
    }
  });
});
