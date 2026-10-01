import { describe, expect, it } from "vitest";
import { createSampleAdapter } from "./sample-adapter";
import { sampleFixtures } from "./sample-fixtures";

describe("fictional sample adapter", () => {
  it("labels the dataset and provides two users with different site permissions", async () => {
    const adapter = createSampleAdapter();
    expect(adapter.mode).toBe("sample");
    expect(adapter.label).toContain("Fictional sample data");
    expect((await adapter.listSites()).map((site) => site.id)).toEqual(["site-a", "site-b"]);
    expect((await adapter.getDemoUser("demo-owner"))?.allowedSiteIds).toEqual(["site-a", "site-b"]);
    expect((await adapter.getDemoUser("demo-supervisor"))?.allowedSiteIds).toEqual(["site-a"]);
  });

  it("preserves 250 recorded bags separately from the pending 50 bags", async () => {
    const adapter = createSampleAdapter();
    const movements = await adapter.listMaterialMovements("site-a", "cement");
    expect(movements.map(({ kind, quantity }) => ({ kind, quantity }))).toEqual([
      { kind: "opening", quantity: 100 }, { kind: "receipt", quantity: 450 }, { kind: "usage", quantity: 300 },
    ]);
    expect(movements.reduce((sum, movement) => sum + (movement.kind === "usage" ? -movement.quantity : movement.quantity), 0)).toBe(250);
    expect(new Set(movements.map((movement) => movement.unit))).toEqual(new Set(["bags"]));
    const deliveries = await adapter.listDeliveries("site-a", "cement");
    const pending = deliveries.filter((delivery) => delivery.status === "open");
    expect(pending).toHaveLength(1);
    expect(pending[0].expectedQuantity - pending[0].receivedQuantity).toBe(50);
    expect(deliveries.find((delivery) => delivery.status === "completed")?.receivedQuantity).toBe(450);
    expect(movements.at(-1)?.recordedAt).toBe("2026-10-01T10:30:00+05:30");
  });

  it("filters by site and material without mixing in other records", async () => {
    const adapter = createSampleAdapter();
    expect((await adapter.listMaterialMovements("site-b", "cement")).every((record) => record.siteId === "site-b")).toBe(true);
    expect(await adapter.listMaterialMovements("site-a", "steel")).toEqual([]);
    expect((await adapter.listDeliveries("site-b")).map((record) => record.id)).toEqual(["delivery-b-pending"]);
    expect(await adapter.listDeliveries("site-a", "steel")).toEqual([]);
  });

  it("resolves evidence through its parent delivery with usable source IDs and timestamps", async () => {
    const adapter = createSampleAdapter();
    for (const site of await adapter.listSites()) {
      expect(await adapter.getSite(site.id)).toEqual(site);
      for (const delivery of await adapter.listDeliveries(site.id)) {
        expect(await adapter.getDelivery(delivery.id)).toEqual(delivery);
        for (const id of delivery.evidenceIds) {
          const evidence = await adapter.getEvidence(id);
          expect(evidence?.deliveryId).toBe(delivery.id);
          expect(evidence?.content).toContain("FICTIONAL SAMPLE");
          expect(evidence?.recordedAt).toBeTruthy();
        }
      }
    }
  });

  it("returns missing records explicitly without inventing a zero balance", async () => {
    const adapter = createSampleAdapter();
    expect(await adapter.getSite("missing")).toBeNull();
    expect(await adapter.getDemoUser("missing")).toBeNull();
    expect(await adapter.getDelivery("missing")).toBeNull();
    expect(await adapter.getEvidence("missing")).toBeNull();
    expect(await adapter.listMaterialMovements("missing", "cement")).toEqual([]);
    expect(await adapter.listDeliveries("missing")).toEqual([]);
  });

  it("isolates its snapshot from changes to input records and returned records", async () => {
    const input = structuredClone(sampleFixtures);
    const adapter = createSampleAdapter(input);
    input.movements[0].quantity = 999;
    const movements = await adapter.listMaterialMovements("site-a", "cement");
    movements[0].quantity = 999;
    const user = await adapter.getDemoUser("demo-supervisor");
    user?.allowedSiteIds.push("site-b");
    const delivery = await adapter.getDelivery("delivery-a-received");
    delivery?.evidenceIds.push("fake");
    const evidence = await adapter.getEvidence("evidence-a-invoice");
    if (evidence) evidence.content = "Changed";
    const sites = await adapter.listSites();
    sites[0].name = "Changed";
    expect((await adapter.listMaterialMovements("site-a", "cement"))[0].quantity).toBe(100);
    expect((await adapter.getDemoUser("demo-supervisor"))?.allowedSiteIds).toEqual(["site-a"]);
    expect((await adapter.getDelivery("delivery-a-received"))?.evidenceIds).toEqual(["evidence-a-invoice"]);
    expect((await adapter.getEvidence("evidence-a-invoice"))?.content).toContain("FICTIONAL SAMPLE");
    expect((await adapter.getSite("site-a"))?.name).toBe("Fictional Site A");
  });

  it("rejects malformed quantities and timestamps before serving data", () => {
    const input = structuredClone(sampleFixtures);
    input.movements[0].quantity = -1;
    expect(() => createSampleAdapter(input)).toThrow();
    input.movements[0].quantity = 100;
    input.movements[0].recordedAt = "yesterday";
    expect(() => createSampleAdapter(input)).toThrow();
  });

  it("rejects duplicate IDs and references to unknown sites", () => {
    const input = structuredClone(sampleFixtures);
    input.sites.push({ ...input.sites[0] });
    expect(() => createSampleAdapter(input)).toThrow();
    input.sites.pop();
    input.users[0].allowedSiteIds.push("unknown-site");
    expect(() => createSampleAdapter(input)).toThrow();
    input.users[0].allowedSiteIds.pop();
    input.movements[0].siteId = "unknown-site";
    expect(() => createSampleAdapter(input)).toThrow();
  });

  it("rejects missing, mismatched, and unreferenced delivery evidence", () => {
    const input = structuredClone(sampleFixtures);
    input.deliveries[0].evidenceIds = ["missing-evidence"];
    expect(() => createSampleAdapter(input)).toThrow();
    input.deliveries[0].evidenceIds = ["evidence-b-message"];
    expect(() => createSampleAdapter(input)).toThrow();
    input.deliveries[0].evidenceIds = [];
    expect(() => createSampleAdapter(input)).toThrow();
  });
});
