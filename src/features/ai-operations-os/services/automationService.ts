import { aiOperationsWorkspace } from "../data/mockOperatingSystem";
import type { AutomationAction, ExecutionState } from "../domain/types";

export function getAutomationOverview() {
  const actions = aiOperationsWorkspace.automationActions;
  const potentialImpact = actions.reduce((sum, action) => sum + action.impactAmount, 0);
  const pendingApproval = actions.filter((action) => action.state === "awaiting_approval").length;
  const executed = actions.filter((action) => action.state === "executed").length;
  const avgConfidence = actions.reduce((sum, action) => sum + action.confidence, 0) / actions.length;

  return {
    actions,
    rules: aiOperationsWorkspace.automationRules,
    potentialImpact,
    pendingApproval,
    executed,
    avgConfidence
  };
}

export function getActionQueueByState(state: ExecutionState) {
  return aiOperationsWorkspace.automationActions.filter((action) => action.state === state);
}

export function canAutoExecute(action: AutomationAction) {
  return !action.approvalRequired && action.automationLevel >= 4 && action.riskLevel !== "high" && action.riskLevel !== "critical";
}

