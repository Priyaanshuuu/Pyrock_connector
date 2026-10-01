import "server-only";
import { deliveryRecordSchema, evidenceRecordSchema, materialMovementSchema, siteSchema } from "../contracts";
import type { DataAdapter } from "./adapter";
import { sampleFixtures } from "./sample-fixtures";
import { demoUserSchema, sampleDatasetSchema } from "./sample-schema";

export function createSampleAdapter(records: unknown = sampleFixtures): DataAdapter {
  // Parsing creates a private snapshot and rejects malformed or broken relationships.
  const data = sampleDatasetSchema.parse(records);
  return {
    mode: data.mode,
    label: data.label,
    async getDemoUser(userId) {
      const user = data.users.find((record) => record.id === userId);
      return user ? demoUserSchema.parse(user) : null;
    },
    async listSites() {
      return siteSchema.array().parse(data.sites);
    },
    async getSite(siteId) {
      const site = data.sites.find((record) => record.id === siteId);
      return site ? siteSchema.parse(site) : null;
    },
    async listMaterialMovements(siteId, materialId) {
      return materialMovementSchema.array().parse(data.movements.filter(
        (record) => record.siteId === siteId && record.materialId === materialId,
      ));
    },
    async listDeliveries(siteId, materialId) {
      return deliveryRecordSchema.array().parse(data.deliveries.filter(
        (record) => record.siteId === siteId && (materialId === undefined || record.materialId === materialId),
      ));
    },
    async getDelivery(deliveryId) {
      const delivery = data.deliveries.find((record) => record.id === deliveryId);
      return delivery ? deliveryRecordSchema.parse(delivery) : null;
    },
    async getEvidence(evidenceId) {
      const evidence = data.evidence.find((record) => record.id === evidenceId);
      return evidence ? evidenceRecordSchema.parse(evidence) : null;
    },
  };
}
