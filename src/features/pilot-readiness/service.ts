import type { ActionItem, AuditLog, ImportRecord, Message, NdrCase, Order, SavingsEvent } from "@/types/domain";
import type { DataTrustStatus } from "@/features/imports";

export type PilotReadinessStatus = "ready" | "almost_ready" | "not_ready";

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

export function buildPilotReadiness(input: PilotReadinessInput): PilotReadinessSummary {
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

function headlineForStatus(status: PilotReadinessStatus) {
  if (status === "ready") return "Pilot-ready for a CEO walkthrough";
  if (status === "almost_ready") return "Pilot-ready with proof gaps";
  return "Not ready for a serious seller pilot yet";
}

function detailForStatus(status: PilotReadinessStatus, nextStep?: PilotReadinessCheck) {
  if (status === "ready") {
    return "The workspace has data, trust labels, an operational action, savings proof, verification, and handoff artifacts.";
  }
  if (!nextStep) return "Review the checklist before inviting a seller into the pilot.";
  return `Next: ${nextStep.nextAction}`;
}
