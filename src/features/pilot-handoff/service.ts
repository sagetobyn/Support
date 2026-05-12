import type { ActionItem, BrandSettings, NdrCase, Order, SavingsEvent } from "@/types/domain";
import type { DataTrustStatus } from "@/features/imports";
import type { PilotReadinessStatus } from "@/features/pilot-readiness";
import type { AuditSession } from "@/lib/audit";
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

export type PilotFinalReviewDecision = "renew" | "narrow" | "stop";

export type PilotFinalReviewTemplate = {
  title: string;
  decision: PilotFinalReviewDecision;
  generatedAt: string;
  baseline: Array<{ label: string; value: string }>;
  actions: Array<{ label: string; value: string }>;
  savings: {
    estimated: number;
    verified: number;
    unverified: number;
    note: string;
  };
  failures: string[];
  nextPlan: string[];
  trustNotes: string[];
  markdown: string;
};

export type AuditToPilotHandoffStatus = "ready_for_pilot" | "needs_csv_first" | "summary_check_only";

export type AuditToPilotHandoff = {
  sourceAuditId: string;
  brandName: string;
  generatedAt: string;
  sourceMode: AuditSession["mode"];
  modeLabel: string;
  privacyLabel: string;
  status: AuditToPilotHandoffStatus;
  headline: string;
  nextMission: string;
  localTransferNote: string;
  assumptions: string[];
  summaryFields: Array<{ label: string; value: string }>;
  proofRequests: string[];
  exportFileName: string;
};

export function buildAuditToPilotHandoff(audit: AuditSession, generatedAt = new Date().toISOString()): AuditToPilotHandoff {
  const metrics = audit.calculated_metrics;
  const hasCsvEvidence = audit.mode === "csv" && (audit.row_count || 0) > 0;
  const enoughLeakage = metrics.monthlyLeakage >= 4999;
  const enoughOrders = metrics.monthlyOrders >= 300;
  const status: AuditToPilotHandoffStatus = hasCsvEvidence && enoughLeakage && enoughOrders
    ? "ready_for_pilot"
    : enoughLeakage && enoughOrders
      ? "needs_csv_first"
      : "summary_check_only";
  const firstRecommendation = audit.recommendations[0]?.action || "Use an anonymized CSV to identify the first COD/RTO/NDR action.";

  return {
    sourceAuditId: audit.id,
    brandName: audit.brand_name,
    generatedAt,
    sourceMode: audit.mode,
    modeLabel: audit.mode === "csv" ? "Anonymized CSV profit audit" : audit.mode === "pilot" ? "Rescue pilot prep readiness" : "Summary leakage check",
    privacyLabel: privacyLabelForAuditMode(audit.mode),
    status,
    headline: handoffHeadline(status, audit.brand_name),
    nextMission: nextMissionForAudit(status, firstRecommendation),
    localTransferNote: "Local handoff only: this summary is saved in this browser or exported only when the seller clicks. No customer-level data is moved silently.",
    assumptions: [
      `RTO loss per order: ${money(metrics.rtoLossPerOrder)}`,
      `Monthly leakage estimate: ${money(metrics.monthlyLeakage)}`,
      `20% recovery scenario: ${money(metrics.savings20)}`,
      audit.mode === "csv"
        ? `Evidence source: anonymized CSV with ${(audit.row_count || 0).toLocaleString("en-IN")} rows.`
        : "Evidence source: seller-entered summary assumptions; confirm with anonymized CSV profit audit before a rescue pilot."
    ],
    summaryFields: [
      { label: "Monthly orders", value: metrics.monthlyOrders.toLocaleString("en-IN") },
      { label: "COD share", value: `${round(metrics.codPercentage)}%` },
      { label: "RTO rate", value: `${round(metrics.rtoPercentage)}%` },
      { label: "Monthly leakage", value: money(metrics.monthlyLeakage) },
      { label: "Rescue pilot decision input", value: status.replaceAll("_", " ") }
    ],
    proofRequests: proofRequestsForAudit(status, audit.mode),
    exportFileName: `${slug(audit.brand_name)}-profit-audit-to-rescue-pilot-handoff.json`
  };
}

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
    decisionRule: `Continue only if the rescue pilot shows Rs ${pilotFee.toLocaleString("en-IN")}+ estimated savings, one repeatable daily habit, and at least one verifiable proof artifact.`,
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

