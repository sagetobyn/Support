import {
  OsAgentGrid,
  OsPageHeader,
  OsPanel,
  OsRiskPill,
  OsShell,
  formatInr
} from "@/features/ai-operations-os/components/OsShell";
import { getAiOperationsEngine, getChiefOperationsBriefing } from "@/features/ai-operations-os";

export default function AiOperationsEnginePage() {
  const engine = getAiOperationsEngine();
  const briefing = getChiefOperationsBriefing();

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
        <div className="os-metric os-tone-warning"><span>Approval Required</span><strong>{engine.findings.filter((finding) => finding.approvalRequired).length}</strong><small>Risk policy applied</small></div>
      </div>

      <OsPanel title="Chief Operations Briefing">
        <div className="os-briefing-band">
          <strong>{briefing.headline}</strong>
          <span>Top opportunity: {briefing.topOpportunity.title} · {formatInr(briefing.topOpportunity.impactAmount)}</span>
        </div>
      </OsPanel>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Agent Registry">
          <OsAgentGrid agents={engine.agents} />
        </OsPanel>
        <OsPanel title="Why Issues Were Flagged">
          <div className="os-finding-list">
            {engine.findings.map((finding) => (
              <article key={finding.id}>
                <div>
                  <h3>{finding.title}</h3>
                  <OsRiskPill value={finding.riskLevel} />
                </div>
                <p>{finding.summary}</p>
                <strong>{formatInr(finding.impactAmount)} · {finding.confidence}% confidence</strong>
                <small>{finding.explanation}</small>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>
    </OsShell>
  );
}

