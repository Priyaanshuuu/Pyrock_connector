import { describe, expect, it } from "vitest";
import { createDemoAccess } from "../access/demo-access";
import { createSampleAdapter } from "../data/sample-adapter";
import { getMaterialBalance } from "./material-balance";

function setup(userId: string | undefined = "demo-owner") {
  const adapter = createSampleAdapter();
  const access = createDemoAccess(adapter, () => userId);
  return { adapter, access };
}

describe("get_material_balance", () => {
  it("returns 250 recorded Site A cement bags with permitted sources and latest update", async () => {
    const { adapter, access } = setup();
    adapter.listDeliveries = async () => { throw new Error("Deliveries must not be read for stock"); };
    const result = await getMaterialBalance(adapter, access, { siteId: "site-a", materialId: "cement" });
    expect(result).toMatchObject({
      ok: true,
      data: { siteId: "site-a", materialId: "cement", balance: { state: "recorded", quantity: 250, unit: "bags" } },
      sources: [
        { id: "movement-a-opening", kind: "movement", recordedAt: "2026-10-01T08:00:00+05:30" },
        { id: "movement-a-receipt", kind: "movement", recordedAt: "2026-10-01T09:00:00+05:30" },
        { id: "movement-a-usage", kind: "movement", recordedAt: "2026-10-01T10:30:00+05:30" },
      ],
      updatedAt: "2026-10-01T10:30:00+05:30",
    });
    if (result.ok) {
      expect(result.sources.map((source) => source.label)).toEqual([
        "opening — 100 bags", "receipt — 450 bags", "usage — 300 bags",
      ]);
      expect(result.warnings).toContain(adapter.label);
    }
  });

  it("keeps Site B movements separate and honours its owner's permission", async () => {
    const { adapter, access } = setup();
    const result = await getMaterialBalance(adapter, access, { siteId: "site-b", materialId: "cement" });
    expect(result).toMatchObject({
      ok: true, data: { siteId: "site-b", balance: { state: "recorded", quantity: 60, unit: "bags" } },
    });
    if (result.ok) expect(result.sources.every((source) => source.id.startsWith("movement-b-"))).toBe(true);
  });

  it("returns the same denied result for forbidden and unknown sites without reading movements", async () => {
    const { adapter, access } = setup("demo-supervisor");
    let reads = 0;
    adapter.listMaterialMovements = async () => { reads += 1; return []; };
    const denied = await getMaterialBalance(adapter, access, { siteId: "site-b", materialId: "cement" });
    const unknown = await getMaterialBalance(adapter, access, { siteId: "unknown", materialId: "cement" });
    expect(denied).toEqual(unknown);
    expect(denied).toMatchObject({ ok: false, error: { code: "access_denied" } });
    expect(reads).toBe(0);
  });

  it("rejects missing identity and caller-supplied user IDs", async () => {
    const adapter = createSampleAdapter();
    const access = createDemoAccess(adapter, () => undefined);
    expect(await getMaterialBalance(adapter, access, { siteId: "site-a", materialId: "cement" })).toMatchObject({
      ok: false, error: { code: "unauthenticated" },
    });
    const owner = createDemoAccess(adapter, () => "demo-owner");
    expect(await getMaterialBalance(adapter, owner, {
      siteId: "site-a", materialId: "cement", userId: "demo-supervisor",
    })).toMatchObject({ ok: false, error: { code: "invalid_input" } });
  });

  it("reports missing records without inventing a zero stock balance", async () => {
    const { adapter, access } = setup();
    const result = await getMaterialBalance(adapter, access, { siteId: "site-a", materialId: "steel" });
    expect(result).toMatchObject({
      ok: true,
      data: { siteId: "site-a", materialId: "steel", balance: { state: "unavailable", reason: "missing_records" } },
      sources: [], updatedAt: null,
    });
    if (result.ok) expect(result.data.balance).not.toHaveProperty("quantity");
  });

  it("distinguishes a recorded zero from unavailable data", async () => {
    const { adapter, access } = setup();
    const original = adapter.listMaterialMovements;
    adapter.listMaterialMovements = async (site, material) => {
      const records = await original(site, material);
      return records.map((record) => ({ ...record, quantity: 0 }));
    };
    expect(await getMaterialBalance(adapter, access, { siteId: "site-a", materialId: "cement" })).toMatchObject({
      ok: true, data: { balance: { state: "recorded", quantity: 0, unit: "bags" } },
    });
  });

  it("reports incomplete records for missing or duplicate opening movements and mixed units", async () => {
    const { adapter, access } = setup();
    const original = adapter.listMaterialMovements;
    const initial = await original("site-a", "cement");
    const variants = [
      initial.filter((record) => record.kind !== "opening"),
      [...initial, { ...initial[0], id: "another-opening" }],
      initial.map((record, index) => index === 1 ? { ...record, unit: "kg" } : record),
    ];
    for (const records of variants) {
      adapter.listMaterialMovements = async () => records;
      const result = await getMaterialBalance(adapter, access, { siteId: "site-a", materialId: "cement" });
      expect(result).toMatchObject({
        ok: true, data: { balance: { state: "unavailable", reason: "incomplete_records" } },
      });
      if (result.ok) {
        expect(result.data.balance).not.toHaveProperty("quantity");
        expect(result.sources).toHaveLength(records.length);
        expect(result.updatedAt).toBe("2026-10-01T10:30:00+05:30");
      }
    }
  });

  it("rejects malformed, foreign, or duplicate movements before exposing sources", async () => {
    const { adapter, access } = setup();
    const original = adapter.listMaterialMovements;
    const initial = await original("site-a", "cement");
    const malformed = [
      initial.map((record, index) => index === 1 ? { ...record, quantity: -1 } : record),
      initial.map((record, index) => index === 1 ? { ...record, recordedAt: "yesterday" } : record),
      initial.map((record, index) => index === 1 ? { ...record, siteId: "site-b" } : record),
      initial.map((record, index) => index === 1 ? { ...record, materialId: "steel" } : record),
      [...initial, { ...initial[1] }],
    ];
    for (const records of malformed) {
      adapter.listMaterialMovements = async () => records;
      const result = await getMaterialBalance(adapter, access, { siteId: "site-a", materialId: "cement" });
      expect(result).toMatchObject({ ok: false, error: { code: "data_unavailable" } });
      expect(result).not.toHaveProperty("sources");
    }
  });

  it("reports adapter retrieval failures safely", async () => {
    const { adapter, access } = setup();
    adapter.listMaterialMovements = async () => { throw new Error("Private upstream details"); };
    const result = await getMaterialBalance(adapter, access, { siteId: "site-a", materialId: "cement" });
    expect(result).toMatchObject({ ok: false, error: { code: "upstream_failure", retryable: true } });
    expect(JSON.stringify(result)).not.toContain("Private upstream details");
  });

  it("keeps a negative recorded discrepancy visible", async () => {
    const { adapter, access } = setup();
    const original = adapter.listMaterialMovements;
    adapter.listMaterialMovements = async (site, material) =>
      (await original(site, material)).map((record) => record.kind === "usage" ? { ...record, quantity: 600 } : record);
    expect(await getMaterialBalance(adapter, access, { siteId: "site-a", materialId: "cement" })).toMatchObject({
      ok: true, data: { balance: { state: "recorded", quantity: -50, unit: "bags" } },
    });
  });
});
