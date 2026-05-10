import {
  appliedStructuredRules,
  brandVoiceSettings
} from "../data/mockSettingsControl";
import type {
  AgentId,
  PromptToConfigPreview,
  RiskLevel,
  SellerRuleDraft,
  StructuredSellerRule
} from "../domain/types";

const defaultInstruction = "Never reduce price below 18% margin and auto-block COD only if RTO risk is above 75%.";

function extractPercent(instruction: string, keyword: string, fallback: number) {
  const normalized = instruction.toLowerCase();
  const keywordIndex = normalized.indexOf(keyword);
  const matches = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*%/g)];

  if (matches.length === 0) return fallback;
  if (keywordIndex === -1) return Number(matches[0][1]);

  const closest = matches
    .map((match) => ({
      value: Number(match[1]),
      distance: Math.abs((match.index || 0) - keywordIndex)
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  return closest?.value || fallback;
}

function createRule({
  instruction,
  id,
  domain,
  condition,
  action,
  riskLevel,
  approvalRequired,
  confidence,
  ruleType,
  settingPath,
  operator,
  parsedValue,
  affectedAgents
}: {
  instruction: string;
  id: string;
  domain: SellerRuleDraft["domain"];
  condition: string;
  action: string;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
  confidence: number;
  ruleType: StructuredSellerRule["ruleType"];
  settingPath: string;
  operator: StructuredSellerRule["operator"];
  parsedValue: string | number | boolean;
  affectedAgents: AgentId[];
}): StructuredSellerRule {
  return {
    id,
    sourceInstruction: instruction,
    domain,
    condition,
    action,
    riskLevel,
    approvalRequired,
    confidence,
    ruleType,
    settingPath,
    operator,
    parsedValue,
    affectedAgents,
    status: "preview"
  };
}

export function parseSellerInstructionToConfig(instruction = defaultInstruction): PromptToConfigPreview {
  const normalized = instruction.toLowerCase();
  const rules: StructuredSellerRule[] = [];

  if (normalized.includes("margin") || normalized.includes("price") || normalized.includes("discount")) {
    const margin = extractPercent(instruction, "margin", 18);
    rules.push(createRule({
      instruction,
      id: "preview-rule-margin-floor",
      domain: "pricing_profitability",
      condition: `projected_margin_percent is below ${margin}`,
      action: "block price, coupon, promotion, or ad recommendation and create approval task",
      riskLevel: "high",
      approvalRequired: true,
      confidence: 0.96,
      ruleType: "profit_margin",
      settingPath: "settings.minMarginPercent",
      operator: "minimum",
      parsedValue: margin,
      affectedAgents: ["pricing-profitability-agent", "marketing-growth-agent", "profit-leakage-engine"]
    }));
  }

  if (normalized.includes("cod") || normalized.includes("rto")) {
    const threshold = extractPercent(instruction, "rto", 75);
    rules.push(createRule({
      instruction,
      id: "preview-rule-cod-rto-threshold",
      domain: "rto_ndr",
      condition: `rto_risk_score is greater than ${threshold} and payment method is COD`,
      action: "draft COD block rule and require seller approval before external marketplace write",
      riskLevel: "high",
      approvalRequired: true,
      confidence: 0.94,
      ruleType: "cod_rto",
      settingPath: "settings.codBlockRiskThreshold",
      operator: "greater_than",
      parsedValue: threshold,
      affectedAgents: ["rto-ndr-engine", "profit-leakage-engine"]
    }));
  }

  if (normalized.includes("tone") || normalized.includes("polite") || normalized.includes("hindi") || normalized.includes("hinglish")) {
    rules.push(createRule({
      instruction,
      id: "preview-rule-support-tone",
      domain: "customer_support",
      condition: "customer_support_agent drafts customer-facing messages",
      action: `apply ${brandVoiceSettings.supportTone} support tone and configured quiet-hour policy`,
      riskLevel: "medium",
      approvalRequired: false,
      confidence: 0.88,
      ruleType: "tone",
      settingPath: "brandVoice.supportTone",
      operator: "set",
      parsedValue: brandVoiceSettings.supportTone,
      affectedAgents: ["customer-support-agent", "rto-ndr-engine"]
    }));
  }

  if (normalized.includes("model") || normalized.includes("settlement reconciliation") || normalized.includes("stronger")) {
    rules.push(createRule({
      instruction,
      id: "preview-rule-settlement-model",
      domain: "model_control",
      condition: "agent domain is settlement_reconciliation or claims_recovery",
      action: "use stricter mock finance model with high reasoning depth and low creativity",
      riskLevel: "medium",
      approvalRequired: true,
      confidence: 0.86,
      ruleType: "model_control",
      settingPath: "modelConfigs.settlement-reconciliation-engine",
      operator: "set",
      parsedValue: "mock-strong-finance-reasoner",
      affectedAgents: ["settlement-reconciliation-engine", "claims-recovery-agent"]
    }));
  }

  if (normalized.includes("critical alerts") || normalized.includes("whatsapp")) {
    rules.push(createRule({
      instruction,
      id: "preview-rule-critical-whatsapp",
      domain: "notifications",
      condition: "alert severity is critical",
      action: "send instant WhatsApp notification and keep lower-severity alerts in daily digest",
      riskLevel: "low",
      approvalRequired: false,
      confidence: 0.9,
      ruleType: "notification",
      settingPath: "notificationPreferences.whatsapp.critical",
      operator: "set",
      parsedValue: true,
      affectedAgents: ["chief-operations-agent"]
    }));
  }

  if (rules.length === 0) {
    rules.push(createRule({
      instruction,
      id: "preview-rule-general",
      domain: "general_operations",
      condition: "instruction needs seller review",
      action: "create reviewable setting draft before applying",
      riskLevel: "medium",
      approvalRequired: true,
      confidence: 0.72,
      ruleType: "general",
      settingPath: "settings.pendingInstruction",
      operator: "set",
      parsedValue: instruction,
      affectedAgents: ["chief-operations-agent"]
    }));
  }

  const settingsPatch = rules.reduce<Record<string, string | number | boolean>>((patch, rule) => {
    patch[rule.settingPath] = rule.parsedValue;
    return patch;
  }, {});
  const averageConfidence = rules.reduce((sum, rule) => sum + rule.confidence, 0) / rules.length;

  return {
    id: "prompt-config-preview-current",
    instruction,
    parser: "mock_keyword_parser",
    confidence: Math.round(averageConfidence * 100) / 100,
    rules,
    settingsPatch,
    requiresReview: rules.some((rule) => rule.approvalRequired || rule.riskLevel === "high" || rule.riskLevel === "critical"),
    applied: false,
    auditSummary: "Preview generated locally by deterministic parser. No LLM or provider call was made."
  };
}

export function applyPromptToConfigPreview(preview: PromptToConfigPreview): PromptToConfigPreview {
  return {
    ...preview,
    applied: true,
    rules: preview.rules.map((rule) => ({ ...rule, status: "applied" })),
    auditSummary: `${preview.rules.length} structured setting rule(s) applied in mock mode. No persistence or external call was made.`
  };
}

export function getAppliedStructuredRules() {
  return appliedStructuredRules;
}

export function convertInstructionToRuleDraft(instruction: string): SellerRuleDraft {
  const preview = parseSellerInstructionToConfig(instruction);
  const firstRule = preview.rules[0];

  return {
    id: firstRule.id,
    sourceInstruction: firstRule.sourceInstruction,
    domain: firstRule.domain,
    condition: firstRule.condition,
    action: firstRule.action,
    riskLevel: firstRule.riskLevel,
    approvalRequired: firstRule.approvalRequired,
    confidence: firstRule.confidence
  };
}
