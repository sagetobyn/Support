import type { BrandSettings, Order, PolicyRecommendation } from "@/types/domain";
import { estimatedLeakageForOrder } from "@/lib/profitRecovery";

function rto(order: Order) {
  return /rto|return to origin/i.test(order.finalStatus || "");
}

function codRto(order: Order) {
  return order.paymentMode === "COD" && rto(order);
}

function topValue(orders: Order[], field: keyof Order) {
  const counts = new Map<string, number>();
  for (const order of orders) {
    const value = String(order[field] || "");
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

export function analyzePincodePolicies(orders: Order[], brand: BrandSettings): PolicyRecommendation[] {
  const groups = new Map<string, Order[]>();
  for (const order of orders) if (order.pincode) groups.set(order.pincode, [...(groups.get(order.pincode) || []), order]);
  return [...groups.entries()].map(([pincode, rows]) => {
    const total = rows.length;
    const cod = rows.filter((order) => order.paymentMode === "COD").length;
    const rtoCount = rows.filter(rto).length;
    const codRtoCount = rows.filter(codRto).length;
    const ndrCount = rows.filter((order) => /ndr|undelivered|failed/i.test(`${order.shipmentStatus} ${order.finalStatus}`)).length;
    const estimatedLeakage = rows.reduce((sum, order) => sum + estimatedLeakageForOrder(order, brand), 0);
    const rtoRate = total ? rtoCount / total : 0;
    const codRtoRate = cod ? codRtoCount / cod : 0;
    const wrongAddress = rows.filter((order) => /wrong|incorrect|address/i.test(order.ndrReason || "")).length / Math.max(1, ndrCount);
    const unavailable = rows.filter((order) => /unavailable|door locked|not available/i.test(order.ndrReason || "")).length / Math.max(1, ndrCount);
    let recommendation = "Monitor only due to low sample.";
    if (total >= 10 && rtoRate > 0.3 && cod / total > 0.6) recommendation = "Verify COD before dispatch.";
    if (total >= 10 && codRtoRate > 0.35) recommendation = "Test prepaid-only for first-time buyers above Rs 999.";
    if (total >= 10 && wrongAddress > 0.35) recommendation = "Require address correction.";
    if (total >= 10 && unavailable > 0.35) recommendation = "Send OFD reminder and schedule reattempt.";
    if (total >= 10 && topValue(rows.filter(rto), "courier")) recommendation += ` Review courier ${topValue(rows.filter(rto), "courier")} for switch test.`;
    return {
      id: `pin-${pincode}`,
      policyType: "pincode_policy",
      title: `${pincode}: ${recommendation}`,
      affectedOrdersCount: total,
      estimatedLeakage,
      expectedSaving: Math.round(estimatedLeakage * (total < 10 ? 0.05 : 0.3)),
      risk: total < 10 ? "low" : rtoRate > 0.3 ? "high" : "medium",
      recommendation,
      status: "suggested",
      createdAt: new Date().toISOString(),
      metrics: { total, cod, prepaid: total - cod, rtoCount, codRtoCount, rtoRate, codRtoRate, ndrCount, averageOrderValue: rows.reduce((sum, order) => sum + order.orderValue, 0) / total, topCourier: topValue(rows, "courier"), topSku: topValue(rows, "sku"), topNdrReason: topValue(rows, "ndrReason"), confidence: total >= 30 ? "high" : total >= 10 ? "medium" : "low" }
    } as PolicyRecommendation;
  }).sort((a, b) => b.estimatedLeakage - a.estimatedLeakage);
}
