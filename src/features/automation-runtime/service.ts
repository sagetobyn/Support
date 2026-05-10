import {
  canClaimAutomated,
  getAutomationCapabilityMatrix,
  type AutomationCapability
} from "@/features/automation-capabilities";
import { getAutomationOverview, type AutomationQueueItem } from "@/features/ai-operations-os";
import type {
  AutomationExecutionEvent,
  AutomationInbox,
  AutomationRunRecord,
  AutomationTaskRecord,
  AutomationTaskStatus
} from "./types";

const workspaceId = "workspace-wembro-total-automation";

function isoNow() {
  return new Date("2026-05-10T10:30:00.000Z").toISOString();
}

function taskStatusFromQueue(action: AutomationQueueItem): AutomationTaskStatus {
  if (action.policyStatus === "blocked") return "blocked";
  return action.state;
}

function proofStateFromQueue(action: AutomationQueueItem): AutomationTaskRecord["proofState"] {
  if (action.mockExecutionResult.status === "simulated_success") return "local_proof";
  if (action.state === "executed") return "local_proof";
  if (action.state === "drafted" || action.state === "awaiting_approval") return "draft";
  if (action.policyStatus === "blocked") return "needs_review";
  return "none";
}

function moneyForCapability(capability: AutomationCapability, index: number) {
  if (capability.priority === "critical") return 180000 - index * 900;
  if (capability.priority === "high") return 98000 - index * 500;
  if (capability.priority === "medium") return 42000 - index * 250;
  return 18000 - index * 100;
}

function taskFromCapability(capability: AutomationCapability, index: number): AutomationTaskRecord {
  const status: AutomationTaskStatus =
    capability.status === "missing" || capability.status === "ui_only" ? "manual" : capability.status === "mock" ? "drafted" : "recommended";

  return {
    id: `cap-task-${capability.id}`,
    capabilityId: capability.id,
    workstreamId: capability.workstreamId,
    title: capability.manualTask,
    status,
    priority: capability.priority,
    automationStatus: capability.status,
    approvalRequired: capability.status === "ai_decision" || capability.status === "mock",
    moneyImpact: Math.max(0, moneyForCapability(capability, index)),
    timeSavedMinutes: capability.status === "missing" || capability.status === "ui_only" ? 0 : 18,
    dataRefs: capability.dataSources,
    normalizedEntities: capability.normalizedEntities,
    decisionReason: capability.currentImplementation,
    actionOutput: capability.actionOutput,
    auditEventId: `audit-${capability.id}`,
    learningSignal: capability.evidence.learningLoop ? "Outcome can update future priority and confidence." : "Learning loop is not complete yet.",
    proofState: capability.evidence.auditEvent ? "local_proof" : capability.status === "mock" ? "draft" : "none",
    failureReason:
      capability.status === "missing" || capability.status === "ui_only"
        ? "This seller work is still manual and must not be marketed as automated."
        : undefined
  };
}

function findCapabilityForAction(action: AutomationQueueItem, capabilities: AutomationCapability[]) {
  const byActionType = capabilities.find((capability) => {
    if (action.actionType.includes("ndr") || action.actionType.includes("cod")) return capability.workstreamId === "courier_shipping";
    if (action.actionType.includes("settlement") || action.actionType.includes("claim")) return capability.workstreamId === "finance_accounting";
    if (action.actionType.includes("reorder") || action.actionType.includes("sku")) return capability.workstreamId === "inventory";
    if (action.actionType.includes("listing") || action.actionType.includes("seo")) return capability.workstreamId === "catalog";
    if (action.actionType.includes("ad") || action.actionType.includes("campaign") || action.actionType.includes("coupon")) return capability.workstreamId === "advertising_promotions";
    if (action.actionType.includes("support") || action.actionType.includes("customer")) return capability.workstreamId === "customer_support";
    if (action.actionType.includes("return")) return capability.workstreamId === "returns_refunds";
    return false;
  });

  return byActionType || capabilities.find((capability) => capability.status === "local_automation") || capabilities[0];
}

