import "server-only";
import { z } from "zod";
import { deliveryRecordSchema, evidenceRecordSchema, materialMovementSchema, siteSchema } from "../contracts";

export const demoUserSchema = z.strictObject({
  id: z.string().trim().min(1).max(128),
  name: z.string().trim().min(1),
  allowedSiteIds: z.array(siteSchema.shape.id),
});
export type DemoUser = z.infer<typeof demoUserSchema>;

export const sampleDatasetSchema = z.strictObject({
  mode: z.literal("sample"),
  label: z.literal("Fictional sample data — not live Pyrock records"),
  users: z.array(demoUserSchema),
  sites: z.array(siteSchema),
  movements: z.array(materialMovementSchema),
  deliveries: z.array(deliveryRecordSchema),
  evidence: z.array(evidenceRecordSchema),
}).superRefine((data, ctx) => {
  const issue = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: "custom", path, message });
  for (const key of ["users", "sites", "movements", "deliveries", "evidence"] as const) {
    const ids = new Set<string>();
    data[key].forEach((record, index) => {
      if (ids.has(record.id)) issue([key, index, "id"], "Duplicate record ID");
      ids.add(record.id);
    });
  }
  const siteIds = new Set(data.sites.map((site) => site.id));
  data.users.forEach((user, index) => {
    if (new Set(user.allowedSiteIds).size !== user.allowedSiteIds.length)
      issue(["users", index, "allowedSiteIds"], "Duplicate site permission");
    user.allowedSiteIds.forEach((id) => {
      if (!siteIds.has(id)) issue(["users", index, "allowedSiteIds"], "Unknown permitted site");
    });
  });
  for (const key of ["movements", "deliveries"] as const) {
    data[key].forEach((record, index) => {
      if (!siteIds.has(record.siteId)) issue([key, index, "siteId"], "Unknown site");
    });
  }
  const deliveries = new Map(data.deliveries.map((delivery) => [delivery.id, delivery]));
  const evidence = new Map(data.evidence.map((record) => [record.id, record]));
  data.deliveries.forEach((delivery, index) => {
    if (new Set(delivery.evidenceIds).size !== delivery.evidenceIds.length)
      issue(["deliveries", index, "evidenceIds"], "Duplicate evidence reference");
    delivery.evidenceIds.forEach((id) => {
      if (evidence.get(id)?.deliveryId !== delivery.id)
        issue(["deliveries", index, "evidenceIds"], "Evidence must belong to this delivery");
    });
  });
  data.evidence.forEach((record, index) => {
    if (!deliveries.get(record.deliveryId)?.evidenceIds.includes(record.id))
      issue(["evidence", index, "deliveryId"], "Evidence must be referenced by its parent delivery");
  });
});
