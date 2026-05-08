import type { ActionItem, BrandSettings, Order, PolicyRecommendation, RecommendedAction } from "@/types/domain";
import { estimatedLeakageForOrder } from "@/lib/profitRecovery";
import { publishEvent } from "@/shared/events";

const labels: Record<string, string> = {
  send_cod_confirmation: "Confirm risky COD",
  request_address_update: "Fix weak address",
  convert_to_prepaid: "Push prepaid offer",
  hold_order: "Hold high-risk order",
  request_reattempt: "Request reattempt",
  call_customer: "Call customer",
  mark_rto: "Mark RTO / cancel",
  escalate_to_ops: "Courier issue review",
  block_or_flag_pincode: "Pincode policy review"
};

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function buildAdvancedActionQueue(orders: Order[], brand: BrandSettings, policies: PolicyRecommendation[] = []): ActionItem[] {
  const orderActions = orders
    .filter((order) => order.recommendedAction !== "no_action" && order.actionStatus !== "done")
    .map((order) => ({
      id: id("action"),
      brandId: brand.id,
      orderId: order.id,
      sourceFeature: /ndr|undelivered|failed/i.test(`${order.shipmentStatus} ${order.finalStatus}`) ? "ndr" : order.recommendedAction === "convert_to_prepaid" ? "prepaid" : "risk",
      actionType: order.recommendedAction,
      title: labels[order.recommendedAction] || "Manual review",
      reason: order.recommendedActionReason,
      priority: order.riskBucket === "Critical" ? "critical" : order.riskBucket === "High" ? "high" : order.riskBucket === "Medium" ? "medium" : "low",
      confidence: order.confidenceLabel || order.riskBucket,
      estimatedLeakage: estimatedLeakageForOrder(order, brand),
      expectedSavingEstimate: Math.round(estimatedLeakageForOrder(order, brand) * 0.35),
      owner: "unassigned",
      status: "open",
      createdAt: new Date().toISOString()
    })) as ActionItem[];
  const policyActions = policies
    .filter((policy) => policy.status === "suggested" || policy.status === "testing")
    .map((policy) => ({
      id: id("action"),
      brandId: brand.id,
      policyId: policy.id,
      sourceFeature: "policy",
      actionType: "escalate_to_ops" as RecommendedAction,
      title: policy.policyType.includes("pincode") ? "Pincode policy review" : policy.policyType.includes("courier") ? "Courier issue review" : "Policy review",
      reason: policy.recommendation,
      priority: policy.risk === "critical" ? "critical" : policy.risk === "high" ? "high" : "medium",
      confidence: policy.risk,
      estimatedLeakage: policy.estimatedLeakage,
      expectedSavingEstimate: policy.expectedSaving,
      owner: "founder",
      status: "open",
      createdAt: new Date().toISOString()
    })) as ActionItem[];
  const priorityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...policyActions, ...orderActions].sort((a, b) => {
    const leakageDiff = (b.estimatedLeakage || 0) - (a.estimatedLeakage || 0);
    if (leakageDiff !== 0) return leakageDiff;
    return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
  });
}

export function assignActionOwner(actions: ActionItem[], actionId: string, owner: NonNullable<ActionItem["owner"]>) {
  return actions.map((action) => (action.id === actionId ? { ...action, owner } : action));
}

export function bulkUpdateActions(actions: ActionItem[], actionIds: string[], status: "completed" | "cancelled") {
  const completedAt = status === "completed" ? new Date().toISOString() : undefined;
  for (const actionId of actionIds) {
    publishEvent({ type: status === "completed" ? "action.completed" : "action.dismissed", sourceFeature: "actions", entityType: "action", entityId: actionId, payload: { status } });
  }
  return actions.map((action) => (actionIds.includes(action.id) ? { ...action, status, completedAt } : action));
}

export function addActionNote(actions: ActionItem[], actionId: string, notes: string) {
  return actions.map((action) => (action.id === actionId ? { ...action, notes } : action));
}
