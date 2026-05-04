import type { Order } from "@/types/domain";
import { estimatedRtoLossPerOrder } from "@/lib/roi";
import type { BrandSettings } from "@/types/domain";
import { normalizeNdrReason } from "@/lib/ndr";
import { findPrepaidConversionOpportunities, pincodeLeakageRecommendation, courierLeakageRecommendation } from "@/lib/profitRecovery";

function topBy<T extends string>(orders: Order[], selector: (order: Order) => T | undefined) {
  const counts = new Map<T, { total: number; rto: number }>();
  for (const order of orders) {
    const key = selector(order);
    if (!key) continue;
    const current = counts.get(key) || { total: 0, rto: 0 };
    current.total += 1;
    if (/rto|return to origin/i.test(order.finalStatus || "")) current.rto += 1;
    counts.set(key, current);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, total: value.total, rto: value.rto, rate: value.total ? value.rto / value.total : 0, lowSample: value.total < 10 }))
    .sort((a, b) => b.rto - a.rto || b.rate - a.rate)
    .slice(0, 5);
}

export function generateAuditReport(orders: Order[], settings: BrandSettings) {
  const cod = orders.filter((order) => order.paymentMode === "COD");
  const rto = orders.filter((order) => /rto|return to origin/i.test(order.finalStatus || ""));
  const codRto = cod.filter((order) => /rto|return to origin/i.test(order.finalStatus || ""));
  const monthlyLoss = rto.length * estimatedRtoLossPerOrder(settings);
  const topRiskyPincodes = topBy(orders, (order) => order.pincode);
  const topRtoCouriers = topBy(orders, (order) => order.courier);
  return {
    orderVolume: orders.length,
    codPercentage: orders.length ? cod.length / orders.length : 0,
    rtoRate: orders.length ? rto.length / orders.length : 0,
    codRtoRate: cod.length ? codRto.length / cod.length : 0,
    topRiskyPincodes,
    topRtoCouriers,
    topRtoSkus: topBy(orders, (order) => order.sku || order.productName),
    topNdrReasons: topBy(orders, (order) => (order.ndrReason ? normalizeNdrReason(order.ndrReason).normalizedReason : undefined)),
    addressQualityIssues: issueCounts(orders.flatMap((order) => order.addressIssues)),
    prepaidConversionOpportunities: findPrepaidConversionOpportunities(orders, settings, 8).map((item) => ({
      orderId: item.order.orderId,
      pincode: item.order.pincode || "",
      courier: item.order.courier || "",
      orderValue: item.order.orderValue,
      riskBucket: item.order.riskBucket,
      expectedLeakage: item.expectedLeakage,
      recommendation: item.recommendedAction,
      reason: item.reason
    })),
    pincodeRecommendations: topRiskyPincodes.map((item) => ({ ...item, recommendation: pincodeLeakageRecommendation(item) })),
    courierRecommendations: topRtoCouriers.map((item) => ({ ...item, recommendation: courierLeakageRecommendation(item) })),
    estimatedMonthlyLoss: monthlyLoss,
    savingsAt10: monthlyLoss * 0.1,
    savingsAt20: monthlyLoss * 0.2,
    savingsAt30: monthlyLoss * 0.3,
    lowSampleSize: orders.length < 50,
    recommendedPilotPlan: [
      "Day 1: Import last 30 days data and confirm profit leakage cost assumptions.",
      "Days 2-4: Confirm risky COD, fix weak addresses, and push prepaid offers before dispatch.",
      "Days 5-8: Work NDR rescue queue daily before courier cutoff.",
      "Days 9-11: Review pincode and courier leakage clusters from the current dataset.",
      "Days 12-14: Compare savings ledger with baseline leakage and finalize operating rules."
    ],
    dailyActionPlan: [
      "Open the Daily Profit Action Queue every morning.",
      "Queue COD confirmation, prepaid conversion, and address correction messages first.",
      "Move NDR wrong-address and customer-unavailable cases before afternoon courier cutoff.",
      "Record customer response and final outcome for every acted order."
    ]
  };
}

function issueCounts(issues: string[]) {
  const counts = new Map<string, number>();
  for (const issue of issues) counts.set(issue, (counts.get(issue) || 0) + 1);
  return [...counts.entries()].map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total);
}
