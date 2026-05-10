import type { RiskLevel } from "../domain/types";
import { getAgentRegistry, getAgentRuns } from "./agentRegistryService";
import { getAutomationDraftIntents, getLegacyAiFindings, getStructuredAiFindings } from "./aiFindingService";
import { getChiefOperationsBriefing as buildChiefOperationsBriefing } from "./chiefOperationsAgentService";

export function getAiOperationsEngine() {
  const agents = getAgentRegistry();
  const findings = getStructuredAiFindings();
  const automationIntents = getAutomationDraftIntents();
  const totalImpact = findings.reduce((sum, finding) => sum + finding.impactAmount, 0);
  const avgConfidence = agents.reduce((sum, agent) => sum + agent.confidence, 0) / agents.length;

  return {
    agents,
    findings,
    legacyFindings: getLegacyAiFindings(),
    agentRuns: getAgentRuns(),
    automationIntents,
    confidenceBreakdowns: findings.map((finding) => finding.confidenceBreakdown),
    briefing: buildChiefOperationsBriefing(),
    totalImpact,
    avgConfidence,
    activeAgents: agents.filter((agent) => agent.status === "active").length,
    approvalRequiredCount: findings.filter((finding) => finding.approvalRequired).length,
    draftIntentCount: automationIntents.length,
    executableIntentCount: automationIntents.filter((intent) => intent.executableNow).length
  };
}

export function getChiefOperationsBriefing() {
  return buildChiefOperationsBriefing();
}

export function requiresApproval(finding: { approvalRequired: boolean; riskLevel: RiskLevel }) {
  return finding.approvalRequired || finding.riskLevel === "high" || finding.riskLevel === "critical";
}
