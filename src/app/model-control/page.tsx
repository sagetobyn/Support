import {
  OsPageHeader,
  OsPanel,
  OsShell,
  OsStatusPill,
  formatInr
} from "@/features/ai-operations-os/components/OsShell";
import { getAiOperationsEngine, getSellerSettings } from "@/features/ai-operations-os";

export default function ModelControlPage() {
  const settings = getSellerSettings();
  const engine = getAiOperationsEngine();

  return (
    <OsShell active="/model-control">
      <OsPageHeader
        eyebrow="Model Control"
        title="Agent-Specific Model Configuration"
        subtitle="Choose provider, model, reasoning depth, budget, fallback, safe mode, and approval thresholds per agent."
      />

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Model Configurations">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead><tr><th>Agent</th><th>Provider</th><th>Model</th><th>Reasoning</th><th>Budget</th><th>Safe Mode</th></tr></thead>
              <tbody>
                {settings.modelConfigs.map((config) => {
                  const agent = engine.agents.find((item) => item.id === config.agentId);
                  return (
                    <tr key={config.id}>
                      <td>{agent?.name || config.agentId}</td>
                      <td>{config.provider}</td>
                      <td>{config.modelName}</td>
                      <td>{config.reasoningDepth}</td>
                      <td>{formatInr(config.maxMonthlyBudgetInr)}</td>
                      <td><OsStatusPill value={config.safeMode ? "safe_mode" : "manual"} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </OsPanel>

        <OsPanel title="Control Policy">
          <div className="os-summary-stack">
            <div>
              <span>Finance strictness</span>
              <strong>High</strong>
              <small>Settlement and claims use lower creativity and stronger reasoning.</small>
            </div>
            <div>
              <span>Approval by risk</span>
              <strong>Medium and above</strong>
              <small>Risky execution still requires seller approval.</small>
            </div>
            <div>
              <span>Fallback behavior</span>
              <strong>Configured per agent</strong>
              <small>Agents degrade to cheaper or safer models when needed.</small>
            </div>
          </div>
        </OsPanel>
      </div>
    </OsShell>
  );
}

