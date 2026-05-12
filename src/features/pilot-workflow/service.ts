import type { PilotDayMetrics, PilotPlan } from "@/lib/pilot";

export type PilotWorkflowDayStatus = "not_started" | "today" | "work_logged" | "proof_captured" | "missed";
export type PilotWorkflowGateStatus = "upcoming" | "continue" | "narrow" | "stop";

export type PilotWorkflowReviewGate = {
  day: 3 | 7 | 10 | 14;
  label: string;
  status: PilotWorkflowGateStatus;
  decision: string;
  stopCondition: string;
};

export type PilotWorkflowCalendarDay = {
  day: number;
  phase: string;
  focus: string;
  actions: string[];
  output: string;
  proof: string;
  savingsLedgerTie: string;
  stopCondition: string;
  status: PilotWorkflowDayStatus;
  estimatedSavings: number;
  reviewGate?: PilotWorkflowReviewGate;
};

export type PilotWorkflowCalendar = {
  currentDay: number;
  days: PilotWorkflowCalendarDay[];
  reviewGates: PilotWorkflowReviewGate[];
  today: PilotWorkflowCalendarDay;
};

export type PilotDailyLogRow = {
  day: number;
  actionCount: number;
  actionSummary: string;
  proofNote: string;
  blocker: string;
  estimatedSavings: number;
  hasSavingsProof: boolean;
  reviewLabel: string;
};

type PilotWorkflowTemplate = Omit<PilotWorkflowCalendarDay, "status" | "estimatedSavings" | "reviewGate"> & {
  reviewGate?: Omit<PilotWorkflowReviewGate, "status" | "decision">;
};

