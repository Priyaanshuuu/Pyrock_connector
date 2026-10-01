import { describe, expect, it } from "vitest";
import { createDemoAccess } from "../access/demo-access";
import { createSampleAdapter } from "../data/sample-adapter";
import { listPendingDeliveries } from "./pending-deliveries";

function setup(userId = "demo-owner") {
  const adapter = createSampleAdapter();
  const access = createDemoAccess(adapter, () => userId);
  return { adapter, access };
}

describe("list_pending_deliveries", () => {
  it("returns the fictional 50-bag Site A delivery without the completed receipt", async () => {
    const { adapter, access } = setup();
    adapter.listMaterialMovements = async () => { throw new Error("Stock movements must not be read"); };
    const result = await listPendingDeliveries(adapter, access, { siteId: "site-a", materialId: "cement" });
    expect(result).toMatchObject({
      ok: true,
      data: {
        siteId: "site-a",
        deliveries: [{
          id: "delivery-a-pending", materialId: "cement",
          expectedQuantity: 50, receivedQuantity: 0, remainingQuantity: 50,
          status: "open", unit: "bags", evidenceIds: ["evidence-a-message"],
          updatedAt: "2026-10-01T10:30:00+05:30",
        }],
      },
      sources: [{ id: "delivery-a-pending", kind: "delivery", recordedAt: "2026-10-01T10:30:00+05:30" }],
      updatedAt: "2026-10-01T10:30:00+05:30",
    });
    if (result.ok) {
      expect(result.data.deliveries).toHaveLength(1);
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].label).toContain("50 bags remaining");
      expect(result.warnings).toContain(adapter.label);
    }
  });

  it("filters optional material and keeps authorised sites separate", async () => {
    const { adapter, access } = setup();
    const siteB = await listPendingDeliveries(adapter, access, { siteId: "site-b" });
    expect(siteB).toMatchObject({
      ok: true, data: { siteId: "site-b", deliveries: [{
        id: "delivery-b-pending", remainingQuantity: 40, evidenceIds: ["evidence-b-message"],
      }] },
    });
    if (siteB.ok) expect(siteB.data.deliveries).toHaveLength(1);
    const noSteel = await listPendingDeliveries(adapter, access, { siteId: "site-a", materialId: "steel" });
    expect(noSteel).toMatchObject({ ok: true, data: { siteId: "site-a", deliveries: [] }, sources: [], updatedAt: null });
    if (noSteel.ok) expect(noSteel.warnings.join(" ")).toContain("nothing about stock on hand");
  });

  it("denies a forbidden site before reading its deliveries", async () => {
    const { adapter, access } = setup("demo-supervisor");
    let reads = 0;
    adapter.listDeliveries = async () => { reads += 1; return []; };
    const forbidden = await listPendingDeliveries(adapter, access, { siteId: "site-b" });
    const unknown = await listPendingDeliveries(adapter, access, { siteId: "unknown" });
    expect(forbidden).toEqual(unknown);
    expect(forbidden).toMatchObject({ ok: false, error: { code: "access_denied" } });
    expect(reads).toBe(0);
    expect(await listPendingDeliveries(adapter, access, { siteId: "site-a" })).toMatchObject({ ok: true });
  });

  it("rejects missing identity and caller-supplied identity", async () => {
    const { adapter } = setup();
    const missingAccess = createDemoAccess(adapter, () => undefined);
    expect(await listPendingDeliveries(adapter, missingAccess, { siteId: "site-a" })).toMatchObject({
      ok: false, error: { code: "unauthenticated" },
    });
    const access = createDemoAccess(adapter, () => "demo-owner");
    expect(await listPendingDeliveries(adapter, access, { siteId: "site-a", userId: "demo-supervisor" })).toMatchObject({
      ok: false, error: { code: "invalid_input" },
    });
  });

  it("calculates remaining quantity for a partial receipt", async () => {
    const { adapter, access } = setup();
    const original = adapter.listDeliveries;
    adapter.listDeliveries = async (siteId, materialId) =>
      (await original(siteId, materialId)).map((delivery) =>
        delivery.id === "delivery-a-pending" ? { ...delivery, receivedQuantity: 20 } : delivery);
    const result = await listPendingDeliveries(adapter, access, { siteId: "site-a" });
    expect(result).toMatchObject({
      ok: true, data: { deliveries: [{ expectedQuantity: 50, receivedQuantity: 20, remainingQuantity: 30 }] },
    });
  });

  it("shows an open delivery with zero remaining quantity and a status warning", async () => {
    const { adapter, access } = setup();
    const original = adapter.listDeliveries;
    adapter.listDeliveries = async (siteId, materialId) =>
      (await original(siteId, materialId)).map((delivery) =>
        delivery.id === "delivery-a-pending" ? { ...delivery, receivedQuantity: 50 } : delivery);
    const result = await listPendingDeliveries(adapter, access, { siteId: "site-a" });
    expect(result).toMatchObject({ ok: true, data: { deliveries: [{ remainingQuantity: 0, status: "open" }] } });
    if (result.ok) expect(result.warnings.join(" ")).toContain("status may need review");
  });

  it("rejects malformed, foreign, and duplicate delivery records", async () => {
    const { adapter, access } = setup();
    const initial = await adapter.listDeliveries("site-a");
    const invalid = [
      initial.map((delivery, index) => index === 0 ? { ...delivery, expectedQuantity: -1 } : delivery),
      initial.map((delivery, index) => index === 0 ? { ...delivery, updatedAt: "yesterday" } : delivery),
      initial.map((delivery, index) => index === 0 ? { ...delivery, siteId: "site-b" } : delivery),
      initial.map((delivery, index) => index === 0 ? { ...delivery, materialId: "steel" } : delivery),
      [...initial, { ...initial[0] }],
    ];
    for (const records of invalid) {
      adapter.listDeliveries = async () => records;
      const result = await listPendingDeliveries(adapter, access, { siteId: "site-a", materialId: "cement" });
      expect(result).toMatchObject({ ok: false, error: { code: "data_unavailable" } });
      expect(result).not.toHaveProperty("sources");
    }
  });

  it("omits evidence IDs that are missing, mismatched, or unavailable", async () => {
    const { adapter, access } = setup();
    const original = adapter.getEvidence;
    for (const replacement of [
      async () => null,
      async (id: string) => ({ ...(await original(id))!, deliveryId: "delivery-b-pending" }),
      async () => { throw new Error("private evidence failure"); },
    ]) {
      adapter.getEvidence = replacement;
      const result = await listPendingDeliveries(adapter, access, { siteId: "site-a" });
      expect(result).toMatchObject({
        ok: true, data: { deliveries: [{ evidenceIds: [] }] },
      });
      if (result.ok) expect(result.warnings.join(" ")).toContain("evidence references are unavailable");
    }
  });

  it("returns a safe retryable failure when delivery retrieval fails", async () => {
    const { adapter, access } = setup();
    adapter.listDeliveries = async () => { throw new Error("Private upstream detail"); };
    const result = await listPendingDeliveries(adapter, access, { siteId: "site-a" });
    expect(result).toMatchObject({ ok: false, error: { code: "upstream_failure", retryable: true } });
    expect(JSON.stringify(result)).not.toContain("Private upstream detail");
  });
});
