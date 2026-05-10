import type {
  AgentFindingEntityRef,
  AutomationActionType,
  AutomationExecutionTarget,
  AutomationLevelDefinition,
  AutomationRule,
  ExecutionState,
  RiskLevel,
  SellerApprovalPolicy
} from "../domain/types";

export interface AutomationActionSeed {
  id: string;
  workspaceId: string;
  title: string;
  sourceFindingId: string;
  sourceIntentId?: string;
  actionType: AutomationActionType;
  description: string;
  impactAmount: number;
  riskLevel: RiskLevel;
  confidence: number;
  automationLevel: AutomationLevelDefinition["level"];
  state: ExecutionState;
  approvalRequired: boolean;
  assignee: string;
  rollbackPlan: string;
  createdAt: string;
  updatedAt: string;
  targetEntityRefs: AgentFindingEntityRef[];
  lineageRefs: string[];
  priorityScore: number;
  executionTarget: AutomationExecutionTarget;
}

export const automationLevelDefinitions: AutomationLevelDefinition[] = [
  {
    level: 1,
    key: "recommend",
    label: "Recommend",
    description: "Create an explained recommendation. No draft or external change is made.",
    requiresApproval: false,
    externalExecutionAllowed: false
  },
  {
    level: 2,
    key: "draft",
    label: "Draft",
    description: "Prepare the work packet, message, claim, content, or budget recommendation for review.",
    requiresApproval: true,
    externalExecutionAllowed: false
  },
  {
    level: 3,
    key: "one_click_approve",
    label: "One-click approve",
    description: "Seller approves a prepared action before any external write could be attempted.",
    requiresApproval: true,
    externalExecutionAllowed: false
  },
  {
    level: 4,
    key: "auto_execute",
    label: "Auto-execute",
    description: "Only low-risk internal work may be simulated automatically under seller policy.",
    requiresApproval: false,
    externalExecutionAllowed: false
  },
  {
    level: 5,
    key: "full_autopilot",
    label: "Full autopilot",
    description: "Defined for future strict-policy execution; disabled until real integrations are hardened.",
    requiresApproval: true,
    externalExecutionAllowed: false
  }
];

export const sellerApprovalPolicy: SellerApprovalPolicy = {
  id: "policy-acme-safe-automation",
  workspaceId: "workspace-acme",
  name: "Balanced seller-controlled automation",
  automationCeiling: 4,
  minConfidenceForAutoExecute: 86,
  maxImpactWithoutApproval: 100000,
  requiresApprovalForRisk: ["medium", "high", "critical"],
  allowedAutoActionTypes: ["settlement_reconciliation", "reorder_sku_recommendation"],
  blockedExternalActionTypes: [
    "claim_draft",
    "ndr_message_draft",
    "cod_block_rule",
    "listing_optimization_draft",
    "ad_budget_recommendation",
    "support_reply_draft"
  ],
  quietHours: {
    startHour: 21,
    endHour: 8,
    timezone: "Asia/Kolkata"
  },
  notes: [
    "External marketplace, customer, bank, support, inventory, listing, and ad writes are disabled in the mock foundation.",
    "High-risk actions always require seller approval.",
    "Auto-execute is limited to local mock state-machine simulation and audit logs."
  ]
};

