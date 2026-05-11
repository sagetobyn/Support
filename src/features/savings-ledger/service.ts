import type { BrandSettings, Message, Order, SavingsEvent, Store } from "@/types/domain";
import { totalEstimatedMessagingCost } from "@/lib/messaging";

export type SavingsProofStage = "pending" | "estimated" | "verified" | "rejected";
export type SavingsConfidenceLevel = "low" | "medium" | "high";
export type NorthStarConfidenceBucket = SavingsConfidenceLevel | "verified" | "pending" | "rejected";

export interface WeeklyNorthStarWindow {
  start: string | Date;
  end: string | Date;
}

export interface WeeklyNorthStarMetric {
  label: "Rupees recovered/protected per seller per week";
  formula: string;
  weekStart: string;
  weekEnd: string;
  rupeesRecoveredOrProtected: number;
  verifiedRupees: number;
  confidenceLabeledRupees: number;
  pendingRupees: number;
  rejectedRupees: number;
  includedEventCount: number;
  pendingEventCount: number;
  rejectedEventCount: number;
  excludedEventCount: number;
  confidenceBreakdown: Record<NorthStarConfidenceBucket, number>;
}

export const NORTH_STAR_METRIC_LABEL = "Rupees recovered/protected per seller per week";
export const NORTH_STAR_METRIC_FORMULA =
  "weekly_north_star = verified actualSaving + confidence-labeled estimatedSaving for positive COD/RTO/NDR savings events in the week; pending and rejected events do not count.";

const recoverableEventTypes = new Set<SavingsEvent["eventType"]>([
  "cancelled_before_shipping",
  "address_corrected",
  "address_corrected_delivered",
  "ndr_rescued_delivered",
  "cod_converted_prepaid",
  "courier_policy_recommendation",
  "pincode_policy_recommendation",
  "sku_policy_recommendation",
  "campaign_policy_recommendation"
]);

export function updateSavingEvent(events: SavingsEvent[], id: string, patch: Partial<Pick<SavingsEvent, "estimatedSaving" | "actualSaving" | "status" | "note">>) {
  return events.map((event) => (event.id === id ? { ...event, ...patch } : event));
}

export function normalizeSavingsStatus(event: SavingsEvent): SavingsProofStage {
  if (event.status === "pending" || event.status === "verified" || event.status === "rejected") return event.status;
  return "estimated";
}

export function normalizeSavingsConfidence(event: SavingsEvent): SavingsConfidenceLevel {
  if (event.confidence === "high" || event.confidence === "medium" || event.confidence === "low") return event.confidence;
  if (typeof event.confidence === "number") {
    if (event.confidence >= 0.8) return "high";
    if (event.confidence >= 0.5) return "medium";
    return "low";
  }
  return event.formulaNote || Object.keys(event.calculation || {}).length ? "medium" : "low";
}

export function savingsProofStatus(event: SavingsEvent) {
  const status = normalizeSavingsStatus(event);
  if (status === "verified") {
    return {
      label: "Verified",
      tone: "success" as const,
      detail: "Use this in founder and finance reviews."
    };
  }
  if (status === "rejected") {
    return {
      label: "Rejected",
      tone: "danger" as const,
      detail: "Excluded from savings proof."
    };
  }
  if (status === "pending") {
    return {
      label: "Pending",
      tone: "warning" as const,
      detail: "Action logged; excluded from North Star until estimated or verified."
    };
  }
  return {
    label: "Estimated",
    tone: "neutral" as const,
    detail: "Confidence-labeled until verified against outcome evidence."
  };
}

function eventAmount(event: SavingsEvent) {
  return normalizeSavingsStatus(event) === "verified" ? event.actualSaving ?? event.estimatedSaving : event.estimatedSaving;
}

function positiveRecoverableAmount(event: SavingsEvent) {
  if (!recoverableEventTypes.has(event.eventType)) return 0;
  return Math.max(0, eventAmount(event));
}

function timestamp(input: string | Date) {
  return input instanceof Date ? input.getTime() : Date.parse(input);
}

function iso(input: string | Date) {
  return input instanceof Date ? input.toISOString() : new Date(input).toISOString();
}

export function currentNorthStarWeek(now = new Date()): WeeklyNorthStarWindow {
  const day = now.getUTCDay() || 7;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - day + 1);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

