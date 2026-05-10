import { agentFindingSeeds } from "../data/mockAiEngine";
import type {
  AIFinding,
  AgentFindingEntityRef,
  AgentId,
  StructuredAiFinding
} from "../domain/types";
import { calculateAgentConfidence } from "./agentConfidenceService";
import { getNormalizedEntities } from "./normalizedEntityService";

function roundScore(value: number) {
  return Math.round(value * 10) / 10;
}

function getRiskWeight(riskLevel: StructuredAiFinding["riskLevel"]) {
  if (riskLevel === "critical") return 100;
  if (riskLevel === "high") return 82;
  if (riskLevel === "medium") return 58;
  return 30;
}

function getInputRefs(entityIds: string[]): AgentFindingEntityRef[] {
  const entities = getNormalizedEntities();

  return entityIds.flatMap((entityId) => {
    const entity = entities.find((candidate) => candidate.id === entityId);
    if (!entity) return [];
    return [{
      entityId: entity.id,
      entityType: entity.entityType,
      title: entity.title
    }];
  });
}

export function getStructuredAiFindings(): StructuredAiFinding[] {
  return agentFindingSeeds.map((seed) => {
    const inputEntityRefs = getInputRefs(seed.entityIds);
    const lineageRefs = getNormalizedEntities()
      .filter((entity) => seed.entityIds.includes(entity.id))
      .flatMap((entity) => entity.lineageIds);
    const confidenceBreakdown = calculateAgentConfidence({
      agentId: seed.agentId,
      findingId: seed.id,
      entityIds: seed.entityIds,
      ruleClarity: seed.ruleClarity,
      impactClarity: seed.impactClarity
    });
    const impactScore = seed.impactAmount > 0 ? Math.min(100, seed.impactAmount / 20000) : 0;
    const priorityScore = roundScore(
      impactScore * 0.34 +
        seed.urgencyScore * 0.2 +
        seed.frequencyScore * 0.16 +
        confidenceBreakdown.finalScore * 0.18 +
        getRiskWeight(seed.riskLevel) * 0.12
    );
    const recommendedAction = {
      id: `recommended-action-${seed.id}`,
      actionType: seed.actionType,
      label: seed.actionLabel,
      description: seed.actionDescription,
      owner: seed.actionOwner,
      expectedImpactAmount: seed.impactAmount,
      automationLevel: seed.automationLevel,
      approvalRequired: seed.approvalRequired,
      riskLevel: seed.riskLevel,
      nextStep: seed.actionNextStep
    };

    return {
      id: seed.id,
      workspaceId: "workspace-acme",
      agentId: seed.agentId,
      title: seed.title,
      summary: seed.summary,
      outputType: seed.outputType,
      riskLevel: seed.riskLevel,
      confidence: confidenceBreakdown.finalScore,
      confidenceSignals: confidenceBreakdown.signals,
      confidenceBreakdown,
      impactAmount: seed.impactAmount,
      urgencyScore: seed.urgencyScore,
      frequencyScore: seed.frequencyScore,
      priorityScore,
      approvalRequired: seed.approvalRequired || seed.riskLevel === "high" || seed.riskLevel === "critical",
      automationLevel: seed.automationLevel,
      inputEntityRefs,
      lineageRefs,
      explanationSummary: seed.explanationSummary,
      recommendedAction,
      automationIntent: {
        id: `automation-intent-${seed.id}`,
        findingId: seed.id,
        actionType: seed.actionType,
        title: seed.actionLabel,
        description: seed.actionDescription,
        targetEntityRefs: inputEntityRefs,
        automationLevel: seed.automationLevel,
        state: seed.automationState,
        approvalRequired: seed.approvalRequired || seed.riskLevel === "high" || seed.riskLevel === "critical",
        policyChecks: seed.policyChecks,
        rollbackPlan: seed.rollbackPlan,
        executableNow: false
      },
      createdAt: seed.createdAt
    };
  });
}

export function getRankedAiFindings() {
  return [...getStructuredAiFindings()].sort((a, b) => b.priorityScore - a.priorityScore);
}

export function getFindingsByAgent(agentId: AgentId) {
  return getStructuredAiFindings().filter((finding) => finding.agentId === agentId);
}

export function getAutomationDraftIntents() {
  return getStructuredAiFindings().map((finding) => finding.automationIntent);
}

export function getLegacyAiFindings(): AIFinding[] {
  return getStructuredAiFindings().map((finding) => ({
    id: finding.id,
    agentId: finding.agentId,
    title: finding.title,
    summary: finding.summary,
    outputType: finding.outputType,
    riskLevel: finding.riskLevel,
    confidence: finding.confidence,
    impactAmount: finding.impactAmount,
    approvalRequired: finding.approvalRequired,
    explanation: finding.explanationSummary,
    recommendedAction: finding.recommendedAction.description
  }));
}
