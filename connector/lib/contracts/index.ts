import { z } from "zod";

const idSchema = z.string().trim().min(1).max(128);
const labelSchema = z.string().trim().min(1);
const quantitySchema = z.number().finite().nonnegative();

// JSON timestamps carry an explicit UTC marker or numeric timezone offset.
export const timestampSchema = z.iso.datetime({ offset: true });
export const unitSchema = z.string().trim().min(1).max(32);

export const siteSchema = z.strictObject({
  id: idSchema,
  name: labelSchema,
});

export const materialMovementSchema = z.strictObject({
  id: idSchema,
  siteId: idSchema,
  materialId: idSchema,
  kind: z.enum(["opening", "receipt", "usage"]),
  quantity: quantitySchema,
  unit: unitSchema,
  recordedAt: timestampSchema,
});

export const deliveryRecordSchema = z
  .strictObject({
    id: idSchema,
    siteId: idSchema,
    materialId: idSchema,
    expectedQuantity: quantitySchema,
    receivedQuantity: quantitySchema,
    unit: unitSchema,
    status: z.enum(["open", "completed", "cancelled"]),
    updatedAt: timestampSchema,
    evidenceIds: z.array(idSchema),
  })
  .refine((delivery) => delivery.receivedQuantity <= delivery.expectedQuantity, {
    message: "Received quantity cannot exceed expected quantity",
    path: ["receivedQuantity"],
  });

export const evidenceRecordSchema = z.strictObject({
  id: idSchema,
  deliveryId: idSchema,
  kind: z.enum(["invoice", "message"]),
  title: labelSchema,
  content: z.string().min(1),
  recordedAt: timestampSchema,
});

export const sourceReferenceSchema = z.strictObject({
  id: idSchema,
  kind: z.enum(["movement", "delivery", "evidence"]),
  label: labelSchema,
  recordedAt: timestampSchema,
});

export const materialBalanceInputSchema = z.strictObject({
  siteId: idSchema,
  materialId: idSchema,
});

export const pendingDeliveriesInputSchema = z.strictObject({
  siteId: idSchema,
  materialId: idSchema.optional(),
});

export const deliveryEvidenceInputSchema = z.strictObject({
  evidenceId: idSchema,
});

export const materialBalanceDataSchema = z.strictObject({
  siteId: idSchema,
  materialId: idSchema,
  balance: z.discriminatedUnion("state", [
    z.strictObject({
      state: z.literal("recorded"),
      quantity: z.number().finite(),
      unit: unitSchema,
    }),
    z.strictObject({
      state: z.literal("unavailable"),
      reason: z.enum(["missing_records", "incomplete_records"]),
    }),
  ]),
});

export const pendingDeliverySchema = z.strictObject({
  id: idSchema,
  materialId: idSchema,
  expectedQuantity: quantitySchema,
  receivedQuantity: quantitySchema,
  remainingQuantity: quantitySchema,
  status: z.literal("open"),
  unit: unitSchema,
  updatedAt: timestampSchema,
  evidenceIds: z.array(idSchema),
}).refine((delivery) => delivery.receivedQuantity <= delivery.expectedQuantity, {
  message: "Received quantity cannot exceed expected quantity",
  path: ["receivedQuantity"],
}).refine((delivery) => {
  const remaining = delivery.expectedQuantity - delivery.receivedQuantity;
  // Allow floating-point roundoff, without rounding quantities or converting units.
  const tolerance = Number.EPSILON * Math.max(
    1, delivery.expectedQuantity, delivery.receivedQuantity, delivery.remainingQuantity,
  );
  return Math.abs(delivery.remainingQuantity - remaining) <= tolerance;
}, {
  message: "Remaining quantity must equal expected quantity minus received quantity",
  path: ["remainingQuantity"],
});

export const pendingDeliveriesDataSchema = z.strictObject({
  siteId: idSchema,
  deliveries: z.array(pendingDeliverySchema),
});

export const deliveryEvidenceDataSchema = evidenceRecordSchema;

export const toolFailureSchema = z.strictObject({
  ok: z.literal(false),
  error: z.strictObject({
    code: z.enum([
      "unauthenticated",
      "access_denied",
      "invalid_input",
      "ambiguous_site",
      "not_found",
      "data_unavailable",
      "upstream_failure",
    ]),
    message: labelSchema,
    retryable: z.boolean(),
  }),
});

function toolResultSchema<T extends z.ZodType>(dataSchema: T) {
  return z.discriminatedUnion("ok", [
    z.strictObject({
      ok: z.literal(true),
      data: dataSchema,
      sources: z.array(sourceReferenceSchema),
      updatedAt: timestampSchema.nullable(),
      warnings: z.array(labelSchema),
    }),
    toolFailureSchema,
  ]);
}

export const materialBalanceResultSchema = toolResultSchema(materialBalanceDataSchema);
export const pendingDeliveriesResultSchema = toolResultSchema(pendingDeliveriesDataSchema);
export const deliveryEvidenceResultSchema = toolResultSchema(deliveryEvidenceDataSchema);

export type Site = z.infer<typeof siteSchema>;
export type MaterialMovement = z.infer<typeof materialMovementSchema>;
export type DeliveryRecord = z.infer<typeof deliveryRecordSchema>;
export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;
export type SourceReference = z.infer<typeof sourceReferenceSchema>;
export type MaterialBalanceInput = z.infer<typeof materialBalanceInputSchema>;
export type PendingDeliveriesInput = z.infer<typeof pendingDeliveriesInputSchema>;
export type DeliveryEvidenceInput = z.infer<typeof deliveryEvidenceInputSchema>;
export type MaterialBalanceData = z.infer<typeof materialBalanceDataSchema>;
export type PendingDelivery = z.infer<typeof pendingDeliverySchema>;
export type PendingDeliveriesData = z.infer<typeof pendingDeliveriesDataSchema>;
export type DeliveryEvidenceData = z.infer<typeof deliveryEvidenceDataSchema>;
export type ToolFailure = z.infer<typeof toolFailureSchema>;
export type MaterialBalanceResult = z.infer<typeof materialBalanceResultSchema>;
export type PendingDeliveriesResult = z.infer<typeof pendingDeliveriesResultSchema>;
export type DeliveryEvidenceResult = z.infer<typeof deliveryEvidenceResultSchema>;
