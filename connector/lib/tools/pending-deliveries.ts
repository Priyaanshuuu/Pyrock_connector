import "server-only";
import {
  deliveryRecordSchema,
  evidenceRecordSchema,
  pendingDeliveriesInputSchema,
  pendingDeliveriesResultSchema,
  toolFailureSchema,
  type DeliveryRecord,
  type PendingDelivery,
  type PendingDeliveriesResult,
  type ToolFailure,
} from "../contracts";
import type { DemoAccess } from "../access/demo-access";
import type { DataAdapter } from "../data/adapter";
import { staleWarning } from "./freshness";

function failure(
  code: ToolFailure["error"]["code"],
  message: string,
  retryable = false,
): ToolFailure {
  return toolFailureSchema.parse({ ok: false, error: { code, message, retryable } });
}

function latestTimestamp(deliveries: DeliveryRecord[]): string | null {
  let latest: string | null = null;
  let latestTime = -Infinity;
  for (const delivery of deliveries) {
    const time = Date.parse(delivery.updatedAt);
    if (time > latestTime) {
      latestTime = time;
      latest = delivery.updatedAt;
    }
  }
  return latest;
}

export async function listPendingDeliveries(
  adapter: DataAdapter,
  access: DemoAccess,
  argumentsFromCaller: unknown,
): Promise<PendingDeliveriesResult> {
  const input = pendingDeliveriesInputSchema.safeParse(argumentsFromCaller);
  if (!input.success) {
    return failure("invalid_input", "Provide a site ID and optional material ID.");
  }

  const authorised = await access.resolveSite({ siteId: input.data.siteId });
  if (!authorised.ok) return authorised;

  let records: unknown;
  try {
    records = await adapter.listDeliveries(authorised.site.id, input.data.materialId);
  } catch {
    return failure("upstream_failure", "Delivery records could not be retrieved.", true);
  }

  const parsed = deliveryRecordSchema.array().safeParse(records);
  if (!parsed.success) {
    return failure("data_unavailable", "Delivery records could not be validated.");
  }
  const ids = new Set<string>();
  for (const delivery of parsed.data) {
    if (
      delivery.siteId !== authorised.site.id ||
      (input.data.materialId !== undefined && delivery.materialId !== input.data.materialId) ||
      ids.has(delivery.id)
    ) {
      return failure("data_unavailable", "Delivery records could not be validated.");
    }
    ids.add(delivery.id);
  }

  const open = parsed.data.filter((delivery) => delivery.status === "open");
  const deliveries: PendingDelivery[] = [];
  let evidenceUnavailable = false;
  for (const delivery of open) {
    const remainingQuantity = delivery.expectedQuantity - delivery.receivedQuantity;
    if (
      !Number.isFinite(remainingQuantity) ||
      (Number.isInteger(delivery.expectedQuantity) &&
        Number.isInteger(delivery.receivedQuantity) &&
        !Number.isSafeInteger(remainingQuantity))
    ) {
      return failure("data_unavailable", "Remaining delivery quantity could not be represented safely.");
    }

    const evidenceIds: string[] = [];
    for (const evidenceId of new Set(delivery.evidenceIds)) {
      try {
        const record = await adapter.getEvidence(evidenceId);
        const evidence = evidenceRecordSchema.safeParse(record);
        if (evidence.success && evidence.data.id === evidenceId && evidence.data.deliveryId === delivery.id) {
          evidenceIds.push(evidenceId);
        } else {
          evidenceUnavailable = true;
        }
      } catch {
        evidenceUnavailable = true;
      }
    }

    deliveries.push({
      id: delivery.id,
      materialId: delivery.materialId,
      expectedQuantity: delivery.expectedQuantity,
      receivedQuantity: delivery.receivedQuantity,
      remainingQuantity,
      status: "open",
      unit: delivery.unit,
      updatedAt: delivery.updatedAt,
      evidenceIds,
    });
  }

  const warnings = adapter.mode === "sample" ? [adapter.label] : [];
  const updatedAt = latestTimestamp(open);
  const stale = staleWarning(updatedAt);
  if (stale) warnings.push(stale);
  if (open.length === 0) warnings.push("No open deliveries were found; this says nothing about stock on hand.");
  if (evidenceUnavailable) warnings.push("Some supporting evidence references are unavailable.");
  if (deliveries.some((delivery) => delivery.remainingQuantity === 0)) {
    warnings.push("An open delivery has no quantity remaining; its status may need review.");
  }

  return pendingDeliveriesResultSchema.parse({
    ok: true,
    data: { siteId: authorised.site.id, deliveries },
    sources: open.map((delivery) => ({
      id: delivery.id,
      kind: "delivery",
      label: `Open ${delivery.materialId} delivery — ${delivery.expectedQuantity - delivery.receivedQuantity} ${delivery.unit} remaining`,
      recordedAt: delivery.updatedAt,
    })),
    updatedAt,
    warnings,
  });
}
