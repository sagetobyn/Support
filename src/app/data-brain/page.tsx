import {
  OsCommerceGraph,
  OsPageHeader,
  OsPanel,
  OsShell,
  OsQualityList,
  formatCompact
} from "@/features/ai-operations-os/components/OsShell";
import { getDataBrainOverview } from "@/features/ai-operations-os";

export default function DataBrainPage() {
  const overview = getDataBrainOverview();

  return (
    <OsShell active="/data-brain">
      <OsPageHeader
        eyebrow="Unified Seller Data Brain"
        title="One Commerce Graph Across Every Marketplace"
        subtitle="Transform fragmented marketplace, logistics, finance, support, ads, and supplier data into canonical entities with confidence and lineage."
      />

      <div className="os-metric-grid">
        <div className="os-metric os-tone-success"><span>Records Unified</span><strong>{formatCompact(overview.totalEntities)}</strong><small>Entity graph foundation</small></div>
        <div className="os-metric os-tone-success"><span>Match Accuracy</span><strong>{overview.weightedConfidence.toFixed(1)}%</strong><small>Weighted by entity volume</small></div>
        <div className="os-metric"><span>Entity Types</span><strong>{overview.entities.length}</strong><small>Orders, SKU, returns, claims, and more</small></div>
        <div className="os-metric os-tone-success"><span>Data Sources</span><strong>{overview.sourceCount}</strong><small>{overview.lineageSummary.sourceCount} sources in lineage</small></div>
      </div>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Unified Commerce Graph" eyebrow="AI-powered entity resolution">
          <OsCommerceGraph nodes={overview.graphNodes} />
        </OsPanel>
        <OsPanel title="Data Quality & Confidence">
          <OsQualityList metrics={overview.dataQuality} />
          <div className="os-summary-stack">
            <small>{overview.confidenceSummary.high} high-confidence records</small>
            <small>{overview.mappingConfidence.marketplaceMappingCount} marketplace ID mappings</small>
            <small>{overview.lineageSummary.totalRecords} lineage records attached</small>
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Normalized Entity Summary">
          <div className="os-entity-grid">
            {overview.entities.map((entity) => (
              <article key={entity.entityType}>
                <span>{entity.entityType}</span>
                <strong>{formatCompact(entity.count)}</strong>
                <small>{entity.confidence.toFixed(1)}% confidence · {entity.sourceCount} sources</small>
              </article>
            ))}
          </div>
        </OsPanel>
        <OsPanel title="Marketplace To Unified ID Mapping">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead><tr><th>Entity</th><th>Unified ID</th><th>Amazon</th><th>Flipkart</th><th>Meesho</th><th>Confidence</th></tr></thead>
              <tbody>
                {overview.mappings.map((mapping) => (
                  <tr key={mapping.id}>
                    <td>{mapping.entityType}</td>
                    <td>{mapping.canonicalId}</td>
                    <td>{mapping.sourceIds.amazon}</td>
                    <td>{mapping.sourceIds.flipkart}</td>
                    <td>{mapping.sourceIds.meesho}</td>
                    <td>{mapping.confidence.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Normalized Record Preview" eyebrow="Canonical entities with confidence and lineage">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead><tr><th>Entity</th><th>Type</th><th>Status</th><th>Source</th><th>Confidence</th></tr></thead>
              <tbody>
                {overview.normalizedPreview.map((entity) => (
                  <tr key={entity.id}>
                    <td>
                      <strong>{entity.title}</strong>
                      <small>{entity.id}</small>
                    </td>
                    <td>{entity.entityType}</td>
                    <td>{entity.status.replaceAll("_", " ")}</td>
                    <td>{entity.sourceRefs.map((source) => source.connectorId).join(", ")}</td>
                    <td>{entity.confidence.score.toFixed(1)}% · {entity.confidence.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>

        <OsPanel title="SKU Mapping & Consolidation">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead><tr><th>Canonical SKU</th><th>Amazon</th><th>Flipkart</th><th>Meesho</th><th>Conflicts</th><th>Confidence</th></tr></thead>
              <tbody>
                {overview.skuMappings.map((mapping) => (
                  <tr key={mapping.id}>
                    <td>
                      <strong>{mapping.canonicalTitle}</strong>
                      <small>{mapping.canonicalSkuId}</small>
                    </td>
                    <td>{mapping.sourceSkuIds.amazon ?? "-"}</td>
                    <td>{mapping.sourceSkuIds.flipkart ?? "-"}</td>
                    <td>{mapping.sourceSkuIds.meesho ?? "-"}</td>
                    <td>{mapping.conflictCount}</td>
                    <td>{mapping.confidenceScore.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Marketplace ID Mapping" eyebrow="Cross-source identifiers resolved into canonical IDs">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead><tr><th>Entity</th><th>Canonical ID</th><th>Amazon</th><th>Flipkart</th><th>Meesho</th><th>Lineage</th></tr></thead>
              <tbody>
                {overview.marketplaceIdMappings.map((mapping) => (
                  <tr key={mapping.id}>
                    <td>{mapping.entityType}</td>
                    <td>{mapping.canonicalId}</td>
                    <td>{mapping.marketplaceIds.amazon ?? "-"}</td>
                    <td>{mapping.marketplaceIds.flipkart ?? "-"}</td>
                    <td>{mapping.marketplaceIds.meesho ?? "-"}</td>
                    <td>{mapping.lineageIds.length} records · {mapping.confidenceScore.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>

        <OsPanel title="Lineage Records" eyebrow="Every preview record points back to source rows">
          <div className="os-report-list">
            {overview.lineageRecords.slice(0, 6).map((lineage) => (
              <article key={lineage.id}>
                <div>
                  <strong>{lineage.entityId}</strong>
                  <span>{lineage.entityType}</span>
                </div>
                <span>{lineage.source.connectorId} · {lineage.source.sourceRecordId}</span>
                <small>{lineage.transformations.join(", ")}</small>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>
    </OsShell>
  );
}
