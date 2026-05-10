import { aiOperationsWorkspace } from "../data/mockOperatingSystem";
import type { AIFinding } from "../domain/types";

export function getAiOperationsEngine() {
  const agents = aiOperationsWorkspace.agents;
  const findings = aiOperationsWorkspace.findings;
  const totalImpact = findings.reduce((sum, finding) => sum + finding.impactAmount, 0);
  const avgConfidence = agents.reduce((sum, agent) => sum + agent.confidence, 0) / agents.length;

  return {
    agents,
    findings,
    totalImpact,
    avgConfidence,
    activeAgents: agents.filter((agent) => agent.status === "active").length
  };
}

export function getChiefOperationsBriefing() {
  const topFindings = [...aiOperationsWorkspace.findings].sort((a, b) => b.impactAmount - a.impactAmount);

  return {
    headline: "AI found recoverable loss, pending approvals, and preventable risk across connected sources.",
    topOpportunity: topFindings[0],
    biggestRisk: topFindings.find((finding) => finding.riskLevel === "high") || topFindings[0],
    findings: topFindings
  };
}

export function requiresApproval(finding: AIFinding) {
  return finding.approvalRequired || finding.riskLevel === "high" || finding.riskLevel === "critical";
}

