import { describe, expect, it } from "vitest";
import {
  canAutoExecute,
  convertInstructionToRuleDraft,
  getAiOperationsEngine,
  getAutomationOverview,
  getConnectorRegistry,
  getDataBrainOverview,
  getIngestionOverview,
  getMarketingAutomationOverview,
  requiresApproval
} from "@/features/ai-operations-os";

describe("AI Operations OS foundation", () => {
  it("keeps ingestion state centralized behind services", () => {
    const overview = getIngestionOverview();
    const registry = getConnectorRegistry();

    expect(overview.sources.length).toBeGreaterThan(5);
    expect(overview.health.totalRecords).toBeGreaterThan(0);
    expect(registry.statuses.connected).toBeGreaterThan(0);
    expect(overview.pipeline.map((stage) => stage.id)).toEqual(["extracting", "parsing", "cleaning", "normalizing", "validating"]);
  });

  it("exposes data brain confidence and canonical mappings", () => {
    const overview = getDataBrainOverview();

    expect(overview.totalEntities).toBeGreaterThan(1000000);
    expect(overview.weightedConfidence).toBeGreaterThan(95);
    expect(overview.mappings[0]?.canonicalId).toMatch(/^(prod|sku|ord|set|PROD|SKU|ORD)/);
  });

  it("requires approval for high-risk AI findings", () => {
    const engine = getAiOperationsEngine();
    const highRiskFinding = engine.findings.find((finding) => finding.riskLevel === "high");

    expect(highRiskFinding).toBeDefined();
    expect(requiresApproval(highRiskFinding!)).toBe(true);
  });

  it("blocks risky auto-execution but allows safe rule-based actions", () => {
    const automation = getAutomationOverview();
    const riskyAction = automation.actions.find((action) => action.riskLevel === "high");
    const safeExecutedAction = automation.actions.find((action) => action.state === "executed");

    expect(riskyAction).toBeDefined();
    expect(safeExecutedAction).toBeDefined();
    expect(canAutoExecute(riskyAction!)).toBe(false);
    expect(canAutoExecute(safeExecutedAction!)).toBe(true);
  });

  it("mocks prompt-to-config as structured rules", () => {
    const draft = convertInstructionToRuleDraft("Never reduce price below 18% margin.");

    expect(draft.domain).toBe("pricing_profitability");
    expect(draft.riskLevel).toBe("high");
    expect(draft.approvalRequired).toBe(true);
  });

  it("keeps marketing recommendations profit-aware", () => {
    const marketing = getMarketingAutomationOverview();

    expect(marketing.totalProfitProtected).toBeGreaterThan(0);
    expect(marketing.recommendations.every((recommendation) => recommendation.profitGuardrail.length > 0)).toBe(true);
  });
});