function taskFromQueueAction(action: AutomationQueueItem, index: number, capabilities: AutomationCapability[]): AutomationTaskRecord {
  const capability = findCapabilityForAction(action, capabilities);

  return {
    id: `runtime-${action.id}`,
    capabilityId: capability.id,
    workstreamId: capability.workstreamId,
    title: action.title,
    status: taskStatusFromQueue(action),
    priority: action.riskLevel === "critical" ? "critical" : action.riskLevel === "high" ? "high" : action.riskLevel === "medium" ? "medium" : "low",
    automationStatus: capability.status,
    approvalRequired: action.approvalRequired,
    moneyImpact: action.impactAmount,
    timeSavedMinutes: action.state === "executed" ? 24 : action.state === "awaiting_approval" ? 9 : 5,
    dataRefs: action.lineageRefs,
    normalizedEntities: action.targetEntityRefs.map((ref) => `${ref.entityType}:${ref.entityId}`),
    decisionReason: `${action.description} Policy status: ${action.policyStatus.replaceAll("_", " ")}.`,
    actionOutput: action.executionTarget.label,
    auditEventId: action.auditLogIds[0] || `audit-runtime-${index}`,
    learningSignal:
      action.state === "executed"
        ? "Executed local result feeds the savings/proof ledger."
        : "Seller decision or failure reason will update future automation confidence.",
    proofState: proofStateFromQueue(action),
    failureReason: action.policyStatus === "blocked" ? "Blocked by seller policy or external-write guardrail." : undefined
  };
}

function buildEvents(tasks: AutomationTaskRecord[]): AutomationExecutionEvent[] {
  return tasks.flatMap((task) => {
    const created: AutomationExecutionEvent = {
      id: `event-created-${task.id}`,
      taskId: task.id,
      eventType: "created",
      actor: "system",
      status: task.status,
      message: `Automation task created from ${task.workstreamId.replaceAll("_", " ")} capability.`,
      occurredAt: isoNow()
    };

    if (task.status === "executed") {
      return [
        created,
        {
          id: `event-executed-${task.id}`,
          taskId: task.id,
          eventType: "executed",
          actor: "system",
          status: "executed",
          message: `Local execution proof recorded: ${task.actionOutput}.`,
          occurredAt: isoNow()
        },
        {
          id: `event-learning-${task.id}`,
          taskId: task.id,
          eventType: "learning_recorded",
          actor: "system",
          status: "executed",
          message: task.learningSignal,
          occurredAt: isoNow()
        }
      ];
    }

    if (task.status === "blocked" || task.status === "manual") {
      return [
        created,
        {
          id: `event-blocked-${task.id}`,
          taskId: task.id,
          eventType: "blocked",
          actor: "system",
          status: task.status,
          message: task.failureReason || "Task is not execution-ready.",
          occurredAt: isoNow()
        }
      ];
    }

    if (task.status === "awaiting_approval") {
      return [
        created,
        {
          id: `event-approval-${task.id}`,
          taskId: task.id,
          eventType: "created",
          actor: "system",
          status: "awaiting_approval",
          message: "Seller approval is required before this work can execute.",
          occurredAt: isoNow()
        }
      ];
    }

    return [created];
  });
}

export function getAutomationRuntimeTasks(): AutomationTaskRecord[] {
  const matrix = getAutomationCapabilityMatrix();
  const automation = getAutomationOverview();
  const queueTasks = automation.actions.map((action, index) => taskFromQueueAction(action, index, matrix.capabilities));

  const exceptionTasks = matrix.capabilities
    .filter((capability) => capability.status === "missing" || capability.status === "ui_only")
    .slice(0, 18)
    .map(taskFromCapability);

  const localProofTasks = matrix.capabilities
    .filter((capability) => capability.status === "local_automation" && !queueTasks.some((task) => task.capabilityId === capability.id))
    .slice(0, 12)
    .map(taskFromCapability);

  return [...queueTasks, ...exceptionTasks, ...localProofTasks];
}

