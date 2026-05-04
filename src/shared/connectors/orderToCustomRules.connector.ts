import type { Order } from "@/types/domain";
import { evaluateCustomRules, type CustomRule } from "@/features/rules";

export function runOrderToCustomRules(order: Order, rules?: CustomRule[]) {
  return evaluateCustomRules(order, rules);
}
