import {
  additionalAutomationActionSeeds,
  automationLevelDefinitions,
  automationRules,
  type AutomationActionSeed
} from "../data/mockAutomationLayer";
import type {
  AutomationAction,
  AutomationActionDetailView,
  AutomationActionType,
  AutomationLayerOverview,
  AutomationQueueItem,
  AutomationRuleBuilderView,
  ExecutionState,
  StructuredAiFinding
} from "../domain/types";
import { getApprovalQueue } from "./approvalQueueService";
import { buildAutomationAuditLogs, buildRecentAutomationActivity, getAuditLogIdsForAction } from "./automationAuditService";
import { getRankedAiFindings } from "./aiFindingService";
import { canPolicyAutoExecute, evaluateAutomationPolicy, getExecutionTargetForActionType, getSellerApprovalPolicy } from "./automationPolicyService";
import { createMockExecutionResult, getAllowedNextStates, getExecutionStateCounts, getStateTrailForAction } from "./automationStateMachineService";

const knownActionTypes: AutomationActionType[] = [
  "claim_draft",
  "ndr_message_draft",
  "cod_block_rule",
  "settlement_reconciliation",
  "reorder_sku_recommendation",
  "listing_optimization_draft",
  "ad_budget_recommendation",
  "support_reply_draft",
  "profit_leakage_review",
  "return_reason_review",
  "margin_guardrail_recommendation",
  "profit_aware_growth_review",
  "settlement_mismatch_packet",
  "ndr_rescue_draft",
  "reorder_recommendation",
  "customer_message_draft",
  "cod_rule_change",
  "seo_keyword_update_draft",
  "competitor_response_recommendation",
  "loss_making_campaign_pause_draft",
  "coupon_profitability_review",
  "festival_sale_plan_draft",
  "marketing_report_draft"
];

const actionTypeAliases: Partial<Record<string, AutomationActionType>> = {
  ndr_rescue_draft: "ndr_message_draft",
  support_reply_draft: "support_reply_draft",
  settlement_mismatch_packet: "settlement_mismatch_packet",
  reorder_recommendation: "reorder_recommendation",
  return_reason_review: "return_reason_review",
  margin_guardrail_recommendation: "margin_guardrail_recommendation",
  profit_aware_growth_review: "profit_aware_growth_review"
};

const actionTitleOverrides: Partial<Record<AutomationActionType, string>> = {
  ndr_message_draft: "Draft NDR message workflow",
  support_reply_draft: "Draft customer support reply",
  settlement_mismatch_packet: "Draft settlement mismatch packet",
  reorder_recommendation: "Create reorder review recommendation",
  return_reason_review: "Create return reason review task",
  margin_guardrail_recommendation: "Recommend margin guardrail",
  profit_aware_growth_review: "Keep growth in profit-aware review mode",
  seo_keyword_update_draft: "Draft SEO keyword update",
  competitor_response_recommendation: "Recommend competitor response",
  loss_making_campaign_pause_draft: "Draft campaign pause recommendation",
  coupon_profitability_review: "Review coupon profitability",
  festival_sale_plan_draft: "Draft festival sale plan",
  marketing_report_draft: "Generate marketing report draft"
};

function normalizeActionType(actionType: string): AutomationActionType {
  if (actionTypeAliases[actionType]) return actionTypeAliases[actionType];
  if (knownActionTypes.includes(actionType as AutomationActionType)) return actionType as AutomationActionType;
  return "profit_leakage_review";
}

function toAutomationActionSeed(finding: StructuredAiFinding): AutomationActionSeed {
  const intent = finding.automationIntent;
  const actionType = normalizeActionType(intent.actionType);

  return {
    id: `action-${finding.id.replace("finding-", "")}`,
    workspaceId: finding.workspaceId,
    title: actionTitleOverrides[actionType] || intent.title,
    sourceFindingId: finding.id,
    sourceIntentId: intent.id,
    actionType,
    description: intent.description,
    impactAmount: finding.recommendedAction.expectedImpactAmount,
    riskLevel: finding.riskLevel,
    confidence: Math.round(finding.confidence),
    automationLevel: intent.automationLevel,
    state: intent.state,
    approvalRequired: intent.approvalRequired,
    assignee: finding.recommendedAction.owner,
    rollbackPlan: intent.rollbackPlan,
    createdAt: finding.createdAt,
    updatedAt: finding.createdAt,
    targetEntityRefs: intent.targetEntityRefs,
    lineageRefs: finding.lineageRefs,
    priorityScore: finding.priorityScore,
    executionTarget: getExecutionTargetForActionType(actionType)
  };
}