const pilotWorkflowTemplates: PilotWorkflowTemplate[] = [
  {
    day: 1,
    phase: "Baseline",
    focus: "Lock the seller baseline",
    actions: ["Confirm 30-day order, shipment, and NDR exports", "Confirm RTO cost assumptions", "Name one seller-side ops owner"],
    output: "Trusted starting baseline and owner.",
    proof: "Checklist items completed with data caveats visible.",
    savingsLedgerTie: "No savings entry yet; this is the baseline used to judge later proof.",
    stopCondition: "Stop if the seller cannot provide summary numbers or one accountable owner."
  },
  {
    day: 2,
    phase: "Baseline",
    focus: "Build the first rescue cohort",
    actions: ["Separate risky COD, weak address, and fresh NDR cases", "Pick one narrow cohort", "Confirm manual response capture path"],
    output: "One COD/RTO/NDR cohort ready for daily work.",
    proof: "Cohort count and reasons are visible before outreach.",
    savingsLedgerTie: "Ledger stays empty until an outcome is recorded.",
    stopCondition: "Stop if the cohort is too small or data fields are too weak to explain actions."
  },
  {
    day: 3,
    phase: "Setup review",
    focus: "Review setup before pitching momentum",
    actions: ["Check baseline confidence", "Check owner attendance", "Check first work logged"],
    output: "Continue, narrow, or stop setup decision.",
    proof: "Day 3 gate shows data trust and first work signal.",
    savingsLedgerTie: "Only log savings if a real cancellation, rescue, or address fix happened.",
    stopCondition: "Stop if baseline, owner, or first work day is missing.",
    reviewGate: {
      day: 3,
      label: "Day 3 setup gate",
      stopCondition: "Stop if baseline, owner, or first work day is missing."
    }
  },
  {
    day: 4,
    phase: "COD control",
    focus: "Work high-risk COD before dispatch",
    actions: ["Confirm risky COD orders", "Hold obvious low-intent orders", "Queue address corrections"],
    output: "Risky COD queue worked with outcomes.",
    proof: "Confirmed, cancelled, held, or corrected actions are counted.",
    savingsLedgerTie: "Log cancelled-before-shipping savings only when the seller records the outcome.",
    stopCondition: "Narrow if the team checks orders but records no outcomes."
  },
  {
    day: 5,
    phase: "COD control",
    focus: "Push only margin-safe prepaid offers",
    actions: ["Review high-value COD risk", "Offer prepaid only where margin allows", "Record accepted or rejected offers"],
    output: "Prepaid experiment with clean accept/reject notes.",
    proof: "Prepaid opportunities and accepted conversions are separated.",
    savingsLedgerTie: "Log prepaid conversion as estimated risk reduction, not guaranteed savings.",
    stopCondition: "Stop prepaid offers if the incentive hurts margin or irritates genuine customers."
  },
  {
    day: 6,
    phase: "NDR rescue",
    focus: "Attack fresh NDR within the same day",
    actions: ["Contact fresh NDR cases", "Request reattempt or corrected address", "Escalate high-value failures"],
    output: "Fresh NDR queue contacted.",
    proof: "NDR contacted count and response notes are visible.",
    savingsLedgerTie: "Ledger entry waits for delivered-after-NDR, cancellation, or clean RTO outcome.",
    stopCondition: "Narrow if NDR contact is happening too late to affect delivery."
  },
  {
    day: 7,
    phase: "Mid-pilot review",
    focus: "Decide if the operating habit exists",
    actions: ["Review action completion", "Review missed days", "Choose one cohort for week two"],
    output: "Week-two focus decision.",
    proof: "At least one COD/address/NDR action has been executed.",
    savingsLedgerTie: "Separate actions from savings; do not claim saved money from activity alone.",
    stopCondition: "Stop the broad pilot if no action was executed by day 7.",
    reviewGate: {
      day: 7,
      label: "Day 7 operating gate",
      stopCondition: "Stop the broad pilot if no action was executed by day 7."
    }
  },
  {
    day: 8,
    phase: "NDR rescue",
    focus: "Double down on the highest-loss NDR reason",
    actions: ["Pick top NDR reason", "Run one message/call fallback", "Record delivered, cancelled, or RTO"],
    output: "NDR reason sprint evidence.",
    proof: "Delivered-after-NDR or clean failed attempt is recorded.",
    savingsLedgerTie: "Log rescued delivery at estimated RTO-loss avoided, then verify later if possible.",
    stopCondition: "Narrow if NDR reasons are too mixed for one playbook."
  },
  {
    day: 9,
    phase: "Courier/pincode check",
    focus: "Find one courier or pincode leakage cluster",
    actions: ["Review courier-pincode concentration", "Pick one policy test", "Document the before/after rule"],
    output: "One lane or pincode policy test.",
    proof: "The affected orders and decision rule are named.",
    savingsLedgerTie: "Do not book savings until the cohort outcome changes.",
    stopCondition: "Stop the policy test if the sample is too small or not comparable."
  },
  {
    day: 10,
    phase: "Proof review",
    focus: "Check whether savings proof has started",
    actions: ["Review savings ledger", "Check estimated versus verified proof", "Choose final sprint cohort"],
    output: "Proof quality decision.",
    proof: "At least one savings-linked outcome exists.",
    savingsLedgerTie: "Every claimed save must point to an order outcome and formula.",
    stopCondition: "Narrow the pilot if savings proof is still zero by day 10.",
    reviewGate: {
      day: 10,
      label: "Day 10 proof gate",
      stopCondition: "Narrow the pilot if savings proof is still zero by day 10."
    }
  },
  {
    day: 11,
    phase: "Repeatable loop",
    focus: "Repeat the best working action",
    actions: ["Repeat the strongest COD/NDR play", "Remove weak actions", "Capture operator friction"],
    output: "Repeatable daily rescue loop.",
    proof: "Second proof attempt or clear reason why it failed.",
    savingsLedgerTie: "Ledger entries should use the same formula as earlier proof.",
    stopCondition: "Stop scaling actions that cannot be repeated by the seller team."
  },
  {
    day: 12,
    phase: "Policy decision",
    focus: "Write the narrow operating rule",
    actions: ["Draft COD hold rule", "Draft NDR escalation rule", "Draft courier/pincode watch rule"],
    output: "One rule the seller can keep using.",
    proof: "Rule is tied to the pilot cohort, not a generic dashboard insight.",
    savingsLedgerTie: "Ledger supports the rule; it does not guarantee future savings.",
    stopCondition: "Stop if the rule cannot be explained from the seller data."
  },
  {
    day: 13,
    phase: "CEO review prep",
    focus: "Clean proof before the founder sees it",
    actions: ["Separate estimated from verified savings", "List weak-data caveats", "Write continue/narrow/stop recommendation"],
    output: "Founder-ready proof packet.",
    proof: "Savings, caveats, and next action are readable without a dashboard tour.",
    savingsLedgerTie: "Ledger rows must stay labelled estimated unless verified by delivery or finance proof.",
    stopCondition: "Stop renewal pitch if proof is only activity counts."
  },
  {
    day: 14,
    phase: "CEO review",
    focus: "Make the renewal decision from proof",
    actions: ["Compare savings to pilot fee", "Review proof quality", "Choose monthly plan, narrow rerun, or stop"],
    output: "Continue, narrow, or stop decision.",
    proof: "Final review includes money, actions, caveats, and owner.",
    savingsLedgerTie: "Ledger is the trust artifact; keep estimates and verified saves separate.",
    stopCondition: "Stop or rerun narrowly if savings do not cover the pilot fee or proof is weak.",
    reviewGate: {
      day: 14,
      label: "Day 14 CEO gate",
      stopCondition: "Stop or rerun narrowly if savings do not cover the pilot fee or proof is weak."
    }
  }
];