export const automationRules: AutomationRule[] = [
  {
    id: "rule-risky-pincode-cod",
    name: "High Risk Pincode COD Blocker",
    active: true,
    trigger: "Pincode risk score is greater than 75 and payment method is COD",
    condition: "Seller allows COD controls and expected loss is above approval threshold",
    action: "Create COD block rule draft and request seller approval",
    automationLevel: 3,
    approvalRequired: true
  },
  {
    id: "rule-customer-message-quiet-hours",
    name: "Customer Message Quiet Hours",
    active: true,
    trigger: "Outbound customer message after 9 PM",
    condition: "Channel is WhatsApp, SMS, email, or marketplace support",
    action: "Hold the draft until the next allowed window",
    automationLevel: 4,
    approvalRequired: false
  },
  {
    id: "rule-settlement-local-reconcile",
    name: "Settlement Local Reconciliation",
    active: true,
    trigger: "Mapped settlement mismatch has complete order, bank, and deduction lineage",
    condition: "No external claim submission is required and confidence is above 86%",
    action: "Simulate local reconciliation and create an audit record",
    automationLevel: 4,
    approvalRequired: false
  },
  {
    id: "rule-claim-submission-guardrail",
    name: "Claim Submission Guardrail",
    active: true,
    trigger: "Claim draft has marketplace-facing submission intent",
    condition: "Any claim submission needs finance and seller approval",
    action: "Keep claim as draft evidence packet",
    automationLevel: 2,
    approvalRequired: true
  },
  {
    id: "rule-full-autopilot-disabled",
    name: "Full Autopilot Disabled For External Writes",
    active: false,
    trigger: "Any external write action asks for Level 5 autopilot",
    condition: "Real integration execution is not enabled in this foundation",
    action: "Block execution and create a policy audit log",
    automationLevel: 5,
    approvalRequired: true
  }
];

