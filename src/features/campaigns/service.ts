import type { BrandSettings, Order } from "@/types/domain";
import { estimatedLeakageForOrder } from "@/lib/profitRecovery";

function campaignKey(order: Order) {
  return order.campaignName || order.utmCampaign || order.utmSource || order.sourcePlatform || order.adId || "";
}

export function hasCampaignData(orders: Order[]) {
  return orders.some((order) => Boolean(campaignKey(order)));
}

export function campaignMissingEmptyState() {
  return "Upload campaign/source fields to unlock campaign leakage analysis.";
}

export function analyzeCampaignLeakage(orders: Order[], brand: BrandSettings) {
  if (!hasCampaignData(orders)) return [];
  const groups = new Map<string, Order[]>();
  for (const order of orders) {
    const key = campaignKey(order);
    if (key) groups.set(key, [...(groups.get(key) || []), order]);
  }
  return [...groups.entries()].map(([campaign, rows]) => {
    const ordersCount = rows.length;
    const codOrders = rows.filter((order) => order.paymentMode === "COD").length;
    const rtoOrders = rows.filter((order) => /rto/i.test(order.finalStatus || "")).length;
    const topSku = [...new Set(rows.map((order) => order.sku).filter(Boolean))][0] || "";
    const topPincode = [...new Set(rows.map((order) => order.pincode).filter(Boolean))][0] || "";
    let recommendation = "Low sample size. Monitor.";
    if (ordersCount >= 20 && rtoOrders / ordersCount > 0.3 && codOrders / ordersCount > 0.6) recommendation = "Campaign may be bringing low-intent COD traffic. Test prepaid nudge or COD verification.";
    else if (ordersCount >= 20 && topSku) recommendation = "Review ad-product match and landing page promise.";
    else if (ordersCount >= 20 && topPincode) recommendation = "Add pincode-specific COD rules.";
    return {
      campaign,
      orders: ordersCount,
      codPercent: ordersCount ? codOrders / ordersCount : 0,
      rtoPercent: ordersCount ? rtoOrders / ordersCount : 0,
      codRtoPercent: codOrders ? rows.filter((order) => order.paymentMode === "COD" && /rto/i.test(order.finalStatus || "")).length / codOrders : 0,
      ndrCount: rows.filter((order) => /ndr|undelivered|failed/i.test(`${order.shipmentStatus} ${order.finalStatus}`)).length,
      averageOrderValue: rows.reduce((sum, order) => sum + order.orderValue, 0) / Math.max(1, ordersCount),
      estimatedLoss: rows.reduce((sum, order) => sum + estimatedLeakageForOrder(order, brand), 0),
      topSku,
      topPincode,
      recommendation
    };
  }).sort((a, b) => b.estimatedLoss - a.estimatedLoss);
}
