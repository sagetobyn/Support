import type { BrandSettings, Order, PolicyRecommendation } from "@/types/domain";
import { estimatedLeakageForOrder } from "@/lib/profitRecovery";

const mixWarning = "Courier comparison is affected by pincode/order mix.";

function isRto(order: Order) {
  return /rto|return to origin/i.test(order.finalStatus || "");
}

function groupBy<T>(items: T[], fn: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = fn(item);
    if (key) map.set(key, [...(map.get(key) || []), item]);
  }
  return map;
}

export function analyzeCourierPolicies(orders: Order[], brand: BrandSettings) {
  const byCourier = groupBy(orders, (order) => order.courier || "");
  const league = [...byCourier.entries()].map(([courier, rows]) => {
    const total = rows.length;
    const cod = rows.filter((order) => order.paymentMode === "COD").length;
    const rto = rows.filter(isRto).length;
    const ndr = rows.filter((order) => /ndr|undelivered|failed/i.test(`${order.shipmentStatus} ${order.finalStatus}`)).length;
    const codRto = rows.filter((order) => order.paymentMode === "COD" && isRto(order)).length;
    const estimatedLeakage = rows.reduce((sum, order) => sum + estimatedLeakageForOrder(order, brand), 0);
    const topFailingPincode = [...groupBy(rows.filter(isRto), (order) => order.pincode || "").entries()].sort((a, b) => b[1].length - a[1].length)[0]?.[0] || "";
    return { courier, total, cod, delivered: rows.filter((order) => /delivered/i.test(order.finalStatus || "")).length, rto, ndr, rtoRate: total ? rto / total : 0, codRtoRate: cod ? codRto / cod : 0, estimatedLeakage, topFailingPincode, confidence: total >= 30 ? "high" : total >= 10 ? "medium" : "low", mixWarning };
  });
  const recommendations: PolicyRecommendation[] = league.map((row) => {
    const recommendation = row.total < 10
      ? "Monitor due to low sample."
      : row.rtoRate > 0.3
        ? `Run 14-day switchback test for ${row.courier} in ${row.topFailingPincode || "high-loss lanes"}.`
        : row.codRtoRate > 0.3
          ? "Keep courier for prepaid but verify COD."
          : "Review courier allocation in high-loss pincode.";
    return {
      id: `courier-${row.courier}`,
      policyType: "courier_policy",
      title: `${row.courier}: ${recommendation}`,
      affectedOrdersCount: row.total,
      estimatedLeakage: row.estimatedLeakage,
      expectedSaving: Math.round(row.estimatedLeakage * 0.25),
      risk: row.rtoRate > 0.3 ? "high" : row.total < 10 ? "low" : "medium",
      recommendation: `${recommendation} ${mixWarning}`,
      status: "suggested",
      createdAt: new Date().toISOString()
    };
  });
  const lanes = [...groupBy(orders, (order) => `${order.courier || ""}|${order.pincode || ""}`).entries()]
    .map(([key, rows]) => ({ key, rows, rtoRate: rows.filter(isRto).length / rows.length }))
    .filter((lane) => lane.rows.length >= 5 && lane.rtoRate > 0.25);
  return { league, lanes, recommendations, mixWarning };
}
