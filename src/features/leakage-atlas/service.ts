import type { BrandSettings, NdrCase, Order } from "@/types/domain";
import { isNdrOrder } from "@/lib/actionGroups";
import { estimatedLeakageForOrder } from "@/lib/profitRecovery";

export type LeakageAtlasRouteView = "missions" | "ndr" | "orders" | "pincode" | "courier" | "sku" | "campaigns" | "reports";

export interface LeakageAtlasDriver {
  id: "cod_risk" | "ndr_sla" | "address_quality" | "courier_pincode" | "sku" | "campaign" | "savings_proof";
  title: string;
  sellerQuestion: string;
  count: number;
  estimatedLeakage: number;
  recommendation: string;
  tone: "danger" | "warning" | "success" | "info" | "neutral";
  route: {
    view: LeakageAtlasRouteView;
    quickFilter?: string;
  };
}

function groupTotal<T extends string | number>(orders: Order[], key: (order: Order) => T | undefined) {
  const groups = new Map<T, { count: number; leakage: number }>();
  orders.forEach((order) => {
    const id = key(order);
    if (!id) return;
    const current = groups.get(id) || { count: 0, leakage: 0 };
    current.count += 1;
    groups.set(id, current);
  });
  return [...groups.entries()].sort((a, b) => b[1].count - a[1].count)[0];
}

function leakageSum(orders: Order[], brand: BrandSettings) {
  return orders.reduce((sum, order) => sum + estimatedLeakageForOrder(order, brand), 0);
}

export function buildLeakageAtlas(orders: Order[], ndrCases: NdrCase[], brand: BrandSettings): LeakageAtlasDriver[] {
  const highRiskCod = orders.filter((order) => order.paymentMode === "COD" && ["High", "Critical"].includes(order.riskBucket));
  const urgentNdrs = ndrCases.filter((ndr) => (ndr.hoursSinceNdr || 0) >= 8 && !["delivered_after_ndr", "rto"].includes(ndr.state));
  const urgentNdrOrders = urgentNdrs
    .map((ndr) => orders.find((order) => order.id === ndr.orderId))
    .filter((order): order is Order => Boolean(order));
  const weakAddress = orders.filter((order) => order.addressIssues.length > 0);
  const riskyCourierPincode = orders.filter((order) => order.paymentMode === "COD" && (order.riskBucket === "High" || order.riskBucket === "Critical"));
  const topPincode = groupTotal(riskyCourierPincode, (order) => order.pincode)?.[0];
  const rtoOrders = orders.filter((order) => /rto/i.test(order.finalStatus || ""));
  const topSku = groupTotal(rtoOrders, (order) => order.sku)?.[0];
  const campaignOrders = orders.filter((order) => order.campaignName || order.utmCampaign);
  const topCampaign = groupTotal(campaignOrders.filter((order) => /rto/i.test(order.finalStatus || "") || isNdrOrder(order)), (order) => order.campaignName || order.utmCampaign)?.[0];

  return [
    {
      id: "cod_risk",
      title: "COD Risk",
      sellerQuestion: "Which COD orders should not move blindly?",
      count: highRiskCod.length,
      estimatedLeakage: leakageSum(highRiskCod, brand),
      recommendation: highRiskCod.length ? "Start Mission Mode with critical COD orders before dispatch or reattempt." : "COD risk is controlled for now.",
      tone: highRiskCod.length ? "danger" : "success",
      route: { view: "missions", quickFilter: "highRiskCod" }
    },
    {
      id: "ndr_sla",
      title: "NDR SLA",
      sellerQuestion: "Which failed deliveries can still be rescued?",
      count: urgentNdrs.length,
      estimatedLeakage: leakageSum(urgentNdrOrders, brand),
      recommendation: urgentNdrs.length ? "Open NDR Rescue and act before the courier window closes." : "No urgent NDR breach risk right now.",
      tone: urgentNdrs.length ? "danger" : "success",
      route: { view: "ndr", quickFilter: "ndr" }
    },
    {
      id: "address_quality",
      title: "Address Quality",
      sellerQuestion: "Which weak addresses create avoidable RTO?",
      count: weakAddress.length,
      estimatedLeakage: leakageSum(weakAddress, brand),
      recommendation: weakAddress.length ? "Ask for landmark, house number, or alternate phone before shipping/reattempt." : "No major address quality cluster detected.",
      tone: weakAddress.length ? "warning" : "success",
      route: { view: "orders", quickFilter: "weakAddress" }
    },
    {
      id: "courier_pincode",
      title: "Courier + Pincode",
      sellerQuestion: "Which lane is leaking the most money?",
      count: riskyCourierPincode.length,
      estimatedLeakage: leakageSum(riskyCourierPincode, brand),
      recommendation: topPincode ? `Review pincode ${topPincode} and test courier allocation or COD verification.` : "Upload more courier and pincode data before changing lane policy.",
      tone: riskyCourierPincode.length ? "warning" : "neutral",
      route: { view: "pincode" }
    },
    {
      id: "sku",
      title: "SKU Leakage",
      sellerQuestion: "Which product creates high RTO or mismatch?",
      count: rtoOrders.length,
      estimatedLeakage: leakageSum(rtoOrders, brand),
      recommendation: topSku ? `Inspect ${topSku}: size, promise, discount, and delivery expectation may need correction.` : "No SKU leakage cluster is visible yet.",
      tone: rtoOrders.length ? "warning" : "neutral",
      route: { view: "sku" }
    },
    {
      id: "campaign",
      title: "Campaign Quality",
      sellerQuestion: "Which demand source creates low-intent COD?",
      count: campaignOrders.length,
      estimatedLeakage: leakageSum(campaignOrders.filter((order) => /rto/i.test(order.finalStatus || "") || isNdrOrder(order)), brand),
      recommendation: topCampaign ? `Check ${topCampaign}: pause, narrow, or prepaid-nudge low-intent COD traffic.` : "Campaign/source fields unlock this view.",
      tone: topCampaign ? "warning" : "info",
      route: { view: "campaigns" }
    },
    {
      id: "savings_proof",
      title: "Savings Proof",
      sellerQuestion: "Can we prove the workflow is worth paying for?",
      count: orders.filter((order) => order.actionStatus === "done").length,
      estimatedLeakage: leakageSum(orders.filter((order) => order.actionStatus === "done"), brand),
      recommendation: "Review estimated savings events and verify the ones finance can trust.",
      tone: "success",
      route: { view: "reports" }
    }
  ];
}

export function getTopLeakageDriver(drivers: LeakageAtlasDriver[]) {
  return [...drivers].sort((a, b) => b.estimatedLeakage - a.estimatedLeakage)[0];
}
