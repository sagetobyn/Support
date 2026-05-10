import { sellerApprovalPolicy } from "../data/mockAutomationLayer";
import type {
  AutomationAction,
  AutomationActionType,
  AutomationExecutionTarget,
  AutomationPolicyCheck,
  AutomationPolicyStatus,
  AutomationQueueItem,
  SellerApprovalPolicy
} from "../domain/types";

export function getSellerApprovalPolicy(): SellerApprovalPolicy {
  return sellerApprovalPolicy;
}

export function getExecutionTargetForActionType(actionType: AutomationActionType): AutomationExecutionTarget {
  const targets: Record<AutomationActionType, AutomationExecutionTarget> = {
    claim_draft: {
      kind: "finance_packet",
      label: "Claim evidence packet",
      externalSystem: "Marketplace claims",
      externalWriteRequired: true
    },
    ndr_message_draft: {
      kind: "customer_message",
      label: "NDR customer message draft",
      externalSystem: "WhatsApp / marketplace messaging",
      externalWriteRequired: true
    },
    cod_block_rule: {
      kind: "marketplace",
      label: "COD pincode rule",
      externalSystem: "Marketplace settings",
      externalWriteRequired: true
    },
    settlement_reconciliation: {
      kind: "internal_record",
      label: "Internal reconciliation record",
      externalSystem: "Wembro mock ledger",
      externalWriteRequired: false
    },
    reorder_sku_recommendation: {
      kind: "inventory_planning",
      label: "Internal reorder recommendation",
      externalSystem: "Wembro planning queue",
      externalWriteRequired: false
    },
    listing_optimization_draft: {
      kind: "listing_content",
      label: "Listing content draft",
      externalSystem: "Marketplace listing tools",
      externalWriteRequired: true
    },
    ad_budget_recommendation: {
      kind: "ad_budget",
      label: "Ad budget recommendation",
      externalSystem: "Marketplace Ads",
      externalWriteRequired: true
    },
    support_reply_draft: {
      kind: "customer_message",
      label: "Customer support reply draft",
      externalSystem: "Support channel",
      externalWriteRequired: true
    },
    profit_leakage_review: {
      kind: "internal_record",
      label: "Leakage review workstream",
      externalSystem: "Wembro operating queue",
      externalWriteRequired: false
    },
    return_reason_review: {
      kind: "internal_record",
      label: "Return reason review task",
      externalSystem: "Wembro operating queue",
      externalWriteRequired: false
    },
    margin_guardrail_recommendation: {
      kind: "internal_record",
      label: "Margin guardrail recommendation",
      externalSystem: "Wembro operating queue",
      externalWriteRequired: false
    },
    profit_aware_growth_review: {
      kind: "internal_record",
      label: "Profit-aware growth review",
      externalSystem: "Wembro operating queue",
      externalWriteRequired: false
    },
    settlement_mismatch_packet: {
      kind: "finance_packet",
      label: "Settlement mismatch packet",
      externalSystem: "Marketplace finance support",
      externalWriteRequired: true
    },
    ndr_rescue_draft: {
      kind: "customer_message",
      label: "NDR rescue workflow draft",
      externalSystem: "WhatsApp / courier workflow",
      externalWriteRequired: true
    },
    reorder_recommendation: {
      kind: "inventory_planning",
      label: "Reorder recommendation",
      externalSystem: "Wembro planning queue",
      externalWriteRequired: false
    },
    customer_message_draft: {
      kind: "customer_message",
      label: "Customer message draft",
      externalSystem: "Customer messaging provider",
      externalWriteRequired: true
    },
    cod_rule_change: {
      kind: "marketplace",
      label: "COD rule change",
      externalSystem: "Marketplace settings",
      externalWriteRequired: true
    },
    seo_keyword_update_draft: {
      kind: "listing_content",
      label: "Marketplace SEO keyword draft",
      externalSystem: "Marketplace listing tools",
      externalWriteRequired: true
    },
    competitor_response_recommendation: {
      kind: "internal_record",
      label: "Competitor response recommendation",
      externalSystem: "Wembro growth queue",
      externalWriteRequired: false
    },
    loss_making_campaign_pause_draft: {
      kind: "ad_budget",
      label: "Campaign pause draft",
      externalSystem: "Marketplace Ads",
      externalWriteRequired: true
    },
    coupon_profitability_review: {
      kind: "internal_record",
      label: "Coupon profitability review",
      externalSystem: "Wembro growth queue",
      externalWriteRequired: false
    },
    festival_sale_plan_draft: {
      kind: "internal_record",
      label: "Festival sale plan draft",
      externalSystem: "Wembro growth queue",
      externalWriteRequired: false
    },
    marketing_report_draft: {
      kind: "internal_record",
      label: "Marketing report draft",
      externalSystem: "Wembro reports hub",
      externalWriteRequired: false
    }
  };

  return targets[actionType];
}

