import { describe, expect, it } from "vitest";
import {
  canAutoExecute,
  getActionQueueByState,
  getAllowedNextStates,
  getAutomationActionDetail,
  getAutomationOverview,
  getAutomationRuleBuilderViews,
  getAiOperationsEngine,
  getSellerApprovalPolicy
} from "@/features/ai-operations-os";

describe("Automation / Action Layer foundation", () => {
  it("turns every AI automation intent into a queue item and adds requested mock actions", () => {
    const engine = getAiOperationsEngine();
    const overview = getAutomationOverview();
    const actionTypes = overview.actions.map((action) => action.actionType);
    const sourceIntentIds = overview.actions.flatMap((action) => action.sourceIntentId ? [action.sourceIntentId] : []);

    expect(engine.automationIntents.every((intent) => sourceIntentIds.includes(intent.id))).toBe(true);
    expect(actionTypes).toEqual(expect.arrayContaining([
      "claim_draft",
      "ndr_message_draft",
      "cod_block_rule",
      "settlement_reconciliation",
      "reorder_sku_recommendation",
      "listing_optimization_draft",
      "ad_budget_recommendation"
    ]));
  });

  it("defines safe automation levels while keeping external execution disabled", () => {
    const overview = getAutomationOverview();

    expect(overview.levelDefinitions.map((level) => level.key)).toEqual([
      "recommend",
      "draft",
      "one_click_approve",
      "auto_execute",
      "full_autopilot"
    ]);
    expect(overview.levelDefinitions.every((level) => level.externalExecutionAllowed === false)).toBe(true);
    expect(overview.actions.every((action) => action.mockExecutionResult.externalCallMade === false)).toBe(true);
  });

  it("approval-gates risky or external actions and only auto-allows internal mock work", () => {
    const overview = getAutomationOverview();
    const policy = getSellerApprovalPolicy();
    const codRule = overview.actions.find((action) => action.actionType === "cod_block_rule");
    const ndrDraft = overview.actions.find((action) => action.actionType === "ndr_message_draft");
    const localExecuted = overview.actions.find((action) => action.policyStatus === "auto_allowed" && action.state === "executed");

    expect(policy.blockedExternalActionTypes).toEqual(expect.arrayContaining(["claim_draft", "cod_block_rule", "ndr_message_draft"]));
    expect(codRule?.approvalRequired).toBe(true);
    expect(codRule?.policyStatus).toBe("approval_ready");
    expect(ndrDraft?.executionTarget.externalWriteRequired).toBe(true);
    expect(localExecuted).toBeDefined();
    expect(canAutoExecute(codRule!)).toBe(false);
    expect(canAutoExecute(localExecuted!)).toBe(true);
  });

  it("builds approval queue, execution state counts, rule builder, audit logs, and detail view", () => {
    const overview = getAutomationOverview();
    const detail = getAutomationActionDetail();

    expect(overview.approvalQueue.length).toBeGreaterThan(3);
    expect(overview.stateCounts.map((state) => state.state)).toEqual([
      "recommended",
      "drafted",
      "awaiting_approval",
      "approved",
      "scheduled",
      "executing",
      "executed",
      "failed",
      "reverted"
    ]);
    expect(getAllowedNextStates("drafted")).toContain("awaiting_approval");
    expect(getAutomationRuleBuilderViews().every((rule) => rule.nodes.map((node) => node.nodeType).includes("guardrail"))).toBe(true);
    expect(overview.auditLogs.length).toBeGreaterThan(overview.actions.length);
    expect(overview.recentActivity.length).toBeGreaterThan(overview.actions.length);
    expect(detail.action.policyChecks.length).toBeGreaterThanOrEqual(4);
    expect(detail.auditLogs.every((log) => log.actionId === detail.action.id)).toBe(true);
  });

  it("keeps queue helpers service-backed for the automation page", () => {
    const overview = getAutomationOverview();
    const drafted = getActionQueueByState("drafted");
    const executed = getActionQueueByState("executed");

    expect(overview.actions.length).toBeGreaterThan(overview.approvalQueue.length);
    expect(drafted.length).toBeGreaterThan(0);
    expect(executed.length).toBeGreaterThan(0);
    expect(overview.selectedAction.action.id).toBeDefined();
    expect(overview.rules.length).toBe(overview.ruleBuilder.length);
  });
});
