import {
  OsPageHeader,
  OsPanel,
  OsRiskPill,
  OsShell,
  OsStatusPill,
  formatInr
} from "@/features/ai-operations-os/components/OsShell";
import { getMarketingAutomationOverview } from "@/features/ai-operations-os";

export default function MarketingAutomationPage() {
  const overview = getMarketingAutomationOverview();

  return (
    <OsShell active="/marketing-automation">
      <OsPageHeader
        eyebrow="Marketing / Growth Automation"
        title="Profit-Aware Growth Operations"
        subtitle="Listing, ads, competitor, reviews, SEO, and campaign recommendations operate inside the same data brain and approval policy."
      />

      <div className="os-metric-grid">
        <div className="os-metric os-tone-success"><span>Profit Protected</span><strong>{formatInr(overview.totalProfitProtected)}</strong><small>Marketing actions with risk checks</small></div>
        <div className="os-metric"><span>Recommendations</span><strong>{overview.recommendations.length}</strong><small>Listing, ads, reviews, competitor</small></div>
        <div className="os-metric os-tone-warning"><span>Needs Approval</span><strong>{overview.approvalRequired}</strong><small>High-risk spend or price changes</small></div>
        <div className="os-metric"><span>Optimization Goal</span><strong>Profit</strong><small>Not raw sales volume</small></div>
      </div>

      <OsPanel title="Marketing Recommendations">
        <div className="os-finding-list os-finding-list--cards">
          {overview.recommendations.map((recommendation) => (
            <article key={recommendation.id}>
              <div>
                <h3>{recommendation.title}</h3>
                <OsRiskPill value={recommendation.riskLevel} />
              </div>
              <p>{recommendation.summary}</p>
              <strong>{formatInr(recommendation.impactAmount)} protected</strong>
              <small>{recommendation.profitGuardrail}</small>
              <OsStatusPill value={recommendation.approvalRequired ? "approval_required" : "draft_only"} />
            </article>
          ))}
        </div>
      </OsPanel>
    </OsShell>
  );
}

