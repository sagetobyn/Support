import {
  OsActionTable,
  OsPageHeader,
  OsPanel,
  OsRiskPill,
  OsShell,
  OsStatusPill,
  formatInr
} from "@/features/ai-operations-os/components/OsShell";
import { getMarketingAutomationOverview } from "@/features/ai-operations-os";

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function formatSignedPercent(value: number) {
  return `${value > 0 ? "+" : ""}${formatPercent(value)}`;
}

export default function MarketingAutomationPage() {
  const overview = getMarketingAutomationOverview();

  return (
    <OsShell active="/marketing-automation">
      <OsPageHeader
        eyebrow="Marketing / Growth Automation"
        title="Profit-Aware Growth Operations"
        subtitle="Listing, ads, competitor, reviews, SEO, coupons, and sale planning stay tied to profit, inventory, returns, RTO, and seller rules."
      />

      <div className="os-metric-grid">
        <div className="os-metric os-tone-success">
          <span>Profit Protected</span>
          <strong>{formatInr(overview.totalProfitProtected)}</strong>
          <small>Growth actions after margin and risk checks</small>
        </div>
        <div className="os-metric">
          <span>Active Workflows</span>
          <strong>{overview.activeWorkflows}</strong>
          <small>Listings, ads, SEO, reviews, coupons</small>
        </div>
        <div className="os-metric os-tone-warning">
          <span>Needs Approval</span>
          <strong>{overview.approvalRequired}</strong>
          <small>Shared automation policy controls</small>
        </div>
        <div className="os-metric os-tone-danger">
          <span>Loss-making Campaigns</span>
          <strong>{overview.lossMakingCampaignCount}</strong>
          <small>Detected after RTO and return costs</small>
        </div>
      </div>

      <OsPanel title="Profit-Aware Growth Recommendations">
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

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Listing Optimization Workflow" eyebrow="Review, returns, RTO, and inventory-aware drafts">
          <div className="os-finding-list">
            {overview.listingDrafts.map((draft) => (
              <article key={draft.id}>
                <div>
                  <h3>{draft.titleDraft}</h3>
                  <OsStatusPill value={draft.status} />
                </div>
                <p>{draft.reason}</p>
                <div className="os-copy-draft">
                  <span>Current title</span>
                  <strong>{draft.currentTitle}</strong>
                  <span>Bullet draft</span>
                  <ul>
                    {draft.bulletDrafts.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <span>Description draft</span>
                  <p>{draft.descriptionDraft}</p>
                </div>
                <small>{draft.inventorySignal}</small>
                <small>{draft.profitGuardrail}</small>
                <div className="os-chip-row">
                  <span>SKU {draft.skuId}</span>
                  <span>Returns {draft.linkedReturnIds.join(", ")}</span>
                  <span>Reviews {draft.linkedReviewIds.join(", ")}</span>
                  <span>Action {draft.automationActionId}</span>
                </div>
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Marketplace SEO Keyword Insights" eyebrow="Search intent filtered by risk">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Rank</th>
                  <th>Opportunity</th>
                  <th>Risk Fit</th>
                  <th>Recommended Use</th>
                </tr>
              </thead>
              <tbody>
                {overview.keywordInsights.map((insight) => (
                  <tr key={insight.id}>
                    <td>
                      <strong>{insight.keyword}</strong>
                      <small>{insight.marketplace} - {insight.searchIntent}</small>
                    </td>
                    <td>{insight.currentRank}</td>
                    <td>{insight.opportunityScore}%</td>
                    <td>
                      <small>RTO {insight.rtoRisk}%</small>
                      <small>Return {insight.returnRisk}%</small>
                      <small>Inventory {insight.inventoryFit}%</small>
                    </td>
                    <td>{insight.recommendedUse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Competitor Listing + Pricing Intelligence">
          <div className="os-finding-list">
            {overview.competitorIntelligence.map((item) => (
              <article key={item.id}>
                <div>
                  <h3>{item.competitorName}</h3>
                  <OsStatusPill value={item.marginSafe ? "margin_safe" : "margin_blocked"} />
                </div>
                <p>{item.positioningGap}</p>
                <div className="os-summary-stack">
                  <div>
                    <span>Competitor Price</span>
                    <strong>{formatInr(item.price)}</strong>
                    <small>{formatSignedPercent(item.pricingDeltaPercent)} versus current price</small>
                  </div>
                  <div>
                    <span>Rating</span>
                    <strong>{item.rating.toFixed(1)}</strong>
                    <small>{item.reviewCount.toLocaleString("en-IN")} reviews</small>
                  </div>
                </div>
                <small>{item.responseRecommendation}</small>
                <small>{item.inventoryWarning}</small>
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Review Mining + Customer Sentiment">
          <div className="os-finding-list">
            {overview.reviewInsights.map((insight) => (
              <article key={insight.id}>
                <div>
                  <h3>{insight.theme}</h3>
                  <OsStatusPill value={insight.sentiment} />
                </div>
                <p>{insight.returnRiskSignal}</p>
                <small>{insight.listingFix}</small>
                <small>{insight.supportToneSignal}</small>
                <div className="os-chip-row">
                  <span>{insight.reviewCount} reviews</span>
                  <span>{insight.confidence}% confidence</span>
                  <span>{insight.linkedSkuId}</span>
                </div>
              </article>
            ))}
            {overview.sentimentInsights.map((insight) => (
              <article key={insight.id}>
                <div>
                  <h3>{insight.segment}</h3>
                  <strong>{insight.sentimentScore}/100</strong>
                </div>
                <p>{insight.topComplaint}</p>
                <small>{insight.topPraise}</small>
                <small>{insight.recommendedAction}</small>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Ad Campaign Recommendation Workflow" eyebrow="Budget is controlled by delivered profit">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead>
                <tr>
                  <th>Campaign Recommendation</th>
                  <th>Spend / Revenue</th>
                  <th>Risk Costs</th>
                  <th>Delivered Profit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {overview.adRecommendations.map((recommendation) => (
                  <tr key={recommendation.id}>
                    <td>
                      <strong>{recommendation.title}</strong>
                      <small>ACOS {formatPercent(recommendation.acos)} - inventory risk {recommendation.inventoryRisk}%</small>
                    </td>
                    <td>
                      <small>Spend {formatInr(recommendation.currentSpend)}</small>
                      <small>Revenue {formatInr(recommendation.attributedRevenue)}</small>
                    </td>
                    <td>
                      <small>RTO {formatInr(recommendation.rtoLoss)}</small>
                      <small>Returns {formatInr(recommendation.returnLoss)}</small>
                    </td>
                    <td>
                      <strong>{formatInr(recommendation.deliveredProfit)}</strong>
                      <OsRiskPill value={recommendation.riskLevel} />
                    </td>
                    <td>
                      <small>{recommendation.recommendation}</small>
                      <OsStatusPill value={recommendation.approvalRequired ? "approval_required" : "draft_only"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>

        <OsPanel title="Coupon / Promotion Profitability Calculator">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Orders</th>
                  <th>Contribution</th>
                  <th>Margin</th>
                  <th>Guardrail</th>
                </tr>
              </thead>
              <tbody>
                {overview.couponScenarios.map((scenario) => (
                  <tr key={scenario.id}>
                    <td>
                      <strong>{scenario.title}</strong>
                      <small>{scenario.discountPercent}% discount - {scenario.skuId}</small>
                    </td>
                    <td>{scenario.expectedOrders.toLocaleString("en-IN")}</td>
                    <td>{formatInr(scenario.contributionProfit)}</td>
                    <td>
                      <strong>{formatPercent(scenario.marginPercent)}</strong>
                      <OsStatusPill value={scenario.verdict} />
                    </td>
                    <td>{scenario.guardrail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Festival Sale Planning Foundation">
          <div className="os-finding-list">
            {overview.festivalPlans.map((plan) => (
              <article key={plan.id}>
                <div>
                  <h3>{plan.eventName}</h3>
                  <strong>{plan.readinessScore}% ready</strong>
                </div>
                <p>{plan.dateRange}</p>
                <small>{plan.inventoryConstraint}</small>
                <small>{plan.rtoConstraint}</small>
                <div className="os-copy-draft">
                  <span>Planned actions</span>
                  <ul>
                    {plan.plannedActions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
                <div className="os-chip-row">
                  <span>Margin floor {formatPercent(plan.marginFloor)}</span>
                  <span>{plan.skuFocus.join(", ")}</span>
                </div>
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Marketing Report Section">
          <div className="os-report-list">
            {overview.reportSections.map((section) => (
              <article key={section.id}>
                <div>
                  <h3>{section.title}</h3>
                  <OsStatusPill value="report_draft" />
                </div>
                <p>{section.summary}</p>
                <div className="os-summary-stack">
                  {section.metrics.map((metric) => (
                    <div key={metric.label}>
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                      <small>{metric.note}</small>
                    </div>
                  ))}
                </div>
                <div className="os-chip-row">
                  {section.actionIds.map((actionId) => (
                    <span key={actionId}>{actionId}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>

      <OsPanel title="Automation Layer Handoff" eyebrow="Marketing outputs enter the same AIAction queue and policy system">
        <OsActionTable actions={overview.automationActions} />
      </OsPanel>
    </OsShell>
  );
}
