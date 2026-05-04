import type { BrandSettings, Order, PolicyRecommendation } from "@/types/domain";
import { buildAdvancedActionQueue } from "@/features/actions";

export function runOrdersToActions(orders: Order[], brand: BrandSettings, policies: PolicyRecommendation[] = []) {
  return buildAdvancedActionQueue(orders, brand, policies);
}
