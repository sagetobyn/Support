import type { BrandSettings, Order } from "@/types/domain";
import { calculateRiskScore } from "@/features/risk";
import { publishEvent } from "@/shared/events";

export function scoreOrderForLedger(order: Partial<Order>, settings: BrandSettings) {
  const result = calculateRiskScore(order, { settings });
  publishEvent({
    type: "risk.score.calculated",
    sourceFeature: "risk",
    entityType: "order",
    entityId: order.id,
    payload: { orderId: order.orderId, score: result.score, bucket: result.bucket, reasons: result.reasons }
  });
  return result;
}

