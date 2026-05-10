import { describe, expect, it } from "vitest";
import {
  getAiOperationsEngine,
  getAutomationOverview,
  getCommandCenterOverview,
  getReportsHub
} from "@/features/ai-operations-os";

describe("Dashboard + Alerts + Reports foundation", () => {
  it("builds all requested command-center metrics from service state", () => {
    const dashboard = getCommandCenterOverview();
    const automation = getAutomationOverview();
    const metricIds = dashboard.metrics.map((metric) => metric.id);
    const executedSavings = automation.actions
      .filter((action) => action.state === "executed")
      .reduce((sum, action) => sum + action.impactAmount, 0);
    const openActions = automation.actions.filter((action) => action.state !== "executed" && action.state !== "reverted");

    expect(metricIds).toEqual([
      "recoverable_money",
      "money_saved",
      "money_at_risk",
      "rto_risk",
      "return_loss",
      "settlement_leakage",
      "stockout_risk",
      "action_items"
    ]);
    expect(dashboard.metrics.find((metric) => metric.id === "recoverable_money")?.value).toBe(automation.potentialImpact);
    expect(dashboard.metrics.find((metric) => metric.id === "money_saved")?.value).toBe(executedSavings);
    expect(dashboard.metrics.find((metric) => metric.id === "action_items")?.value).toBe(openActions.length);
    expect(dashboard.metrics.every((metric) => metric.sourceRefs.length > 0)).toBe(true);
    expect(dashboard.metrics.every((metric) => metric.drilldownHref.length > 0)).toBe(true);
  });

  it("composes the AI daily briefing from AI, automation, ingestion, and data-brain refs", () => {
    const dashboard = getCommandCenterOverview();
    const engine = getAiOperationsEngine();

    expect(dashboard.briefing.topOpportunity.label).toBe(engine.briefing.topOpportunity.title);
    expect(dashboard.briefing.biggestRisk.label).toBe(engine.briefing.biggestRisk.title);
    expect(dashboard.briefing.recoverableMoney).toBeGreaterThan(0);
    expect(dashboard.briefing.moneySaved).toBeGreaterThan(0);
    expect(dashboard.briefing.sourceRefs.join(" ")).toContain("data-quality");
    expect(dashboard.briefing.sourceRefs.join(" ")).toContain("ingestion-sources");
    expect(dashboard.briefing.sourceRefs.join(" ")).toContain("automation-actions");
  });

  it("turns high-risk findings and approval-gated actions into alerts with drilldowns", () => {
    const dashboard = getCommandCenterOverview();

    expect(dashboard.alerts.length).toBeGreaterThan(0);
    expect(dashboard.alerts.some((alert) => alert.status === "approval_needed")).toBe(true);
    expect(dashboard.alerts.every((alert) => alert.drilldownHref.startsWith("/"))).toBe(true);
    expect(dashboard.alerts.every((alert) => alert.recommendedAction.length > 0)).toBe(true);
  });

  it("exposes report download stubs without pretending to create real files", () => {
    const dashboard = getCommandCenterOverview();
    const reportsHub = getReportsHub();

    expect(dashboard.reportDownloadStubs.length).toBe(dashboard.reports.length);
    expect(reportsHub).toEqual(dashboard.reportDownloadStubs);
    expect(dashboard.reportDownloadStubs.every((report) => report.stubbed === true)).toBe(true);
    expect(dashboard.reportDownloadStubs.every((report) => report.downloadHref.includes("download="))).toBe(true);
  });

  it("provides marketplace comparison, leakage trend, and loss drilldown sections", () => {
    const dashboard = getCommandCenterOverview();

    expect(dashboard.marketplaceComparison.map((row) => row.marketplace)).toEqual(["amazon", "flipkart", "meesho"]);
    expect(dashboard.marketplaceComparison.every((row) => row.recoverableMoney > 0)).toBe(true);
    expect(dashboard.leakageTrend).toHaveLength(14);
    expect(dashboard.leakageTrend.every((point) => point.rtoLoss > 0 && point.returnLoss > 0)).toBe(true);
    expect(dashboard.topLossEntities.some((entity) => entity.type === "sku")).toBe(true);
    expect(dashboard.topLossEntities.some((entity) => entity.type === "pincode")).toBe(true);
    expect(dashboard.topLossEntities.every((entity) => entity.sourceEntityRefs.length > 0)).toBe(true);
    expect(dashboard.topLossEntities.every((entity) => entity.drilldownHref.startsWith("/data-brain"))).toBe(true);
  });

  it("surfaces automation status, agent health, recent activity, and action items for the page", () => {
    const dashboard = getCommandCenterOverview();
    const automation = getAutomationOverview();
    const engine = getAiOperationsEngine();

    expect(dashboard.automationStatus.totalActions).toBe(automation.actions.length);
    expect(dashboard.automationStatus.pendingApproval).toBe(automation.pendingApproval);
    expect(dashboard.agentHealth.length).toBe(engine.agents.length);
    expect(dashboard.agentHealth.some((agent) => agent.health === "needs_data")).toBe(true);
    expect(dashboard.recentActivity.length).toBeGreaterThan(0);
    expect(dashboard.recentActivity.every((activity) => activity.href.startsWith("/automation"))).toBe(true);
    expect(dashboard.actionItems.every((action) => action.state !== "executed" && action.state !== "reverted")).toBe(true);
  });
});
