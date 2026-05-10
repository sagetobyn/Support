import { leakageTrendPoints, marketplaceComparisonRows, topLossEntities } from "../data/mockCommandCenter";
import { aiOperationsWorkspace } from "../data/mockOperatingSystem";
import type {
  AgentHealthRow,
  AgentId,
  AutomationQueueItem,
  CommandCenterOverview,
  DashboardAlert,
  DashboardMetric,
  DashboardRecentActivity,
  ReportDownloadStub,
  StructuredAiFinding
} from "../domain/types";
import { getAiOperationsEngine } from "./aiInsightsService";
import { getAutomationOverview } from "./automationService";
import { getDataBrainOverview } from "./dataBrainService";
import { getIngestionOverview } from "./ingestionService";

function byAgent(findings: StructuredAiFinding[], agentId: AgentId) {
  return findings.find((finding) => finding.agentId === agentId);
}

function sumImpact(actions: AutomationQueueItem[]) {
  return actions.reduce((sum, action) => sum + action.impactAmount, 0);
}

function getOpenActions(actions: AutomationQueueItem[]) {
  return actions.filter((action) => action.state !== "executed" && action.state !== "reverted");
}

function getMoneySaved(actions: AutomationQueueItem[]) {
  return sumImpact(actions.filter((action) => action.state === "executed"));
}

function getMoneyAtRisk(actions: AutomationQueueItem[]) {
  return sumImpact(getOpenActions(actions).filter((action) => action.riskLevel === "high" || action.riskLevel === "medium"));
}

function buildMetric({
  id,
  label,
  value,
  tone,
  deltaLabel,
  sourceRefs,
  drilldownHref
}: Omit<DashboardMetric, "valueType">): DashboardMetric {
  return {
    id,
    label,
    value,
    valueType: id === "action_items" ? "count" : "money",
    tone,
    deltaLabel,
    sourceRefs,
    drilldownHref
  };
}

