import type { ActionItem, BrandSettings, NdrCase, Order, SavingsEvent } from "@/types/domain";
import type { DataTrustStatus } from "@/features/imports";
import type { PilotReadinessStatus } from "@/features/pilot-readiness";
import type { PilotFinalReview, PilotPlan, PilotProgress } from "@/lib/pilot";

export type PilotHandoffStatus = "ready_to_pitch" | "needs_operator_work" | "needs_data_first";

export type PilotHandoffCriterion = {
  label: string;
  target: string;
  current: string;
  met: boolean;
};

export type PilotHandoffWorkstream = {
  phase: string;
  days: string;
  owner: string;
  objective: string;
  actions: string[];
  output: string;
};

export type PilotHandoffArtifact = {
  label: string;
  source: string;
  targetView: string;
};

export type PilotHandoffPack = {
  status: PilotHandoffStatus;
  headline: string;
  decisionRule: string;
  pilotWindow: string;
  operatingCadence: string[];
  successCriteria: PilotHandoffCriterion[];
  workstreams: PilotHandoffWorkstream[];
  proofArtifacts: PilotHandoffArtifact[];
  risks: string[];
  ceoInstruction: string;
  renewalDecision: string;
};

export function buildPilotHandoffPack(input: {
  brandName: string;
  readinessStatus: PilotReadinessStatus;
  dataTrustStatus: DataTrustStatus;
  orderCount: number;
  ndrCount: number;
  completedActionCount: number;
  estimatedSavings: number;
  verifiedSavings: number;
  pilotFee?: number;
}): PilotHandoffPack {
  const pilotFee = input.pilotFee ?? 4999;
  const successCriteria: PilotHandoffCriterion[] = [
    {
      label: "Enough data to diagnose patterns",
      target: "500+ recent orders",
      current: `${input.orderCount.toLocaleString("en-IN")} orders`,
      met: input.orderCount >= 500
    },
    {
      label: "NDR rescue queue exists",
      target: "At least 1 failed-delivery case",
      current: `${input.ndrCount.toLocaleString("en-IN")} cases`,
      met: input.ndrCount > 0
    },
    {
      label: "Team can complete work",
      target: "At least 1 action closed",
      current: `${input.completedActionCount.toLocaleString("en-IN")} actions closed`,
      met: input.completedActionCount > 0
    },
    {
      label: "Savings story exists",
      target: `Estimated savings above Rs ${pilotFee.toLocaleString("en-IN")} pilot fee`,
      current: `Rs ${Math.round(input.estimatedSavings).toLocaleString("en-IN")} estimated`,
      met: input.estimatedSavings >= pilotFee
    },
    {
      label: "Renewal proof can be trusted",
      target: "At least 1 verified savings event",
      current: `Rs ${Math.round(input.verifiedSavings).toLocaleString("en-IN")} verified`,
      met: input.verifiedSavings > 0
    }
  ];

  const requiredMet = successCriteria.slice(0, 4).every((item) => item.met);
  const status: PilotHandoffStatus =
    input.readinessStatus === "not_ready" || input.dataTrustStatus === "empty" || input.dataTrustStatus === "blocked"
      ? "needs_data_first"
      : requiredMet
        ? "ready_to_pitch"
        : "needs_operator_work";

  return {
    status,
    headline: headlineForStatus(status, input.brandName),
    decisionRule: `Continue only if the 14-day pilot shows Rs ${pilotFee.toLocaleString("en-IN")}+ estimated savings, one repeatable daily habit, and at least one verifiable proof artifact.`,
    pilotWindow: "14 days: 2 setup days, 9 operating days, 3 review and decision days.",
    operatingCadence: [
      "Morning: import/check orders, prioritize risky COD and weak-address work.",
      "Afternoon: record customer confirmations, cancellations, address updates, and prepaid interest.",
      "Evening: rescue NDR cases before the next courier attempt and log delivery outcome."
    ],
    successCriteria,
    workstreams: defaultWorkstreams(),
    proofArtifacts: [
      { label: "Data trust snapshot", source: "Latest import readiness and missing-field notes", targetView: "upload" },
      { label: "Daily action trail", source: "Completed action queue and owner notes", targetView: "missions" },
      { label: "NDR rescue evidence", source: "Delivered-after-NDR, reattempt, call, cancel, and RTO outcomes", targetView: "ndr" },
      { label: "Savings ledger", source: "Estimated, verified, rejected, and net savings proof", targetView: "savings" },
      { label: "Founder decision brief", source: "Weekly summary of driver, action, experiment, and trust warning", targetView: "weekly" },
      { label: "Privacy-safe handoff", source: "Workspace backup or CSV export", targetView: "privacy" }
    ],
    risks: buildRisks(input),
    ceoInstruction: ceoInstructionForStatus(status),
    renewalDecision: renewalDecisionForInput(input, pilotFee)
  };
}

export function buildPilotHandoffFromWorkspace(input: {
  brand: BrandSettings;
  orders: Order[];
  ndrCases: NdrCase[];
  savingsEvents: SavingsEvent[];
  actions: ActionItem[];
  readinessStatus: PilotReadinessStatus;
  dataTrustStatus: DataTrustStatus;
  pilotFee?: number;
}): PilotHandoffPack {
  const estimatedSavings = input.savingsEvents.reduce((sum, event) => sum + event.estimatedSaving, 0);
  const verifiedSavings = input.savingsEvents.reduce((sum, event) => sum + (event.status === "verified" ? event.actualSaving ?? event.estimatedSaving : 0), 0);

  return buildPilotHandoffPack({
    brandName: input.brand.name,
    readinessStatus: input.readinessStatus,
    dataTrustStatus: input.dataTrustStatus,
    orderCount: input.orders.length,
    ndrCount: input.ndrCases.length,
    completedActionCount: input.actions.filter((action) => action.status === "completed").length,
    estimatedSavings,
    verifiedSavings,
    pilotFee: input.pilotFee
  });
}

