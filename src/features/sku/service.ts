import type { BrandSettings, Order } from "@/types/domain";
import { estimatedLeakageForOrder } from "@/lib/profitRecovery";

function rto(order: Order) {
  return /rto|return to origin/i.test(order.finalStatus || "");
}

export function analyzeSkuLeakage(orders: Order[], brand: BrandSettings) {
  const groups = new Map<string, Order[]>();
  for (const order of orders) {
    const key = order.sku || order.productName || "";
    if (key) groups.set(key, [...(groups.get(key) || []), order]);
  }
  return [...groups.entries()].map(([sku, rows]) => {
    const rtoRows = rows.filter(rto);
    const total = rows.length;
    const customerRefused = rtoRows.filter((order) => /refused/i.test(order.ndrReason || "")).length;
    const wrongAddress = rtoRows.filter((order) => /wrong|incorrect|address/i.test(order.ndrReason || "")).length;
    const pincodes = new Set(rtoRows.map((order) => order.pincode).filter(Boolean));
    let recommendation = "Monitor until more volume.";
    if (total >= 10 && customerRefused / Math.max(1, rtoRows.length) > 0.35) recommendation = "Review product promise, COD confirmation script, and landing page expectation.";
    else if (total >= 10 && wrongAddress / Math.max(1, rtoRows.length) > 0.35) recommendation = "Not primarily SKU issue; inspect acquisition region/address quality.";
    else if (total >= 10 && pincodes.size === 1 && rtoRows.length) recommendation = "Apply pincode-specific verification.";
    else if (total >= 10 && rtoRows.length / total > 0.3) recommendation = "Check product quality, size chart, imagery, price expectation, and ad targeting.";
    return {
      sku,
      totalOrders: total,
      codOrders: rows.filter((order) => order.paymentMode === "COD").length,
      rtoOrders: rtoRows.length,
      rtoRate: total ? rtoRows.length / total : 0,
      codRtoRate: rows.filter((order) => order.paymentMode === "COD").length ? rtoRows.filter((order) => order.paymentMode === "COD").length / rows.filter((order) => order.paymentMode === "COD").length : 0,
      ndrCount: rows.filter((order) => /ndr|undelivered|failed/i.test(`${order.shipmentStatus} ${order.finalStatus}`)).length,
      estimatedLoss: rows.reduce((sum, order) => sum + estimatedLeakageForOrder(order, brand), 0),
      averageOrderValue: rows.reduce((sum, order) => sum + order.orderValue, 0) / total,
      grossMargin: rows.find((order) => order.grossMargin)?.grossMargin,
      topPincode: [...pincodes][0] || "",
      recommendation,
      confidence: total >= 30 ? "high" : total >= 10 ? "medium" : "low"
    };
  }).sort((a, b) => b.estimatedLoss - a.estimatedLoss);
}
