import {
  adCampaignRecommendations,
  competitorIntelligence,
  couponProfitabilityScenarios,
  festivalSalePlans,
  listingOptimizationDrafts,
  marketingRecommendations,
  marketingReportSections,
  reviewMiningInsights,
  sentimentInsights,
  seoKeywordInsights
} from "../data/mockMarketingAutomation";
import type {
  CouponProfitabilityScenario,
  MarketingAutomationOverview
} from "../domain/types";
import { getAutomationActions } from "./automationService";

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function isLossMakingCampaign(deliveredProfit: number) {
  return deliveredProfit < 0;
}

function computeCouponMargin(scenario: CouponProfitabilityScenario) {
  if (!scenario.grossRevenue) return 0;
  return Math.round((scenario.contributionProfit / scenario.grossRevenue) * 1000) / 10;
}

function getMarketingAutomationActionIds() {
  return unique([
    ...listingOptimizationDrafts.map((draft) => draft.automationActionId),
    ...seoKeywordInsights.flatMap((insight) => insight.automationActionId ? [insight.automationActionId] : []),
    ...competitorIntelligence.flatMap((item) => item.automationActionId ? [item.automationActionId] : []),
    ...adCampaignRecommendations.map((recommendation) => recommendation.automationActionId),
    ...couponProfitabilityScenarios.map((scenario) => scenario.automationActionId),
    ...festivalSalePlans.flatMap((plan) => plan.automationActionIds),
    ...marketingReportSections.flatMap((section) => section.actionIds)
  ]);
}

export function getListingOptimizationWorkflow() {
  return listingOptimizationDrafts;
}

export function getMarketplaceSeoKeywordInsights() {
  return seoKeywordInsights;
}

export function getCompetitorIntelligence() {
  return competitorIntelligence;
}

export function getReviewAndSentimentInsights() {
  return {
    reviewInsights: reviewMiningInsights,
    sentimentInsights
  };
}

export function getAdCampaignRecommendationWorkflow() {
  return adCampaignRecommendations.map((recommendation) => ({
    ...recommendation,
    lossMaking: isLossMakingCampaign(recommendation.deliveredProfit),
    netAfterRiskCosts: recommendation.attributedRevenue - recommendation.currentSpend - recommendation.rtoLoss - recommendation.returnLoss
  }));
}

export function getCouponProfitabilityScenarios() {
  return couponProfitabilityScenarios.map((scenario) => ({
    ...scenario,
    calculatedMarginPercent: computeCouponMargin(scenario)
  }));
}

export function getFestivalSalePlanningFoundation() {
  return festivalSalePlans;
}

export function getMarketingAutomationOverview(): MarketingAutomationOverview {
  const automationActionIds = getMarketingAutomationActionIds();
  const allActions = getAutomationActions();
  const automationActions = allActions.filter((action) => automationActionIds.includes(action.id));
  const adRecommendations = getAdCampaignRecommendationWorkflow();
  const couponScenarios = getCouponProfitabilityScenarios();
  const positiveCouponContribution = couponScenarios
    .filter((scenario) => scenario.verdict !== "blocked_by_margin")
    .reduce((sum, scenario) => sum + scenario.contributionProfit, 0);
  const profitSignals = [
    ...adRecommendations.map((recommendation) =>
      recommendation.deliveredProfit >= 0
        ? Math.min(100, 65 + recommendation.deliveredProfit / 2000)
        : Math.max(0, 50 + recommendation.deliveredProfit / 1000)
    ),
    ...couponScenarios.map((scenario) => Math.max(0, scenario.marginPercent)),
    ...listingOptimizationDrafts.map((draft) => draft.confidence)
  ];
  const averageProfitScore = profitSignals.length
    ? Math.round(profitSignals.reduce((sum, signal) => sum + signal, 0) / profitSignals.length)
    : 0;

  return {
    recommendations: marketingRecommendations,
    listingDrafts: getListingOptimizationWorkflow(),
    keywordInsights: getMarketplaceSeoKeywordInsights(),
    competitorIntelligence: getCompetitorIntelligence(),
    reviewInsights: reviewMiningInsights,
    sentimentInsights,
    adRecommendations,
    couponScenarios,
    festivalPlans: getFestivalSalePlanningFoundation(),
    reportSections: marketingReportSections,
    automationActions,
    automationActionIds,
    totalProfitProtected:
      marketingRecommendations.reduce((sum, recommendation) => sum + recommendation.impactAmount, 0) + positiveCouponContribution,
    approvalRequired: automationActions.filter((action) => action.approvalRequired || action.policyStatus === "approval_ready").length,
    activeWorkflows:
      listingOptimizationDrafts.length +
      seoKeywordInsights.length +
      competitorIntelligence.length +
      reviewMiningInsights.length +
      adRecommendations.length +
      couponScenarios.length +
      festivalSalePlans.length,
    lossMakingCampaignCount: adRecommendations.filter((recommendation) => recommendation.lossMaking).length,
    averageProfitScore
  };
}