export function buildPilotFinalReviewTemplate(input: {
  plan: PilotPlan;
  finalReview: PilotFinalReview;
  verifiedSavings?: number;
  generatedAt?: string;
}): PilotFinalReviewTemplate {
  const verifiedSavings = Math.max(0, input.verifiedSavings ?? 0);
  const estimatedSavings = Math.max(0, input.finalReview.estimatedSavings);
  const actionTotals = input.plan.days.reduce(
    (sum, day) => ({
      ordersChecked: sum.ordersChecked + day.ordersChecked,
      riskyCodFound: sum.riskyCodFound + day.riskyCodFound,
      addressesCorrected: sum.addressesCorrected + day.addressesCorrected,
      codConfirmationsQueued: sum.codConfirmationsQueued + day.codConfirmationsQueued,
      prepaidOpportunitiesFound: sum.prepaidOpportunitiesFound + day.prepaidOpportunitiesFound,
      ndrCasesFound: sum.ndrCasesFound + day.ndrCasesFound,
      ndrsContacted: sum.ndrsContacted + day.ndrsContacted,
      ndrsRescued: sum.ndrsRescued + day.ndrsRescued,
      ordersCancelledBeforeShipping: sum.ordersCancelledBeforeShipping + day.ordersCancelledBeforeShipping
    }),
    {
      ordersChecked: 0,
      riskyCodFound: 0,
      addressesCorrected: 0,
      codConfirmationsQueued: 0,
      prepaidOpportunitiesFound: 0,
      ndrCasesFound: 0,
      ndrsContacted: 0,
      ndrsRescued: 0,
      ordersCancelledBeforeShipping: 0
    }
  );
  const decision = finalReviewDecision({
    estimatedSavings,
    verifiedSavings,
    totalActionsTaken: input.finalReview.totalActionsTaken,
    pilotFee: input.plan.pilotFee
  });
  const failures = finalReviewFailures({
    plan: input.plan,
    actionTotals,
    estimatedSavings,
    verifiedSavings
  });
  const nextPlan = finalReviewNextPlan(decision);
  const trustNotes = [
    "Estimated savings are directional until the seller confirms delivery, cancellation, finance, or courier proof.",
    "Verified savings must point to an order outcome or finance confirmation; this template does not create verification by itself.",
    "No real WhatsApp sending, courier push, or store sync is implied by this review."
  ];
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const baseline = [
    { label: "Brand", value: input.plan.brandName },
    { label: "Category", value: input.plan.category },
    { label: "Monthly orders", value: input.plan.baseline.monthlyOrders.toLocaleString("en-IN") },
    { label: "COD baseline", value: `${input.plan.baseline.codPercentage}%` },
    { label: "RTO baseline", value: `${input.plan.baseline.rtoPercentage}%` },
    { label: "Monthly leakage", value: money(input.plan.baseline.monthlyLeakage) },
    { label: "Pilot fee", value: money(input.plan.pilotFee) }
  ];
  const actions = [
    { label: "Orders checked", value: actionTotals.ordersChecked.toLocaleString("en-IN") },
    { label: "Risky COD found", value: actionTotals.riskyCodFound.toLocaleString("en-IN") },
    { label: "COD confirmations queued", value: actionTotals.codConfirmationsQueued.toLocaleString("en-IN") },
    { label: "Addresses corrected", value: actionTotals.addressesCorrected.toLocaleString("en-IN") },
    { label: "Prepaid opportunities found", value: actionTotals.prepaidOpportunitiesFound.toLocaleString("en-IN") },
    { label: "NDR cases found", value: actionTotals.ndrCasesFound.toLocaleString("en-IN") },
    { label: "NDRs contacted", value: actionTotals.ndrsContacted.toLocaleString("en-IN") },
    { label: "NDRs rescued", value: actionTotals.ndrsRescued.toLocaleString("en-IN") },
    { label: "Cancelled before shipping", value: actionTotals.ordersCancelledBeforeShipping.toLocaleString("en-IN") }
  ];
  const template: Omit<PilotFinalReviewTemplate, "markdown"> = {
    title: `${input.plan.brandName} COD/RTO/NDR rescue pilot final review`,
    decision,
    generatedAt,
    baseline,
    actions,
    savings: {
      estimated: estimatedSavings,
      verified: verifiedSavings,
      unverified: Math.max(0, estimatedSavings - verifiedSavings),
      note: verifiedSavings > 0 ? "Verified proof exists, but estimated and verified numbers must stay separate." : "No savings are marked verified in this rescue pilot plan."
    },
    failures,
    nextPlan,
    trustNotes
  };

  return {
    ...template,
    markdown: renderPilotFinalReviewMarkdown(template)
  };
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
  if (status === "ready_to_pitch") return `${brandName} has enough proof to pitch the rescue pilot`;
  if (status === "needs_operator_work") return `${brandName} needs one operating loop before the pitch`;
  return `${brandName} needs a cleaner baseline before the pitch`;
}

