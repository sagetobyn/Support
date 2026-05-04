import type { BrandSettings, Order, PolicyRecommendation } from "@/types/domain";
import { estimatedLeakageForOrder } from "@/lib/profitRecovery";
import { publishEvent } from "@/shared/events";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function recommendation(input: Omit<PolicyRecommendation, "id" | "createdAt">): PolicyRecommendation {
  const row = { ...input, id: id("policy"), createdAt: new Date().toISOString() };
  publishEvent({ type: "policy.recommendation.created", sourceFeature: "policy-recommendations", entityType: "policy_recommendation", entityId: row.id, payload: { policyType: row.policyType, affectedOrdersCount: row.affectedOrdersCount } });
  return row;
}

export function generateHighRiskCodHoldPolicies(orders: Order[], brand: BrandSettings): PolicyRecommendation[] {
  const criticalCod = orders.filter((order) => order.paymentMode === "COD" && order.riskBucket === "Critical" && !/delivered|rto/i.test(order.finalStatus || ""));
  const highValue = orders.filter((order) => order.paymentMode === "COD" && order.orderValue > 2499 && ["High", "Critical"].includes(order.riskBucket));
  const weakAddress = orders.filter((order) => order.addressQualityScore < 50 && !/delivered|rto/i.test(order.finalStatus || ""));
  const thirdAttempt = orders.filter((order) => (order.attemptCount || 0) >= 3 && /ndr|undelivered|failed|in ndr/i.test(`${order.shipmentStatus} ${order.finalStatus}`));
  const rows: Array<[string, string, Order[], string]> = [
    ["critical_cod_hold", "Critical COD hold", criticalCod, "Critical risk COD orders should be held for confirmation before dispatch."],
    ["high_value_cod_hold", "High-value COD hold", highValue, "COD orders above Rs 2,499 with High/Critical risk should be held."],
    ["weak_address_hold", "Weak address hold", weakAddress, "Orders with address score below 50 should not dispatch until corrected."],
    ["third_attempt_ndr_review", "Third-attempt NDR review", thirdAttempt, "Low-margin third-attempt NDR cases should be reviewed before more courier spend."]
  ];
  return rows
    .filter(([, , affected]) => affected.length)
    .map(([policyType, title, affected, text]) => {
      const estimatedLeakage = affected.reduce((sum, order) => sum + estimatedLeakageForOrder(order, brand), 0);
      return recommendation({ policyType, title, affectedOrdersCount: affected.length, estimatedLeakage, expectedSaving: Math.round(estimatedLeakage * 0.35), risk: affected.length > 5 ? "critical" : "high", recommendation: text, status: "suggested" });
    });
}

export function updatePolicyStatus(recommendations: PolicyRecommendation[], id: string, status: PolicyRecommendation["status"]) {
  return recommendations.map((item) => (item.id === id ? { ...item, status } : item));
}