export const additionalAutomationActionSeeds: AutomationActionSeed[] = [
  {
    id: "action-cod-block-rule",
    workspaceId: "workspace-acme",
    title: "Block COD in high-risk 560102 pincode",
    sourceFindingId: "finding-rto-ndr-001",
    actionType: "cod_block_rule",
    description: "Prepare a COD block rule for the risky pincode cluster. The rule is not applied without seller approval.",
    impactAmount: 218700,
    riskLevel: "high",
    confidence: 95,
    automationLevel: 3,
    state: "awaiting_approval",
    approvalRequired: true,
    assignee: "Risk Team",
    rollbackPlan: "Restore the previous COD eligibility rule and notify operations.",
    createdAt: "2026-05-10T09:22:00.000Z",
    updatedAt: "2026-05-10T09:25:00.000Z",
    targetEntityRefs: [
      { entityId: "pin-560102", entityType: "pincode", title: "Bangalore 560102" },
      { entityId: "ord-91aa3f", entityType: "order", title: "Order #404-8750123" }
    ],
    lineageRefs: ["lin-order-amazon-404", "lin-ndr-courier-2261d", "lin-rto-report-11ab7c"],
    priorityScore: 91.4,
    executionTarget: {
      kind: "marketplace",
      label: "Marketplace COD eligibility rule",
      externalSystem: "Marketplace settings",
      externalWriteRequired: true
    }
  },
  {
    id: "action-settlement-reconcile-local",
    workspaceId: "workspace-acme",
    title: "Reconcile settlement mismatch locally",
    sourceFindingId: "finding-settlement-001",
    actionType: "settlement_reconciliation",
    description: "Simulate local reconciliation across settlement, deduction, refund, order, and bank lineage.",
    impactAmount: 85600,
    riskLevel: "low",
    confidence: 91,
    automationLevel: 4,
    state: "executed",
    approvalRequired: false,
    assignee: "System",
    rollbackPlan: "Reopen the mismatch and mark the simulated reconciliation as discarded.",
    createdAt: "2026-05-10T09:24:00.000Z",
    updatedAt: "2026-05-10T09:29:00.000Z",
    targetEntityRefs: [
      { entityId: "set-2d410", entityType: "settlement", title: "Settlement SET-May-W2" },
      { entityId: "ded-7712", entityType: "deduction", title: "Unusual marketplace deduction" }
    ],
    lineageRefs: ["lin-settlement-flipkart-w2", "lin-bank-statement-w2", "lin-deduction-report-7712"],
    priorityScore: 82.6,
    executionTarget: {
      kind: "internal_record",
      label: "Internal reconciliation worklog",
      externalSystem: "Wembro mock ledger",
      externalWriteRequired: false
    }
  },
  {
    id: "action-reorder-sku-recommendation",
    workspaceId: "workspace-acme",
    title: "Auto-create reorder recommendation for Noise Air Buds Pro 2",
    sourceFindingId: "finding-inventory-001",
    actionType: "reorder_sku_recommendation",
    description: "Create a local reorder recommendation with supplier lead-time context. No purchase order is placed.",
    impactAmount: 63200,
    riskLevel: "low",
    confidence: 88,
    automationLevel: 4,
    state: "executed",
    approvalRequired: false,
    assignee: "System",
    rollbackPlan: "Archive the recommendation and leave inventory and supplier systems unchanged.",
    createdAt: "2026-05-10T09:26:00.000Z",
    updatedAt: "2026-05-10T09:31:00.000Z",
    targetEntityRefs: [
      { entityId: "sku-airbuds-pro-black", entityType: "sku", title: "Noise Air Buds Pro 2 - Black" },
      { entityId: "inv-312009", entityType: "inventory_item", title: "Inventory for Noise Air Buds Pro 2" }
    ],
    lineageRefs: ["lin-inventory-amazon-airbuds", "lin-po-audio-778", "lin-sku-mapping-airbuds"],
    priorityScore: 79.2,
    executionTarget: {
      kind: "inventory_planning",
      label: "Internal reorder recommendation",
      externalSystem: "Wembro planning queue",
      externalWriteRequired: false
    }
  },
  {
    id: "action-listing-optimization-draft",
    workspaceId: "workspace-acme",
    title: "Draft listing optimization for repeat-return SKU",
    sourceFindingId: "finding-return-intel-001",
    actionType: "listing_optimization_draft",
    description: "Draft listing copy changes that clarify fit and battery expectations. No marketplace listing is edited.",
    impactAmount: 146200,
    riskLevel: "medium",
    confidence: 86,
    automationLevel: 2,
    state: "drafted",
    approvalRequired: true,
    assignee: "Catalog",
    rollbackPlan: "Delete the draft copy packet; no listing content is changed.",
    createdAt: "2026-05-10T09:27:00.000Z",
    updatedAt: "2026-05-10T09:32:00.000Z",
    targetEntityRefs: [
      { entityId: "list-amazon-airbuds", entityType: "listing", title: "Amazon listing - Noise Air Buds Pro 2" },
      { entityId: "review-airbuds-fit", entityType: "review", title: "Fit and battery review cluster" }
    ],
    lineageRefs: ["lin-listing-amazon-airbuds", "lin-review-airbuds-fit", "lin-return-report-11ab7c"],
    priorityScore: 78.1,
    executionTarget: {
      kind: "listing_content",
      label: "Listing content draft",
      externalSystem: "Amazon Seller Central",
      externalWriteRequired: true
    }
  },
  {
    id: "action-ad-budget-recommendation",
    workspaceId: "workspace-acme",
    title: "Recommend ad budget shift away from loss-making COD traffic",
    sourceFindingId: "finding-pricing-001",
    actionType: "ad_budget_recommendation",
    description: "Prepare a profit-aware ad budget recommendation. No campaign budget is changed.",
    impactAmount: 87300,
    riskLevel: "medium",
    confidence: 84,
    automationLevel: 1,
    state: "recommended",
    approvalRequired: true,
    assignee: "Growth",
    rollbackPlan: "Dismiss the recommendation; ad campaign settings remain unchanged.",
    createdAt: "2026-05-10T09:28:00.000Z",
    updatedAt: "2026-05-10T09:33:00.000Z",
    targetEntityRefs: [
      { entityId: "adcamp-festival-audio", entityType: "ad_campaign", title: "Festival audio campaign" },
      { entityId: "kw-wireless-earbuds", entityType: "keyword", title: "wireless earbuds keyword cluster" }
    ],
    lineageRefs: ["lin-ad-report-festival-audio", "lin-keyword-wireless-earbuds", "lin-settlement-flipkart-w2"],
    priorityScore: 73.8,
    executionTarget: {
      kind: "ad_budget",
      label: "Ad budget recommendation",
      externalSystem: "Marketplace Ads",
      externalWriteRequired: true
    }
  }
];
