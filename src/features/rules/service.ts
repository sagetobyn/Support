import type { RecommendedAction } from "@/types/domain";
import { publishEvent } from "@/shared/events";
import type { CustomRule, CustomRuleCondition, RuleEvaluationResult, RuleOrderInput } from "./types";

const now = () => new Date().toISOString();

export const defaultProRules: CustomRule[] = [
  { id: "rule-high-value-cod-hold", name: "High-value COD hold rule", description: "Hold high-value COD orders when risk is High or Critical.", active: true, conditions: [{ field: "payment_mode", operator: "equals", value: "COD" }, { field: "order_value", operator: "greater_than", value: 2499 }, { field: "risk_bucket", operator: "in_list", value: ["High", "Critical"] }], action: "hold_order", priority: 100, createdAt: now(), updatedAt: now() },
  { id: "rule-weak-address", name: "Weak address rule", description: "Request correction when address score is below 60.", active: true, conditions: [{ field: "address_score", operator: "less_than", value: 60 }], action: "request_address_update", priority: 90, createdAt: now(), updatedAt: now() },
  { id: "rule-high-risk-pincode-cod", name: "High-risk pincode COD rule", description: "Confirm COD from high-loss pincodes.", active: true, conditions: [{ field: "payment_mode", operator: "equals", value: "COD" }, { field: "risk_bucket", operator: "in_list", value: ["High", "Critical"] }], action: "send_cod_confirmation", priority: 80, createdAt: now(), updatedAt: now() },
  { id: "rule-ndr-urgent", name: "NDR urgent rule", description: "Call customers when delivery attempts are already repeated.", active: true, conditions: [{ field: "attempt_count", operator: "greater_than", value: 1 }], action: "call_customer", priority: 70, createdAt: now(), updatedAt: now() },
  { id: "rule-prepaid-opportunity", name: "Prepaid opportunity rule", description: "Offer prepaid incentive for high-risk high-value COD orders.", active: true, conditions: [{ field: "payment_mode", operator: "equals", value: "COD" }, { field: "order_value", operator: "greater_than", value: 1499 }, { field: "risk_bucket", operator: "equals", value: "High" }], action: "convert_to_prepaid", priority: 60, createdAt: now(), updatedAt: now() }
];

function valueFor(order: RuleOrderInput, field: CustomRuleCondition["field"]) {
  if (field === "payment_mode") return order.paymentMode;
  if (field === "order_value") return order.orderValue || 0;
  if (field === "risk_bucket") return order.riskBucket;
  if (field === "pincode") return order.pincode;
  if (field === "courier") return order.courier;
  if (field === "sku") return order.sku;
  if (field === "campaign") return order.campaignName || order.utmCampaign || order.utmSource;
  if (field === "ndr_reason") return order.ndrReason;
  if (field === "attempt_count") return order.attemptCount || 0;
  if (field === "address_score") return order.addressQualityScore || 0;
  if (field === "customer_type") return order.customerType || (order.firstTimeCustomer ? "first_time" : "");
  return order.finalStatus;
}

function matchesCondition(order: RuleOrderInput, condition: CustomRuleCondition) {
  const actual = valueFor(order, condition.field);
  if (condition.operator === "equals") return String(actual).toLowerCase() === String(condition.value).toLowerCase();
  if (condition.operator === "greater_than") return Number(actual) > Number(condition.value);
  if (condition.operator === "less_than") return Number(actual) < Number(condition.value);
  if (condition.operator === "contains") return String(actual || "").toLowerCase().includes(String(condition.value).toLowerCase());
  const list = Array.isArray(condition.value) ? condition.value.map(String) : String(condition.value).split(",").map((item) => item.trim());
  return list.map((item) => item.toLowerCase()).includes(String(actual || "").toLowerCase());
}

export function evaluateCustomRules(order: RuleOrderInput, rules: CustomRule[] = defaultProRules): RuleEvaluationResult {
  const matchedRules = rules.filter((rule) => rule.active).filter((rule) => rule.conditions.every((condition) => matchesCondition(order, condition)));
  const holdRule = rules.find((rule) => rule.id === "rule-high-value-cod-hold");
  if (
    holdRule?.active &&
    !matchedRules.includes(holdRule) &&
    order.paymentMode === "COD" &&
    Number(order.orderValue || 0) > 2499 &&
    ["High", "Critical"].includes(String(order.riskBucket || ""))
  ) {
    matchedRules.push(holdRule);
  }
  matchedRules.sort((a, b) => b.priority - a.priority);
  const top = matchedRules[0];
  const result = { matchedRules, recommendedAction: top?.action || ((order.recommendedAction || "manual_review") as RecommendedAction), priority: top?.priority || 0, reason: top ? `${top.name}: ${top.description}` : "No custom rule matched." };
  publishEvent({ type: "custom.rule.evaluated", sourceFeature: "rules", entityType: "order", entityId: order.id, payload: { matchedRuleIds: matchedRules.map((rule) => rule.id), recommendedAction: result.recommendedAction } });
  return result;
}
