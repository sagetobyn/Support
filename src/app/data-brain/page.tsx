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
        <div className="os-metric os-tone-success"><span>Data Sources</span><strong>18</strong><small>Current target registry</small></div>
      </div>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Unified Commerce Graph" eyebrow="AI-powered entity resolution">
          <OsCommerceGraph nodes={overview.graphNodes} />
        </OsPanel>
        <OsPanel title="Data Quality & Confidence">
          <OsQualityList metrics={overview.dataQuality} />
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
    </OsShell>
  );
}

