import {
  OsPageHeader,
  OsPanel,
  OsShell,
  OsSourceGrid,
  OsStatusPill,
  OsQualityList,
  formatCompact
} from "@/features/ai-operations-os/components/OsShell";
import { getIngestionOverview } from "@/features/ai-operations-os";

export default function DataIngestionPage() {
  const overview = getIngestionOverview();

  return (
    <OsShell active="/data-ingestion">
      <OsPageHeader
        eyebrow="Data Ingestion Layer"
        title="Unified, Reliable, Intelligent Ingestion"
        subtitle="Pull, parse, clean, normalize, validate, and store seller data before any AI or automation decision is made."
      />

      <div className="os-metric-grid">
        <div className="os-metric os-tone-success"><span>Connected Sources</span><strong>{overview.health.connectedSources}/{overview.health.totalSources}</strong><small>{overview.health.syncingSources} syncing</small></div>
        <div className="os-metric"><span>Records Processed</span><strong>{formatCompact(overview.health.totalRecords)}</strong><small>Across all mock sources</small></div>
        <div className="os-metric os-tone-warning"><span>Retry Eligible</span><strong>{overview.health.retryableSources}</strong><small>{overview.health.failedSources} failed, {overview.health.staleSources} stale</small></div>
        <div className="os-metric os-tone-success"><span>Quality Score</span><strong>{overview.qualityScorecard.overallScore.toFixed(1)}%</strong><small>{overview.health.overallStatus.replaceAll("_", " ")}</small></div>
      </div>

      <div className="os-layout-three">
        <OsPanel title="Connector Registry" eyebrow="APIs, uploads, inboxes, bank files, courier feeds">
          <OsSourceGrid sources={overview.sources} />
        </OsPanel>

        <OsPanel title="Ingestion Pipeline">
          <div className="os-pipeline">
            {overview.pipeline.map((stage) => (
              <article key={stage.id}>
                <div>
                  <strong>{stage.label}</strong>
                  <p>{stage.description}</p>
                </div>
                <OsStatusPill value={stage.status} />
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Data Quality Overview">
          <OsQualityList metrics={overview.quality} />
          <div className="os-summary-stack">
            <small>Parse accuracy {overview.qualityScorecard.parseAccuracy.toFixed(1)}%</small>
            <small>Duplicate rate {overview.qualityScorecard.duplicateRate.toFixed(2)}%</small>
            <small>Missing fields {overview.qualityScorecard.missingFieldRate.toFixed(2)}%</small>
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Connector Capabilities" eyebrow="Mock-only adapters; no live credentials">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead><tr><th>Connector</th><th>Category</th><th>Inputs</th><th>Permissions</th><th>Status</th></tr></thead>
              <tbody>
                {overview.connectors.map((connector) => (
                  <tr key={connector.id}>
                    <td>
                      <strong>{connector.label}</strong>
                      <small>{connector.notes}</small>
                    </td>
                    <td>{connector.category}</td>
                    <td>{connector.supportedInputs.join(", ")}</td>
                    <td>{connector.permissions.slice(0, 3).join(", ")}</td>
                    <td><OsStatusPill value={connector.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>

        <OsPanel title="Ingestion Jobs" eyebrow="Status, retries, and source freshness">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead><tr><th>Job</th><th>Stage</th><th>Records</th><th>Failed</th><th>Retry</th><th>Status</th></tr></thead>
              <tbody>
                {overview.jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <strong>{job.sourceLabel}</strong>
                      <small>{job.message}</small>
                    </td>
                    <td>{job.currentStage}</td>
                    <td>{formatCompact(job.successCount)} / {formatCompact(job.recordCount)}</td>
                    <td>{job.failedCount.toLocaleString("en-IN")}</td>
                    <td>{job.nextRetryAt ? "scheduled" : job.retryCount ? "used" : "none"}</td>
                    <td><OsStatusPill value={job.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Source Freshness">
          <div className="os-report-list">
            {overview.freshness.map((source) => (
              <article key={source.connectorId}>
                <div>
                  <strong>{source.sourceLabel}</strong>
                  <OsStatusPill value={source.status} />
                </div>
                <span>{source.freshnessLabel}</span>
                <small>{source.freshnessMinutes} minutes since the last healthy source event</small>
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Ingestion Activity">
          <div className="os-report-list">
            {overview.activity.map((activity) => (
              <article key={activity.id}>
                <div>
                  <strong>{activity.label}</strong>
                  <OsStatusPill value={activity.status} />
                </div>
                <span>{formatCompact(activity.recordCount)} records · {activity.occurredAt}</span>
                <small>{activity.detail}</small>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>
    </OsShell>
  );
}
