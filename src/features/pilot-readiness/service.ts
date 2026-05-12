import type { ActionItem, AuditLog, ImportRecord, Message, NdrCase, Order, SavingsEvent } from "@/types/domain";
import type { DataTrustStatus } from "@/features/imports";
import type { PilotFinalReview, PilotOwnerDiscipline, PilotPlan, PilotProgress } from "@/lib/pilot";

export type PilotReadinessStatus = "ready" | "almost_ready" | "not_ready";
export type PilotGoNoGoRecommendation = "continue" | "narrow" | "stop";
export type PilotGateStatus = "pass" | "fail";

export type PilotReadinessCheck = {
  id: string;
  label: string;
  metric: string;
  complete: boolean;
  required: boolean;
  targetView: string;
  why: string;
  nextAction: string;
};

export type PilotReadinessInput = {
  ordersCount: number;
  importsCount: number;
  ndrCount: number;
  messagesCount: number;
  savingsEventsCount: number;
  completedActionCount: number;
  verifiedSavingsCount: number;
  dataTrustStatus: DataTrustStatus;
  exportCount: number;
  ownerDiscipline?: PilotOwnerDiscipline;
};

export type PilotOwnerDisciplineSummary = {
  ready: boolean;
  missing: string[];
  privacyWarning?: string;
  metric: string;
  nextAction: string;
};

export type PilotReadinessSummary = {
  status: PilotReadinessStatus;
  headline: string;
  detail: string;
  percentage: number;
  completedCount: number;
  totalCount: number;
  requiredMissingCount: number;
  nextStep?: PilotReadinessCheck;
  checks: PilotReadinessCheck[];
};

export type PilotGoNoGoGate = {
  id: "data-trust" | "leakage-size" | "ops-owner" | "action-proof";
  label: string;
  status: PilotGateStatus;
  metric: string;
  reason: string;
  nextAction: string;
};

export type PilotGoNoGoInput = {
  dataTrustStatus: DataTrustStatus;
  monthlyOrders: number;
  monthlyLeakage: number;
  pilotFee: number;
  opsOwnerAssigned: boolean;
  ownerDiscipline?: PilotOwnerDiscipline;
  completedActionCount: number;
  estimatedSavings: number;
  ndrCount: number;
};

export function evaluatePilotOwnerDiscipline(input?: PilotOwnerDiscipline): PilotOwnerDisciplineSummary {
  const ownerRole = input?.ownerRole?.trim() || "";
  const morningWindow = input?.morningWindow?.trim() || "";
  const afternoonWindow = input?.afternoonWindow?.trim() || "";
  const eveningWindow = input?.eveningWindow?.trim() || "";
  const escalationChannel = input?.escalationChannel?.trim() || "";
  const missing = [
    !ownerRole ? "owner role" : "",
    !morningWindow ? "morning work window" : "",
    !afternoonWindow ? "afternoon work window" : "",
    !eveningWindow ? "evening NDR window" : "",
    !escalationChannel ? "escalation channel label" : ""
  ].filter(Boolean);
  const privacyWarning = containsDirectContact(escalationChannel)
    ? "Use a role or channel label for escalation, not a phone number or email."
    : undefined;
  const ready = missing.length === 0 && !privacyWarning;

  return {
    ready,
    missing,
    privacyWarning,
    metric: ready
      ? `${ownerRole} owner · ${morningWindow} / ${afternoonWindow} / ${eveningWindow}`
      : missing.length
        ? `Missing ${missing.join(", ")}`
        : privacyWarning || "Owner discipline incomplete",
    nextAction: ready
      ? "Keep the same owner and cadence through the 14-day pilot."
      : privacyWarning || "Assign the owner role, daily work windows, and escalation channel before pitching the pilot."
  };
}

export type PilotGoNoGoSummary = {
  recommendation: PilotGoNoGoRecommendation;
  headline: string;
  detail: string;
  gates: PilotGoNoGoGate[];
  failedGateCount: number;
  passedGateCount: number;
};

