import type { BrandSettings, NdrCase, Order, RiskBucket } from "@/types/domain";
import { isDeliveredNoAction, isNdrOrder } from "@/lib/actionGroups";
import { estimatedLeakageForOrder } from "@/lib/profitRecovery";

export type MissionPriority = "Critical" | "High" | "Medium" | "Low";

export interface ProfitMission {
  order: Order;
  priority: MissionPriority;
  estimatedLeakage: number;
  urgencyLabel: string;
  slaHoursLeft?: number;
  why: string;
  priorityFactors: Array<{
    label: "Impact" | "Urgency" | "Frequency" | "Confidence";
    value: string;
    detail: string;
  }>;
}

const riskRank: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1
};

function missionPriority(bucket: RiskBucket | string): MissionPriority {
  if (bucket === "Critical" || bucket === "High" || bucket === "Medium") return bucket;
  return "Low";
}

function ndrForOrder(order: Order, ndrCases: NdrCase[]) {
  return ndrCases.find((ndr) => ndr.orderId === order.id);
}

function matchingSignalCount(order: Order, orders: Order[]) {
  return orders.filter((candidate) => {
    if (!isMissionActionable(candidate)) return false;
    if (order.pincode && candidate.pincode === order.pincode) return true;
    if (order.courier && candidate.courier === order.courier && candidate.riskBucket === order.riskBucket) return true;
    if (order.sku && candidate.sku === order.sku) return true;
    const campaign = order.campaignName || order.utmCampaign;
    const candidateCampaign = candidate.campaignName || candidate.utmCampaign;
    return Boolean(campaign && candidateCampaign === campaign);
  }).length;
}

function formatRs(value: number) {
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
}

export function isMissionActionable(order: Order) {
  return order.actionStatus !== "done" && order.recommendedAction !== "no_action" && !isDeliveredNoAction(order);
}

export function buildProfitMissions(orders: Order[], brand: BrandSettings, ndrCases: NdrCase[] = []): ProfitMission[] {
  return orders
    .filter(isMissionActionable)
    .map((order) => {
      const ndr = ndrForOrder(order, ndrCases);
      const hoursSinceNdr = ndr?.hoursSinceNdr || 0;
      const slaHoursLeft = ndr ? Math.max(0, 12 - Math.round(hoursSinceNdr)) : undefined;
      const ndrUrgency = ndr && hoursSinceNdr >= 10 ? "SLA breach risk" : ndr && hoursSinceNdr >= 8 ? "Act this shift" : "";
      const urgencyLabel = ndrUrgency || (order.riskBucket === "Critical" ? "Critical COD risk" : order.riskBucket === "High" ? "High risk order" : "Recoverable action");
      const estimatedLeakage = estimatedLeakageForOrder(order, brand);
      const frequency = matchingSignalCount(order, orders);
      const priorityFactors: ProfitMission["priorityFactors"] = [
        {
          label: "Impact",
          value: formatRs(estimatedLeakage),
          detail: "Estimated leakage this action can protect or recover."
        },
        {
          label: "Urgency",
          value: slaHoursLeft !== undefined ? `${slaHoursLeft}h left` : urgencyLabel,
          detail: slaHoursLeft !== undefined ? "NDR rescue window is time-sensitive." : "Risk bucket controls daily queue order."
        },
        {
          label: "Frequency",
          value: `${frequency} signal${frequency === 1 ? "" : "s"}`,
          detail: "Similar open orders share pincode, courier, SKU, campaign, or risk signals."
        },
        {
          label: "Confidence",
          value: order.confidenceLabel || order.riskBucket,
          detail: "Based on imported fields and the visible risk reason trail."
        }
      ];

      return {
        order,
        priority: missionPriority(order.riskBucket),
        estimatedLeakage,
        urgencyLabel,
        slaHoursLeft,
        why: isNdrOrder(order)
          ? `NDR rescue window is active. ${order.recommendedActionReason}`
          : order.recommendedActionReason,
        priorityFactors
      };
    })
    .sort((a, b) => {
      const bUrgencyBoost = b.slaHoursLeft !== undefined && b.slaHoursLeft <= 2 ? 2 : 0;
      const aUrgencyBoost = a.slaHoursLeft !== undefined && a.slaHoursLeft <= 2 ? 2 : 0;
      const priorityDiff = (riskRank[b.priority] + bUrgencyBoost) - (riskRank[a.priority] + aUrgencyBoost);
      if (priorityDiff) return priorityDiff;
      return b.estimatedLeakage - a.estimatedLeakage;
    });
}

export function getMissionProgress(orders: Order[]) {
  const actionable = orders.filter((order) => order.recommendedAction !== "no_action" && !isDeliveredNoAction(order));
  const completed = actionable.filter((order) => order.actionStatus === "done");
  const total = actionable.length;
  const completedCount = completed.length;
  return {
    total,
    completed: completedCount,
    remaining: Math.max(0, total - completedCount),
    percent: total ? Math.round((completedCount / total) * 100) : 100,
    complete: total === 0 || completedCount === total
  };
}

export function getNextProfitMission(orders: Order[], brand: BrandSettings, ndrCases: NdrCase[] = []) {
  return buildProfitMissions(orders, brand, ndrCases)[0];
}
