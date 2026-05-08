import type { BrandSettings, MonthlyStrategyReport, Order, PolicyRecommendation, SavingsEvent, WeeklyReport } from "@/types/domain";
import { calculateRoi } from "@/lib/roi";
import { publishEvent } from "@/shared/events";

function periodFilter(startDate: string, endDate: string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return (date?: string) => {
    const time = new Date(date || "").getTime();
    return Number.isFinite(time) && time >= start && time <= end;
  };
}

export function generateWeeklyFounderReport(params: { brand: BrandSettings; orders: Order[]; savingsEvents: SavingsEvent[]; policies?: PolicyRecommendation[]; startDate?: string; endDate?: string }): WeeklyReport {
  const end = params.endDate ? new Date(params.endDate) : new Date();
  const start = params.startDate ? new Date(params.startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const inPeriod = periodFilter(start.toISOString(), end.toISOString());
  const orders = params.orders.filter((order) => inPeriod(order.orderDate || order.createdAt));
  const savings = params.savingsEvents.filter((event) => inPeriod(event.createdAt));
  const roi = calculateRoi(orders, savings, params.brand);
  const topPincode = orders.reduce<Record<string, number>>((acc, order) => ({ ...acc, [order.pincode || "missing"]: (acc[order.pincode || "missing"] || 0) + Number(/rto/i.test(order.finalStatus || "")) }), {});
  const leakageDriver = Object.entries(topPincode).sort((a, b) => b[1] - a[1])[0]?.[0] || "No strong pincode cluster yet";
  const report: WeeklyReport = {
    id: `weekly-${Date.now()}`,
    brandId: params.brand.id,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    metrics: { ordersProcessed: orders.length, codExposure: roi.codOrders, rtoOrders: roi.totalRto, ndrCases: roi.ndrCases, estimatedSavings: roi.estimatedSavings, verifiedSavings: savings.filter((event) => event.status === "verified").reduce((sum, event) => sum + (event.actualSaving || event.estimatedSaving), 0) },
    sections: {
      executiveSummary: `Your biggest leakage this week came from COD orders around ${leakageDriver}. The highest-leverage action next week is to verify COD before dispatch and test prepaid incentives for high-risk orders above Rs 1,499.`,
      ordersProcessed: orders.length,
      codExposure: roi.codOrders,
      rtoNdrMovement: `${roi.totalRto} RTO and ${roi.ndrCases} NDR cases in period.`,
      actionsCompleted: savings.length,
      topLeakageDrivers: leakageDriver,
      pincodePolicyRecommendations: (params.policies || []).filter((policy) => policy.policyType.includes("pincode")).slice(0, 3),
      courierPolicyRecommendations: (params.policies || []).filter((policy) => policy.policyType.includes("courier")).slice(0, 3),
      nextWeekFocus: ["Verify COD in highest-loss pincode", "Queue prepaid offers for High/Critical COD", "Review NDR playbook SLA daily"],
      openRisks: ["CSV data quality may limit campaign/source confidence", "Savings remain estimates until verified"]
    },
    createdAt: new Date().toISOString()
  };
  publishEvent({ type: "weekly.report.generated", sourceFeature: "weekly-report", entityType: "weekly_report", entityId: report.id, payload: { ordersProcessed: orders.length } });
  return report;
}

export function exportWeeklyReportJson(report: WeeklyReport) {
  return JSON.stringify(report, null, 2);
}

export function buildFounderDecisionBrief(params: {
  weeklyReport: WeeklyReport;
  monthlyReport?: MonthlyStrategyReport;
  topDriverTitle?: string;
  topDriverRecommendation?: string;
  dataTrustHeadline: string;
  dataTrustStatus: string;
  estimatedSavings: number;
  verifiedSavings: number;
}) {
  const experiment = params.monthlyReport?.experiments?.[0];
  const trustWarning = params.dataTrustStatus === "ready"
    ? "Data foundation is ready for founder review."
    : `${params.dataTrustHeadline}. Treat decisions as directional until missing fields are fixed.`;
  const savingsProof = params.verifiedSavings > 0
    ? `Verified savings proof: Rs ${Math.round(params.verifiedSavings).toLocaleString("en-IN")}.`
    : `Estimated savings only: Rs ${Math.round(params.estimatedSavings).toLocaleString("en-IN")}. Verify events before claiming ROI.`;

  return {
    driver: params.topDriverTitle || String(params.weeklyReport.sections.topLeakageDrivers || "No clear leakage driver yet"),
    decision: params.topDriverRecommendation || "Keep clearing the priority queue before changing policy.",
    experiment: experiment
      ? `${String(experiment.hypothesis)} Target: ${String(experiment.targetSegment)}.`
      : "Run one 14-day controlled test on the highest-loss segment.",
    savingsProof,
    trustWarning,
    order: ["Driver", "Decision", "Experiment", "Savings proof", "Trust warning"]
  };
}
