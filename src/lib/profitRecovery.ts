import type { BrandSettings, Order, RiskBucket } from "@/types/domain";
import { estimatedRtoLossPerOrder } from "@/lib/roi";

export interface PrepaidOpportunity {
  order: Order;
  expectedLeakage: number;
  recommendedAction: "Offer prepaid incentive";
  messageExample: string;
  reason: string;
  placeholderPaymentLink: string;
}

export interface LeakageMetric {
  label: string;
  total: number;
  rto: number;
  rate: number;
  lowSample?: boolean;
}

const riskLeakageMultiplier: Record<RiskBucket, number> = {
  Low: 0.12,
  Medium: 0.35,
  High: 0.55,
  Critical: 0.75
};

function hasFinalStatus(order: Order, pattern: RegExp) {
  return pattern.test(order.finalStatus || "") || pattern.test(order.shipmentStatus || "");
}

export function estimatedLeakageForOrder(order: Order, settings: BrandSettings) {
  const baseLoss = estimatedRtoLossPerOrder(settings);
  const cogsPct = Math.max(0, Math.min(1, 1 - (settings.grossMarginPercent ?? 40) / 100));
  const orderValue = Math.max(0, order.orderValue || 0);
  const cogsLoss = Math.round(orderValue * cogsPct * (order.paymentMode === "COD" ? 1 : 0.5));
  const fullRtoLoss = baseLoss + cogsLoss;
  if (hasFinalStatus(order, /rto|return to origin/i)) return fullRtoLoss;
  if (hasFinalStatus(order, /delivered/i)) return 0;

  const multiplier = riskLeakageMultiplier[order.riskBucket] || 0.25;
  const codExposure = order.paymentMode === "COD" ? 1 : 0.65;
  return Math.round(fullRtoLoss * multiplier * codExposure);
}

export function estimatedRecoverableLeakage(orders: Order[], settings: BrandSettings) {
  return orders
    .filter((order) => order.actionStatus !== "done")
    .reduce((sum, order) => sum + estimatedLeakageForOrder(order, settings), 0);
}

export function isPrepaidConversionCandidate(order: Order) {
  const highEnoughValue = order.orderValue > 999 || (["High", "Critical"].includes(order.riskBucket) && order.orderValue > 1499);
  const activeOrder = !hasFinalStatus(order, /delivered|rto|return to origin/i);
  return (
    order.paymentMode === "COD" &&
    highEnoughValue &&
    ["Medium", "High", "Critical"].includes(order.riskBucket) &&
    activeOrder &&
    order.confirmationStatus !== "prepaid_converted"
  );
}

export function findPrepaidConversionOpportunities(orders: Order[], settings: BrandSettings, limit = 12): PrepaidOpportunity[] {
  return orders
    .filter(isPrepaidConversionCandidate)
    .map((order) => ({
      order,
      expectedLeakage: estimatedLeakageForOrder(order, settings),
      recommendedAction: "Offer prepaid incentive" as const,
      messageExample: "Pay online now and get priority dispatch / ₹50 benefit.",
      reason: "High-risk COD order. Prepaid conversion can reduce RTO exposure.",
      placeholderPaymentLink: `https://pay.example.com/${encodeURIComponent(order.orderId)}`
    }))
    .sort((a, b) => b.expectedLeakage - a.expectedLeakage || b.order.orderValue - a.order.orderValue)
    .slice(0, limit);
}

export function pincodeLeakageRecommendation(item: LeakageMetric) {
  if (item.rate >= 0.25 && item.rto >= 2) return "Consider prepaid-only for first-time buyers in this pincode.";
  if (item.rate >= 0.15) return "Verify COD orders from this pincode before dispatch.";
  if (item.lowSample) return "Keep this pincode on watch until more orders confirm the pattern.";
  return "Add address correction step for this cluster.";
}

export function courierLeakageRecommendation(item: LeakageMetric) {
  if (item.rate >= 0.25 && item.rto >= 2) return "Switch courier for COD shipments in this pincode if alternate courier has better success.";
  if (item.rate >= 0.15) return "Review courier allocation for this lane.";
  if (item.lowSample) return "Monitor this courier lane before changing allocation rules.";
  return "Add address correction step for this cluster.";
}
