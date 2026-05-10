import { aiOperationsWorkspace } from "../data/mockOperatingSystem";

export function getCommandCenterOverview() {
  const metrics = aiOperationsWorkspace.metrics;
  const alerts = aiOperationsWorkspace.findings.filter((finding) => finding.riskLevel === "high" || finding.riskLevel === "critical");
  const pendingActions = aiOperationsWorkspace.automationActions.filter((action) => action.state !== "executed");

  return {
    metrics,
    alerts,
    reports: aiOperationsWorkspace.reports,
    pendingActions,
    learningSignals: aiOperationsWorkspace.learningSignals
  };
}

export function getReportsHub() {
  return aiOperationsWorkspace.reports;
}