export function buildPilotReadiness(input: PilotReadinessInput): PilotReadinessSummary {
  const ownerDiscipline = evaluatePilotOwnerDiscipline(input.ownerDiscipline);
  const checks: PilotReadinessCheck[] = [
    {
      id: "baseline-data",
      label: "Baseline seller data loaded",
      metric: `${input.ordersCount.toLocaleString("en-IN")} orders`,
      complete: input.ordersCount >= 500 && input.importsCount > 0,
      required: true,
      targetView: "upload",
      why: "A CEO pilot needs enough order history to expose courier, pincode, SKU, and NDR patterns.",
      nextAction: "Load a Pro demo dataset or import anonymized seller CSV data."
    },
    {
      id: "data-trust",
      label: "Data trust reviewed",
      metric: statusLabel(input.dataTrustStatus),
      complete: input.dataTrustStatus === "ready" || input.dataTrustStatus === "limited",
      required: true,
      targetView: "upload",
      why: "The pilot should clearly separate reliable recommendations from directional ones.",
      nextAction: "Fix blocked CSV fields or use a cleaner demo dataset before pitching policy decisions."
    },
    {
      id: "ndr-signal",
      label: "NDR rescue signal present",
      metric: `${input.ndrCount.toLocaleString("en-IN")} NDR cases`,
      complete: input.ndrCount > 0,
      required: true,
      targetView: "ndr",
      why: "The first Wembro wedge is delivery rescue, so the pilot must show real NDR work.",
      nextAction: "Load data with NDR reasons or open the NDR Rescue view."
    },
    {
      id: "owner-discipline",
      label: "Pilot owner and cadence assigned",
      metric: ownerDiscipline.metric,
      complete: ownerDiscipline.ready,
      required: true,
      targetView: "pilot",
      why: "A 14-day pilot needs one accountable human owner and daily COD/RTO/NDR work windows.",
      nextAction: ownerDiscipline.nextAction
    },
    {
      id: "daily-action",
      label: "One action completed",
      metric: `${input.completedActionCount.toLocaleString("en-IN")} completed`,
      complete: input.completedActionCount > 0,
      required: true,
      targetView: "missions",
      why: "A pilot is not a dashboard demo until one operational task is worked end to end.",
      nextAction: "Complete one high-priority action from the Action Queue."
    },
    {
      id: "savings-proof",
      label: "Savings proof created",
      metric: `${input.savingsEventsCount.toLocaleString("en-IN")} savings events`,
      complete: input.savingsEventsCount > 0,
      required: true,
      targetView: "savings",
      why: "The CEO buyer needs to see money saved, not just tickets touched.",
      nextAction: "Rescue one NDR or record one customer response that creates a savings event."
    },
    {
      id: "verified-proof",
      label: "Verified proof path exists",
      metric: `${input.verifiedSavingsCount.toLocaleString("en-IN")} verified`,
      complete: input.verifiedSavingsCount > 0,
      required: false,
      targetView: "savings",
      why: "Estimated savings can sell the pilot; verified savings closes the renewal conversation.",
      nextAction: "Mark at least one savings event verified after delivery or finance confirmation."
    },
    {
      id: "handoff",
      label: "Handoff export prepared",
      metric: `${input.exportCount.toLocaleString("en-IN")} exports`,
      complete: input.exportCount > 0,
      required: false,
      targetView: "privacy",
      why: "A serious buyer should leave with a privacy-safe backup, CSV, or report artifact.",
      nextAction: "Export the workspace backup or current orders CSV for pilot handoff."
    }
  ];

  const completedCount = checks.filter((check) => check.complete).length;
  const requiredMissing = checks.filter((check) => check.required && !check.complete);
  const nextStep = checks.find((check) => !check.complete);
  const percentage = Math.round((completedCount / checks.length) * 100);
  const status: PilotReadinessStatus =
    requiredMissing.length > 0 ? "not_ready" : completedCount === checks.length ? "ready" : "almost_ready";

  return {
    status,
    headline: headlineForStatus(status),
    detail: detailForStatus(status, nextStep),
    percentage,
    completedCount,
    totalCount: checks.length,
    requiredMissingCount: requiredMissing.length,
    nextStep,
    checks
  };
}

export function buildPilotGoNoGo(input: PilotGoNoGoInput): PilotGoNoGoSummary {
  const leakageTarget = Math.max(input.pilotFee * 3, 15000);
  const ownerDiscipline = evaluatePilotOwnerDiscipline(input.ownerDiscipline);
  const ownerGatePass = input.ownerDiscipline ? ownerDiscipline.ready : input.opsOwnerAssigned;
  const gates: PilotGoNoGoGate[] = [
    {
      id: "data-trust",
      label: "Data trust",
      status: input.dataTrustStatus === "ready" || input.dataTrustStatus === "limited" ? "pass" : "fail",
      metric: `${statusLabel(input.dataTrustStatus)} · ${input.monthlyOrders.toLocaleString("en-IN")} orders`,
      reason: "Pilot decisions need enough trusted summary or anonymized CSV data to avoid guessing.",
      nextAction: "Stop the pitch until baseline data, missing fields, and confidence caveats are reviewed."
    },
    {
      id: "leakage-size",
      label: "Leakage size",
      status: input.monthlyLeakage >= leakageTarget && input.ndrCount > 0 ? "pass" : "fail",
      metric: `₹${Math.round(input.monthlyLeakage).toLocaleString("en-IN")} estimated monthly leakage`,
      reason: `A pilot needs a meaningful COD/RTO/NDR leak. Target: ₹${Math.round(leakageTarget).toLocaleString("en-IN")}+ and at least one NDR signal.`,
      nextAction: "Stop or run only a free/paid audit until leakage is large enough to justify operator time."
    },
    {
      id: "ops-owner",
      label: "Ops owner",
      status: ownerGatePass ? "pass" : "fail",
      metric: ownerGatePass ? ownerDiscipline.metric : ownerDiscipline.metric || "No owner assigned",
      reason: "A 14-day pilot fails if no seller-side owner works the daily COD/RTO/NDR queue at agreed times.",
      nextAction: ownerDiscipline.nextAction
    },
    {
      id: "action-proof",
      label: "Action proof",
      status: input.completedActionCount > 0 && input.estimatedSavings > 0 ? "pass" : "fail",
      metric: `${input.completedActionCount.toLocaleString("en-IN")} actions · ₹${Math.round(input.estimatedSavings).toLocaleString("en-IN")} estimated proof`,
      reason: "The pilot should not be pitched from enthusiasm; it needs one worked action and one savings/proof signal.",
      nextAction: "Run one narrow COD/NDR proof loop before pitching a full 14-day pilot."
    }
  ];
  const failedGateCount = gates.filter((gate) => gate.status === "fail").length;
  const hardStop = gates.some((gate) => gate.status === "fail" && gate.id !== "action-proof");
  const recommendation: PilotGoNoGoRecommendation = failedGateCount === 0 ? "continue" : hardStop ? "stop" : "narrow";

  return {
    recommendation,
    headline: goNoGoHeadline(recommendation),
    detail: goNoGoDetail(recommendation),
    gates,
    failedGateCount,
    passedGateCount: gates.length - failedGateCount
  };
}

