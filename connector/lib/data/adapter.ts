import type { DeliveryRecord, EvidenceRecord, MaterialMovement, Site } from "../contracts";
import type { DemoUser } from "./sample-schema";

// Internal retrieval only. Callers must establish identity and authorise access.
export interface DataAdapter {
  readonly mode: "sample" | "live";
  readonly label: string;
  getDemoUser(userId: string): Promise<DemoUser | null>;
  listSites(): Promise<Site[]>;
  getSite(siteId: string): Promise<Site | null>;
  listMaterialMovements(siteId: string, materialId: string): Promise<MaterialMovement[]>;
  listDeliveries(siteId: string, materialId?: string): Promise<DeliveryRecord[]>;
  getDelivery(deliveryId: string): Promise<DeliveryRecord | null>;
  getEvidence(evidenceId: string): Promise<EvidenceRecord | null>;
}
