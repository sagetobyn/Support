import {
  OsAgentGrid,
  OsPageHeader,
  OsPanel,
  OsRiskPill,
  OsShell,
  OsStatusPill,
  formatInr
} from "@/features/ai-operations-os/components/OsShell";
import { getAiOperationsEngine } from "@/features/ai-operations-os";

export default function AiOperationsEnginePage() {
  const engine = getAiOperationsEngine();
  const briefing = engine.briefing;

  return (
    <OsShell active="/ai-operations-engine">
      <OsPageHeader
        eyebrow="AI Operations Engine"
        title="Autonomous Intelligence That Detects, Decides, And Drives Recovery"
        subtitle="A structured agent system observes normalized seller data, explains why issues matter, and creates policy-checked work."
      />

      <div className="os-metric-grid">
        <div className="os-metric os-tone-success"><span>Active Agents</span><strong>{engine.activeAgents}/{engine.agents.length}</strong><small>Model orchestration online</small></div>
        <div className="os-metric os-tone-success"><span>7d Potential Impact</span><strong>{formatInr(engine.totalImpact)}</strong><small>From structured findings</small></div>
        <div className="os-metric"><span>Avg Confidence</span><strong>{engine.avgConfidence.toFixed(1)}%</strong><small>Weighted by agent health</small></div>
        <div className="os-metric os-tone-warning"><span>Draft Intents</span><strong>{engine.draftIntentCount}</strong><small>{engine.executableIntentCount} executable now</small></div>
      </div>

      <OsPanel title="Chief Operations Briefing">
        <div className="os-briefing-band">
          <strong>{briefing.headline}</strong>
          <span>Top opportunity: {briefing.topOpportunity.title} · {formatInr(briefing.topOpportunity.impactAmount)}</span>
          <span>Ranking: {briefing.rankingMethod} · {briefing.approvalRequiredCount} need approval</span>
        </div>
      </OsPanel>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Agent Registry">
          <OsAgentGrid agents={engine.agents} />
        </OsPanel>
        <OsPanel title="Structured Findings">
          <div className="os-finding-list">
            {engine.findings.map((finding) => (
              <article key={finding.id}>
                <div>
                  <h3>{finding.title}</h3>
                  <OsRiskPill value={finding.riskLevel} />
                </div>
                <p>{finding.summary}</p>
                <strong>{formatInr(finding.impactAmount)} · {finding.confidence.toFixed(1)}% confidence · priority {finding.priorityScore.toFixed(1)}</strong>
                <small>{finding.explanationSummary}</small>
                <small>{finding.inputEntityRefs.length} inputs · {finding.lineageRefs.length} lineage records · {finding.outputType.replaceAll("_", " ")}</small>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Confidence Scoring" eyebrow="Deterministic mock factors">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead><tr><th>Finding</th><th>Data</th><th>Entities</th><th>Lineage</th><th>Freshness</th><th>Final</th></tr></thead>
              <tbody>
                {engine.findings.map((finding) => (
                  <tr key={finding.confidenceBreakdown.id}>
                    <td>
                      <strong>{finding.title}</strong>
                      <small>{finding.agentId}</small>
                    </td>
                    <td>{finding.confidenceBreakdown.dataQuality.toFixed(1)}%</td>
                    <td>{finding.confidenceBreakdown.entityConfidence.toFixed(1)}%</td>
                    <td>{finding.confidenceBreakdown.lineageCoverage.toFixed(1)}%</td>
                    <td>{finding.confidenceBreakdown.sourceFreshness.toFixed(1)}%</td>
                    <td>{finding.confidenceBreakdown.finalScore.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>

        <OsPanel title="Recommended Actions" eyebrow="Automation-ready draft intents only">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead><tr><th>Action</th><th>Owner</th><th>Level</th><th>Approval</th><th>State</th><th>Executable</th></tr></thead>
              <tbody>
                {engine.findings.map((finding) => (
                  <tr key={finding.recommendedAction.id}>
                    <td>
                      <strong>{finding.recommendedAction.label}</strong>
                      <small>{finding.recommendedAction.description}</small>
                    </td>
                    <td>{finding.recommendedAction.owner}</td>
                    <td>L{finding.recommendedAction.automationLevel}</td>
                    <td>{finding.recommendedAction.approvalRequired ? "Required" : "Not required"}</td>
                    <td><OsStatusPill value={finding.automationIntent.state} /></td>
                    <td>{finding.automationIntent.executableNow ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Mock Orchestration Flow">
          <div className="os-report-list">
            {engine.agentRuns.map((run) => (
              <article key={run.id}>
                <div>
                  <strong>{run.agentId}</strong>
                  <OsStatusPill value={run.status} />
                </div>
                <span>{run.inputEntityCount} inputs · {run.findingCount} findings</span>
                <small>{run.message}</small>
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Automation Draft Intent Guardrails">
          <div className="os-report-list">
            {engine.automationIntents.slice(0, 6).map((intent) => (
              <article key={intent.id}>
                <div>
                  <strong>{intent.title}</strong>
                  <OsStatusPill value={intent.state} />
                </div>
                <span>{intent.targetEntityRefs.length} target entities · L{intent.automationLevel}</span>
                <small>{intent.policyChecks.join(", ")}</small>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>
    </OsShell>
  );
}
