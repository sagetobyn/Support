import {
  OsPageHeader,
  OsPanel,
  OsRiskPill,
  OsShell,
  OsStatusPill,
  formatInr
} from "@/features/ai-operations-os/components/OsShell";
import { getAutomationOverview } from "@/features/ai-operations-os";

export default function AutomationPage() {
  const overview = getAutomationOverview();
  const detail = overview.selectedAction;

  return (
    <OsShell active="/automation">
      <OsPageHeader
        eyebrow="Automation / Action Layer"
        title="Turn AI Findings Into Safe Execution"
        subtitle="AI draft intents become action queues, approval decisions, policy checks, simulated execution, and audit logs. No external API action is executed."
      />

      <div className="os-metric-grid">
        <div className="os-metric os-tone-warning"><span>Potential Impact Open</span><strong>{formatInr(overview.potentialImpact)}</strong><small>Policy-checked queue value</small></div>
        <div className="os-metric"><span>Approval Queue</span><strong>{overview.pendingApproval}</strong><small>{overview.actions.length} total actions</small></div>
        <div className="os-metric os-tone-success"><span>Mock Executed</span><strong>{overview.executed}</strong><small>{overview.autoExecutableCount} auto-allowed internal actions</small></div>
        <div className="os-metric"><span>Avg Confidence</span><strong>{overview.avgConfidence.toFixed(1)}%</strong><small>{overview.blocked} blocked by policy</small></div>
      </div>

      <OsPanel title="Safe Automation Levels" eyebrow="Seller-controlled ladder">
        <div className="os-level-grid">
          {overview.levelDefinitions.map((level) => (
            <article key={level.level}>
              <span>Level {level.level}</span>
              <strong>{level.label}</strong>
              <p>{level.description}</p>
              <small>{level.externalExecutionAllowed ? "External execution enabled" : "No external execution"}</small>
            </article>
          ))}
        </div>
      </OsPanel>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Action Queue" eyebrow="AI output -> automation-ready records">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Impact</th>
                  <th>Risk</th>
                  <th>Policy</th>
                  <th>State</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>
                {overview.actions.map((action) => (
                  <tr key={action.id}>
                    <td>
                      <strong>{action.title}</strong>
                      <small>{action.actionType} · {action.assignee}</small>
                    </td>
                    <td>{formatInr(action.impactAmount)}</td>
                    <td><OsRiskPill value={action.riskLevel} /></td>
                    <td><OsStatusPill value={action.policyStatus} /></td>
                    <td><OsStatusPill value={action.state} /></td>
                    <td>L{action.automationLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>

        <OsPanel title="Action Detail View" eyebrow="Selected highest-priority approval item">
          <div className="os-action-detail">
            <div>
              <h3>{detail.action.title}</h3>
              <OsRiskPill value={detail.action.riskLevel} />
            </div>
            <p>{detail.action.description}</p>
            <dl>
              <div><dt>Expected Impact</dt><dd>{formatInr(detail.action.impactAmount)}</dd></div>
              <div><dt>Confidence</dt><dd>{detail.action.confidence}%</dd></div>
              <div><dt>Policy</dt><dd>{detail.action.policyStatus.replaceAll("_", " ")}</dd></div>
              <div><dt>Target</dt><dd>{detail.action.executionTarget.label}</dd></div>
            </dl>
            <div className="os-policy-checks">
              {detail.action.policyChecks.map((check) => (
                <article key={check.id}>
                  <OsStatusPill value={check.status} />
                  <strong>{check.label}</strong>
                  <small>{check.detail}</small>
                </article>
              ))}
            </div>
            <p><strong>Rollback:</strong> {detail.action.rollbackPlan}</p>
            <small>Allowed next states: {detail.allowedNextStates.length ? detail.allowedNextStates.join(", ") : "none"}</small>
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Approval Queue">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead><tr><th>Approval</th><th>Owner</th><th>Reason</th><th>Impact</th><th>Status</th></tr></thead>
              <tbody>
                {overview.approvalQueue.map((approval) => (
                  <tr key={approval.id}>
                    <td>
                      <strong>{approval.title}</strong>
                      <small>{approval.confidence}% confidence · {approval.riskLevel} risk</small>
                    </td>
                    <td>{approval.approverRole}</td>
                    <td>{approval.reason}</td>
                    <td>{formatInr(approval.impactAmount)}</td>
                    <td><OsStatusPill value={approval.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>

        <OsPanel title="Execution State Machine">
          <div className="os-state-grid">
            {overview.stateCounts.map((state) => (
              <article key={state.state}>
                <span>{state.label}</span>
                <strong>{state.count}</strong>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Automation Rule Builder" eyebrow="Mock rule graph">
          <div className="os-rule-stack">
            {overview.ruleBuilder.map((rule) => (
              <article key={rule.ruleId}>
                <div>
                  <h3>{rule.name}</h3>
                  <OsStatusPill value={rule.active ? "active" : "paused"} />
                </div>
                <div className="os-rule-nodes">
                  {rule.nodes.map((node) => (
                    <span key={node.id}>
                      <b>{node.label}</b>
                      {node.detail}
                    </span>
                  ))}
                </div>
                <small>Level {rule.automationLevel} · approval {rule.approvalRequired ? "required" : "not required"}</small>
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Seller Approval Policy">
          <div className="os-summary-stack">
            <div><span>Policy</span><strong>{overview.sellerPolicy.name}</strong></div>
            <div><span>Automation ceiling</span><strong>Level {overview.sellerPolicy.automationCeiling}</strong></div>
            <div><span>Auto confidence floor</span><strong>{overview.sellerPolicy.minConfidenceForAutoExecute}%</strong></div>
            <div><span>Quiet hours</span><strong>{overview.sellerPolicy.quietHours.startHour}:00-{overview.sellerPolicy.quietHours.endHour}:00</strong></div>
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Recent Activity Timeline">
          <div className="os-timeline">
            {overview.recentActivity.slice(0, 8).map((activity) => (
              <article className={`os-timeline-${activity.tone}`} key={activity.id}>
                <span>{new Date(activity.occurredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                <div>
                  <strong>{activity.title}</strong>
                  <small>{activity.detail}</small>
                </div>
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Audit Logs">
          <div className="os-report-list">
            {overview.auditLogs.slice(0, 8).map((log) => (
              <article key={log.id}>
                <div>
                  <strong>{log.eventType.replaceAll("_", " ")}</strong>
                  <OsStatusPill value={log.actor} />
                </div>
                <span>{log.message}</span>
                <small>{log.actionId} · {new Date(log.occurredAt).toLocaleString("en-IN")}</small>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>
    </OsShell>
  );
}
