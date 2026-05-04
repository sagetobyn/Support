import type { NdrCase } from "@/types/domain";
import { buildNdrCases as buildCases, isNdrOrder } from "@/lib/ndrCases";
import { normalizeNdrReason } from "@/lib/ndr";
import { publishEvent } from "@/shared/events";

export { isNdrOrder, normalizeNdrReason };

export function detectNdrCases(...params: Parameters<typeof buildCases>) {
  const cases = buildCases(...params);
  for (const ndrCase of cases) {
    publishEvent({
      type: "ndr.detected",
      sourceFeature: "ndr",
      entityType: "ndr_case",
      entityId: ndrCase.id,
      payload: { orderId: ndrCase.orderId, reason: ndrCase.ndrReasonNormalized }
    });
  }
  return cases;
}

export function updateNdrCaseState(ndrCase: NdrCase, patch: Partial<NdrCase>) {
  return { ...ndrCase, ...patch, updatedAt: new Date().toISOString() };
}

