import { calculatePilotProgress, type PilotDayMetrics, type PilotPlan } from "@/lib/pilot";

export type PilotExecutionDayStatus = "not_started" | "today" | "work_logged" | "proof_captured" | "missed";
export type PilotCheckpointStatus = "upcoming" | "needs_attention" | "passed";

export type PilotExecutionDay = {
  day: number;
  status: PilotExecutionDayStatus;
  phase: string;
  label: string;
  workCount: number;
  proofCount: number;
  estimatedSavings: number;
  note: string;
  instruction: string;
};

export type PilotExecutionCheckpoint = {
  day: number;
  label: string;
  status: PilotCheckpointStatus;
  criteria: string;
  decision: string;
};

export type PilotExecutionTracker = {
  currentDay: number;
  completionPercent: number;
  proofDays: number;
  missedDays: number;
  loggedDays: number;
  today?: PilotExecutionDay;
  currentInstruction: string;
  warnings: string[];
  days: PilotExecutionDay[];
  checkpoints: PilotExecutionCheckpoint[];
};

export function buildPilotExecutionTracker(plan: PilotPlan, currentDay: number): PilotExecutionTracker {
  const boundedDay = Math.min(14, Math.max(1, currentDay));
  const progress = calculatePilotProgress(plan);
  const days = plan.days.map((day) => buildExecutionDay(day, boundedDay));
  const proofDays = days.filter((day) => day.proofCount > 0).length;
  const missedDays = days.filter((day) => day.status === "missed").length;
  const loggedDays = days.filter((day) => day.workCount > 0).length;
  const checkpoints = buildCheckpoints(plan, boundedDay);
  const today = days.find((day) => day.day === boundedDay);
  const warnings = buildWarnings({ plan, days, boundedDay, proofDays, missedDays, estimatedSavings: progress.estimatedSavings });

  return {
    currentDay: boundedDay,
    completionPercent: Math.round((loggedDays / Math.max(1, plan.days.length)) * 100),
    proofDays,
    missedDays,
    loggedDays,
    today,
    currentInstruction: today?.instruction || "Keep the pilot moving through the daily operating loop.",
    warnings,
    days,
    checkpoints
  };
}

function buildExecutionDay(day: PilotDayMetrics, currentDay: number): PilotExecutionDay {
  const workCount =
    day.ordersChecked +
    day.riskyCodFound +
    day.addressesCorrected +
    day.codConfirmationsQueued +
    day.prepaidOpportunitiesFound +
    day.ndrCasesFound +
    day.ndrsContacted +
    day.ndrsRescued +
    day.ordersCancelledBeforeShipping;
  const proofCount = day.ndrsRescued + day.ordersCancelledBeforeShipping + (day.estimatedSavings > 0 ? 1 : 0);
  const hasNote = day.notes.trim().length > 0;
  const status: PilotExecutionDayStatus =
    proofCount > 0
      ? "proof_captured"
      : workCount > 0 || hasNote
        ? "work_logged"
        : day.day < currentDay
          ? "missed"
          : day.day === currentDay
            ? "today"
            : "not_started";

  return {
    day: day.day,
    status,
    phase: phaseForDay(day.day),
    label: labelForDay(day.day),
    workCount,
    proofCount,
    estimatedSavings: day.estimatedSavings,
    note: day.notes,
    instruction: instructionForDay(day.day, status)
  };
}