function ceoInstructionForStatus(status: PilotHandoffStatus) {
  if (status === "ready_to_pitch") return "Invite the seller into a rescue pilot with one clear cohort, one owner, and daily proof review.";
  if (status === "needs_operator_work") return "Do one complete rescue loop first: action, customer response or NDR outcome, savings event, then handoff.";
  return "Do not pitch the rescue pilot yet. Fix data trust and load enough recent operational history first.";
}

function renewalDecisionForInput(input: { estimatedSavings: number; verifiedSavings: number; completedActionCount: number }, pilotFee: number) {
  if (input.verifiedSavings > 0 && input.estimatedSavings >= 3 * pilotFee) return "Renew into a monthly recovery plan and expand to the next leakage cohort.";
  if (input.estimatedSavings >= pilotFee && input.completedActionCount > 0) return "Continue one more cycle and convert estimated proof into verified proof.";
  if (input.estimatedSavings > 0) return "Narrow the cohort and rerun; the signal exists but is not strong enough.";
  return "Stop or restart after fixing data, owner, and daily execution discipline.";
}

function privacyLabelForAuditMode(mode: AuditSession["mode"]) {
  if (mode === "csv") return "Anonymized CSV: no names, phones, emails, customer IDs, or full addresses should be present.";
  if (mode === "pilot") return "Full pilot prep: customer-level data is allowed only inside a separately agreed delivery rescue workflow.";
  return "Summary leakage check: no order-level or customer-level data is included.";
}

function handoffHeadline(status: AuditToPilotHandoffStatus, brandName: string) {
  if (status === "ready_for_pilot") return `${brandName} can move into a narrow COD/RTO/NDR rescue pilot.`;
  if (status === "needs_csv_first") return `${brandName} needs anonymized CSV proof before a rescue pilot.`;
  return `${brandName} should stay in leakage check or summary review for now.`;
}

function nextMissionForAudit(status: AuditToPilotHandoffStatus, firstRecommendation: string) {
  if (status === "ready_for_pilot") return `Create a rescue pilot plan around the first mission: ${firstRecommendation}`;
  if (status === "needs_csv_first") return "Export or upload an anonymized order/shipment/NDR CSV, then confirm the top leak before pitching the rescue pilot.";
  return "Avoid a hard rescue pilot pitch; clarify volume, COD share, RTO rate, and leakage size first.";
}

function proofRequestsForAudit(status: AuditToPilotHandoffStatus, mode: AuditSession["mode"]) {
  if (status === "ready_for_pilot") {
    return [
      "Assign one ops owner for daily COD/RTO/NDR work.",
      "Keep estimated and verified savings separate in the pilot ledger.",
      "Log each action with an order outcome, not a broad ROI claim."
    ];
  }
  if (mode === "summary") {
    return [
      "Confirm the assumptions with an anonymized CSV profit audit before a rescue pilot.",
      "Keep customer names, phones, emails, and full addresses out of the public audit.",
      "Use the first action as a hypothesis, not a verified saving."
    ];
  }
  return [
    "Increase the sample size or fix missing fields before rescue pilot planning.",
    "Confirm RTO loss assumptions with the seller.",
    "Do not pitch a broad rescue pilot until the leakage and daily owner are clear."
  ];
}