function buildQueueItem(seed: AutomationActionSeed): AutomationQueueItem {
  const policyDecision = evaluateAutomationPolicy(seed);
  const action = {
    ...seed,
    policyStatus: policyDecision.status,
    policyChecks: policyDecision.checks,
    mockExecutionResult: {
      id: `mock-result-${seed.id}`,
      actionId: seed.id,
      status: "not_started",
      summary: "Action has not been simulated yet.",
      externalCallMade: false,
      evidenceRefs: seed.lineageRefs
    },
    auditLogIds: []
  } satisfies AutomationQueueItem;

  const actionWithResult: AutomationQueueItem = {
    ...action,
    mockExecutionResult: createMockExecutionResult(action)
  };

  return {
    ...actionWithResult,
    auditLogIds: getAuditLogIdsForAction(actionWithResult)
  };
}

export function getAutomationActions(): AutomationQueueItem[] {
  const intentSeeds = getRankedAiFindings().map(toAutomationActionSeed);

  return [...intentSeeds, ...additionalAutomationActionSeeds]
    .map(buildQueueItem)
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function getAutomationRuleBuilderViews(): AutomationRuleBuilderView[] {
  return automationRules.map((rule) => ({
    ruleId: rule.id,
    name: rule.name,
    active: rule.active,
    automationLevel: rule.automationLevel,
    approvalRequired: rule.approvalRequired,
    nodes: [
      {
        id: `${rule.id}-trigger`,
        nodeType: "trigger",
        label: "If",
        detail: rule.trigger
      },
      {
        id: `${rule.id}-condition`,
        nodeType: "condition",
        label: "And",
        detail: rule.condition
      },
      {
        id: `${rule.id}-guardrail`,
        nodeType: "guardrail",
        label: "Guardrail",
        detail: rule.approvalRequired ? "Seller approval is required before progress." : "Allowed under seller policy if all checks pass."
      },
      {
        id: `${rule.id}-action`,
        nodeType: "action",
        label: "Then",
        detail: rule.action
      }
    ]
  }));
}

export function getAutomationActionDetail(actionId?: string): AutomationActionDetailView {
  const actions = getAutomationActions();
  const auditLogs = buildAutomationAuditLogs(actions);
  const recentActivity = buildRecentAutomationActivity(actions, auditLogs);
  const approvalQueue = getApprovalQueue(actions);
  const selected =
    actions.find((action) => action.id === actionId) ||
    actions.find((action) => action.policyStatus === "approval_ready") ||
    actions[0];

  return {
    action: selected,
    approval: approvalQueue.find((approval) => approval.actionId === selected.id),
    allowedNextStates: getAllowedNextStates(selected.state),
    stateTrail: getStateTrailForAction(selected),
    auditLogs: auditLogs.filter((log) => log.actionId === selected.id),
    recentActivity: recentActivity.filter((activity) => activity.actionId === selected.id)
  };
}

export function getAutomationOverview(selectedActionId?: string): AutomationLayerOverview {
  const actions = getAutomationActions();
  const approvalQueue = getApprovalQueue(actions);
  const auditLogs = buildAutomationAuditLogs(actions);
  const recentActivity = buildRecentAutomationActivity(actions, auditLogs);
  const potentialImpact = actions.reduce((sum, action) => sum + action.impactAmount, 0);
  const avgConfidence = actions.reduce((sum, action) => sum + action.confidence, 0) / actions.length;

  return {
    actions,
    approvalQueue,
    rules: automationRules,
    ruleBuilder: getAutomationRuleBuilderViews(),
    sellerPolicy: getSellerApprovalPolicy(),
    levelDefinitions: automationLevelDefinitions,
    stateCounts: getExecutionStateCounts(actions),
    auditLogs,
    recentActivity,
    selectedAction: getAutomationActionDetail(selectedActionId),
    potentialImpact,
    pendingApproval: approvalQueue.filter((approval) => approval.status === "pending").length,
    executed: actions.filter((action) => action.state === "executed").length,
    blocked: actions.filter((action) => action.policyStatus === "blocked").length,
    autoExecutableCount: actions.filter(canPolicyAutoExecute).length,
    avgConfidence
  };
}

export function getActionQueueByState(state: ExecutionState) {
  return getAutomationActions().filter((action) => action.state === state);
}

export function canAutoExecute(action: AutomationAction | AutomationQueueItem) {
  if ("policyStatus" in action) {
    return canPolicyAutoExecute(action);
  }

  return !action.approvalRequired && action.automationLevel >= 4 && action.riskLevel !== "high" && action.riskLevel !== "critical";
}
