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
        <div className="os-metric os-tone-warning"><span>Failed Sources</span><strong>{overview.health.failedSources}</strong><small>Retry-ready skeleton</small></div>
        <div className="os-metric os-tone-success"><span>Overall Status</span><strong>{overview.health.overallStatus.replaceAll("_", " ")}</strong><small>Dashboard reads this state</small></div>
      </div>

      <div className="os-layout-three">
        <OsPanel title="Data Sources">
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
        </OsPanel>
      </div>
    </OsShell>
  );
}