function round(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(1)).toLocaleString("en-IN") : "0";
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "seller";
}

function finalReviewDecision(input: { estimatedSavings: number; verifiedSavings: number; totalActionsTaken: number; pilotFee: number }): PilotFinalReviewDecision {
  if (input.verifiedSavings > 0 && input.estimatedSavings >= input.pilotFee && input.totalActionsTaken > 0) return "renew";
  if (input.estimatedSavings > 0 && input.totalActionsTaken > 0) return "narrow";
  return "stop";
}

function finalReviewFailures(input: {
  plan: PilotPlan;
  actionTotals: {
    ordersChecked: number;
    codConfirmationsQueued: number;
    addressesCorrected: number;
    ndrCasesFound: number;
    ndrsContacted: number;
    ndrsRescued: number;
    ordersCancelledBeforeShipping: number;
  };
  estimatedSavings: number;
  verifiedSavings: number;
}) {
  const failures: string[] = [];
  if (input.actionTotals.ordersChecked === 0) failures.push("No daily order-checking habit was logged.");
  if (input.actionTotals.ndrCasesFound > 0 && input.actionTotals.ndrsContacted === 0) failures.push("NDR cases existed, but no NDR contact work was logged.");
  if (input.actionTotals.ndrsContacted > 0 && input.actionTotals.ndrsRescued === 0) failures.push("NDR contact happened, but no delivered-after-NDR proof was logged.");
  if (input.actionTotals.codConfirmationsQueued + input.actionTotals.addressesCorrected + input.actionTotals.ordersCancelledBeforeShipping === 0) {
    failures.push("No COD confirmation, address correction, or pre-ship cancellation proof was logged.");
  }
  if (input.estimatedSavings <= 0) failures.push("No estimated savings event exists.");
  if (input.verifiedSavings <= 0) failures.push("No savings are verified yet.");
  if (input.plan.checklist.some((item) => !item.complete)) failures.push("Baseline checklist is incomplete.");
  return failures.length ? failures : ["No major failure logged; remaining risk is converting estimates into verified proof."];
}

function finalReviewNextPlan(decision: PilotFinalReviewDecision) {
  if (decision === "renew") {
    return [
      "Renew into a monthly recovery plan for the next COD/RTO/NDR cohort.",
      "Keep the same savings verification rule before claiming ROI.",
      "Expand only to the next highest-leakage cohort."
    ];
  }
  if (decision === "narrow") {
    return [
      "Rerun one narrow cohort for 7 to 14 days.",
      "Convert at least one estimated saving into verified proof.",
      "Do not pitch a broad monthly recovery plan until verification exists."
    ];
  }
  return [
    "Stop the rescue pilot pitch.",
    "Fix data trust, owner discipline, and daily action logging.",
    "Restart only when the seller can work the COD/RTO/NDR queue daily."
  ];
}

function renderPilotFinalReviewMarkdown(template: Omit<PilotFinalReviewTemplate, "markdown">) {
  return [
    `# ${template.title}`,
    "",
    `Generated: ${template.generatedAt}`,
    `Decision: ${template.decision.toUpperCase()}`,
    "",
    "## Baseline",
    ...template.baseline.map((item) => `- ${item.label}: ${item.value}`),
    "",
    "## Actions Worked",
    ...template.actions.map((item) => `- ${item.label}: ${item.value}`),
    "",
    "## Savings Proof",
    `- Estimated savings: ${money(template.savings.estimated)}`,
    `- Verified savings: ${money(template.savings.verified)}`,
    `- Still unverified: ${money(template.savings.unverified)}`,
    `- Note: ${template.savings.note}`,
    "",
    "## Failures And Limits",
    ...template.failures.map((item) => `- ${item}`),
    "",
    "## Next Plan",
    ...template.nextPlan.map((item) => `- ${item}`),
    "",
    "## Trust Notes",
    ...template.trustNotes.map((item) => `- ${item}`)
  ].join("\n");
}

function money(amount: number) {
  return `INR ${Math.round(amount).toLocaleString("en-IN")}`;
}
