import type { ActionItem, ActionPriority, BrandSettings, CustomerIntent, NdrCase, Order, RecommendedAction } from "@/types/domain";
import { estimatedLeakageForOrder } from "@/lib/profitRecovery";
import { normalizeNdrReason } from "@/lib/ndr";

export function recommendedActionLabel(action: RecommendedAction) {
  return action
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function nextActionAfterResponse(order: Order, intent: CustomerIntent): { action: RecommendedAction; reason: string } {
  if (intent === "confirm_delivery") return { action: "ship_normally", reason: "Customer confirmed intent, so the order can move." };
  if (intent === "update_address") return { action: "update_address_with_courier", reason: "Customer shared or requested address correction." };
  if (intent === "reschedule_today" || intent === "reschedule_tomorrow" || intent === "reschedule_specific_date") {
    return { action: "request_reattempt", reason: "Customer requested another delivery attempt." };
  }
  if (intent === "share_alternate_phone") return { action: "update_address_with_courier", reason: "Alternate phone should be added before reattempt." };
  if (intent === "convert_prepaid") return { action: "convert_to_prepaid", reason: "Customer is open to prepaid conversion." };
  if (intent === "cancel_order") return { action: "mark_cancelled", reason: "Customer requested cancellation." };
  if (intent === "angry_customer") return { action: "escalate_to_ops", reason: "Sensitive customer response needs human handling." };

  if (order.ndrReason) {
    const ndr = normalizeNdrReason(order.ndrReason);
    return { action: ndr.recommendedAction, reason: ndr.recommendedMessage };
  }

  return { action: order.recommendedAction, reason: order.recommendedActionReason };
}

export function priorityForAction(order: Order, ndrCase?: NdrCase): ActionPriority {
  if (ndrCase?.urgency === "Critical") return "critical";
  if (order.riskBucket === "Critical" && order.paymentMode === "COD") return "high";
  if (order.orderValue >= 1499 && ["High", "Critical"].includes(order.riskBucket)) return "high";
  if (order.addressQualityScore < 50) return "high";
  if (order.addressQualityScore < 70) return "medium";
  if (order.recommendedAction === "convert_to_prepaid" && order.riskScore >= 61) return "high";
  if (order.recommendedAction === "escalate_to_ops") return "medium";
  return "medium";
}

export function createActionItem(order: Order, brand: BrandSettings, ndrCase?: NdrCase): ActionItem {
  const now = new Date().toISOString();
  const estimatedLeakage = estimatedLeakageForOrder(order, brand);
  return {
    id: `action-${order.id}-${order.recommendedAction}`,
    brandId: brand.id,
    orderId: order.id,
    ndrCaseId: ndrCase?.id,
    sourceFeature: ndrCase ? "ndr" : order.recommendedAction === "convert_to_prepaid" ? "prepaid" : "risk",
    actionType: order.recommendedAction,
    title: recommendedActionLabel(order.recommendedAction),
    reason: order.recommendedActionReason,
    priority: priorityForAction(order, ndrCase),
    estimatedLeakage,
    expectedSavingEstimate: Math.round(estimatedLeakage * 0.6),
    owner: "unassigned",
    status: "open",
    createdAt: now
  };
}
