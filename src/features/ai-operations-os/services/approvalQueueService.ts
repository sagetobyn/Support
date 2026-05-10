import type { ApprovalQueueItem, AutomationQueueItem } from "../domain/types";

function getApprovalReason(action: AutomationQueueItem) {
  if (action.policyStatus === "blocked") return "Policy blocked execution until settings or integration readiness changes.";
  if (action.executionTarget.externalWriteRequired) return "External write target requires seller approval and no provider call is enabled.";
  if (action.riskLevel === "high" || action.riskLevel === "critical") return `${action.riskLevel} risk action requires seller review.`;
  return "Seller policy requires review before this action progresses.";
}

function getApproverRole(action: AutomationQueueItem) {
  if (action.actionType.includes("claim") || action.actionType.includes("settlement")) return "Finance owner";
  if (action.actionType.includes("ndr") || action.actionType.includes("support")) return "CX owner";
  if (action.actionType.includes("cod")) return "Operations owner";
  if (action.actionType.includes("listing")) return "Catalog owner";
  if (action.actionType.includes("ad")) return "Growth owner";
  return "Workspace admin";
}

export function getApprovalQueue(actions: AutomationQueueItem[]): ApprovalQueueItem[] {
  return actions
    .filter((action) => action.approvalRequired || action.policyStatus === "approval_ready" || action.policyStatus === "blocked")
    .map((action) => {
      const status: ApprovalQueueItem["status"] =
        action.policyStatus === "blocked" ? "blocked" : action.state === "approved" || action.state === "executed" ? "approved" : "pending";

      return {
        id: `approval-${action.id}`,
        actionId: action.id,
        title: action.title,
        requestedBy: action.assignee === "System" ? "System" : action.assignee,
        approverRole: getApproverRole(action),
        reason: getApprovalReason(action),
        impactAmount: action.impactAmount,
        riskLevel: action.riskLevel,
        confidence: action.confidence,
        status,
        createdAt: action.updatedAt,
        policyChecks: action.policyChecks
      };
    })
    .sort((a, b) => b.impactAmount - a.impactAmount);
}