export function buildPilotWorkflowCalendar(plan: PilotPlan, currentDay: number): PilotWorkflowCalendar {
  const boundedDay = Math.min(14, Math.max(1, currentDay));
  const reviewGates = buildReviewGates(plan, boundedDay);
  const days = pilotWorkflowTemplates.map((template) => {
    const metrics = plan.days[template.day - 1];
    const gate = reviewGates.find((item) => item.day === template.day);

    return {
      ...template,
      status: buildDayStatus(metrics, template.day, boundedDay),
      estimatedSavings: metrics?.estimatedSavings || 0,
      reviewGate: gate
    };
  });

  return {
    currentDay: boundedDay,
    days,
    reviewGates,
    today: days[boundedDay - 1]
  };
}

export function buildPilotDailyLogRows(plan: PilotPlan): PilotDailyLogRow[] {
  return plan.days.map((day) => {
    const actionCount = dailyActionCount(day);
    const proofNote = day.proofNote?.trim() || "";
    const blocker = day.blocker?.trim() || "";
    const hasSavingsProof = day.estimatedSavings > 0 && actionCount > 0 && proofNote.length > 0;

    return {
      day: day.day,
      actionCount,
      actionSummary: [
        `${day.codConfirmationsQueued} COD`,
        `${day.addressesCorrected} address`,
        `${day.prepaidOpportunitiesFound} prepaid`,
        `${day.ndrsContacted}/${day.ndrsRescued} NDR`,
        `${day.ordersCancelledBeforeShipping} cancelled`
      ].join(" · "),
      proofNote,
      blocker,
      estimatedSavings: day.estimatedSavings,
      hasSavingsProof,
      reviewLabel: blocker
        ? "Blocked"
        : hasSavingsProof
          ? "Proof tied"
          : actionCount > 0
            ? "Action logged"
            : "No action"
    };
  });
}

