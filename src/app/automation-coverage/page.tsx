import Link from "next/link";
import {
  formatInr,
  OsPageHeader,
  OsPanel,
  OsShell,
  OsStatusPill
} from "@/features/ai-operations-os/components/OsShell";
import { getAutomationCoverageView } from "@/features/automation-coverage";
import type { AutomationCapabilityStatus } from "@/features/automation-capabilities";

const statusOrder: AutomationCapabilityStatus[] = [
  "missing",
  "ui_only",
  "mock",
  "local_automation",
  "connected_read",
  "ai_decision",
  "approval_execution",
  "autonomous_execution"
];

function statusLabel(status: AutomationCapabilityStatus) {
  if (status === "local_automation") return "local workflow proof";
  if (status === "approval_execution") return "approval execution";
  if (status === "autonomous_execution") return "trusted-rule execution";
  return status.replaceAll("_", " ");
}

function pct(value: number) {
  return `${Math.round(value)}%`;
}

export default function AutomationCoveragePage() {
  const view = getAutomationCoverageView();
  const { matrix, inbox } = view;

  return (
    <OsShell active="/automation-coverage">
      <OsPageHeader
        eyebrow="Automation Truth Layer"
        title="Total Automation Coverage"
        subtitle="Every seller task is labeled honestly: missing, UI-only, mock, local workflow proof, AI decision draft, approval execution, or trusted-rule execution."
        actions={<Link className="os-button os-button--secondary" href="/automation">Open Action Layer</Link>}
      />

      <OsPanel title="Vision Lock" eyebrow="Wembro objective">
        <div className="os-truth-banner">
          <strong>{matrix.objective}</strong>
          <div className="os-loop-row">
            {view.executionChain.map((step) => (
              <span key={step.step}>
                <b>{step.step}</b>
                {step.label}
              </span>
            ))}
          </div>
          <p>{matrix.honestyRule}</p>
        </div>
      </OsPanel>

      <div className="os-metric-grid">
        <div className="os-metric os-tone-warning"><span>Coverage</span><strong>{pct(matrix.summary.coveragePercent)}</strong><small>{matrix.summary.totalCapabilities} seller tasks mapped</small></div>
        <div className="os-metric os-tone-success"><span>Local Proof Today</span><strong>{inbox.summary.autoResolvedLocal}</strong><small>{formatInr(inbox.summary.moneyProtected)} protected locally</small></div>
        <div className="os-metric os-tone-danger"><span>Manual Work Exposed</span><strong>{matrix.summary.missingOrUiOnlyCount}</strong><small>Cannot be called automated</small></div>
        <div className="os-metric"><span>Automation Claims Allowed</span><strong>{matrix.summary.automatedClaimCount}</strong><small>Trusted-rule execution: {matrix.summary.statusCounts.autonomous_execution}</small></div>
      </div>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Automation Inbox" eyebrow="Only exceptions, approvals, failures, and proof">
          <div className="os-inbox-grid">
            <article>
              <span>Approvals needed</span>
              <strong>{inbox.approvals.length}</strong>
              <small>Seller-controlled execution, not hidden autopilot</small>
            </article>
            <article>
              <span>Blocked or manual</span>
              <strong>{inbox.failures.length}</strong>
              <small>Work still needs implementation or external permission</small>
            </article>
            <article>
              <span>Proof events</span>
              <strong>{inbox.run.proofEvents}</strong>
              <small>Local audit and learning records</small>
            </article>
          </div>
          <div className="os-report-list">
            {inbox.approvals.slice(0, 6).map((task) => (
              <article key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <OsStatusPill value={task.status} />
                </div>
                <span>{task.decisionReason}</span>
                <small>{formatInr(task.moneyImpact)} impact · {task.actionOutput}</small>
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Manual Work Still Open" eyebrow="This is the accountability list">
          <div className="os-report-list">
            {inbox.unresolvedManualWork.slice(0, 8).map((task) => (
              <article key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <OsStatusPill value={task.automationStatus} />
                </div>
                <span>{task.failureReason}</span>
                <small>{task.workstreamId.replaceAll("_", " ")} · next: {task.actionOutput}</small>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>

      <OsPanel title="14 Workstreams" eyebrow="Future capability map, not the current product promise">
        <div className="os-coverage-grid">
          {view.workstreams.map((workstream) => (
            <article className="os-coverage-card" key={workstream.id}>
              <div>
                <h3>{workstream.title}</h3>
                <OsStatusPill value={workstream.strongestStatus} />
              </div>
              <p>{workstream.description}</p>
              <div className="os-bar-track" aria-label={`${workstream.title} automation coverage`}>
                <span className="os-bar-fill" style={{ width: `${workstream.coveragePercent}%` }} />
              </div>
              <small>{workstream.capabilitiesCount} tasks · {pct(workstream.coveragePercent)} coverage</small>
              <strong>Next gap: {workstream.nextManualTask}</strong>
              <span>{workstream.nextImplementation}</span>
            </article>
          ))}
        </div>
      </OsPanel>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Status Definitions" eyebrow="No more fake automation">
          <div className="os-report-list">
            {matrix.statusDefinitions.map((definition) => (
              <article key={definition.status}>
                <div>
                  <strong>{definition.label}</strong>
                  <OsStatusPill value={definition.canClaimAutomated ? "approval_ready" : definition.status} />
                </div>
                <span>{definition.description}</span>
                <small>{definition.canClaimAutomated ? "Can claim automation only with complete proof" : "Must not be sold as automation"}</small>
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="Status Counts" eyebrow="Current implementation truth">
          <div className="os-state-grid">
            {statusOrder.map((status) => (
              <article key={status}>
                <span>{statusLabel(status)}</span>
                <strong>{matrix.summary.statusCounts[status]}</strong>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>

      <OsPanel title="Capability Matrix" eyebrow="Every manual seller task from the future capability vision">
        <div className="os-table-wrap os-capability-table">
          <table className="os-table">
            <thead>
              <tr>
                <th>Workstream</th>
                <th>Manual seller work</th>
                <th>Status</th>
                <th>Data</th>
                <th>Decision</th>
                <th>Action / proof</th>
              </tr>
            </thead>
            <tbody>
              {matrix.capabilities.map((capability) => (
                <tr key={capability.id}>
                  <td>
                    <strong>{capability.workstreamTitle}</strong>
                    <small>{capability.priority} priority</small>
                  </td>
                  <td>{capability.manualTask}</td>
                  <td><OsStatusPill value={capability.status} /></td>
                  <td><small>{capability.dataSources.slice(0, 2).join(", ")}</small></td>
                  <td><small>{capability.decisionService}</small></td>
                  <td>
                    <strong>{capability.sellerWorkRemoved}</strong>
                    <small>{capability.nextImplementation}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OsPanel>
    </OsShell>
  );
}
