import {
  OsPageHeader,
  OsPanel,
  OsRiskPill,
  OsShell,
  OsStatusPill
} from "@/features/ai-operations-os/components/OsShell";
import { convertInstructionToRuleDraft, getSellerSettings } from "@/features/ai-operations-os";

export default function SettingsPage() {
  const settings = getSellerSettings();
  const preview = convertInstructionToRuleDraft("Auto-generate claims but ask me before submitting.");

  return (
    <OsShell active="/settings">
      <OsPageHeader
        eyebrow="Settings + Customization"
        title="Configure The Operating System"
        subtitle="Seller rules, permissions, tones, margins, COD policy, notification rules, and automation limits live here."
      />

      <div className="os-metric-grid">
        <div className="os-metric"><span>Risk Appetite</span><strong>{settings.riskAppetite}</strong><small>Controls automation posture</small></div>
        <div className="os-metric os-tone-warning"><span>Minimum Margin</span><strong>{settings.minMarginPercent}%</strong><small>Pricing guardrail</small></div>
        <div className="os-metric"><span>COD Block Threshold</span><strong>{settings.codBlockRiskThreshold}%</strong><small>Requires policy approval</small></div>
        <div className="os-metric os-tone-success"><span>Automation Ceiling</span><strong>Level {settings.automationCeiling}</strong><small>No full autopilot yet</small></div>
      </div>

      <div className="os-layout-two">
        <OsPanel title="Prompt-to-Configure Preview" eyebrow="Mock conversion flow">
          <div className="os-rule-preview">
            <span>Seller instruction</span>
            <strong>{preview.sourceInstruction}</strong>
            <p><b>Domain:</b> {preview.domain}</p>
            <p><b>Condition:</b> {preview.condition}</p>
            <p><b>Action:</b> {preview.action}</p>
            <div>
              <OsRiskPill value={preview.riskLevel} />
              <OsStatusPill value={preview.approvalRequired ? "approval_required" : "auto_apply_allowed"} />
            </div>
          </div>
        </OsPanel>

        <OsPanel title="Existing Rule Drafts">
          <div className="os-rule-stack">
            {settings.promptRuleDrafts.map((rule) => (
              <article key={rule.id}>
                <h3>{rule.sourceInstruction}</h3>
                <p>{rule.condition}</p>
                <small>{rule.action}</small>
              </article>
            ))}
          </div>
        </OsPanel>
      </div>
    </OsShell>
  );
}