function buildReviewGates(plan: PilotPlan, currentDay: number): PilotWorkflowReviewGate[] {
  const completedChecklist = plan.checklist.filter((item) => item.complete).length;
  const ownerAssigned = plan.checklist.some((item) => item.complete && /ops owner/i.test(item.label));
  const firstThree = plan.days.filter((day) => day.day <= 3);
  const firstSeven = plan.days.filter((day) => day.day <= 7);
  const firstTen = plan.days.filter((day) => day.day <= 10);
  const totalSavings = plan.days.reduce((sum, day) => sum + day.estimatedSavings, 0);
  const proofDays = plan.days.filter((day) => day.estimatedSavings > 0 || day.ndrsRescued > 0 || day.ordersCancelledBeforeShipping > 0).length;
  const actionCount = (days: PilotDayMetrics[]) =>
    days.reduce((sum, day) => sum + day.codConfirmationsQueued + day.addressesCorrected + day.ndrsContacted + day.ordersCancelledBeforeShipping, 0);

  return [
    buildGate({
      day: 3,
      label: "Day 3 setup gate",
      currentDay,
      passed: completedChecklist >= 4 && ownerAssigned && firstThree.some((day) => day.ordersChecked > 0),
      narrow: completedChecklist >= 4 && firstThree.some((day) => day.ordersChecked > 0),
      continueDecision: "Continue with the selected rescue cohort.",
      narrowDecision: "Narrow to one cohort until the ops owner is explicit.",
      stopDecision: "Stop: baseline, owner, or first work day is missing.",
      stopCondition: "Stop if baseline, owner, or first work day is missing."
    }),
    buildGate({
      day: 7,
      label: "Day 7 operating gate",
      currentDay,
      passed: actionCount(firstSeven) > 0,
      narrow: firstSeven.some((day) => day.ordersChecked > 0),
      continueDecision: "Continue into the week-two rescue sprint.",
      narrowDecision: "Narrow to the one action the seller team actually worked.",
      stopDecision: "Stop the broad pilot: no COD/address/NDR action was executed.",
      stopCondition: "Stop the broad pilot if no action was executed by day 7."
    }),
    buildGate({
      day: 10,
      label: "Day 10 proof gate",
      currentDay,
      passed: firstTen.reduce((sum, day) => sum + day.estimatedSavings, 0) > 0,
      narrow: actionCount(firstTen) > 0,
      continueDecision: "Continue the final sprint with proof cleanup.",
      narrowDecision: "Narrow to the best action; savings proof is still missing.",
      stopDecision: "Stop the full pilot pitch until the savings ledger has one proof event.",
      stopCondition: "Narrow the pilot if savings proof is still zero by day 10."
    }),
    buildGate({
      day: 14,
      label: "Day 14 CEO gate",
      currentDay,
      passed: totalSavings >= plan.pilotFee && proofDays >= 2,
      narrow: totalSavings > 0,
      continueDecision: "Continue only if the founder accepts the proof and next monthly rhythm.",
      narrowDecision: "Rerun one narrow cohort; proof exists but is not strong enough to scale.",
      stopDecision: "Stop: savings did not cover the pilot fee or proof quality is weak.",
      stopCondition: "Stop or rerun narrowly if savings do not cover the pilot fee or proof is weak."
    })
  ];
}

function buildGate(input: {
  day: 3 | 7 | 10 | 14;
  label: string;
  currentDay: number;
  passed: boolean;
  narrow: boolean;
  continueDecision: string;
  narrowDecision: string;
  stopDecision: string;
  stopCondition: string;
}): PilotWorkflowReviewGate {
  const status: PilotWorkflowGateStatus =
    input.currentDay < input.day ? "upcoming" : input.passed ? "continue" : input.narrow ? "narrow" : "stop";
  const decision =
    status === "continue"
      ? input.continueDecision
      : status === "narrow"
        ? input.narrowDecision
        : status === "stop"
          ? input.stopDecision
          : "Upcoming review gate.";

  return {
    day: input.day,
    label: input.label,
    status,
    decision,
    stopCondition: input.stopCondition
  };
}

function dailyActionCount(metrics: PilotDayMetrics) {
  return (
    metrics.codConfirmationsQueued +
    metrics.addressesCorrected +
    metrics.prepaidOpportunitiesFound +
    metrics.ndrsContacted +
    metrics.ndrsRescued +
    metrics.ordersCancelledBeforeShipping
  );
}

function buildDayStatus(metrics: PilotDayMetrics | undefined, day: number, currentDay: number): PilotWorkflowDayStatus {
  if (!metrics) return day === currentDay ? "today" : day < currentDay ? "missed" : "not_started";
  const workCount =
    metrics.ordersChecked +
    metrics.riskyCodFound +
    metrics.addressesCorrected +
    metrics.codConfirmationsQueued +
    metrics.prepaidOpportunitiesFound +
    metrics.ndrCasesFound +
    metrics.ndrsContacted +
    metrics.ndrsRescued +
    metrics.ordersCancelledBeforeShipping;
  const proofCount = metrics.estimatedSavings + metrics.ndrsRescued + metrics.ordersCancelledBeforeShipping;

  if (proofCount > 0) return "proof_captured";
  if (workCount > 0 || metrics.notes.trim().length > 0 || (metrics.proofNote || "").trim().length > 0 || (metrics.blocker || "").trim().length > 0) return "work_logged";
  if (day === currentDay) return "today";
  if (day < currentDay) return "missed";
  return "not_started";
}
