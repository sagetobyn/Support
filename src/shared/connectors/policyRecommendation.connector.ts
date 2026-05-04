import type { BrandSettings, Order } from "@/types/domain";
import { analyzeCourierPolicies } from "@/features/courier";
import { analyzePincodePolicies } from "@/features/pincode";
import { generateHighRiskCodHoldPolicies } from "@/features/policy-recommendations";

export function runPolicyRecommendationConnector(orders: Order[], brand: BrandSettings) {
  return [...generateHighRiskCodHoldPolicies(orders, brand), ...analyzePincodePolicies(orders, brand), ...analyzeCourierPolicies(orders, brand).recommendations];
}
