import {
  OsPageHeader,
  OsPanel,
  OsRiskPill,
  OsShell,
  OsStatusPill
} from "@/features/ai-operations-os/components/OsShell";
import { PromptToConfigPanel } from "@/features/ai-operations-os/components/PromptToConfigPanel";
import { getSettingsControlOverview } from "@/features/ai-operations-os";

export default function SettingsPage() {
  const overview = getSettingsControlOverview();
  const { settings, brandVoice } = overview;

  return (
    <OsShell active="/settings">
      <OsPageHeader
        eyebrow="Settings + Customization"
        title="Configure The Operating System"
        subtitle="Seller rules, tones, margins, COD/RTO policy, notifications, and approval boundaries are structured settings the agents can read."
      />

      <div className="os-metric-grid">
        <div className="os-metric"><span>Risk Appetite</span><strong>{settings.riskAppetite}</strong><small>Controls automation posture</small></div>
        <div className="os-metric os-tone-warning"><span>Minimum Margin</span><strong>{settings.minMarginPercent}%</strong><small>Pricing and marketing guardrail</small></div>
        <div className="os-metric"><span>COD/RTO Threshold</span><strong>{settings.codBlockRiskThreshold}%</strong><small>Draft block rule above this risk</small></div>
        <div className="os-metric os-tone-success"><span>Notifications</span><strong>{settings.notificationPreference.replaceAll("_", " ")}</strong><small>{overview.notificationPreferences.filter((item) => item.enabled).length} enabled channels</small></div>
      </div>

      <div className="os-layout-two os-layout-two--wide">
        <OsPanel title="Prompt-to-Configure" eyebrow="Mock parser, real rule shape">
          <PromptToConfigPanel />
        </OsPanel>

        <OsPanel title="Brand Voice + Tone">
          <div className="os-summary-stack">
            <div><span>Brand voice</span><strong>{brandVoice.brandVoice.replaceAll("_", " ")}</strong><small>{brandVoice.examples[1]}</small></div>
            <div><span>Customer support tone</span><strong>{brandVoice.supportTone}</strong><small>{brandVoice.examples[0]}</small></div>
            <div><span>Marketing tone</span><strong>{brandVoice.marketingTone.replaceAll("_", " ")}</strong><small>Growth copy stays premium and profit-aware.</small></div>
            <div><span>Finance strictness</span><strong>{brandVoice.financeStrictness.replaceAll("_", " ")}</strong><small>{brandVoice.examples[2]}</small></div>
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Profit Margin Rules">
          <div className="os-rule-stack">
            {overview.profitMarginRules.map((rule) => (
              <article key={rule.id}>
                <div>
                  <h3>{rule.label}</h3>
                  <OsStatusPill value={rule.actionBelowFloor} />
                </div>
                <p>{rule.appliesTo}</p>
                <small>Floor {rule.minMarginPercent}% · approval {rule.approvalRequired ? "required" : "not required"}</small>
              </article>
            ))}
          </div>
        </OsPanel>

        <OsPanel title="COD / RTO Rules">
          <div className="os-rule-stack">
            {overview.codRtoRules.map((rule) => (
              <article key={rule.id}>
                <div>
                  <h3>{rule.label}</h3>
                  <OsStatusPill value={rule.action} />
                </div>
                <p>Payment method {rule.paymentMethod} · RTO risk above {rule.rtoRiskThreshold}%</p>
                <small>Approval {rule.approvalRequired ? "required" : "not required"}</small>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Automation Approval Rules">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead><tr><th>Rule</th><th>Risk</th><th>Max Level</th><th>Approval</th><th>Notes</th></tr></thead>
              <tbody>
                {overview.automationApprovalRules.map((rule) => (
                  <tr key={rule.id}>
                    <td><strong>{rule.label}</strong></td>
                    <td><OsRiskPill value={rule.riskLevel} /></td>
                    <td>L{rule.maxAutomationLevel}</td>
                    <td>{rule.approvalRequired ? "Required" : "Not required"}</td>
                    <td>{rule.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>

        <OsPanel title="Notification Preferences">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead><tr><th>Channel</th><th>Severity</th><th>Cadence</th><th>Status</th></tr></thead>
              <tbody>
                {overview.notificationPreferences.map((preference) => (
                  <tr key={preference.id}>
                    <td><strong>{preference.channel.replaceAll("_", " ")}</strong></td>
                    <td>{preference.severity}</td>
                    <td>{preference.cadence}</td>
                    <td><OsStatusPill value={preference.enabled ? "active" : "muted"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OsPanel>
      </div>

      <OsPanel title="Applied Structured Rules" eyebrow="What agents and automation policies read">
        <div className="os-preview-rule-list">
          {overview.appliedRules.map((rule) => (
            <article key={rule.id}>
              <div>
                <strong>{rule.ruleType.replaceAll("_", " ")}</strong>
                <OsStatusPill value={rule.status} />
              </div>
              <p>{rule.condition}</p>
              <small>{rule.settingPath} {rule.operator.replaceAll("_", " ")} {String(rule.parsedValue)} · {rule.affectedAgents.join(", ")}</small>
            </article>
          ))}
        </div>
      </OsPanel>
    </OsShell>
  );
}