export function getAutomationRun(): AutomationRunRecord {
  const matrix = getAutomationCapabilityMatrix();
  const tasks = getAutomationRuntimeTasks();
  const events = buildEvents(tasks);

  return {
    id: "automation-run-total-recovery-001",
    workspaceId,
    startedAt: "2026-05-10T10:25:00.000Z",
    completedAt: isoNow(),
    objective: matrix.objective,
    operatingLoop: matrix.operatingLoop,
    tasksCreated: tasks.length,
    approvalsNeeded: tasks.filter((task) => task.status === "awaiting_approval" || task.approvalRequired).length,
    failures: tasks.filter((task) => task.status === "blocked" || task.status === "failed" || task.status === "manual").length,
    proofEvents: events.filter((event) => event.eventType === "executed" || event.eventType === "learning_recorded").length,
    moneyProtected: tasks.filter((task) => task.proofState === "local_proof").reduce((sum, task) => sum + task.moneyImpact, 0),
    timeSavedMinutes: tasks.filter((task) => task.proofState === "local_proof").reduce((sum, task) => sum + task.timeSavedMinutes, 0),
    manualCapabilitiesRemaining: matrix.capabilities.filter((capability) => !canClaimAutomated(capability)).length,
    events
  };
}

export function getAutomationInbox(): AutomationInbox {
  const matrix = getAutomationCapabilityMatrix();
  const tasks = getAutomationRuntimeTasks();
  const run = getAutomationRun();
  const failures = tasks.filter((task) => task.status === "blocked" || task.status === "failed" || task.status === "manual");
  const approvals = tasks.filter((task) => task.status === "awaiting_approval" || (task.approvalRequired && task.status !== "executed"));
  const proof = tasks.filter((task) => task.proofState === "local_proof").sort((a, b) => b.moneyImpact - a.moneyImpact);
  const unresolvedManualWork = failures.sort((a, b) => b.moneyImpact - a.moneyImpact).slice(0, 20);

  return {
    run,
    approvals,
    failures,
    proof,
    unresolvedManualWork,
    summary: {
      todayNeedsSeller: approvals.length + failures.length,
      autoResolvedLocal: proof.filter((task) => task.status === "executed" || task.automationStatus === "local_automation").length,
      blockedExternalWrites: failures.filter((task) => task.failureReason?.includes("external") || task.status === "blocked").length,
      moneyProtected: run.moneyProtected,
      coveragePercent: matrix.summary.coveragePercent,
      honestAutomationClaims: matrix.summary.automatedClaimCount,
      manualWorkRemaining: matrix.summary.missingOrUiOnlyCount
    }
  };
}

export function approveAutomationTask(taskId: string) {
  const task = getAutomationRuntimeTasks().find((item) => item.id === taskId || item.id.replace(/^runtime-/, "") === taskId);
  if (!task) return undefined;

  const approved: AutomationTaskRecord = {
    ...task,
    status: "approved",
    approvalRequired: false,
    proofState: task.proofState === "none" ? "draft" : task.proofState,
    learningSignal: "Seller approval captured. Execution remains policy-gated until provider permissions are available."
  };

  const event: AutomationExecutionEvent = {
    id: `event-approved-${approved.id}`,
    taskId: approved.id,
    eventType: "approved",
    actor: "seller",
    status: "approved",
    message: "Seller approved the automation task. External execution is still guarded by provider permissions.",
    occurredAt: isoNow()
  };

  return { task: approved, event };
}

export function recordAutomationEvent(input: {
  taskId: string;
  eventType: AutomationExecutionEvent["eventType"];
  actor?: AutomationExecutionEvent["actor"];
  status?: AutomationTaskStatus;
  message?: string;
  rawPayload?: Record<string, unknown>;
}) {
  const task = getAutomationRuntimeTasks().find((item) => item.id === input.taskId);
  const event: AutomationExecutionEvent = {
    id: `event-${input.eventType}-${input.taskId}-${Date.now()}`,
    taskId: input.taskId,
    eventType: input.eventType,
    actor: input.actor || "system",
    status: input.status || task?.status || "recommended",
    message: input.message || `Recorded ${input.eventType.replaceAll("_", " ")} for automation task.`,
    occurredAt: new Date().toISOString(),
    rawPayload: input.rawPayload
  };

  return {
    event,
    task,
    accepted: Boolean(task)
  };
}
