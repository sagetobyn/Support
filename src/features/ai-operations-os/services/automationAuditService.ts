import type {
  AutomationActivityKind,
  AutomationActivityTimelineItem,
  AutomationAuditLog,
  AutomationQueueItem
} from "../domain/types";

function getStateEvent(action: AutomationQueueItem): AutomationActivityKind {
  if (action.policyStatus === "blocked") return "blocked";
  if (action.state === "executed") return "mock_executed";
  if (action.state === "approved") return "approved";
  if (action.state === "awaiting_approval") return "approval_requested";
  if (action.state === "drafted") return "drafted";
  return "created";
}

function getTone(kind: AutomationActivityKind): AutomationActivityTimelineItem["tone"] {
  if (kind === "mock_executed" || kind === "approved") return "success";
  if (kind === "blocked" || kind === "failed") return "danger";
  if (kind === "approval_requested" || kind === "drafted") return "warning";
  return "neutral";
}

export function getAuditLogIdsForAction(action: Pick<AutomationQueueItem, "id" | "state" | "policyStatus">) {
  const ids = [`audit-${action.id}-created`, `audit-${action.id}-policy`];
  if (action.policyStatus === "blocked") ids.push(`audit-${action.id}-blocked`);
  if (action.state === "drafted") ids.push(`audit-${action.id}-drafted`);
  if (action.state === "awaiting_approval") ids.push(`audit-${action.id}-approval-requested`);
  if (action.state === "approved") ids.push(`audit-${action.id}-approved`);
  if (action.state === "executed") ids.push(`audit-${action.id}-mock-executed`);
  return ids;
}

export function buildAutomationAuditLogs(actions: AutomationQueueItem[]): AutomationAuditLog[] {
  return actions.flatMap((action) => {
    const logs: AutomationAuditLog[] = [
      {
        id: `audit-${action.id}-created`,
        actionId: action.id,
        eventType: "created",
        actor: "system",
        message: `Created ${action.title} from ${action.sourceFindingId}.`,
        toState: "recommended",
        occurredAt: action.createdAt
      },
      {
        id: `audit-${action.id}-policy`,
        actionId: action.id,
        eventType: "policy_checked",
        actor: "system",
        message: `Policy status is ${action.policyStatus.replaceAll("_", " ")} with ${action.policyChecks.length} checks.`,
        occurredAt: action.updatedAt
      }
    ];

    if (action.policyStatus === "blocked") {
      logs.push({
        id: `audit-${action.id}-blocked`,
        actionId: action.id,
        eventType: "blocked",
        actor: "system",
        message: "Execution blocked by seller policy or external-write guardrail.",
        occurredAt: action.updatedAt
      });
    }

    if (action.state === "drafted") {
      logs.push({
        id: `audit-${action.id}-drafted`,
        actionId: action.id,
        eventType: "drafted",
        actor: "system",
        message: "Draft packet prepared for human review.",
        fromState: "recommended",
        toState: "drafted",
        occurredAt: action.updatedAt
      });
    }

    if (action.state === "awaiting_approval") {
      logs.push({
        id: `audit-${action.id}-approval-requested`,
        actionId: action.id,
        eventType: "approval_requested",
        actor: "system",
        message: "Seller approval requested before any execution can occur.",
        fromState: "drafted",
        toState: "awaiting_approval",
        occurredAt: action.updatedAt
      });
    }

    if (action.state === "approved") {
      logs.push({
        id: `audit-${action.id}-approved`,
        actionId: action.id,
        eventType: "approved",
        actor: "seller",
        message: "Seller approval recorded in the mock approval queue.",
        fromState: "awaiting_approval",
        toState: "approved",
        occurredAt: action.updatedAt
      });
    }

    if (action.state === "executed") {
      logs.push({
        id: `audit-${action.id}-mock-executed`,
        actionId: action.id,
        eventType: "mock_executed",
        actor: "system",
        message: action.mockExecutionResult.summary,
        fromState: "executing",
        toState: "executed",
        occurredAt: action.mockExecutionResult.completedAt || action.updatedAt
      });
    }

    return logs;
  });
}

export function buildRecentAutomationActivity(actions: AutomationQueueItem[], logs = buildAutomationAuditLogs(actions)): AutomationActivityTimelineItem[] {
  return logs
    .filter((log) => log.eventType !== "policy_checked")
    .map((log) => {
      const action = actions.find((candidate) => candidate.id === log.actionId);
      const kind = log.eventType || getStateEvent(action!);

      return {
        id: `activity-${log.id}`,
        actionId: log.actionId,
        kind,
        title: action?.title || "Automation activity",
        detail: log.message,
        occurredAt: log.occurredAt,
        tone: getTone(kind)
      };
    })
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}
