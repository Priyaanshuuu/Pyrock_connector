import { describe, expect, it, vi } from "vitest";
import { createDemoAccess } from "../access/demo-access";
import { createSampleAdapter } from "../data/sample-adapter";
import { getDeliveryEvidence } from "./delivery-evidence";
import { getMaterialBalance } from "./material-balance";
import { listPendingDeliveries } from "./pending-deliveries";
import { staleAfterMs, staleWarning } from "./freshness";

describe("source freshness", () => {
  const now = Date.parse("2026-10-03T12:00:00Z");

  it("warns only when a known source is older than 48 hours", () => {
    expect(staleWarning(null, now)).toBeNull();
    expect(staleWarning(new Date(now - staleAfterMs).toISOString(), now)).toBeNull();
    expect(staleWarning(new Date(now - staleAfterMs - 1).toISOString(), now)).toContain("48 hours");
  });

  it("adds stale warnings to each tool without changing recorded values or timestamps", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-05T12:00:00Z"));
    try {
      const adapter = createSampleAdapter();
      const access = createDemoAccess(adapter, () => "demo-owner");
      const balance = await getMaterialBalance(adapter, access, { siteId: "site-a", materialId: "cement" });
      const pending = await listPendingDeliveries(adapter, access, { siteId: "site-a", materialId: "cement" });
      const evidence = await getDeliveryEvidence(adapter, access, { evidenceId: "evidence-a-message" });
      for (const result of [balance, pending, evidence]) {
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.updatedAt).toMatch(/^2026-10-01/);
          expect(result.warnings).toContain(staleWarning(result.updatedAt));
        }
      }
      if (balance.ok) expect(balance.data.balance).toMatchObject({ state: "recorded", quantity: 250 });
    } finally {
      vi.useRealTimers();
    }
  });
});