export function buildPilotGoNoGoFromPlan(plan: PilotPlan, progress: PilotProgress, finalReview: PilotFinalReview): PilotGoNoGoSummary {
  const completedTrustChecks = plan.checklist.filter((item) =>
    item.complete && /csv|rto baseline|cod baseline|ndr baseline|top leakage|cost assumptions/i.test(item.label)
  ).length;
  const dataTrustStatus: DataTrustStatus = completedTrustChecks >= 4 ? "ready" : completedTrustChecks >= 2 ? "limited" : "blocked";
  const ownerDiscipline = evaluatePilotOwnerDiscipline(plan.ownerDiscipline);
  const ndrCount = plan.days.reduce((sum, day) => sum + day.ndrCasesFound, 0) || plan.baseline.ndrBaseline || 0;

  return buildPilotGoNoGo({
    dataTrustStatus,
    monthlyOrders: plan.baseline.monthlyOrders,
    monthlyLeakage: plan.baseline.monthlyLeakage,
    pilotFee: plan.pilotFee,
    opsOwnerAssigned: ownerDiscipline.ready,
    ownerDiscipline: plan.ownerDiscipline,
    completedActionCount: finalReview.totalActionsTaken,
    estimatedSavings: progress.estimatedSavings,
    ndrCount
  });
}

export function buildPilotReadinessFromWorkspace(input: {
  orders: Order[];
  imports: ImportRecord[];
  ndrCases: NdrCase[];
  messages: Message[];
  savingsEvents: SavingsEvent[];
  actions: ActionItem[];
  audits: AuditLog[];
  dataTrustStatus: DataTrustStatus;
}): PilotReadinessSummary {
  return buildPilotReadiness({
    ordersCount: input.orders.length,
    importsCount: input.imports.length,
    ndrCount: input.ndrCases.length,
    messagesCount: input.messages.length,
    savingsEventsCount: input.savingsEvents.length,
    completedActionCount: input.actions.filter((action) => action.status === "completed").length,
    verifiedSavingsCount: input.savingsEvents.filter((event) => event.status === "verified").length,
    dataTrustStatus: input.dataTrustStatus,
    exportCount: input.audits.filter((audit) => audit.action === "export_created").length
  });
}

function statusLabel(status: DataTrustStatus) {
  if (status === "ready") return "Ready";
  if (status === "limited") return "Directional";
  if (status === "blocked") return "Blocked";
  return "No data";
}

function containsDirectContact(value: string) {
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value) || /\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/.test(value.replace(/\D/g, ""));
}

function headlineForStatus(status: PilotReadinessStatus) {
  if (status === "ready") return "Pilot-ready for a CEO walkthrough";
  if (status === "almost_ready") return "Pilot-ready with proof gaps";
  return "Not ready for a serious seller pilot yet";
}

function goNoGoHeadline(recommendation: PilotGoNoGoRecommendation) {
  if (recommendation === "continue") return "Continue: pilot can be pitched";
  if (recommendation === "narrow") return "Narrow: prove one loop before pitching";
  return "Stop: do not pitch the pilot yet";
}

function goNoGoDetail(recommendation: PilotGoNoGoRecommendation) {
  if (recommendation === "continue") {
    return "Data trust, leakage size, owner, and action proof are strong enough for a 14-day COD/RTO/NDR pilot conversation.";
  }
  if (recommendation === "narrow") {
    return "Core conditions are present, but the seller still needs one narrow action-proof loop before a full pilot pitch.";
  }
  return "One or more hard gates failed. Keep the seller in audit mode until the missing proof is fixed.";
}

function detailForStatus(status: PilotReadinessStatus, nextStep?: PilotReadinessCheck) {
  if (status === "ready") {
    return "The workspace has data, trust labels, an operational action, savings proof, verification, and handoff artifacts.";
  }
  if (!nextStep) return "Review the checklist before inviting a seller into the pilot.";
  return `Next: ${nextStep.nextAction}`;
}
