import { describe, expect, it } from "vitest";
import {
  getAgentInputRequirements,
  getAgentRegistry,
  getAiOperationsEngine,
  getChiefOperationsBriefing,
  requiresApproval
} from "@/features/ai-operations-os";

const requiredAgentIds = [
  "chief-operations-agent",
  "profit-leakage-engine",
  "rto-ndr-engine",
  "return-intelligence-engine",
  "settlement-reconciliation-engine",
  "claims-recovery-agent",
  "inventory-intelligence-engine",
  "customer-support-agent",
  "pricing-profitability-agent",
  "marketing-growth-agent"
];

describe("AI Operations Engine foundation", () => {
  it("registers the requested agents with operating contracts", () => {
    const registry = getAgentRegistry();
    const ids = registry.map((agent) => agent.id);

    expect(ids).toEqual(requiredAgentIds);
    expect(registry.every((agent) => agent.purpose.length > 0)).toBe(true);
    expect(registry.every((agent) => agent.inputRequirements.length > 0)).toBe(true);
    expect(registry.every((agent) => agent.possibleActions.length > 0)).toBe(true);
    expect(registry.every((agent) => agent.modelConfigId.length > 0)).toBe(true);
    expect(getAgentInputRequirements("rto-ndr-engine").map((input) => input.entityType)).toEqual(expect.arrayContaining(["shipment", "ndr", "pincode"]));
  });

  it("ranks findings through the Chief Operations Agent priority formula", () => {
    const briefing = getChiefOperationsBriefing();

    expect(briefing.rankingMethod).toContain("Financial Impact");
    expect(briefing.rankedFindings.length).toBeGreaterThan(5);
    briefing.rankedFindings.slice(1).forEach((finding, index) => {
      expect(briefing.rankedFindings[index].priorityScore).toBeGreaterThanOrEqual(finding.priorityScore);
    });
    expect(briefing.topOpportunity.priorityScore).toBe(briefing.rankedFindings[0].priorityScore);
  });

  it("emits structured findings with confidence, explanations, inputs, lineage, and automation intents", () => {
    const engine = getAiOperationsEngine();

    expect(engine.findings.length).toBeGreaterThanOrEqual(8);
    engine.findings.forEach((finding) => {
      expect(finding.explanationSummary.length).toBeGreaterThan(20);
      expect(finding.confidence).toBeGreaterThan(70);
      expect(finding.confidenceSignals.length).toBeGreaterThanOrEqual(4);
      expect(finding.inputEntityRefs.length).toBeGreaterThan(0);
      expect(finding.lineageRefs.length).toBeGreaterThan(0);
      expect(finding.recommendedAction.label.length).toBeGreaterThan(0);
      expect(finding.automationIntent.findingId).toBe(finding.id);
      expect(finding.automationIntent.executableNow).toBe(false);
    });
  });

  it("keeps high-risk findings approval-gated and non-executable", () => {
    const engine = getAiOperationsEngine();
    const highRiskFindings = engine.findings.filter((finding) => finding.riskLevel === "high");

    expect(highRiskFindings.length).toBeGreaterThan(0);
    highRiskFindings.forEach((finding) => {
      expect(requiresApproval(finding)).toBe(true);
      expect(finding.automationIntent.approvalRequired).toBe(true);
      expect(finding.automationIntent.executableNow).toBe(false);
    });
  });

  it("keeps the Marketing/Growth Agent as a profit-aware skeleton", () => {
    const engine = getAiOperationsEngine();
    const marketingAgent = engine.agents.find((agent) => agent.id === "marketing-growth-agent");
    const marketingFinding = engine.findings.find((finding) => finding.agentId === "marketing-growth-agent");

    expect(marketingAgent?.status).toBe("needs_data");
    expect(marketingFinding?.impactAmount).toBe(0);
    expect(marketingFinding?.automationLevel).toBe(1);
    expect(marketingFinding?.recommendedAction.description.toLowerCase()).toContain("profit");
    expect(marketingFinding?.automationIntent.policyChecks.join(" ").toLowerCase()).toContain("profit");
    expect(marketingFinding?.automationIntent.executableNow).toBe(false);
  });

  it("composes a route-ready AI engine view model", () => {
    const engine = getAiOperationsEngine();

    expect(engine.briefing.topOpportunity).toBeDefined();
    expect(engine.agentRuns.length).toBe(engine.agents.length);
    expect(engine.automationIntents.length).toBe(engine.findings.length);
    expect(engine.confidenceBreakdowns.length).toBe(engine.findings.length);
    expect(engine.executableIntentCount).toBe(0);
    expect(engine.approvalRequiredCount).toBeGreaterThan(0);
  });
});
