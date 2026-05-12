import type { AuditSession } from "@/lib/audit";

export type PilotOutcomeStatus = "strong_success" | "promising" | "inconclusive" | "not_viable";

export interface PilotDayMetrics {
  day: number;
  ordersChecked: number;
  riskyCodFound: number;
  addressesCorrected: number;
  codConfirmationsQueued: number;
  prepaidOpportunitiesFound: number;
  ndrCasesFound: number;
  ndrsContacted: number;
  ndrsRescued: number;
  ordersCancelledBeforeShipping: number;
  estimatedSavings: number;
  proofNote: string;
  blocker: string;
  notes: string;
}

export interface PilotChecklistItem {
  id: string;
  label: string;
  complete: boolean;
}

export interface PilotOwnerDiscipline {
  ownerRole: string;
  ownerName?: string;
  morningWindow: string;
  afternoonWindow: string;
  eveningWindow: string;
  escalationChannel: string;
}

export interface PilotPlan {
  id: string;
  createdAt: string;
  brandName: string;
  category: string;
  auditSessionId?: string;
  pilotFee: number;
  baseline: {
    monthlyOrders: number;
    codPercentage: number;
    rtoPercentage: number;
    ndrBaseline?: number;
    rtoLossPerOrder: number;
    monthlyLeakage: number;
  };
  ownerDiscipline?: PilotOwnerDiscipline;
  selectedActionRules: string[];
  checklist: PilotChecklistItem[];
  days: PilotDayMetrics[];
  finalReview?: PilotFinalReview;
}

export interface PilotProgress {
  checklistCompletionRate: number;
  actionCompletionRate: number;
  ndrResponseRate: number;
  deliveredAfterNdrCount: number;
  cancellationsBeforeShipping: number;
  estimatedSavings: number;
  pilotNetBenefit: number;
  pilotRoi: number | null;
}

export interface PilotFinalReview extends PilotProgress {
  baselineRto: number;
  pilotPeriodRto: number;
  totalActionsTaken: number;
  topSuccessfulActionType: string;
  topLeakageStillUnresolved: string;
  recommendation: string;
  outcomeStatus: PilotOutcomeStatus;
}

export const pilotActionRules = [
  "Confirm risky COD before dispatch",
  "Request address correction for weak addresses",
  "Push prepaid offer for high-risk COD",
  "Rescue NDR within 12 hours",
  "Call high-value NDR cases",
  "Mark low-margin third-attempt NDR as RTO",
  "Review courier issue clusters",
  "Review pincode policy"
];

export const pilotChecklistLabels = [
  "Brand details confirmed",
  "Cost assumptions confirmed",
  "Baseline CSV uploaded",
  "RTO baseline calculated",
  "COD baseline calculated",
  "NDR baseline calculated",
  "Top leakage drivers identified",
  "Action rules selected",
  "Ops owner assigned"
];

export function emptyPilotDay(day: number): PilotDayMetrics {
  return {
    day,
    ordersChecked: 0,
    riskyCodFound: 0,
    addressesCorrected: 0,
    codConfirmationsQueued: 0,
    prepaidOpportunitiesFound: 0,
    ndrCasesFound: 0,
    ndrsContacted: 0,
    ndrsRescued: 0,
    ordersCancelledBeforeShipping: 0,
    estimatedSavings: 0,
    proofNote: "",
    blocker: "",
    notes: ""
  };
}

