import { aiOperationsWorkspace } from "../data/mockOperatingSystem";

export function getMarketingAutomationOverview() {
  const recommendations = aiOperationsWorkspace.marketingRecommendations;
  const totalProfitProtected = recommendations.reduce((sum, recommendation) => sum + recommendation.impactAmount, 0);

  return {
    recommendations,
    totalProfitProtected,
    approvalRequired: recommendations.filter((recommendation) => recommendation.approvalRequired).length
  };
}

