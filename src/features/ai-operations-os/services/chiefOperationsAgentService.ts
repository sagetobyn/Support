import type { ChiefOperationsBriefing } from "../domain/types";
import { getRankedAiFindings } from "./aiFindingService";

export function getChiefOperationsBriefing(): ChiefOperationsBriefing {
  const rankedFindings = getRankedAiFindings();
  const topOpportunity = rankedFindings[0];
  const biggestRisk = rankedFindings.find((finding) => finding.riskLevel === "critical" || finding.riskLevel === "high") || topOpportunity;
  const approvalRequiredCount = rankedFindings.filter((finding) => finding.approvalRequired).length;
  const totalPotentialImpact = rankedFindings.reduce((sum, finding) => sum + finding.impactAmount, 0);

  return {
    id: "chief-ops-briefing-20260510",
    headline: "AI found recoverable losses, preventable delivery risk, and approval-ready drafts across normalized seller data.",
    rankingMethod: "Financial Impact x Urgency/Risk x Frequency x Confidence",
    topOpportunity,
    biggestRisk,
    approvalRequiredCount,
    totalPotentialImpact,
    rankedFindings,
    explanationSummary:
      "The Chief Operations Agent ranked specialist outputs using normalized entity confidence, lineage coverage, source freshness, impact amount, urgency, and risk. No external action has been executed."
  };
}