function buildDashboardAlerts(findings: StructuredAiFinding[], actions: AutomationQueueItem[]): DashboardAlert[] {
  const highRiskAlerts = findings
    .filter((finding) => finding.riskLevel === "high" || finding.riskLevel === "critical")
    .map((finding) => {
      const matchingAction = actions.find((action) => action.sourceFindingId === finding.id);

      return {
        id: `alert-${finding.id}`,
        title: finding.title,
        summary: finding.summary,
        riskLevel: finding.riskLevel,
        status: matchingAction?.policyStatus === "approval_ready" ? "approval_needed" : "open",
        createdAt: finding.createdAt,
        sourceFindingId: finding.id,
        actionId: matchingAction?.id,
        recommendedAction: finding.recommendedAction.label,
        drilldownHref: matchingAction ? `/automation?action=${matchingAction.id}` : `/ai-operations-engine?finding=${finding.id}`
      } satisfies DashboardAlert;
    });

  const approvalAlerts = actions
    .filter((action) => action.policyStatus === "blocked" || action.state === "awaiting_approval")
    .map((action) => ({
      id: `alert-${action.id}`,
      title: action.policyStatus === "blocked" ? `Policy blocked: ${action.title}` : `Approval needed: ${action.title}`,
      summary: action.description,
      riskLevel: action.riskLevel,
      status: action.policyStatus === "blocked" ? "in_review" : "approval_needed",
      createdAt: action.createdAt,
      sourceFindingId: action.sourceFindingId,
      actionId: action.id,
      recommendedAction: action.policyChecks.find((check) => check.status === "blocked")?.detail || action.rollbackPlan,
      drilldownHref: `/automation?action=${action.id}`
    } satisfies DashboardAlert));

  const seen = new Set<string>();
  return [...highRiskAlerts, ...approvalAlerts]
    .filter((alert) => {
      const key = alert.actionId || alert.sourceFindingId || alert.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function buildReportDownloadStubs(): ReportDownloadStub[] {
  return aiOperationsWorkspace.reports.map((report) => ({
    id: `download-${report.id}`,
    reportId: report.id,
    title: report.title,
    cadence: report.cadence,
    status: report.status,
    downloadType: report.downloadType,
    generatedAt: report.lastGenerated,
    owner: report.owner,
    drilldownHref: `/alerts-reports?report=${report.id}`,
    downloadHref: `/alerts-reports?download=${report.id}`,
    stubbed: true
  }));
}

function buildAgentHealth(engine: ReturnType<typeof getAiOperationsEngine>, actions: AutomationQueueItem[]): AgentHealthRow[] {
  return engine.agents.map((agent) => {
    const run = engine.agentRuns.find((candidate) => candidate.agentId === agent.id);
    const findings = engine.findings.filter((finding) => finding.agentId === agent.id);
    const linkedActions = actions.filter((action) =>
      findings.some((finding) => finding.id === action.sourceFindingId)
    );

    return {
      agentId: agent.id as AgentId,
      agentName: agent.name,
      status: run?.status || "ready",
      confidence: agent.confidence,
      openFindings: findings.length,
      linkedActionCount: linkedActions.length,
      lastRunAt: run?.completedAt || run?.startedAt || "not run",
      health: run?.status === "needs_data" ? "needs_data" : agent.status === "watching" ? "watching" : "healthy"
    };
  });
}

function buildRecentActivity(automation: ReturnType<typeof getAutomationOverview>): DashboardRecentActivity[] {
  return automation.recentActivity.slice(0, 7)
    .map((activity) => ({
      id: `dashboard-${activity.id}`,
      title: activity.title,
      detail: activity.detail,
      occurredAt: activity.occurredAt,
      tone: activity.tone,
      href: `/automation?action=${activity.actionId}`
    }));
}

export function getCommandCenterOverview(): CommandCenterOverview {
  const engine = getAiOperationsEngine();
  const automation = getAutomationOverview();
  const dataBrain = getDataBrainOverview();
  const ingestion = getIngestionOverview();
  const openActions = getOpenActions(automation.actions);
  const moneySaved = getMoneySaved(automation.actions);
  const moneyAtRisk = getMoneyAtRisk(automation.actions);
  const rtoFinding = byAgent(engine.findings, "rto-ndr-engine");
  const returnFinding = byAgent(engine.findings, "return-intelligence-engine");
  const settlementFinding = byAgent(engine.findings, "settlement-reconciliation-engine");
  const inventoryFinding = byAgent(engine.findings, "inventory-intelligence-engine");
  const recoverableMoney = automation.potentialImpact;
  const topOpportunity = engine.briefing.topOpportunity;
  const biggestRisk = engine.briefing.biggestRisk;
  const highRiskPincodeCount = topLossEntities.filter((entity) => entity.type === "pincode" && entity.rtoRisk >= 70).length;

  return {
    briefing: {
      id: "briefing-command-center-20260510",
      generatedAt: "2026-05-10T09:45:00.000Z",
      headline: "AI Daily Briefing",
      summary: `Recover ${recoverableMoney.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })} in open operational opportunities, protect ${moneySaved.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })} already saved through mock-executed internal actions, and review ${openActions.length} pending actions before marketplace writes are allowed.`,
      recoverableMoney,
      moneySaved,
      moneyAtRisk,
      topOpportunity: {
        label: topOpportunity.title,
        amount: topOpportunity.impactAmount,
        href: `/ai-operations-engine?finding=${topOpportunity.id}`
      },
      biggestRisk: {
        label: biggestRisk.title,
        amount: biggestRisk.impactAmount,
        href: `/ai-operations-engine?finding=${biggestRisk.id}`
      },
      focusArea: {
        label: "High RTO pincodes",
        count: highRiskPincodeCount,
        href: "/data-brain?entity=pincode"
      },
      sourceRefs: [
        `data-quality-${dataBrain.qualityScorecard.overallScore}`,
        `ingestion-sources-${ingestion.health.connectedSources}`,
        `automation-actions-${automation.actions.length}`
      ]
    },
    metrics: [
      buildMetric({
        id: "recoverable_money",
        label: "Recoverable Money",
        value: recoverableMoney,
        tone: "success",
        deltaLabel: `${automation.pendingApproval} approvals can unlock recovery`,
        sourceRefs: automation.actions.map((action) => action.id),
        drilldownHref: "/automation"
      }),
      buildMetric({
        id: "money_saved",
        label: "Money Saved",
        value: moneySaved,
        tone: "success",
        deltaLabel: `${automation.executed} internal actions mock-executed`,
        sourceRefs: automation.actions.filter((action) => action.state === "executed").map((action) => action.id),
        drilldownHref: "/automation?state=executed"
      }),
      buildMetric({
        id: "money_at_risk",
        label: "Money At Risk",
        value: moneyAtRisk,
        tone: "warning",
        deltaLabel: `${openActions.length} open actions need decisions`,
        sourceRefs: openActions.map((action) => action.id),
        drilldownHref: "/automation?state=open"
      }),
      buildMetric({
        id: "rto_risk",
        label: "RTO Risk",
        value: rtoFinding?.impactAmount || 0,
        tone: "danger",
        deltaLabel: `${highRiskPincodeCount} risky pincode clusters`,
        sourceRefs: rtoFinding ? [rtoFinding.id, ...rtoFinding.lineageRefs] : [],
        drilldownHref: "/ai-operations-engine?agent=rto-ndr-engine"
      }),
      buildMetric({
        id: "return_loss",
        label: "Return Loss",
        value: returnFinding?.impactAmount || 0,
        tone: "danger",
        deltaLabel: `${returnFinding?.confidence.toFixed(1) || 0}% confidence`,
        sourceRefs: returnFinding ? [returnFinding.id, ...returnFinding.lineageRefs] : [],
        drilldownHref: "/ai-operations-engine?agent=return-intelligence-engine"
      }),
      buildMetric({
        id: "settlement_leakage",
        label: "Settlement Leakage",
        value: settlementFinding?.impactAmount || 0,
        tone: "warning",
        deltaLabel: `${settlementFinding?.inputEntityRefs.length || 0} mapped evidence refs`,
        sourceRefs: settlementFinding ? [settlementFinding.id, ...settlementFinding.lineageRefs] : [],
        drilldownHref: "/ai-operations-engine?agent=settlement-reconciliation-engine"
      }),
      buildMetric({
        id: "stockout_risk",
        label: "Stockout Risk",
        value: inventoryFinding?.impactAmount || 0,
        tone: "warning",
        deltaLabel: `${dataBrain.skuMappings.length} SKU mappings checked`,
        sourceRefs: inventoryFinding ? [inventoryFinding.id, ...inventoryFinding.lineageRefs] : [],
        drilldownHref: "/data-brain?entity=inventory_item"
      }),
      buildMetric({
        id: "action_items",
        label: "Action Items",
        value: openActions.length,
        tone: openActions.length ? "danger" : "success",
        deltaLabel: `${automation.pendingApproval} approval requests`,
        sourceRefs: openActions.map((action) => action.id),
        drilldownHref: "/automation"
      })
    ],
    alerts: buildDashboardAlerts(engine.findings, automation.actions),
    reports: aiOperationsWorkspace.reports,
    reportDownloadStubs: buildReportDownloadStubs(),
    actionItems: openActions,
    marketplaceComparison: marketplaceComparisonRows,
    leakageTrend: leakageTrendPoints,
    topLossEntities,
    automationStatus: {
      totalActions: automation.actions.length,
      pendingApproval: automation.pendingApproval,
      autoExecuted: automation.executed,
      blocked: automation.blocked,
      avgConfidence: automation.avgConfidence,
      potentialImpact: automation.potentialImpact,
      recentActivityCount: automation.recentActivity.length
    },
    agentHealth: buildAgentHealth(engine, automation.actions),
    recentActivity: buildRecentActivity(automation)
  };
}

export function getReportsHub() {
  return buildReportDownloadStubs();
}