export function buildPilotHandoffFromPlan(plan: PilotPlan, progress: PilotProgress, finalReview: PilotFinalReview): PilotHandoffPack {
  return buildPilotHandoffPack({
    brandName: plan.brandName,
    readinessStatus: progress.estimatedSavings >= plan.pilotFee ? "almost_ready" : "not_ready",
    dataTrustStatus: plan.checklist.filter((item) => item.complete).length >= 4 ? "limited" : "empty",
    orderCount: plan.baseline.monthlyOrders,
    ndrCount: plan.days.reduce((sum, day) => sum + day.ndrCasesFound, 0) || plan.baseline.ndrBaseline || 0,
    completedActionCount: finalReview.totalActionsTaken,
    estimatedSavings: progress.estimatedSavings,
    verifiedSavings: 0,
    pilotFee: plan.pilotFee
  });
}

function defaultWorkstreams(): PilotHandoffWorkstream[] {
  return [
    {
      phase: "Baseline and trust",
      days: "Days 1-2",
      owner: "Founder + ops lead",
      objective: "Agree on clean data, cost assumptions, and what counts as proof.",
      actions: ["Load recent orders", "Review missing fields", "Confirm RTO cost assumptions", "Pick the first rescue cohort"],
      output: "Pilot baseline and trust warning."
    },
    {
      phase: "Daily rescue habit",
      days: "Days 3-5",
      owner: "Ops lead",
      objective: "Prove the team can act on the queue every day.",
      actions: ["Work high-risk COD orders", "Fix weak addresses", "Queue confirmations", "Close completed actions"],
      output: "Daily action trail."
    },
    {
      phase: "NDR recovery sprint",
      days: "Days 6-9",
      owner: "Support or delivery owner",
      objective: "Turn failed deliveries into reattempts, delivered orders, or clean cancellations.",
      actions: ["Contact fresh NDR cases", "Escalate high-value cases", "Mark reattempt/call/cancel/RTO", "Log savings events"],
      output: "NDR rescue evidence."
    },
    {
      phase: "Policy experiment",
      days: "Days 10-12",
      owner: "Founder",
      objective: "Test one narrow rule without changing the whole operation.",
      actions: ["Pick one pincode, courier, SKU, or COD cohort", "Simulate expected benefit", "Watch conversion guardrails"],
      output: "Decision-safe experiment."
    },
    {
      phase: "CEO decision",
      days: "Days 13-14",
      owner: "Founder",
      objective: "Decide renew, narrow, or stop using proof instead of excitement.",
      actions: ["Review savings ledger", "Separate estimated from verified", "Export handoff pack", "Choose next operating plan"],
      output: "Renewal decision."
    }
  ];
}

function buildRisks(input: {
  dataTrustStatus: DataTrustStatus;
  orderCount: number;
  ndrCount: number;
  completedActionCount: number;
  estimatedSavings: number;
  verifiedSavings: number;
}) {
  const risks: string[] = [];
  if (input.dataTrustStatus === "empty" || input.dataTrustStatus === "blocked") risks.push("Data is not reliable enough for a CEO decision.");
  if (input.orderCount < 500) risks.push("Order sample is too small to trust courier, pincode, or SKU patterns.");
  if (input.ndrCount === 0) risks.push("No NDR rescue queue exists yet, so the first wedge cannot be demonstrated.");
  if (input.completedActionCount === 0) risks.push("The team has not completed a daily action inside Wembro yet.");
  if (input.estimatedSavings <= 0) risks.push("No savings story has been created yet.");
  if (input.verifiedSavings <= 0) risks.push("Savings are still estimated; renewal proof needs verification.");
  return risks.length ? risks : ["Main risk is execution discipline: the team must work the queue daily for 14 days."];
}

function headlineForStatus(status: PilotHandoffStatus, brandName: string) {
  if (status === "ready_to_pitch") return `${brandName} has enough proof to pitch the 14-day pilot`;
  if (status === "needs_operator_work") return `${brandName} needs one operating loop before the pitch`;
  return `${brandName} needs a cleaner baseline before the pitch`;
}

function ceoInstructionForStatus(status: PilotHandoffStatus) {
  if (status === "ready_to_pitch") return "Invite the seller into a 14-day pilot with one clear cohort, one owner, and daily proof review.";
  if (status === "needs_operator_work") return "Do one complete rescue loop first: action, customer response or NDR outcome, savings event, then handoff.";
  return "Do not pitch the pilot yet. Fix data trust and load enough recent operational history first.";
}

function renewalDecisionForInput(input: { estimatedSavings: number; verifiedSavings: number; completedActionCount: number }, pilotFee: number) {
  if (input.verifiedSavings > 0 && input.estimatedSavings >= 3 * pilotFee) return "Renew into monthly control room and expand to the next leakage cohort.";
  if (input.estimatedSavings >= pilotFee && input.completedActionCount > 0) return "Continue one more cycle and convert estimated proof into verified proof.";
  if (input.estimatedSavings > 0) return "Narrow the cohort and rerun; the signal exists but is not strong enough.";
  return "Stop or restart after fixing data, owner, and daily execution discipline.";
}
