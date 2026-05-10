import Link from "next/link";
import {
  formatInr,
  OsActionTable,
  OsPageHeader,
  OsPanel,
  OsRiskPill,
  OsShell,
  OsStatusPill
} from "@/features/ai-operations-os/components/OsShell";
import { getCommandCenterOverview } from "@/features/ai-operations-os";
import type { DashboardMetric, LeakageTrendPoint, MarketplaceChannel } from "@/features/ai-operations-os";

function formatMetric(metric: DashboardMetric) {
  if (metric.valueType === "money") return formatInr(metric.value);
  if (metric.valueType === "percent") return `${metric.value.toFixed(1)}%`;
  return metric.value.toLocaleString("en-IN");
}

function marketplaceLabel(marketplace: MarketplaceChannel) {
  return marketplace.charAt(0).toUpperCase() + marketplace.slice(1);
}

function getTrendMax(points: LeakageTrendPoint[]) {
  return Math.max(
    ...points.flatMap((point) => [point.rtoLoss, point.returnLoss, point.settlementLeakage, point.stockoutRisk])
  );
}

export default function AlertsReportsPage() {
  const overview = getCommandCenterOverview();
  const trendMax = getTrendMax(overview.leakageTrend);
  const marketplaceMax = Math.max(...overview.marketplaceComparison.map((row) => row.recoverableMoney));

  return (
    <OsShell active="/alerts-reports">
      <OsPageHeader
        eyebrow="Dashboard + Alerts + Reports"
        title="Exception-Based Command Center"
        subtitle="Shows only what needs attention: approvals, failures, proof, risks, and report evidence from the data brain, AI findings, and automation logs."
        actions={<Link className="os-button os-button--secondary" href="/automation-coverage">Automation Truth</Link>}
      />

      <OsPanel
        title={overview.briefing.headline}
        eyebrow="Live Command Brief"
        action={<Link className="os-button os-button--secondary" href={overview.briefing.topOpportunity.href}>View Full Briefing</Link>}
      >
        <div className="os-briefing-band os-briefing-band--dashboard">
          <div>
            <strong>{overview.briefing.summary}</strong>
            <div className="os-briefing-chips">
              <Link href={overview.briefing.topOpportunity.href}>
                Top Opportunity <b>{overview.briefing.topOpportunity.label}</b> {formatInr(overview.briefing.topOpportunity.amount)}
              </Link>
              <Link href={overview.briefing.biggestRisk.href}>
                Biggest Risk <b>{overview.briefing.biggestRisk.label}</b> {formatInr(overview.briefing.biggestRisk.amount)}
              </Link>
              <Link href={overview.briefing.focusArea.href}>
                Focus Area <b>{overview.briefing.focusArea.label}</b> {overview.briefing.focusArea.count}
              </Link>
            </div>
          </div>
        </div>
      </OsPanel>

      <div className="os-dashboard-metric-grid">
        {overview.metrics.map((metric) => (
          <Link className={`os-metric os-tone-${metric.tone}`} href={metric.drilldownHref} key={metric.id}>
            <span>{metric.label}</span>
            <strong>{formatMetric(metric)}</strong>
            <small>{metric.deltaLabel}</small>
          </Link>
        ))}
      </div>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Alerts & Notifications" action={<Link href="/alerts-reports?view=alerts">View All Alerts</Link>}>
          <div className="os-finding-list os-alert-list">
            {overview.alerts.map((alert) => (
              <article key={alert.id}>
                <div>
                  <h3>{alert.title}</h3>
                  <OsRiskPill value={alert.riskLevel} />
                </div>
                <p>{alert.summary}</p>
                <footer>
                  <small>{alert.createdAt}</small>
                  <Link href={alert.drilldownHref}>{alert.recommendedAction}</Link>
                </footer>
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Marketplace Comparison" action={<Link href="/data-brain">Data Brain</Link>}>
          <div className="os-marketplace-comparison">
            {overview.marketplaceComparison.map((row) => {
              const width = `${Math.round((row.recoverableMoney / marketplaceMax) * 100)}%`;

              return (
                <Link href={row.drilldownHref} key={row.id}>
                  <div>
                    <strong>{row.label}</strong>
                    <span>{formatInr(row.recoverableMoney)}</span>
                  </div>
                  <div className="os-bar-track" aria-label={`${row.label} recoverable money`}>
                    <span className="os-bar-fill" style={{ width }} />
                  </div>
                  <small>{row.actionItems} actions · {formatInr(row.moneyAtRisk)} at risk</small>
                </Link>
              );
            })}
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Leakage Trend" action={<Link href="/alerts-reports?chart=leakage">Last 14 Days</Link>}>
          <div className="os-trend-legend">
            <span className="rto">RTO loss</span>
            <span className="returns">Return loss</span>
            <span className="settlement">Settlement leakage</span>
            <span className="stockout">Stockout risk</span>
          </div>
          <div className="os-trend-chart" aria-label="Fourteen day leakage trend">
            {overview.leakageTrend.map((point) => (
              <div className="os-trend-column" key={point.date}>
                <div className="os-trend-bars">
                  <span className="rto" style={{ height: `${Math.max(8, (point.rtoLoss / trendMax) * 100)}%` }} />
                  <span className="returns" style={{ height: `${Math.max(8, (point.returnLoss / trendMax) * 100)}%` }} />
                  <span className="settlement" style={{ height: `${Math.max(8, (point.settlementLeakage / trendMax) * 100)}%` }} />
                  <span className="stockout" style={{ height: `${Math.max(8, (point.stockoutRisk / trendMax) * 100)}%` }} />
                </div>
                <small>{point.date.replace("May ", "")}</small>
              </div>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Reports Hub" action={<Link href="/alerts-reports?view=reports">View All Reports</Link>}>
          <div className="os-report-list">
            {overview.reportDownloadStubs.map((report) => (
              <article key={report.id}>
                <div>
                  <strong>{report.title}</strong>
                  <OsStatusPill value={report.status} />
                </div>
                <span>{report.cadence} · {report.downloadType.toUpperCase()} · {report.generatedAt}</span>
                <footer>
                  <small>{report.owner}</small>
                  <Link href={report.downloadHref}>Download Stub</Link>
                </footer>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Top Loss-Making SKUs / Pincodes" action={<Link href="/data-brain?view=losses">View Drilldowns</Link>}>
          <div className="os-table-wrap">
            <table className="os-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>SKU / Pincode</th>
                  <th>Marketplaces</th>
                  <th>Loss</th>
                  <th>Risk</th>
                  <th>Drilldown</th>
                </tr>
              </thead>
              <tbody>
                {overview.topLossEntities.map((entity) => (
                  <tr key={entity.id}>
                    <td>{entity.rank}</td>
                    <td>
                      <strong>{entity.label}</strong>
                      <small>{entity.subtitle}</small>
                    </td>
                    <td>{entity.marketplaces.map(marketplaceLabel).join(", ")}</td>
                    <td>
                      {formatInr(entity.lossAmount)}
                      <small>{entity.lossPercent}% loss rate</small>
                    </td>
                    <td>
                      <small>RTO {entity.rtoRisk}% · Return {entity.returnRisk}%</small>
                    </td>
                    <td><Link href={entity.drilldownHref}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>

        <OsPanel title="Automation Status" action={<Link href="/automation">Open Automation</Link>}>
          <div className="os-state-grid os-dashboard-state-grid">
            <article>
              <span>Total Actions</span>
              <strong>{overview.automationStatus.totalActions}</strong>
              <small>{formatInr(overview.automationStatus.potentialImpact)} potential impact</small>
            </article>
            <article>
              <span>Approval Queue</span>
              <strong>{overview.automationStatus.pendingApproval}</strong>
              <small>Seller policy-gated</small>
            </article>
            <article>
              <span>Auto-Executed</span>
              <strong>{overview.automationStatus.autoExecuted}</strong>
              <small>Mock internal actions only</small>
            </article>
            <article>
              <span>Blocked</span>
              <strong>{overview.automationStatus.blocked}</strong>
              <small>No external execution</small>
            </article>
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Agent Health" action={<Link href="/ai-operations-engine">AI Engine</Link>}>
          <div className="os-agent-health-grid">
            {overview.agentHealth.map((agent) => (
              <Link className={`os-agent-health os-agent-health-${agent.health}`} href={`/ai-operations-engine?agent=${agent.agentId}`} key={agent.agentId}>
                <div>
                  <strong>{agent.agentName}</strong>
                  <OsStatusPill value={agent.status} />
                </div>
                <span>{agent.confidence}% confidence</span>
                <small>{agent.openFindings} findings · {agent.linkedActionCount} actions</small>
              </Link>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Recent Activity" action={<Link href="/automation?view=activity">View Timeline</Link>}>
          <div className="os-timeline os-dashboard-activity">
            {overview.recentActivity.map((activity) => (
              <Link className={`os-timeline-${activity.tone}`} href={activity.href} key={activity.id}>
                <span>{activity.occurredAt}</span>
                <div>
                  <strong>{activity.title}</strong>
                  <small>{activity.detail}</small>
                </div>
              </Link>
            ))}
          </div>
        </OsPanel>
      </div>

      <OsPanel title="Action Items" action={<Link href="/automation">Review Queue</Link>}>
        <OsActionTable actions={overview.actionItems} />
      </OsPanel>
    </OsShell>
  );
}
