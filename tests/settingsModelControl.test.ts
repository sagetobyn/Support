import { describe, expect, it } from "vitest";
import {
  applyPromptToConfigPreview,
  convertInstructionToRuleDraft,
  getModelControlOverview,
  getSettingsControlOverview,
  parseSellerInstructionToConfig
} from "@/features/ai-operations-os";

describe("Settings + Customization + Model Control foundation", () => {
  it("exposes model provider abstraction without enabling real LLM calls", () => {
    const overview = getModelControlOverview();
    const providerIds = overview.providers.map((provider) => provider.id);

    expect(providerIds).toEqual(expect.arrayContaining(["openai", "anthropic", "google", "local", "not_configured"]));
    expect(overview.llmCallsEnabled).toBe(false);
    expect(overview.providers.find((provider) => provider.id === "not_configured")?.status).toBe("available");
    expect(overview.providers.filter((provider) => provider.apiKeyRequired).length).toBeGreaterThan(0);
  });

  it("creates agent-specific model rows with prompt templates and safe mode", () => {
    const overview = getModelControlOverview();

    expect(overview.agentRows.length).toBe(10);
    expect(overview.safeModeCount).toBe(overview.agentRows.length);
    overview.agentRows.forEach((row) => {
      expect(row.config.agentId).toBe(row.promptTemplate.agentId);
      expect(row.config.fallbackModelName.length).toBeGreaterThan(0);
      expect(row.promptTemplate.safetyBoundary.toLowerCase()).toContain("do not");
      expect(row.provider.id).toBe(row.config.provider);
    });
  });

  it("parses a natural-language instruction into margin and COD/RTO structured rules", () => {
    const preview = parseSellerInstructionToConfig("Never reduce price below 18% margin and auto-block COD only if RTO risk is above 75%.");
    const ruleTypes = preview.rules.map((rule) => rule.ruleType);

    expect(ruleTypes).toEqual(expect.arrayContaining(["profit_margin", "cod_rto"]));
    expect(preview.settingsPatch["settings.minMarginPercent"]).toBe(18);
    expect(preview.settingsPatch["settings.codBlockRiskThreshold"]).toBe(75);
    expect(preview.requiresReview).toBe(true);
    expect(preview.auditSummary.toLowerCase()).toContain("no llm");
  });

  it("applies prompt-to-config only as a mock structured preview", () => {
    const preview = parseSellerInstructionToConfig("Send me only critical alerts on WhatsApp.");
    const applied = applyPromptToConfigPreview(preview);

    expect(applied.applied).toBe(true);
    expect(applied.rules.every((rule) => rule.status === "applied")).toBe(true);
    expect(applied.settingsPatch["notificationPreferences.whatsapp.critical"]).toBe(true);
    expect(applied.auditSummary.toLowerCase()).toContain("no persistence");
  });

  it("keeps the legacy single-rule conversion compatible", () => {
    const draft = convertInstructionToRuleDraft("Never reduce price below 18% margin.");

    expect(draft.domain).toBe("pricing_profitability");
    expect(draft.riskLevel).toBe("high");
    expect(draft.approvalRequired).toBe(true);
  });

  it("composes a route-ready settings overview", () => {
    const overview = getSettingsControlOverview();

    expect(overview.brandVoice.supportTone).toBe("hinglish");
    expect(overview.profitMarginRules[0]?.minMarginPercent).toBe(18);
    expect(overview.codRtoRules[0]?.rtoRiskThreshold).toBe(75);
    expect(overview.automationApprovalRules.length).toBeGreaterThanOrEqual(3);
    expect(overview.notificationPreferences.some((preference) => preference.channel === "whatsapp" && preference.enabled)).toBe(true);
    expect(overview.promptToConfigPreview.rules.length).toBeGreaterThanOrEqual(2);
    expect(overview.appliedRules.every((rule) => rule.status === "applied")).toBe(true);
  });
});