export function createPilotFromAudit(audit?: AuditSession, pilotFee = 4999): PilotPlan {
  const metrics = audit?.calculated_metrics;
  return {
    id: `pilot-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    brandName: audit?.brand_name || "Demo D2C Brand",
    category: audit?.category || "Fashion",
    auditSessionId: audit?.id,
    pilotFee,
    baseline: {
      monthlyOrders: metrics?.monthlyOrders || 1500,
      codPercentage: metrics?.codPercentage || 70,
      rtoPercentage: metrics?.rtoPercentage || 24,
      ndrBaseline: metrics?.ndrReasonLeakage?.reduce((sum, item) => sum + item.total, 0),
      rtoLossPerOrder: metrics?.rtoLossPerOrder || 395,
      monthlyLeakage: metrics?.monthlyLeakage || 142200
    },
    selectedActionRules: pilotActionRules.slice(0, 5),
    checklist: pilotChecklistLabels.map((label, index) => ({ id: `check-${index + 1}`, label, complete: index < 2 })),
    days: Array.from({ length: 14 }, (_, index) => emptyPilotDay(index + 1))
  };
}

export function updatePilotDay(plan: PilotPlan, day: number, patch: Partial<PilotDayMetrics>) {
  return {
    ...plan,
    days: plan.days.map((item) => (item.day === day ? { ...item, ...patch } : item))
  };
}

export function calculatePilotOutcome(estimatedSavings: number, pilotFee: number): PilotOutcomeStatus {
  if (pilotFee <= 0) return estimatedSavings > 0 ? "strong_success" : "not_viable";
  if (estimatedSavings >= 3 * pilotFee) return "strong_success";
  if (estimatedSavings >= pilotFee) return "promising";
  if (estimatedSavings > 0) return "inconclusive";
  return "not_viable";
}

export function calculatePilotProgress(plan: PilotPlan): PilotProgress {
  const totals = plan.days.reduce(
    (sum, day) => ({
      ordersChecked: sum.ordersChecked + day.ordersChecked,
      riskyCodFound: sum.riskyCodFound + day.riskyCodFound,
      codConfirmationsQueued: sum.codConfirmationsQueued + day.codConfirmationsQueued,
      ndrsContacted: sum.ndrsContacted + day.ndrsContacted,
      ndrsRescued: sum.ndrsRescued + day.ndrsRescued,
      ordersCancelledBeforeShipping: sum.ordersCancelledBeforeShipping + day.ordersCancelledBeforeShipping,
      estimatedSavings: sum.estimatedSavings + day.estimatedSavings
    }),
    { ordersChecked: 0, riskyCodFound: 0, codConfirmationsQueued: 0, ndrsContacted: 0, ndrsRescued: 0, ordersCancelledBeforeShipping: 0, estimatedSavings: 0 }
  );
  const completed = plan.checklist.filter((item) => item.complete).length;
  const actionBase = Math.max(1, totals.riskyCodFound + plan.days.reduce((sum, day) => sum + day.ndrCasesFound, 0));
  const actionDone = totals.codConfirmationsQueued + totals.ndrsContacted;

  return {
    checklistCompletionRate: plan.checklist.length ? completed / plan.checklist.length : 0,
    actionCompletionRate: Math.min(1, actionDone / actionBase),
    ndrResponseRate: totals.ndrsContacted ? totals.ndrsRescued / totals.ndrsContacted : 0,
    deliveredAfterNdrCount: totals.ndrsRescued,
    cancellationsBeforeShipping: totals.ordersCancelledBeforeShipping,
    estimatedSavings: totals.estimatedSavings,
    pilotNetBenefit: totals.estimatedSavings - plan.pilotFee,
    pilotRoi: plan.pilotFee > 0 ? totals.estimatedSavings / plan.pilotFee : null
  };
}

export function generatePilotFinalReview(plan: PilotPlan): PilotFinalReview {
  const progress = calculatePilotProgress(plan);
  const totalActionsTaken = plan.days.reduce(
    (sum, day) => sum + day.codConfirmationsQueued + day.addressesCorrected + day.ndrsContacted + day.ordersCancelledBeforeShipping,
    0
  );
  const topSuccessfulActionType =
    progress.deliveredAfterNdrCount > plan.days.reduce((sum, day) => sum + day.ordersCancelledBeforeShipping, 0)
      ? "NDR rescue"
      : "COD cancellation before shipping";
  const pilotPeriodRto = Math.max(0, plan.baseline.rtoPercentage - (progress.estimatedSavings / Math.max(plan.baseline.monthlyLeakage, 1)) * plan.baseline.rtoPercentage);
  const outcomeStatus = calculatePilotOutcome(progress.estimatedSavings, plan.pilotFee);
  const recommendation =
    outcomeStatus === "strong_success"
      ? "Move to a monthly operating plan and tighten courier/pincode rules."
      : outcomeStatus === "promising"
        ? "Continue for one more cycle with sharper action thresholds."
        : outcomeStatus === "inconclusive"
          ? "Run a narrower pilot on the top COD/NDR cohort before scaling."
          : "Do not scale yet; recheck volume, cost assumptions, and action execution.";

  return {
    ...progress,
    baselineRto: plan.baseline.rtoPercentage,
    pilotPeriodRto,
    totalActionsTaken,
    topSuccessfulActionType,
    topLeakageStillUnresolved: "Courier/pincode clusters still need weekly review",
    recommendation,
    outcomeStatus
  };
}