function isAutoLevel(action: Pick<AutomationAction, "automationLevel" | "approvalRequired">) {
  return action.automationLevel >= 4 && !action.approvalRequired;
}

export function evaluateAutomationPolicy(
  action: Pick<AutomationQueueItem, "automationLevel" | "approvalRequired" | "confidence" | "riskLevel" | "impactAmount" | "executionTarget" | "state"> & {
    actionType: AutomationActionType;
  },
  policy = sellerApprovalPolicy
): { status: AutomationPolicyStatus; checks: AutomationPolicyCheck[] } {
  const checks: AutomationPolicyCheck[] = [];
  const isExternal = action.executionTarget.externalWriteRequired;
  const riskRequiresApproval = policy.requiresApprovalForRisk.includes(action.riskLevel);
  const autoCandidate = isAutoLevel(action);

  checks.push({
    id: "automation-ceiling",
    label: "Automation ceiling",
    status: action.automationLevel <= policy.automationCeiling ? "passed" : "blocked",
    detail:
      action.automationLevel <= policy.automationCeiling
        ? `Level ${action.automationLevel} is within seller ceiling Level ${policy.automationCeiling}.`
        : `Level ${action.automationLevel} is above seller ceiling Level ${policy.automationCeiling}.`
  });

  checks.push({
    id: "external-write-guardrail",
    label: "External write guardrail",
    status: isExternal ? "warning" : "passed",
    detail: isExternal
      ? "External provider execution is disabled; this can only stay as a draft or approval preview."
      : "Action targets an internal mock record only."
  });

  checks.push({
    id: "risk-approval",
    label: "Risk approval rule",
    status: riskRequiresApproval && !action.approvalRequired ? "blocked" : riskRequiresApproval ? "warning" : "passed",
    detail: riskRequiresApproval
      ? `${action.riskLevel} risk requires seller approval.`
      : `${action.riskLevel} risk can follow standard queue policy.`
  });

  checks.push({
    id: "confidence-threshold",
    label: "Confidence threshold",
    status: autoCandidate && action.confidence < policy.minConfidenceForAutoExecute ? "blocked" : "passed",
    detail: autoCandidate
      ? `Auto-execute requires ${policy.minConfidenceForAutoExecute}% confidence; this action is ${action.confidence}%.`
      : `Confidence ${action.confidence}% is recorded for approval and audit context.`
  });

  checks.push({
    id: "impact-threshold",
    label: "Impact threshold",
    status: autoCandidate && action.impactAmount > policy.maxImpactWithoutApproval ? "blocked" : "passed",
    detail: autoCandidate
      ? `Auto-execute without approval is capped at INR ${policy.maxImpactWithoutApproval.toLocaleString("en-IN")}.`
      : "Impact will be shown in the approval or recommendation record."
  });

  if (action.executionTarget.kind === "customer_message") {
    checks.push({
      id: "quiet-hours",
      label: "Quiet hours",
      status: "warning",
      detail: `Customer messages cannot be sent between ${policy.quietHours.startHour}:00 and ${policy.quietHours.endHour}:00 ${policy.quietHours.timezone}.`
    });
  }

  const hasBlockedCheck = checks.some((check) => check.status === "blocked");
  const allowedAutoType = policy.allowedAutoActionTypes.includes(action.actionType);

  if (hasBlockedCheck || action.automationLevel === 5) {
    return { status: "blocked", checks };
  }

  if (autoCandidate) {
    if (!isExternal && allowedAutoType) {
      return { status: "auto_allowed", checks };
    }
    return { status: "blocked", checks };
  }

  if (action.approvalRequired || action.state === "awaiting_approval" || riskRequiresApproval) {
    return { status: "approval_ready", checks };
  }

  if (action.automationLevel === 2 || action.state === "drafted") {
    return { status: "draft_only", checks };
  }

  return { status: "recommendation_only", checks };
}

export function canPolicyAutoExecute(action: AutomationQueueItem) {
  const decision = evaluateAutomationPolicy(action);
  return decision.status === "auto_allowed" && action.state === "executed" && !action.executionTarget.externalWriteRequired;
}
