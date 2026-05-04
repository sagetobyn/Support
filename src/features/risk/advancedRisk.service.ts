import type { BrandSettings, Order, RecommendedAction } from "@/types/domain";
import { scoreOrder, type RiskScoringContext } from "@/lib/riskScoring";
import { evaluateCustomRules, type CustomRule } from "@/features/rules";
import { estimatedRtoLossPerOrder } from "@/lib/roi";

export interface AdvancedRiskContext extends RiskScoringContext {
  customRules?: CustomRule[];
  campaignCodRtoRate?: number;
  campaignCodSampleSize?: number;
  brand?: BrandSettings;
}

export function calculateAdvancedRiskScore(order: Partial<Order>, context: AdvancedRiskContext) {
  const base = scoreOrder(order, context);
  let score = base.score;
  const reasons = [...base.reasons];
  const warnings = [...base.dataQualityWarnings];
  const grossMargin = Number(order.grossMargin || context.settings.grossMarginPercent || 0);
  const discountPercent = order.orderValue ? ((order.discountAmount || 0) / order.orderValue) * 100 : 0;
  if (grossMargin > 0 && grossMargin < 30 && order.paymentMode === "COD" && ["High", "Critical"].includes(base.bucket)) {
    score += 10;
    reasons.push("Low-margin high-risk COD order increases action severity (+10)");
  }
  if (grossMargin >= 50 && (order.ndrReason || /ndr/i.test(order.finalStatus || ""))) {
    score += 5;
    reasons.push("High-margin NDR should be prioritized for rescue (+5)");
  }
  if (discountPercent > 40 && order.paymentMode === "COD") {
    score += 10;
    reasons.push("High discount above 40% on COD (+10)");
  }
  if (discountPercent > 40 && (order.firstTimeCustomer || /first|new/i.test(String(order.customerType || "")))) {
    score += 10;
    reasons.push("High discount and first-time customer (+10)");
  }
  if ((context.campaignRtoRate || 0) > 0.3 && (context.campaignSampleSize || 0) >= 20) {
    score += 15;
    reasons.push("Campaign RTO above 30% with sample >= 20 (+15)");
  }
  if ((context.campaignCodRtoRate || 0) > 0.35 && (context.campaignCodSampleSize || 0) >= 20) {
    score += 20;
    reasons.push("Campaign COD RTO above 35% with sample >= 20 (+20)");
  }
  if (order.paymentMode === "COD" && (order.firstTimeCustomer || /first|new/i.test(String(order.customerType || "")))) {
    score += 10;
    reasons.push("First-time COD customer (+10)");
  }
  if (/repeat_delivered|repeat delivered/i.test(String(order.customerType || ""))) {
    score -= 10;
    reasons.push("Repeat delivered customer (-10)");
  }
  const boundedScore = Math.max(0, Math.min(100, score));
  const bucket = boundedScore <= 30 ? "Low" : boundedScore <= 60 ? "Medium" : boundedScore <= 80 ? "High" : "Critical";
  const customRules = evaluateCustomRules({ ...order, riskBucket: bucket, addressQualityScore: base.addressQualityScore }, context.customRules);
  let recommendedAction = base.recommendedAction;
  if (customRules.matchedRules.length && customRules.recommendedAction !== "manual_review") recommendedAction = customRules.recommendedAction as RecommendedAction;
  if (!order.campaignName && !order.utmCampaign && !order.utmSource) warnings.push("missing campaign/source fields");
  const strongSamples = (context.pincodeSampleSize || 0) >= 20 || (context.courierPincodeSampleSize || 0) >= 20 || (context.campaignSampleSize || 0) >= 20;
  const confidenceLabel = strongSamples && warnings.length <= 2 ? "High" : warnings.length >= 4 ? "Low" : "Medium";
  const loss = estimatedRtoLossPerOrder(context.settings);
  return { ...base, score: boundedScore, bucket, reasons, customRuleMatches: customRules.matchedRules.map((rule) => rule.name), dataQualityWarnings: warnings, expectedLeakageEstimate: Math.round(loss * (boundedScore / 100) * (order.paymentMode === "COD" ? 1 : 0.65)), recommendedAction, recommendedActionReason: customRules.matchedRules.length ? customRules.reason : base.recommendedActionReason, confidenceLabel };
}
