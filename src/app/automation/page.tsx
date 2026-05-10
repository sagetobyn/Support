import {
  OsActionTable,
  OsPageHeader,
  OsPanel,
  OsShell,
  OsStatusPill,
  formatInr
} from "@/features/ai-operations-os/components/OsShell";
import { getAutomationOverview } from "@/features/ai-operations-os";

export default function AutomationPage() {
  const overview = getAutomationOverview();

  return (
    <OsShell active="/automation">
      <OsPageHeader
        eyebrow="Automation / Action Layer"
        title="Turn AI Findings Into Execution"
        subtitle="Move from recommendation to drafts, approval, safe auto-execution, audit logs, and rollback plans."
      />

      <div className="os-metric-grid">
        <div className="os-metric os-tone-warning"><span>Potential Impact Open</span><strong>{formatInr(overview.potentialImpact)}</strong><small>Across action queue</small></div>
        <div className="os-metric"><span>Actions In Queue</span><strong>{overview.actions.length}</strong><small>{overview.pendingApproval} awaiting approval</small></div>
        <div className="os-metric os-tone-success"><span>Auto-Executed</span><strong>{overview.executed}</strong><small>Only under seller rules</small></div>
        <div className="os-metric os-tone-success"><span>Avg Confidence</span><strong>{overview.avgConfidence.toFixed(1)}%</strong><small>Policy-checked</small></div>
      </div>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Action Queue">
          <OsActionTable actions={overview.actions} />
        </OsPanel>

        <OsPanel title="Automation Rule Builder">
          <div className="os-rule-stack">
            {overview.rules.map((rule) => (
              <article key={rule.id}>
                <div>
                  <h3>{rule.name}</h3>
                  <OsStatusPill value={rule.active ? "active" : "paused"} />
                </div>
                <p><strong>If:</strong> {rule.trigger}</p>
                <p><strong>Then:</strong> {rule.action}</p>
                <small>Level {rule.automationLevel} · approval {rule.approvalRequired ? "required" : "not required"}</small>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>
    </OsShell>
  );
}

