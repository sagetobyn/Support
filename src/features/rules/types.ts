import type { Order, RecommendedAction, RiskBucket } from "@/types/domain";

export type RuleOperator = "equals" | "greater_than" | "less_than" | "in_list" | "contains";
export type RuleConditionField =
  | "payment_mode"
  | "order_value"
  | "risk_bucket"
  | "pincode"
  | "courier"
  | "sku"
  | "campaign"
  | "ndr_reason"
  | "attempt_count"
  | "address_score"
  | "customer_type"
  | "final_status";

export interface CustomRuleCondition {
  field: RuleConditionField;
  operator: RuleOperator;
  value: string | number | string[] | RiskBucket[];
}

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  conditions: CustomRuleCondition[];
  action: RecommendedAction;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface RuleEvaluationResult {
  matchedRules: CustomRule[];
  recommendedAction: RecommendedAction | "manual_review";
  priority: number;
  reason: string;
}

export type RuleOrderInput = Partial<Order>;
