import {
  OsActionTable,
  OsMetricCard,
  OsPageHeader,
  OsPanel,
  OsRiskPill,
  OsShell
} from "@/features/ai-operations-os/components/OsShell";
import { getCommandCenterOverview } from "@/features/ai-operations-os";

export default function AlertsReportsPage() {
  const overview = getCommandCenterOverview();

  return (
    <OsShell active="/alerts-reports">
      <OsPageHeader
        eyebrow="Dashboard + Alerts + Reports"
        title="Seller Command Center"
        subtitle="Show what the system found, what it did, what is at risk, and what needs approval. The dashboard is visibility, not the source of truth."
      />

      <OsPanel title="AI Daily Briefing" eyebrow="Beta">
        <div className="os-briefing-band">
          <strong>You can recover money from RTO, deductions, inventory, and settlement mismatches.</strong>
          <span>Dashboard reads from the unified data brain, AI findings, and automation logs.</span>
        </div>
      </OsPanel>

      <div className="os-metric-grid">
        {overview.metrics.slice(0, 6).map((metric) => <OsMetricCard metric={metric} key={metric.id} />)}
      </div>

      <div className="os-layout-two">
        <OsPanel title="Alerts & Notifications">
          <div className="os-finding-list">
            {overview.alerts.map((alert) => (
              <article key={alert.id}>
                <div>
                  <h3>{alert.title}</h3>
                  <OsRiskPill value={alert.riskLevel} />
                </div>
                <p>{alert.summary}</p>
                <small>{alert.recommendedAction}</small>
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Reports Hub">
          <div className="os-report-list">
            {overview.reports.map((report) => (
              <article key={report.id}>
                <strong>{report.title}</strong>
                <span>{report.cadence} · {report.status} · {report.downloadType.toUpperCase()}</span>
                <small>{report.owner} · {report.lastGenerated}</small>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>

      <OsPanel title="Pending Action Queue">
        <OsActionTable actions={overview.pendingActions} />
      </OsPanel>
    </OsShell>
  );
}

