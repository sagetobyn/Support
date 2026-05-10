import { describe, expect, it } from "vitest";
import {
  getAdCampaignRecommendationWorkflow,
  getAutomationOverview,
  getCouponProfitabilityScenarios,
  getMarketingAutomationOverview,
  getMarketplaceSeoKeywordInsights,
  getReviewAndSentimentInsights
} from "@/features/ai-operations-os";

describe("Marketing / Growth Automation Layer foundation", () => {
  it("builds listing optimization drafts from operational evidence, not generic copy", () => {
    const overview = getMarketingAutomationOverview();
    const draft = overview.listingDrafts[0];

    expect(draft.titleDraft).toContain("Noise Air Buds Pro 2");
    expect(draft.bulletDrafts.length).toBeGreaterThan(1);
    expect(draft.descriptionDraft.length).toBeGreaterThan(40);
    expect(draft.linkedReturnIds).toContain("ret-11ab7c");
    expect(draft.linkedReviewIds).toContain("review-airbuds-fit");
    expect(draft.linkedRtoIds).toContain("rto-11ab7c");
    expect(draft.inventorySignal).toContain("Inventory");
    expect(draft.profitGuardrail).toContain("price");
  });

  it("filters SEO keyword opportunities through RTO, return, and inventory context", () => {
    const keywordInsights = getMarketplaceSeoKeywordInsights();

    expect(keywordInsights.length).toBeGreaterThan(1);
    expect(keywordInsights.every((insight) => insight.rtoRisk > 0)).toBe(true);
    expect(keywordInsights.every((insight) => insight.returnRisk > 0)).toBe(true);
    expect(keywordInsights.every((insight) => insight.inventoryFit > 0)).toBe(true);
    expect(keywordInsights.some((insight) => insight.recommendedUse.includes("inventory"))).toBe(true);
  });

  it("keeps competitor response profit-aware instead of blindly matching price", () => {
    const overview = getMarketingAutomationOverview();
    const competitor = overview.competitorIntelligence[0];

    expect(competitor.pricingDeltaPercent).toBeLessThan(0);
    expect(competitor.marginSafe).toBe(false);
    expect(competitor.responseRecommendation).toContain("Do not price-match");
    expect(competitor.inventoryWarning).toContain("margin");
    expect(competitor.automationActionId).toBe("action-competitor-response");
  });

  it("mines reviews and sentiment into listing and support-tone signals", () => {
    const { reviewInsights, sentimentInsights } = getReviewAndSentimentInsights();

    expect(reviewInsights.some((insight) => insight.linkedReturnIds.includes("ret-11ab7c"))).toBe(true);
    expect(reviewInsights.some((insight) => insight.listingFix.length > 20)).toBe(true);
    expect(reviewInsights.some((insight) => insight.supportToneSignal.length > 20)).toBe(true);
    expect(sentimentInsights.every((insight) => insight.linkedWorkflowId.length > 0)).toBe(true);
  });

  it("detects loss-making campaigns after spend, RTO, return, and inventory risk", () => {
    const recommendations = getAdCampaignRecommendationWorkflow();
    const lossMaking = recommendations.find((recommendation) => recommendation.lossMaking);

    expect(lossMaking).toBeDefined();
    expect(lossMaking?.deliveredProfit).toBeLessThan(0);
    expect(lossMaking?.rtoLoss).toBeGreaterThan(0);
    expect(lossMaking?.returnLoss).toBeGreaterThan(0);
    expect(lossMaking?.inventoryRisk).toBeGreaterThan(50);
    expect(lossMaking?.approvalRequired).toBe(true);
  });

  it("calculates coupon profitability and blocks scenarios below seller margin", () => {
    const scenarios = getCouponProfitabilityScenarios();
    const blocked = scenarios.find((scenario) => scenario.verdict === "blocked_by_margin");
    const safe = scenarios.find((scenario) => scenario.verdict === "safe_to_test");

    expect(blocked).toBeDefined();
    expect(safe).toBeDefined();
    expect(blocked?.calculatedMarginPercent).toBeLessThan(18);
    expect(blocked?.guardrail).toContain("18%");
    expect(safe?.calculatedMarginPercent).toBeGreaterThan(18);
  });

  it("routes every marketing action through the shared automation queue", () => {
    const marketing = getMarketingAutomationOverview();
    const automation = getAutomationOverview();
    const automationActionIds = automation.actions.map((action) => action.id);
    const marketingActionTypes = marketing.automationActions.map((action) => action.actionType);

    expect(marketing.automationActionIds.every((actionId) => automationActionIds.includes(actionId))).toBe(true);
    expect(marketingActionTypes).toEqual(expect.arrayContaining([
      "listing_optimization_draft",
      "seo_keyword_update_draft",
      "competitor_response_recommendation",
      "loss_making_campaign_pause_draft",
      "coupon_profitability_review",
      "festival_sale_plan_draft",
      "marketing_report_draft"
    ]));
    expect(marketing.automationActions.every((action) => action.mockExecutionResult.externalCallMade === false)).toBe(true);
  });

  it("exposes a complete route-facing marketing view model", () => {
    const overview = getMarketingAutomationOverview();

    expect(overview.recommendations.length).toBeGreaterThan(0);
    expect(overview.reportSections.length).toBeGreaterThan(0);
    expect(overview.festivalPlans[0]?.automationActionIds.length).toBeGreaterThan(1);
    expect(overview.totalProfitProtected).toBeGreaterThan(overview.recommendations[0].impactAmount);
    expect(overview.averageProfitScore).toBeGreaterThan(0);
    expect(overview.approvalRequired).toBeGreaterThan(0);
  });
});