function buildCheckpoints(plan: PilotPlan, currentDay: number): PilotExecutionCheckpoint[] {
  const checklistDone = plan.checklist.filter((item) => item.complete).length;
  const firstThreeDays = plan.days.filter((day) => day.day <= 3);
  const firstSevenDays = plan.days.filter((day) => day.day <= 7);
  const firstTenDays = plan.days.filter((day) => day.day <= 10);
  const allDays = plan.days;
  const day3Passed = checklistDone >= 4 && firstThreeDays.some((day) => day.ordersChecked > 0);
  const day7Passed = firstSevenDays.some((day) => day.codConfirmationsQueued + day.addressesCorrected + day.ndrsContacted > 0);
  const day10Passed = firstTenDays.reduce((sum, day) => sum + day.estimatedSavings, 0) > 0;
  const day14Passed = allDays.reduce((sum, day) => sum + day.estimatedSavings, 0) >= plan.pilotFee;

  return [
    checkpoint(3, "Setup review", day3Passed, currentDay, "Baseline, owner, and first work day are visible.", "Continue only if the team can log daily work."),
    checkpoint(7, "Mid-pilot operating review", day7Passed, currentDay, "At least one COD/address/NDR action has been executed.", "If no action is logged, narrow the cohort immediately."),
    checkpoint(10, "Proof review", day10Passed, currentDay, "Savings proof has started before the final stretch.", "If savings are still zero, shift all effort to NDR rescue proof."),
    checkpoint(14, "CEO renewal review", day14Passed, currentDay, "Estimated savings covers the pilot fee.", "Renew, narrow, or stop based on proof, not enthusiasm.")
  ];
}

function checkpoint(day: number, label: string, passed: boolean, currentDay: number, criteria: string, decision: string): PilotExecutionCheckpoint {
  return {
    day,
    label,
    status: passed ? "passed" : currentDay >= day ? "needs_attention" : "upcoming",
    criteria,
    decision
  };
}

function buildWarnings(input: {
  plan: PilotPlan;
  days: PilotExecutionDay[];
  boundedDay: number;
  proofDays: number;
  missedDays: number;
  estimatedSavings: number;
}) {
  const warnings: string[] = [];
  if (input.missedDays > 0) warnings.push(`${input.missedDays} past pilot day${input.missedDays === 1 ? " has" : "s have"} no logged work.`);
  if (input.boundedDay >= 5 && input.proofDays === 0) warnings.push("No proof day yet. Create at least one savings event before the mid-pilot review.");
  if (input.boundedDay >= 9 && input.plan.days.reduce((sum, day) => sum + day.ndrCasesFound, 0) > 0 && input.plan.days.reduce((sum, day) => sum + day.ndrsRescued, 0) === 0) {
    warnings.push("NDR cases exist but no delivered-after-NDR proof has been logged.");
  }
  if (input.boundedDay >= 14 && input.estimatedSavings < input.plan.pilotFee) warnings.push("Final review is not renewal-ready because estimated savings is below the pilot fee.");
  return warnings.length ? warnings : ["Pilot execution is on track. Keep logging work and proof every day."];
}

function phaseForDay(day: number) {
  if (day <= 2) return "Baseline";
  if (day <= 5) return "Daily habit";
  if (day <= 9) return "NDR sprint";
  if (day <= 12) return "Policy test";
  return "CEO review";
}

function labelForDay(day: number) {
  if (day === 3) return "Setup checkpoint";
  if (day === 7) return "Mid-pilot checkpoint";
  if (day === 10) return "Proof checkpoint";
  if (day === 14) return "Renewal checkpoint";
  return `Day ${day}`;
}

function instructionForDay(day: number, status: PilotExecutionDayStatus) {
  if (status === "proof_captured") return "Proof exists. Keep the source evidence clean for the CEO review.";
  if (status === "work_logged") return "Work is logged. Add outcome proof or savings before calling this day complete.";
  if (status === "missed") return "Backfill the day or mark why no work happened before the next review.";
  if (day <= 2) return "Confirm baseline, owner, data fields, and cost assumptions.";
  if (day <= 5) return "Work the highest-risk COD and address queue, then close at least one action.";
  if (day <= 9) return "Prioritize fresh NDR cases and capture delivered-after-NDR or clean RTO outcomes.";
  if (day <= 12) return "Run one narrow pincode, courier, SKU, or COD policy experiment.";
  return "Prepare the CEO review: savings, proof quality, decision, and next operating plan.";
}
