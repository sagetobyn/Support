import type {
  AutomationCapabilityStatus,
  AutomationPriority,
  SellerWorkstreamId
} from "@/features/automation-capabilities";

export type AutomationTaskStatus =
  | "recommended"
  | "drafted"
  | "awaiting_approval"
  | "approved"
  | "scheduled"
  | "executing"
  | "executed"
  | "failed"
  | "reverted"
  | "blocked"
  | "manual";

export type AutomationProofState = "none" | "draft" | "local_proof" | "execution_proof" | "needs_review";

export interface AutomationTaskRecord {
  id: string;
  capabilityId: string;
  workstreamId: SellerWorkstreamId;
  title: string;
  status: AutomationTaskStatus;
  priority: AutomationPriority;
  automationStatus: AutomationCapabilityStatus;
  approvalRequired: boolean;
  moneyImpact: number;
  timeSavedMinutes: number;
  dataRefs: string[];
  normalizedEntities: string[];
  decisionReason: string;
  actionOutput: string;
  auditEventId: string;
  learningSignal: string;
  proofState: AutomationProofState;
  failureReason?: string;
}

export interface AutomationExecutionEvent {
  id: string;
  taskId: string;
  eventType: "created" | "approved" | "executed" | "failed" | "blocked" | "learning_recorded";
  actor: "system" | "seller" | "ops" | "finance" | "cx" | "growth";
  status: AutomationTaskStatus;
  message: string;
  occurredAt: string;
  rawPayload?: Record<string, unknown>;
}

export interface AutomationRunRecord {
  id: string;
  workspaceId: string;
  startedAt: string;
  completedAt: string;
  objective: string;
  operatingLoop: string[];
  tasksCreated: number;
  approvalsNeeded: number;
  failures: number;
  proofEvents: number;
  moneyProtected: number;
  timeSavedMinutes: number;
  manualCapabilitiesRemaining: number;
  events: AutomationExecutionEvent[];
}

export interface AutomationInbox {
  run: AutomationRunRecord;
  approvals: AutomationTaskRecord[];
  failures: AutomationTaskRecord[];
  proof: AutomationTaskRecord[];
  unresolvedManualWork: AutomationTaskRecord[];
  summary: {
    todayNeedsSeller: number;
    autoResolvedLocal: number;
    blockedExternalWrites: number;
    moneyProtected: number;
    coveragePercent: number;
    honestAutomationClaims: number;
    manualWorkRemaining: number;
  };
}
