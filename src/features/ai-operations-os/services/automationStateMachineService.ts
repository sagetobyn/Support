import type {
  AutomationQueueItem,
  AutomationStateCount,
  AutomationStateTransition,
  ExecutionState,
  MockExecutionResult
} from "../domain/types";

export const executionStateOrder: ExecutionState[] = [
  "recommended",
  "drafted",
  "awaiting_approval",
  "approved",
  "scheduled",
  "executing",
  "executed",
  "failed",
  "reverted"
];

export const automationStateTransitions: AutomationStateTransition[] = [
  { from: "recommended", to: "drafted", label: "Create draft", requiresApproval: false },
  { from: "drafted", to: "awaiting_approval", label: "Request approval", requiresApproval: true },
  { from: "awaiting_approval", to: "approved", label: "Seller approves", requiresApproval: true },
  { from: "approved", to: "scheduled", label: "Schedule execution", requiresApproval: false },
  { from: "scheduled", to: "executing", label: "Start execution", requiresApproval: false },
  { from: "executing", to: "executed", label: "Complete execution", requiresApproval: false },
  { from: "executing", to: "failed", label: "Mark failed", requiresApproval: false },
  { from: "executed", to: "reverted", label: "Run rollback plan", requiresApproval: true },
  { from: "failed", to: "reverted", label: "Clean up failed run", requiresApproval: false }
];

export function getAllowedNextStates(state: ExecutionState): ExecutionState[] {
  return automationStateTransitions.filter((transition) => transition.from === state).map((transition) => transition.to);
}

export function getStateTrailForAction(action: Pick<AutomationQueueItem, "state">): AutomationStateTransition[] {
  const currentIndex = executionStateOrder.indexOf(action.state);

  if (currentIndex <= 0) return [];

  return automationStateTransitions.filter((transition) => {
    const fromIndex = executionStateOrder.indexOf(transition.from);
    const toIndex = executionStateOrder.indexOf(transition.to);
    return fromIndex >= 0 && toIndex >= 0 && fromIndex < currentIndex && toIndex <= currentIndex;
  });
}

export function createMockExecutionResult(action: Pick<AutomationQueueItem, "id" | "state" | "policyStatus" | "executionTarget" | "lineageRefs">): MockExecutionResult {
  if (action.state === "executed" && action.policyStatus === "auto_allowed") {
    return {
      id: `mock-result-${action.id}`,
      actionId: action.id,
      status: "simulated_success",
      summary: "Internal mock execution completed. No external provider call was made.",
      externalCallMade: false,
      evidenceRefs: action.lineageRefs,
      completedAt: "2026-05-10T09:34:00.000Z"
    };
  }

  if (action.policyStatus === "blocked") {
    return {
      id: `mock-result-${action.id}`,
      actionId: action.id,
      status: "simulated_blocked",
      summary: "Policy blocked execution. The action remains visible for review.",
      externalCallMade: false,
      evidenceRefs: action.lineageRefs
    };
  }

  return {
    id: `mock-result-${action.id}`,
    actionId: action.id,
    status: "not_started",
    summary: "Action is staged for recommendation, draft, or approval. No execution attempted.",
    externalCallMade: false,
    evidenceRefs: action.lineageRefs
  };
}

export function getExecutionStateCounts(actions: AutomationQueueItem[]): AutomationStateCount[] {
  return executionStateOrder.map((state) => ({
    state,
    label: state.replaceAll("_", " "),
    count: actions.filter((action) => action.state === state).length
  }));
}
