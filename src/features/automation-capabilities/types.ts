export const automationCapabilityStatuses = [
  "missing",
  "ui_only",
  "mock",
  "local_automation",
  "connected_read",
  "ai_decision",
  "approval_execution",
  "autonomous_execution"
] as const;

export type AutomationCapabilityStatus = (typeof automationCapabilityStatuses)[number];

export type SellerWorkstreamId =
  | "catalog"
  | "inventory"
  | "order_processing"
  | "courier_shipping"
  | "pricing_competition"
  | "advertising_promotions"
  | "returns_refunds"
  | "customer_support"
  | "finance_accounting"
  | "analytics_decisions"
  | "procurement_supplier"
  | "marketplace_compliance"
  | "team_coordination"
  | "hidden_manual_work";

export type AutomationPriority = "critical" | "high" | "medium" | "low";

export interface AutomationEvidence {
  dataInput: boolean;
  normalizedEntities: boolean;
  decisionLogic: boolean;
  actionOutput: boolean;
  auditEvent: boolean;
  tests: boolean;
  externalExecution: boolean;
  learningLoop: boolean;
  notes: string[];
}

export interface AutomationCapability {
  id: string;
  workstreamId: SellerWorkstreamId;
  workstreamTitle: string;
  manualTask: string;
  sellerPain: string;
  status: AutomationCapabilityStatus;
  targetStatus: AutomationCapabilityStatus;
  priority: AutomationPriority;
  sellerWorkRemoved: string;
  dataSources: string[];
  normalizedEntities: string[];
  decisionService: string;
  actionOutput: string;
  currentImplementation: string;
  nextImplementation: string;
  evidence: AutomationEvidence;
}

export interface AutomationWorkstream {
  id: SellerWorkstreamId;
  title: string;
  description: string;
  sellerPain: string;
  priority: AutomationPriority;
  capabilities: AutomationCapability[];
}

export interface AutomationCapabilitySummary {
  totalWorkstreams: number;
  totalCapabilities: number;
  statusCounts: Record<AutomationCapabilityStatus, number>;
  automatedClaimCount: number;
  falseAutomationClaimCount: number;
  executionReadyCount: number;
  missingOrUiOnlyCount: number;
  coveragePercent: number;
  highestStatus: AutomationCapabilityStatus;
  strongestWorkstreams: Array<{
    id: SellerWorkstreamId;
    title: string;
    coveragePercent: number;
    executionReadyCount: number;
  }>;
  weakestWorkstreams: Array<{
    id: SellerWorkstreamId;
    title: string;
    coveragePercent: number;
    missingOrUiOnlyCount: number;
  }>;
}

export interface AutomationCapabilityMatrix {
  objective: string;
  operatingLoop: string[];
  honestyRule: string;
  statusDefinitions: Array<{
    status: AutomationCapabilityStatus;
    label: string;
    description: string;
    canClaimAutomated: boolean;
  }>;
  workstreams: AutomationWorkstream[];
  capabilities: AutomationCapability[];
  summary: AutomationCapabilitySummary;
  falseAutomationClaims: AutomationCapability[];
}
