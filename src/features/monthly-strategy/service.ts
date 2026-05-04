import type { BrandSettings, MonthlyStrategyReport, Order, PolicyRecommendation, SavingsEvent } from "@/types/domain";
import { calculateRoi } from "@/lib/roi";
import { publishEvent } from "@/shared/events";

export function generateMonthlyStrategyReport(params: { brand: BrandSettings; orders: Order[]; savingsEvents: SavingsEvent[]; policies?: PolicyRecommendation[]; startDate?: string; endDate?: string }): MonthlyStrategyReport {
  const end = params.endDate ? new Date(params.endDate) : new Date();
  const start = params.startDate ? new Date(params.startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const roi = calculateRoi(params.orders, params.savingsEvents, params.brand);
  const experiments = [
    { hypothesis: "A Rs 50 prepaid incentive reduces RTO exposure in High-risk COD orders.", targetSegment: "High/Critical COD above Rs 1,499", expectedImpact: "Lower COD RTO and fewer NDRs", guardrail: "Do not exceed margin-safe incentive", duration: "14 days", measurementMetric: "COD-to-prepaid acceptance and RTO rate" },
    { hypothesis: "Switchback testing improves high-loss courier-pincode lanes.", targetSegment: "Top courier+pincode leakage lane", expectedImpact: "Lower NDR/RTO rate", guardrail: "Maintain delivery TAT", duration: "14 days", measurementMetric: "RTO rate by lane" },
    { hypothesis: "COD verification for first-time buyers reduces fake/low-intent orders.", targetSegment: "First-time COD in top-loss pincodes", expectedImpact: "Cancelled before shipping savings", guardrail: "Track conversion drop", duration: "14 days", measurementMetric: "Confirmed dispatch vs cancellation" },
    { hypothesis: "Checkout address correction reduces wrong-address NDR.", targetSegment: "Weak address score below 60", expectedImpact: "Higher delivery success", guardrail: "No checkout friction for prepaid low-risk", duration: "30 days", measurementMetric: "Wrong-address NDR share" },
    { hypothesis: "High-value NDR call fallback rescues contribution margin.", targetSegment: "NDR above Rs 1,499", expectedImpact: "More delivered-after-NDR", guardrail: "Contact cap per order", duration: "14 days", measurementMetric: "Delivered after NDR" }
  ];
  const report: MonthlyStrategyReport = {
    id: `monthly-${Date.now()}`,
    brandId: params.brand.id,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    sections: {
      executiveSummary: "Pro has moved this workspace from daily action workflow toward a profit recovery operating system.",
      baselineVsCurrentMonth: { totalOrders: roi.totalOrders, rtoRate: roi.rtoRate, codRtoRate: roi.codRtoRate },
      estimatedRtoLeakage: roi.estimatedRtoLoss,
      estimatedSavings: roi.estimatedSavings,
      verifiedSavings: params.savingsEvents.filter((event) => event.status === "verified").reduce((sum, event) => sum + (event.actualSaving || event.estimatedSaving), 0),
      codPolicyRecommendations: (params.policies || []).filter((policy) => /cod|pincode/i.test(policy.policyType)),
      addressQualityRecommendations: "Move weak-address orders into correction before dispatch.",
      ndrPlaybookPerformance: "Track SLA adherence by NDR reason before automating.",
      upgradeIntegrationReadinessChecklist: ["Shopify/WooCommerce data fields mapped", "Courier/NDR import template ready", "WhatsApp provider mode selected"]
    },
    experiments,
    createdAt: new Date().toISOString()
  };
  publishEvent({ type: "monthly.strategy.generated", sourceFeature: "monthly-strategy", entityType: "monthly_strategy_report", entityId: report.id, payload: { experiments: experiments.length } });
  return report;
}