export function calculateWeeklyNorthStarMetric(events: SavingsEvent[], window: WeeklyNorthStarWindow = currentNorthStarWeek()): WeeklyNorthStarMetric {
  const start = timestamp(window.start);
  const end = timestamp(window.end);
  const confidenceBreakdown: Record<NorthStarConfidenceBucket, number> = {
    verified: 0,
    high: 0,
    medium: 0,
    low: 0,
    pending: 0,
    rejected: 0
  };
  let verifiedRupees = 0;
  let confidenceLabeledRupees = 0;
  let pendingRupees = 0;
  let rejectedRupees = 0;
  let includedEventCount = 0;
  let pendingEventCount = 0;
  let rejectedEventCount = 0;
  let excludedEventCount = 0;

  for (const event of events) {
    const createdAt = Date.parse(event.createdAt);
    if (Number.isNaN(createdAt) || createdAt < start || createdAt >= end) continue;

    const status = normalizeSavingsStatus(event);
    const amount = positiveRecoverableAmount(event);

    if (status === "rejected") {
      const rejectedAmount = Math.max(0, event.estimatedSaving);
      rejectedRupees += rejectedAmount;
      confidenceBreakdown.rejected += rejectedAmount;
      rejectedEventCount += 1;
      continue;
    }

    if (status === "pending") {
      pendingRupees += amount;
      confidenceBreakdown.pending += amount;
      pendingEventCount += 1;
      continue;
    }

    if (amount <= 0) {
      excludedEventCount += 1;
      continue;
    }

    if (status === "verified") {
      verifiedRupees += amount;
      confidenceBreakdown.verified += amount;
    } else {
      const confidence = normalizeSavingsConfidence(event);
      confidenceLabeledRupees += amount;
      confidenceBreakdown[confidence] += amount;
    }
    includedEventCount += 1;
  }

  return {
    label: NORTH_STAR_METRIC_LABEL,
    formula: NORTH_STAR_METRIC_FORMULA,
    weekStart: iso(window.start),
    weekEnd: iso(window.end),
    rupeesRecoveredOrProtected: verifiedRupees + confidenceLabeledRupees,
    verifiedRupees,
    confidenceLabeledRupees,
    pendingRupees,
    rejectedRupees,
    includedEventCount,
    pendingEventCount,
    rejectedEventCount,
    excludedEventCount,
    confidenceBreakdown
  };
}

export function calculateSavingsLedger(events: SavingsEvent[], messages: Message[], brand: BrandSettings, orders: Order[] = [], stores: Store[] = []) {
  const estimatedSavings = events.filter((event) => normalizeSavingsStatus(event) !== "rejected" && normalizeSavingsStatus(event) !== "pending").reduce((sum, event) => sum + event.estimatedSaving, 0);
  const verifiedSavings = events.filter((event) => normalizeSavingsStatus(event) === "verified").reduce((sum, event) => sum + (event.actualSaving ?? event.estimatedSaving), 0);
  const pendingSavings = events.filter((event) => normalizeSavingsStatus(event) === "pending").reduce((sum, event) => sum + event.estimatedSaving, 0);
  const rejectedSavings = events.filter((event) => normalizeSavingsStatus(event) === "rejected").reduce((sum, event) => sum + event.estimatedSaving, 0);
  const confidenceLabeledSavings = events.filter((event) => normalizeSavingsStatus(event) === "estimated").reduce((sum, event) => sum + event.estimatedSaving, 0);
  const estimatedEventCount = events.filter((event) => normalizeSavingsStatus(event) === "estimated").length;
  const verifiedEventCount = events.filter((event) => normalizeSavingsStatus(event) === "verified").length;
  const pendingEventCount = events.filter((event) => normalizeSavingsStatus(event) === "pending").length;
  const rejectedEventCount = events.filter((event) => normalizeSavingsStatus(event) === "rejected").length;
  const proofRate = events.length ? Math.round((verifiedEventCount / events.length) * 100) : 0;
  const messagingCost = totalEstimatedMessagingCost(messages);
  const softwareCost = brand.softwareCost;
  const by = (key: (event: SavingsEvent) => string) =>
    events.reduce<Record<string, number>>((acc, event) => {
      const bucket = key(event);
      acc[bucket] = (acc[bucket] || 0) + event.estimatedSaving;
      return acc;
    }, {});
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const storeName = (event: SavingsEvent) => {
    const order = event.orderId ? orderById.get(event.orderId) : undefined;
    return stores.find((store) => store.id === order?.storeId)?.storeName || order?.sourceStoreName || "Main store";
  };
  return {
    estimatedSavings,
    verifiedSavings,
    pendingSavings,
    rejectedSavings,
    confidenceLabeledSavings,
    messagingCost,
    softwareCost,
    netEstimatedBenefit: estimatedSavings - messagingCost - softwareCost,
    netVerifiedBenefit: verifiedSavings - messagingCost - softwareCost,
    estimatedEventCount,
    verifiedEventCount,
    pendingEventCount,
    rejectedEventCount,
    proofRate,
    northStarThisWeek: calculateWeeklyNorthStarMetric(events),
    savingsByFeature: by((event) => event.sourceFeature || "manual"),
    savingsByEventType: by((event) => event.eventType),
    savingsByStore: by(storeName),
    savingsByWeek: by((event) => new Date(event.createdAt).toISOString().slice(0, 10))
  };
}
