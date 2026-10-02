import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as balancePost } from "../../app/api/tools/get_material_balance/route";
import { POST as pendingPost } from "../../app/api/tools/list_pending_deliveries/route";
import { POST as evidencePost } from "../../app/api/tools/get_delivery_evidence/route";
import { materialBalanceResultSchema } from "../contracts";
import { createToolPostHandler } from "./tool-route";

afterEach(() => vi.unstubAllEnvs());

function jsonRequest(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
    body: JSON.stringify(body),
  });
}

describe("HTTP tool routes", () => {
  it("returns all three fictional tool results through their route handlers", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "demo-owner");
    const balance = await balancePost(jsonRequest("/api/tools/get_material_balance", {
      siteId: "site-a", materialId: "cement",
    }));
    expect(balance.status).toBe(200);
    expect(balance.headers.get("cache-control")).toBe("no-store");
    expect(balance.headers.get("content-type")).toContain("application/json");
    expect(await balance.json()).toMatchObject({
      ok: true, data: { balance: { state: "recorded", quantity: 250, unit: "bags" } },
    });

    const pending = await pendingPost(jsonRequest("/api/tools/list_pending_deliveries", { siteId: "site-a" }));
    expect(pending.status).toBe(200);
    expect(await pending.json()).toMatchObject({
      ok: true, data: { deliveries: [{ id: "delivery-a-pending", remainingQuantity: 50 }] },
    });

    const evidence = await evidencePost(jsonRequest("/api/tools/get_delivery_evidence", {
      evidenceId: "evidence-a-message",
    }));
    expect(evidence.status).toBe(200);
    expect(await evidence.json()).toMatchObject({
      ok: true, data: { id: "evidence-a-message", deliveryId: "delivery-a-pending" },
    });
  });

  it("rejects missing server identity even if a header or query claims a user", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "");
    const paths = [
      [balancePost, "/api/tools/get_material_balance", { siteId: "site-a", materialId: "cement" }],
      [pendingPost, "/api/tools/list_pending_deliveries", { siteId: "site-a" }],
      [evidencePost, "/api/tools/get_delivery_evidence", { evidenceId: "evidence-a-message" }],
    ] as const;
    for (const [post, path, body] of paths) {
      const response = await post(jsonRequest(`${path}?userId=demo-owner`, body, { "x-user-id": "demo-owner" }));
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ ok: false, error: { code: "unauthenticated" } });
    }
  });

  it("maps denied site access and hides inaccessible evidence", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "demo-supervisor");
    const balance = await balancePost(jsonRequest("/api/tools/get_material_balance", {
      siteId: "site-b", materialId: "cement",
    }));
    const pending = await pendingPost(jsonRequest("/api/tools/list_pending_deliveries", { siteId: "site-b" }));
    expect(balance.status).toBe(403);
    expect(pending.status).toBe(403);
    expect(await balance.json()).toEqual(await pending.json());

    const forbidden = await evidencePost(jsonRequest("/api/tools/get_delivery_evidence", { evidenceId: "evidence-b-message" }));
    const missing = await evidencePost(jsonRequest("/api/tools/get_delivery_evidence", { evidenceId: "missing" }));
    expect(forbidden.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(await forbidden.json()).toEqual(await missing.json());
  });

  it("rejects unexpected caller identity and invalid arguments", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "demo-owner");
    const requests = [
      balancePost(jsonRequest("/api/tools/get_material_balance", {
        siteId: "site-a", materialId: "cement", userId: "demo-supervisor",
      })),
      pendingPost(jsonRequest("/api/tools/list_pending_deliveries", { siteId: "site-a", userId: "demo-supervisor" })),
      evidencePost(jsonRequest("/api/tools/get_delivery_evidence", { evidenceId: " " })),
    ];
    for (const response of await Promise.all(requests)) {
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    }
  });

  it("returns structured errors for malformed JSON, wrong media type, and large bodies", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "demo-owner");
    const path = "http://localhost:3000/api/tools/get_material_balance";
    const malformed = await balancePost(new Request(path, {
      method: "POST", headers: { "content-type": "application/json" }, body: "{bad json",
    }));
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toMatchObject({ ok: false, error: { code: "invalid_input" } });

    const wrongType = await balancePost(new Request(path, {
      method: "POST", headers: { "content-type": "text/plain" }, body: "{}",
    }));
    expect(wrongType.status).toBe(415);
    expect(await wrongType.json()).toMatchObject({ ok: false, error: { code: "invalid_input" } });

    const oversized = await balancePost(new Request(path, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ siteId: "x".repeat(9000) }),
    }));
    expect(oversized.status).toBe(413);
    expect(await oversized.json()).toMatchObject({ ok: false, error: { code: "invalid_input" } });
  });

  it("keeps unavailable stock in the successful envelope", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "demo-owner");
    const response = await balancePost(jsonRequest("/api/tools/get_material_balance", {
      siteId: "site-a", materialId: "steel",
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true, data: { balance: { state: "unavailable", reason: "missing_records" } },
    });
  });

  it("logs bounded outcomes without evidence content or caller-provided identities", async () => {
    vi.stubEnv("PYROCK_DEMO_USER_ID", "demo-supervisor");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      await balancePost(jsonRequest("/api/tools/get_material_balance", {
        siteId: "site-b", materialId: "cement", note: "secret request text",
      }, { "x-user-id": "forged-user" }));
      await evidencePost(jsonRequest("/api/tools/get_delivery_evidence", {
        evidenceId: "evidence-a-message",
      }));
      await balancePost(jsonRequest("/api/tools/get_material_balance", {
        siteId: "site-a", materialId: "steel",
      }));
      const outcomes = log.mock.calls.map(([line]) => JSON.parse(String(line)));
      expect(outcomes).toHaveLength(3);
      expect(outcomes[0]).toMatchObject({
        event: "tool_outcome", tool: "get_material_balance", userId: "demo-supervisor",
        siteId: null, status: 400, outcome: "invalid_input", retryable: false,
      });
      expect(outcomes[1]).toMatchObject({
        event: "tool_outcome", tool: "get_delivery_evidence", userId: "demo-supervisor",
        status: 200, outcome: "ok",
      });
      expect(outcomes[1].latencyMs).toEqual(expect.any(Number));
      expect(outcomes[2]).toMatchObject({
        siteId: "site-a", status: 200, outcome: "missing_records",
      });
      expect(JSON.stringify(outcomes)).not.toMatch(/secret request text|forged-user|content|cookie/i);
    } finally {
      log.mockRestore();
    }
  });

  it("maps upstream and malformed results without exposing internal errors", async () => {
    const upstream = createToolPostHandler(async () => ({
      ok: false, error: { code: "upstream_failure", message: "Retry later", retryable: true },
    }), materialBalanceResultSchema);
    const badResult = createToolPostHandler(async () => ({ ok: true, data: { secret: "private" } }), materialBalanceResultSchema);
    const request = () => jsonRequest("/api/tools/get_material_balance", { siteId: "site-a", materialId: "cement" });
    const upstreamResponse = await upstream(request());
    expect(upstreamResponse.status).toBe(502);
    expect(await upstreamResponse.json()).toMatchObject({ ok: false, error: { code: "upstream_failure" } });
    const badResponse = await badResult(request());
    expect(badResponse.status).toBe(503);
    const body = await badResponse.json();
    expect(body).toMatchObject({ ok: false, error: { code: "data_unavailable" } });
    expect(JSON.stringify(body)).not.toContain("private");
  });
});
