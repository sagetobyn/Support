import {
  getAutomationCapabilityMatrix,
  type AutomationCapabilityStatus,
  type AutomationWorkstream
} from "@/features/automation-capabilities";
import { getAutomationInbox } from "@/features/automation-runtime";

export interface AutomationCoverageWorkstreamView {
  id: string;
  title: string;
  description: string;
  sellerPain: string;
  coveragePercent: number;
  statusCounts: Record<AutomationCapabilityStatus, number>;
  strongestStatus: AutomationCapabilityStatus;
  nextManualTask: string;
  nextImplementation: string;
  capabilitiesCount: number;
}

function statusCountsFor(workstream: AutomationWorkstream) {
  return workstream.capabilities.reduce((counts, capability) => {
    counts[capability.status] += 1;
    return counts;
  }, {
    missing: 0,
    ui_only: 0,
    mock: 0,
    local_automation: 0,
    connected_read: 0,
    ai_decision: 0,
    approval_execution: 0,
    autonomous_execution: 0
  } as Record<AutomationCapabilityStatus, number>);
}

function statusWeight(status: AutomationCapabilityStatus) {
  const weights: Record<AutomationCapabilityStatus, number> = {
    missing: 0,
    ui_only: 8,
    mock: 18,
    local_automation: 42,
    connected_read: 52,
    ai_decision: 64,
    approval_execution: 82,
    autonomous_execution: 100
  };
  return weights[status];
}

function workstreamCoverage(workstream: AutomationWorkstream) {
  const score = workstream.capabilities.reduce((sum, capability) => sum + statusWeight(capability.status), 0);
  return Math.round(score / workstream.capabilities.length);
}

function strongestStatus(workstream: AutomationWorkstream) {
  return workstream.capabilities.reduce<AutomationCapabilityStatus>((strongest, capability) => {
    return statusWeight(capability.status) > statusWeight(strongest) ? capability.status : strongest;
  }, "missing");
}

export function getAutomationCoverageView() {
  const matrix = getAutomationCapabilityMatrix();
  const inbox = getAutomationInbox();
  const workstreams: AutomationCoverageWorkstreamView[] = matrix.workstreams.map((workstream) => {
    const firstGap =
      workstream.capabilities.find((capability) => capability.status === "missing" || capability.status === "ui_only") ||
      workstream.capabilities.find((capability) => capability.status === "mock") ||
      workstream.capabilities[0];

    return {
      id: workstream.id,
      title: workstream.title,
      description: workstream.description,
      sellerPain: workstream.sellerPain,
      coveragePercent: workstreamCoverage(workstream),
      statusCounts: statusCountsFor(workstream),
      strongestStatus: strongestStatus(workstream),
      nextManualTask: firstGap.manualTask,
      nextImplementation: firstGap.nextImplementation,
      capabilitiesCount: workstream.capabilities.length
    };
  });

  return {
    matrix,
    inbox,
    workstreams,
    executionChain: matrix.operatingLoop.map((step, index) => ({
      step,
      label: ["Source data", "Leakage finding", "Policy-ranked decision", "Seller-visible action", "Proof and improvement"][index],
      active: true
    }))
  };
}
