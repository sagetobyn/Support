import type { BrandSettings, Order, PolicySimulation } from "@/types/domain";
import { estimatedLeakageForOrder } from "@/lib/profitRecovery";
import { publishEvent } from "@/shared/events";

export type SimulatedPolicyType =
  | "cod_verification_high_risk"
  | "prepaid_only_first_time_pincodes"
  | "prepaid_incentive_high_risk_cod"
  | "courier_switch_selected_lane"
  | "address_correction_weak_address"
  | "hold_critical_cod";

export interface SimulationInput {
  policyType: SimulatedPolicyType;
  filters?: { pincode?: string; courier?: string; sku?: string; campaign?: string; riskBucket?: string; paymentMode?: string; orderValueThreshold?: number };
  assumedReductionPercent: number;
  assumedConversionLossPercent: number;
  assumedInterventionCost: number;
  pilotDurationDays: number;
}

function matches(order: Order, input: SimulationInput) {
  const filters = input.filters || {};
  if (filters.pincode && order.pincode !== filters.pincode) return false;
  if (filters.courier && order.courier !== filters.courier) return false;
  if (filters.sku && order.sku !== filters.sku) return false;
  if (filters.campaign && order.campaignName !== filters.campaign && order.utmCampaign !== filters.campaign) return false;
  if (filters.riskBucket && order.riskBucket !== filters.riskBucket) return false;
  if (filters.paymentMode && order.paymentMode !== filters.paymentMode) return false;
  if (filters.orderValueThreshold && order.orderValue < filters.orderValueThreshold) return false;
  if (input.policyType === "cod_verification_high_risk") return order.paymentMode === "COD" && ["High", "Critical"].includes(order.riskBucket);
  if (input.policyType === "prepaid_only_first_time_pincodes") return order.paymentMode === "COD" && (order.firstTimeCustomer || /first|new/i.test(String(order.customerType || "")));
  if (input.policyType === "prepaid_incentive_high_risk_cod") return order.paymentMode === "COD" && ["High", "Critical"].includes(order.riskBucket);
  if (input.policyType === "address_correction_weak_address") return order.addressQualityScore < 60;
  if (input.policyType === "hold_critical_cod") return order.paymentMode === "COD" && order.riskBucket === "Critical";
  return true;
}

export function simulatePolicy(orders: Order[], brand: BrandSettings, input: SimulationInput): PolicySimulation {
  const affected = orders.filter((order) => matches(order, input));
  const baselineEstimatedLeakage = affected.reduce((sum, order) => sum + estimatedLeakageForOrder(order, brand), 0);
  const assumedSavedLeakage = baselineEstimatedLeakage * (input.assumedReductionPercent / 100);
  const interventionCost = affected.length * input.assumedInterventionCost;
  const avgContribution = affected.reduce((sum, order) => sum + order.orderValue * ((order.grossMargin || brand.grossMarginPercent || 45) / 100), 0) / Math.max(1, affected.length);
  const lostContributionEstimate = affected.length * avgContribution * (input.assumedConversionLossPercent / 100);
  const simulation: PolicySimulation = {
    id: `simulation-${Date.now()}`,
    brandId: brand.id,
    policyType: input.policyType,
    affectedOrders: affected.length,
    baselineEstimatedLeakage: Math.round(baselineEstimatedLeakage),
    assumedSavedLeakage: Math.round(assumedSavedLeakage),
    interventionCost: Math.round(interventionCost),
    lostContributionEstimate: Math.round(lostContributionEstimate),
    netEstimatedBenefit: Math.round(assumedSavedLeakage) - Math.round(interventionCost) - Math.round(lostContributionEstimate),
    riskNotes: ["This is a simple simulation, not a guarantee.", `Pilot duration: ${input.pilotDurationDays} days.`],
    createdAt: new Date().toISOString()
  };
  publishEvent({ type: "policy.simulation.created", sourceFeature: "policy-simulator", entityType: "policy_simulation", entityId: simulation.id, payload: { affectedOrders: simulation.affectedOrders, netEstimatedBenefit: simulation.netEstimatedBenefit } });
  return simulation;
}
