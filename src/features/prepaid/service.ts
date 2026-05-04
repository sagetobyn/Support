import type { BrandSettings, Order, PrepaidOpportunity, SavingsEvent } from "@/types/domain";
import { estimatedRtoLossPerOrder } from "@/lib/roi";
import { publishEvent } from "@/shared/events";

const riskProbability = { Low: 0.05, Medium: 0.15, High: 0.3, Critical: 0.5 };

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function calculateMarginSafeIncentive(order: Order, brand: BrandSettings) {
  const marginPercent = Number(order.grossMargin || brand.grossMarginPercent || 45);
  const contributionMargin = order.orderValue * (marginPercent / 100);
  const maxSafeIncentive = Math.floor(Math.min(brand.prepaidMaxIncentive || 150, contributionMargin * ((brand.prepaidMarginGuardrailPercent || 10) / 100)));
  const base = order.orderValue >= 2000 ? 100 : order.orderValue >= 999 ? 50 : 25;
  return { contributionMargin, maxSafeIncentive, recommendedIncentive: Math.max(0, Math.min(base, maxSafeIncentive)) };
}

export function createPrepaidOpportunity(order: Order, brand: BrandSettings): PrepaidOpportunity | undefined {
  if (order.paymentMode !== "COD" || /delivered|rto/i.test(`${order.finalStatus} ${order.shipmentStatus}`)) return undefined;
  const margin = calculateMarginSafeIncentive(order, brand);
  if (margin.recommendedIncentive <= 0) return undefined;
  let score = 30;
  if (order.riskBucket === "High") score += 20;
  if (order.riskBucket === "Critical") score += 30;
  if (order.addressQualityScore < 60) score += 10;
  if (/repeat_delivered/i.test(String(order.customerType || ""))) score += 10;
  if (order.firstTimeCustomer || /first|new/i.test(String(order.customerType || ""))) score += 5;
  if ((order.rawData?.previous_rto as number) || /repeat_rto/i.test(String(order.customerType || ""))) score += 15;
  if (/ndr|undelivered|failed/i.test(`${order.shipmentStatus} ${order.finalStatus}`) && !/payment/i.test(order.ndrReason || "")) score -= 20;
  if ((order.grossMargin || brand.grossMarginPercent || 45) < 30) score -= 10;
  const expectedRtoExposure = estimatedRtoLossPerOrder(brand) * riskProbability[order.riskBucket];
  const opportunity: PrepaidOpportunity = { opportunityId: id("prepaid"), orderId: order.id, score: Math.max(0, Math.min(100, score)), reason: `COD ${order.riskBucket} risk with Rs ${Math.round(expectedRtoExposure)} expected RTO exposure; incentive is margin-safe.`, recommendedIncentive: `Rs ${margin.recommendedIncentive}`, messageTemplate: `Pay online now and get Rs ${margin.recommendedIncentive} benefit on this order.`, estimatedRiskReductionNote: `Expected contribution margin Rs ${Math.round(margin.contributionMargin)}, max safe incentive Rs ${margin.maxSafeIncentive}.`, status: "open", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  publishEvent({ type: "prepaid.opportunity.created", sourceFeature: "prepaid", entityType: "prepaid_opportunity", entityId: opportunity.opportunityId, payload: { orderId: order.id, score: opportunity.score } });
  return opportunity;
}

export function findAdvancedPrepaidOpportunities(orders: Order[], brand: BrandSettings) {
  return orders.map((order) => createPrepaidOpportunity(order, brand)).filter((item): item is PrepaidOpportunity => Boolean(item)).sort((a, b) => b.score - a.score);
}

export function acceptPrepaidOpportunity(opportunity: PrepaidOpportunity, order: Order, brand: BrandSettings): { opportunity: PrepaidOpportunity; saving: SavingsEvent } {
  const saving: SavingsEvent = { id: id("saving"), brandId: brand.id, orderId: order.id, sourceFeature: "prepaid", eventType: "cod_converted_prepaid", estimatedSaving: Math.round(estimatedRtoLossPerOrder(brand) * riskProbability[order.riskBucket]), formulaNote: "RTO loss per order * risk probability by bucket", confidence: "medium", status: "estimated", calculation: { riskBucket: order.riskBucket, riskProbability: riskProbability[order.riskBucket] }, createdAt: new Date().toISOString() };
  publishEvent({ type: "savings.event.created", sourceFeature: "prepaid", entityType: "savings_event", entityId: saving.id, payload: { eventType: saving.eventType, estimatedSaving: saving.estimatedSaving } });
  return { opportunity: { ...opportunity, status: "accepted", updatedAt: new Date().toISOString() }, saving };
}
