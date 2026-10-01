import { describe, expect, it } from "vitest";
import {
  deliveryRecordSchema,
  deliveryEvidenceInputSchema,
  deliveryEvidenceResultSchema,
  materialBalanceInputSchema,
  materialBalanceResultSchema,
  materialMovementSchema,
  pendingDeliveriesResultSchema,
  pendingDeliveriesInputSchema,
  pendingDeliverySchema,
  timestampSchema,
} from "./index";

describe("connector contracts", () => {
  it("accepts a recorded zero without treating it as unavailable", () => {
    const result = materialBalanceResultSchema.parse({
      ok: true,
      data: {
        siteId: "site-a",
        materialId: "cement",
        balance: { state: "recorded", quantity: 0, unit: "bags" },
      },
      sources: [],
      updatedAt: "2026-10-01T10:30:00+05:30",
      warnings: [],
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.balance.state).toBe("recorded");
  });

  it("accepts unavailable data only with an explicit reason", () => {
    const base = {
      ok: true,
      sources: [],
      updatedAt: null,
      warnings: [],
    };
    const data = {
      siteId: "site-a",
      materialId: "cement",
      balance: { state: "unavailable", reason: "missing_records" },
    };

    expect(materialBalanceResultSchema.safeParse({ ...base, data }).success).toBe(true);
    expect(
      materialBalanceResultSchema.safeParse({
        ...base,
        data: { ...data, balance: { state: "unavailable", quantity: 0 } },
      }).success,
    ).toBe(false);
  });

  it("rejects a caller-supplied identity and malformed adapter records", () => {
    expect(
      materialBalanceInputSchema.safeParse({
        siteId: "site-a",
        materialId: "cement",
        userId: "another-user",
      }).success,
    ).toBe(false);

    expect(
      materialMovementSchema.safeParse({
        id: "movement-1",
        siteId: "site-a",
        materialId: "cement",
        kind: "receipt",
        quantity: 10,
        unit: "bags",
        recordedAt: "yesterday",
      }).success,
    ).toBe(false);

    expect(
      deliveryRecordSchema.safeParse({
        id: "delivery-1",
        siteId: "site-a",
        materialId: "cement",
        expectedQuantity: 50,
        receivedQuantity: 60,
        unit: "bags",
        status: "open",
        updatedAt: "2026-10-01T10:30:00Z",
        evidenceIds: [],
      }).success,
    ).toBe(false);
  });

  it("rejects a pending-delivery response missing its unit", () => {
    expect(
      pendingDeliveriesResultSchema.safeParse({
        ok: true,
        data: {
          siteId: "site-a",
          deliveries: [
            {
              id: "delivery-1",
              materialId: "cement",
              expectedQuantity: 50,
              receivedQuantity: 0,
              remainingQuantity: 50,
              status: "open",
              updatedAt: "2026-10-01T10:30:00Z",
              evidenceIds: [],
            },
          ],
        },
        sources: [],
        updatedAt: "2026-10-01T10:30:00Z",
        warnings: [],
      }).success,
    ).toBe(false);
  });

  it("validates all tool inputs without accepting caller identity", () => {
    expect(pendingDeliveriesInputSchema.parse({ siteId: "site-a" })).toEqual({ siteId: "site-a" });
    expect(deliveryEvidenceInputSchema.parse({ evidenceId: "evidence-1" })).toEqual({ evidenceId: "evidence-1" });
    expect(materialBalanceInputSchema.safeParse({ siteId: " ", materialId: "cement" }).success).toBe(false);
    expect(pendingDeliveriesInputSchema.safeParse({ siteId: "site-a", userId: "owner" }).success).toBe(false);
    expect(deliveryEvidenceInputSchema.safeParse({ evidenceId: "evidence-1", userId: "owner" }).success).toBe(false);
  });

  const pending = {
    id: "delivery-1", materialId: "cement", expectedQuantity: 50,
    receivedQuantity: 20, remainingQuantity: 30, status: "open",
    unit: "bags", updatedAt: "2026-10-01T10:30:00Z", evidenceIds: [],
  };

  it("accepts partial receipts and decimal quantities with floating-point roundoff", () => {
    expect(pendingDeliverySchema.safeParse(pending).success).toBe(true);
    expect(pendingDeliverySchema.safeParse({
      ...pending, expectedQuantity: 0.3, receivedQuantity: 0.1, remainingQuantity: 0.2,
    }).success).toBe(true);
  });

  it.each([
    { receivedQuantity: 60 }, { remainingQuantity: 31 },
    { status: "completed" }, { status: "cancelled" }, { status: undefined },
    { expectedQuantity: -1 }, { remainingQuantity: Infinity },
  ])("rejects inconsistent or non-pending deliveries: %j", (invalid) => {
    expect(pendingDeliverySchema.safeParse({ ...pending, ...invalid }).success).toBe(false);
  });

  it("accepts an empty pending list without claiming a stock balance", () => {
    expect(pendingDeliveriesResultSchema.safeParse({
      ok: true, data: { siteId: "site-a", deliveries: [] },
      sources: [], updatedAt: null, warnings: [],
    }).success).toBe(true);
  });

  it("validates evidence and its source metadata", () => {
    const result = {
      ok: true,
      data: {
        id: "evidence-1", deliveryId: "delivery-1", kind: "invoice",
        title: "Test invoice", content: "Contract test content",
        recordedAt: "2026-10-01T10:30:00Z",
      },
      sources: [{ id: "evidence-1", kind: "evidence", label: "Test invoice", recordedAt: "2026-10-01T10:30:00Z" }],
      updatedAt: "2026-10-01T10:30:00Z", warnings: [],
    };
    expect(deliveryEvidenceResultSchema.safeParse(result).success).toBe(true);
    expect(deliveryEvidenceResultSchema.safeParse({ ...result, data: { ...result.data, deliveryId: "" } }).success).toBe(false);
    expect(deliveryEvidenceResultSchema.safeParse({ ...result, sources: [{ ...result.sources[0], recordedAt: "yesterday" }] }).success).toBe(false);
  });

  it("uses the same strict failure shape for all three tools", () => {
    const failure = { ok: false, error: { code: "access_denied", message: "Access denied", retryable: false } };
    for (const schema of [materialBalanceResultSchema, pendingDeliveriesResultSchema, deliveryEvidenceResultSchema]) {
      expect(schema.safeParse(failure).success).toBe(true);
      expect(schema.safeParse({ ...failure, data: {} }).success).toBe(false);
      expect(schema.safeParse({ ...failure, error: { ...failure.error, code: "unknown" } }).success).toBe(false);
      expect(schema.safeParse({ ...failure, error: { code: "access_denied", message: "Access denied" } }).success).toBe(false);
    }
  });

  it.each([-1, Infinity, NaN])("rejects invalid movement quantities: %s", (quantity) => {
    expect(materialMovementSchema.safeParse({
      id: "movement-1", siteId: "site-a", materialId: "cement",
      kind: "receipt", quantity, unit: "bags", recordedAt: "2026-10-01T10:30:00Z",
    }).success).toBe(false);
  });

  it("requires a timezone and preserves signed recorded balances", () => {
    expect(timestampSchema.safeParse("2026-10-01T10:30:00").success).toBe(false);
    expect(materialBalanceResultSchema.safeParse({
      ok: true, data: { siteId: "site-a", materialId: "cement", balance: { state: "recorded", quantity: -5, unit: "bags" } },
      sources: [], updatedAt: null, warnings: ["Recorded discrepancy"],
    }).success).toBe(true);
  });
});
