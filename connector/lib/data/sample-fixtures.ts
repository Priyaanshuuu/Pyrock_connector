import "server-only";

// Fictional records only. This module is internal to the sample adapter.
export const sampleFixtures = {
  mode: "sample",
  label: "Fictional sample data — not live Pyrock records",
  users: [
    { id: "demo-owner", name: "Fictional owner", allowedSiteIds: ["site-a", "site-b"] },
    { id: "demo-supervisor", name: "Fictional Site A supervisor", allowedSiteIds: ["site-a"] },
  ],
  sites: [
    { id: "site-a", name: "Fictional Site A" },
    { id: "site-b", name: "Fictional Site B" },
  ],
  movements: [
    { id: "movement-a-opening", siteId: "site-a", materialId: "cement", kind: "opening", quantity: 100, unit: "bags", recordedAt: "2026-10-01T08:00:00+05:30" },
    { id: "movement-a-receipt", siteId: "site-a", materialId: "cement", kind: "receipt", quantity: 450, unit: "bags", recordedAt: "2026-10-01T09:00:00+05:30" },
    { id: "movement-a-usage", siteId: "site-a", materialId: "cement", kind: "usage", quantity: 300, unit: "bags", recordedAt: "2026-10-01T10:30:00+05:30" },
    { id: "movement-b-opening", siteId: "site-b", materialId: "cement", kind: "opening", quantity: 80, unit: "bags", recordedAt: "2026-10-01T08:00:00+05:30" },
    { id: "movement-b-usage", siteId: "site-b", materialId: "cement", kind: "usage", quantity: 20, unit: "bags", recordedAt: "2026-10-01T10:00:00+05:30" },
  ],
  deliveries: [
    { id: "delivery-a-received", siteId: "site-a", materialId: "cement", expectedQuantity: 450, receivedQuantity: 450, unit: "bags", status: "completed", updatedAt: "2026-10-01T09:00:00+05:30", evidenceIds: ["evidence-a-invoice"] },
    { id: "delivery-a-pending", siteId: "site-a", materialId: "cement", expectedQuantity: 50, receivedQuantity: 0, unit: "bags", status: "open", updatedAt: "2026-10-01T10:30:00+05:30", evidenceIds: ["evidence-a-message"] },
    { id: "delivery-b-pending", siteId: "site-b", materialId: "cement", expectedQuantity: 40, receivedQuantity: 0, unit: "bags", status: "open", updatedAt: "2026-10-01T10:00:00+05:30", evidenceIds: ["evidence-b-message"] },
  ],
  evidence: [
    { id: "evidence-a-invoice", deliveryId: "delivery-a-received", kind: "invoice", title: "Fictional Site A cement invoice", content: "FICTIONAL SAMPLE: Receipt of 450 cement bags at Site A. This is not a customer invoice.", recordedAt: "2026-10-01T09:00:00+05:30" },
    { id: "evidence-a-message", deliveryId: "delivery-a-pending", kind: "message", title: "Fictional Site A delivery message", content: "FICTIONAL SAMPLE: Another 50 cement bags are expected at Site A and have not been received.", recordedAt: "2026-10-01T10:30:00+05:30" },
    { id: "evidence-b-message", deliveryId: "delivery-b-pending", kind: "message", title: "Fictional Site B delivery message", content: "FICTIONAL SAMPLE: 40 cement bags are expected at Site B and have not been received.", recordedAt: "2026-10-01T10:00:00+05:30" },
  ],
};
