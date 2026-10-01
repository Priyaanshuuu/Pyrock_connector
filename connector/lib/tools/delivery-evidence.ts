import "server-only";
import {
  deliveryEvidenceInputSchema,
  deliveryEvidenceResultSchema,
  deliveryRecordSchema,
  evidenceRecordSchema,
  toolFailureSchema,
  type DeliveryEvidenceResult,
  type ToolFailure,
} from "../contracts";
import type { DemoAccess } from "../access/demo-access";
import type { DataAdapter } from "../data/adapter";

function failure(
  code: ToolFailure["error"]["code"],
  message: string,
  retryable = false,
): ToolFailure {
  return toolFailureSchema.parse({ ok: false, error: { code, message, retryable } });
}

const unavailable = () => failure("not_found", "Evidence is unavailable.");
const malformed = () => failure("data_unavailable", "Evidence records could not be validated.");
const upstreamFailure = () => failure("upstream_failure", "Evidence records could not be retrieved.", true);

export async function getDeliveryEvidence(
  adapter: DataAdapter,
  access: DemoAccess,
  argumentsFromCaller: unknown,
): Promise<DeliveryEvidenceResult> {
  const input = deliveryEvidenceInputSchema.safeParse(argumentsFromCaller);
  if (!input.success) return failure("invalid_input", "Provide an evidence ID.");

  // Do not query an ID until the server has established a current identity.
  const identity = await access.getIdentity();
  if (!identity.ok) return identity;

  let rawEvidence: unknown;
  try {
    rawEvidence = await adapter.getEvidence(input.data.evidenceId);
  } catch {
    return upstreamFailure();
  }
  if (rawEvidence === null) return unavailable();
  const parsedEvidence = evidenceRecordSchema.safeParse(rawEvidence);
  if (!parsedEvidence.success || parsedEvidence.data.id !== input.data.evidenceId) return malformed();
  const evidence = parsedEvidence.data;

  let rawDelivery: unknown;
  try {
    rawDelivery = await adapter.getDelivery(evidence.deliveryId);
  } catch {
    return upstreamFailure();
  }
  if (rawDelivery === null) return unavailable();
  const parsedDelivery = deliveryRecordSchema.safeParse(rawDelivery);
  if (!parsedDelivery.success || parsedDelivery.data.id !== evidence.deliveryId) return malformed();
  const delivery = parsedDelivery.data;
  // In the sample model, the parent's explicit reference is the evidence-level grant.
  if (!delivery.evidenceIds.includes(evidence.id)) return unavailable();

  // Recheck current site permission now, even if an earlier delivery list showed this ID.
  const authorised = await access.resolveSite({ siteId: delivery.siteId });
  if (!authorised.ok) {
    // Do not reveal whether a guessed ID exists on another site.
    return authorised.error.code === "access_denied" ? unavailable() : authorised;
  }
  if (authorised.site.id !== delivery.siteId) return malformed();

  return deliveryEvidenceResultSchema.parse({
    ok: true,
    data: evidence,
    sources: [{
      id: evidence.id,
      kind: "evidence",
      label: evidence.title,
      recordedAt: evidence.recordedAt,
    }],
    updatedAt: evidence.recordedAt,
    warnings: adapter.mode === "sample" ? [adapter.label] : [],
  });
}
