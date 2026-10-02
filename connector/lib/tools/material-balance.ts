import "server-only";
import {
  materialBalanceInputSchema,
  materialBalanceResultSchema,
  materialMovementSchema,
  toolFailureSchema,
  type MaterialBalanceResult,
  type MaterialMovement,
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

function latestTimestamp(movements: MaterialMovement[]): string | null {
  let latest: string | null = null;
  let latestTime = -Infinity;
  for (const movement of movements) {
    const time = Date.parse(movement.recordedAt);
    if (time > latestTime) {
      latestTime = time;
      latest = movement.recordedAt;
    }
  }
  return latest;
}

export async function getMaterialBalance(
  adapter: DataAdapter,
  access: DemoAccess,
  argumentsFromCaller: unknown,
): Promise<MaterialBalanceResult> {
  const input = materialBalanceInputSchema.safeParse(argumentsFromCaller);
  if (!input.success) {
    return failure("invalid_input", "Provide a site ID and material ID.");
  }

  const authorised = await access.resolveSite({ siteId: input.data.siteId });
  if (!authorised.ok) return authorised;

  let records: unknown;
  try {
    records = await adapter.listMaterialMovements(authorised.site.id, input.data.materialId);
  } catch {
    return failure("upstream_failure", "Material records could not be retrieved.", true);
  }

  const parsed = materialMovementSchema.array().safeParse(records);
  if (!parsed.success) {
    return failure("data_unavailable", "Material records could not be validated.");
  }
  const movements = parsed.data;
  const ids = new Set<string>();
  for (const movement of movements) {
    if (
      movement.siteId !== authorised.site.id ||
      movement.materialId !== input.data.materialId ||
      ids.has(movement.id)
    ) {
      return failure("data_unavailable", "Material records could not be validated.");
    }
    ids.add(movement.id);
  }

  const sources = movements.map((movement) => ({
    id: movement.id,
    kind: "movement" as const,
    label: `${movement.kind} — ${movement.quantity} ${movement.unit}`,
    recordedAt: movement.recordedAt,
  }));
  const updatedAt = latestTimestamp(movements);
  const sampleWarning = adapter.mode === "sample" ? [adapter.label] : [];
  const stale = staleWarning(updatedAt);
  if (stale) sampleWarning.push(stale);

  if (movements.length === 0) {
    return materialBalanceResultSchema.parse({
      ok: true,
      data: {
        siteId: authorised.site.id,
        materialId: input.data.materialId,
        balance: { state: "unavailable", reason: "missing_records" },
      },
      sources,
      updatedAt,
      warnings: [...sampleWarning, "No material movements were found."],
    });
  }

  const openingCount = movements.filter((movement) => movement.kind === "opening").length;
  const units = new Set(movements.map((movement) => movement.unit));
  if (openingCount !== 1 || units.size !== 1) {
    return materialBalanceResultSchema.parse({
      ok: true,
      data: {
        siteId: authorised.site.id,
        materialId: input.data.materialId,
        balance: { state: "unavailable", reason: "incomplete_records" },
      },
      sources,
      updatedAt,
      warnings: [...sampleWarning, "The movements cannot establish a balance with one opening record and one consistent unit."],
    });
  }

  const quantity = movements.reduce(
    (total, movement) => total + (movement.kind === "usage" ? -movement.quantity : movement.quantity),
    0,
  );
  if (!Number.isFinite(quantity) || (movements.every((movement) => Number.isInteger(movement.quantity)) && !Number.isSafeInteger(quantity))) {
    return failure("data_unavailable", "Material balance could not be represented safely.");
  }

  return materialBalanceResultSchema.parse({
    ok: true,
    data: {
      siteId: authorised.site.id,
      materialId: input.data.materialId,
      balance: { state: "recorded", quantity, unit: movements[0].unit },
    },
    sources,
    updatedAt,
    warnings: sampleWarning,
  });
}
