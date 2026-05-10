import {
  OsPageHeader,
  OsPanel,
  OsShell,
  OsStatusPill,
  formatInr
} from "@/features/ai-operations-os/components/OsShell";
import { getModelControlOverview } from "@/features/ai-operations-os";

export default function ModelControlPage() {
  const overview = getModelControlOverview();

  return (
    <OsShell active="/model-control">
      <OsPageHeader
        eyebrow="Model Control"
        title="Agent-Specific Model Configuration"
        subtitle="Provider abstraction, per-agent model choice, prompts, fallback models, safe mode, reasoning depth, budget, and approval thresholds."
      />

      <div className="os-metric-grid">
        <div className="os-metric"><span>Providers</span><strong>{overview.providers.length}</strong><small>{overview.configuredProviderCount} mock-ready provider</small></div>
        <div className="os-metric os-tone-success"><span>Safe Mode</span><strong>{overview.safeModeCount}/{overview.agentRows.length}</strong><small>Every agent remains guarded</small></div>
        <div className="os-metric os-tone-warning"><span>Monthly Budget Ceiling</span><strong>{formatInr(overview.totalMonthlyBudgetInr)}</strong><small>Across agent configs</small></div>
        <div className="os-metric"><span>LLM Calls</span><strong>{overview.llmCallsEnabled ? "On" : "Off"}</strong><small>Mock parser mode only</small></div>
      </div>

      <OsPanel title="Model Provider Abstraction" eyebrow="No real provider calls in this increment">
        <div className="os-provider-grid">
          {overview.providers.map((provider) => (
            <article key={provider.id}>
              <div>
                <strong>{provider.label}</strong>
                <OsStatusPill value={provider.status} />
              </div>
              <p>{provider.notes}</p>
              <small>{provider.defaultModel} · fallback {provider.fallbackModel}</small>
              <div>
                <OsStatusPill value={provider.supportsJsonMode ? "json_mode" : "no_json_mode"} />
                <OsStatusPill value={provider.supportsTools ? "tools" : "no_tools"} />
                <OsStatusPill value={provider.supportsReasoningControl ? "reasoning_control" : "fixed_reasoning"} />
              </div>
            </article>
          ))}
        </div>
      </OsPanel>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Agent Model Settings">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead><tr><th>Agent</th><th>Provider</th><th>Model</th><th>Reasoning</th><th>Budget</th><th>Approval</th></tr></thead>
              <tbody>
                {overview.agentRows.map((row) => (
                  <tr key={row.config.id}>
                    <td>
                      <strong>{row.agentName}</strong>
                      <small>{row.agentPurpose}</small>
                    </td>
                    <td>{row.provider.label}</td>
                    <td>
                      <strong>{row.config.modelName}</strong>
                      <small>Fallback: {row.config.fallbackModelName}</small>
                    </td>
                    <td>{row.config.reasoningDepth} · temp {row.config.temperature}</td>
                    <td>{formatInr(row.monthlyBudgetUsedInr)} / {formatInr(row.config.maxMonthlyBudgetInr)}</td>
                    <td>{row.config.approvalRequiredAbove}+ risk</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>

        <OsPanel title="Model Safety Policy">
          <div className="os-summary-stack">
            <div>
              <span>Finance strictness</span>
              <strong>Very strict</strong>
              <small>Settlement, claims, and pricing agents use low creativity and stronger reasoning.</small>
            </div>
            <div>
              <span>Fallback behavior</span>
              <strong>Deterministic mock parser</strong>
              <small>No real provider is contacted until credentials and routing are configured.</small>
            </div>
            <div>
              <span>Approval boundary</span>
              <strong>Risk-aware per agent</strong>
              <small>Model output still becomes structured recommendations, not hidden execution.</small>
            </div>
          </div>
        </OsPanel>
      </div>

      <OsPanel title="Prompt Template Settings" eyebrow="Agent instructions and output contracts">
        <div className="os-template-grid">
          {overview.promptTemplates.map((template) => (
            <article key={template.id}>
              <div>
                <strong>{template.name}</strong>
                <OsStatusPill value={template.version} />
              </div>
              <p>{template.systemInstruction}</p>
              <small>{template.outputContract}</small>
              <small>{template.safetyBoundary}</small>
            </article>
          ))}
        </div>
      </OsPanel>
    </OsShell>
  );
}
