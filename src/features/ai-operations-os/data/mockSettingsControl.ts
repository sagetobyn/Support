import type {
  AgentId,
  AgentModelConfig,
  AutomationApprovalRule,
  BrandVoiceSettings,
  CodRtoRule,
  ModelProviderDefinition,
  NotificationPreference,
  ProfitMarginRule,
  PromptTemplateSetting,
  StructuredSellerRule
} from "../domain/types";

export const modelProviders: ModelProviderDefinition[] = [
  {
    id: "openai",
    label: "OpenAI",
    status: "not_configured",
    apiKeyRequired: true,
    supportsTools: true,
    supportsJsonMode: true,
    supportsVision: true,
    supportsReasoningControl: true,
    defaultModel: "strong-reasoning",
    fallbackModel: "balanced-reasoning",
    notes: "Provider abstraction is ready; mock mode does not call real OpenAI APIs."
  },
  {
    id: "anthropic",
    label: "Anthropic",
    status: "not_configured",
    apiKeyRequired: true,
    supportsTools: true,
    supportsJsonMode: true,
    supportsVision: true,
    supportsReasoningControl: false,
    defaultModel: "commerce-reasoning-large",
    fallbackModel: "commerce-reasoning-small",
    notes: "Available as a future provider option once credentials and routing are configured."
  },
  {
    id: "google",
    label: "Google",
    status: "not_configured",
    apiKeyRequired: true,
    supportsTools: true,
    supportsJsonMode: true,
    supportsVision: true,
    supportsReasoningControl: false,
    defaultModel: "multimodal-commerce-pro",
    fallbackModel: "multimodal-commerce-flash",
    notes: "Reserved for future multimodal listing, review, and catalog workflows."
  },
  {
    id: "local",
    label: "Local / Private Model",
    status: "disabled",
    apiKeyRequired: false,
    supportsTools: false,
    supportsJsonMode: false,
    supportsVision: false,
    supportsReasoningControl: false,
    defaultModel: "private-small-ops",
    fallbackModel: "private-small-ops",
    notes: "Disabled until a private runtime is attached."
  },
  {
    id: "not_configured",
    label: "Mock Parser Only",
    status: "available",
    apiKeyRequired: false,
    supportsTools: false,
    supportsJsonMode: true,
    supportsVision: false,
    supportsReasoningControl: false,
    defaultModel: "deterministic-mock-parser",
    fallbackModel: "deterministic-mock-parser",
    notes: "Current foundation uses deterministic TypeScript parsing and mock model settings only."
  }
];

const phaseFiveAgentIds: AgentId[] = [
  "chief-operations-agent",
  "profit-leakage-engine",
  "rto-ndr-engine",
  "return-intelligence-engine",
  "settlement-reconciliation-engine",
  "claims-recovery-agent",
  "inventory-intelligence-engine",
  "customer-support-agent",
  "pricing-profitability-agent",
  "marketing-growth-agent"
];

export const agentModelConfigs: AgentModelConfig[] = phaseFiveAgentIds.map((agentId) => {
  const financeAgent = agentId === "settlement-reconciliation-engine" || agentId === "claims-recovery-agent" || agentId === "pricing-profitability-agent";
  const customerAgent = agentId === "customer-support-agent" || agentId === "rto-ndr-engine";
  const growthAgent = agentId === "marketing-growth-agent";

  return {
    id: `model-${agentId}`,
    agentId,
    provider: "not_configured",
    modelName: financeAgent ? "mock-strong-finance-reasoner" : growthAgent ? "mock-profit-aware-growth" : "mock-balanced-ops-reasoner",
    temperature: financeAgent ? 0 : growthAgent ? 0.35 : customerAgent ? 0.15 : 0.1,
    reasoningDepth: financeAgent ? "high" : "medium",
    maxMonthlyBudgetInr: financeAgent ? 18000 : growthAgent ? 9000 : 12000,
    fallbackModelName: "deterministic-mock-parser",
    safeMode: true,
    approvalRequiredAbove: financeAgent ? "low" : customerAgent ? "medium" : "high"
  };
});

export const promptTemplates: PromptTemplateSetting[] = phaseFiveAgentIds.map((agentId) => ({
  id: `prompt-template-${agentId}`,
  agentId,
  name: `${agentId.replaceAll("-", " ")} operating prompt`,
  systemInstruction:
    agentId === "marketing-growth-agent"
      ? "Optimize for profitable growth only. Respect margin floor, RTO risk, return risk, and inventory position before suggesting marketing changes."
      : agentId === "customer-support-agent"
        ? "Draft customer responses in the configured support tone, obey quiet hours, and never send without policy approval."
        : agentId === "settlement-reconciliation-engine" || agentId === "claims-recovery-agent"
          ? "Use strict finance reasoning, cite lineage, and keep claims or settlement actions in draft until approved."
          : "Use normalized seller data, cite confidence and lineage, and produce structured recommendations only.",
  outputContract: "Return structured insight, recommendation, risk level, confidence, explanation, and automation intent.",
  safetyBoundary: "Do not call providers, write external systems, or execute risky actions in mock mode.",
  version: "v0.1-mock",
  lastEditedAt: "2026-05-10T10:05:00.000Z"
}));

export const brandVoiceSettings: BrandVoiceSettings = {
  id: "brand-voice-acme",
  brandVoice: "premium",
  supportTone: "hinglish",
  marketingTone: "less_discount_heavy",
  financeStrictness: "very_strict",
  languagePreference: "hindi_english",
  examples: [
    "Helpful, clear, and calm for customer support.",
    "Premium and trust-building for marketplace listing copy.",
    "Strict and evidence-first for finance and claims."
  ]
};

export const profitMarginRules: ProfitMarginRule[] = [
  {
    id: "profit-rule-margin-floor",
    label: "Never reduce below margin floor",
    minMarginPercent: 18,
    appliesTo: "All marketplace price, coupon, promotion, and ad-budget decisions",
    actionBelowFloor: "block",
    approvalRequired: true
  },
  {
    id: "profit-rule-coupon-review",
    label: "Review coupons below contribution floor",
    minMarginPercent: 22,
    appliesTo: "Coupon and festival-sale recommendations",
    actionBelowFloor: "require_approval",
    approvalRequired: true
  }
];

export const codRtoRules: CodRtoRule[] = [
  {
    id: "cod-rule-rto-75",
    label: "Auto-block COD only above RTO risk threshold",
    rtoRiskThreshold: 75,
    paymentMethod: "COD",
    action: "draft_cod_block",
    approvalRequired: true
  },
  {
    id: "cod-rule-meesho-aggressive",
    label: "Meesho RTO prevention posture",
    rtoRiskThreshold: 70,
    paymentMethod: "COD",
    action: "recommend_review",
    approvalRequired: true
  }
];

export const automationApprovalRules: AutomationApprovalRule[] = [
  {
    id: "approval-low-risk",
    label: "Low-risk internal actions",
    riskLevel: "low",
    maxAutomationLevel: 4,
    approvalRequired: false,
    notes: "Internal mock actions may auto-complete when confidence and impact rules pass."
  },
  {
    id: "approval-medium-risk",
    label: "Medium-risk actions",
    riskLevel: "medium",
    maxAutomationLevel: 3,
    approvalRequired: true,
    notes: "Drafts and one-click approval are allowed; external writes remain disabled."
  },
  {
    id: "approval-high-risk",
    label: "High-risk actions",
    riskLevel: "high",
    maxAutomationLevel: 2,
    approvalRequired: true,
    notes: "Claims, COD blocks, price changes, and customer sends require seller review."
  }
];

export const notificationPreferences: NotificationPreference[] = [
  { id: "notify-critical-whatsapp", channel: "whatsapp", severity: "critical", cadence: "instant", enabled: true },
  { id: "notify-high-in-app", channel: "in_app", severity: "high", cadence: "instant", enabled: true },
  { id: "notify-digest-email", channel: "email", severity: "digest", cadence: "daily", enabled: true },
  { id: "notify-low-muted", channel: "in_app", severity: "low", cadence: "muted", enabled: false }
];

export const appliedStructuredRules: StructuredSellerRule[] = [
  {
    id: "applied-rule-margin-floor",
    sourceInstruction: "Never reduce price below 18% margin.",
    domain: "pricing_profitability",
    condition: "projected_margin_percent is below 18",
    action: "block price, coupon, or promotion change and create approval task",
    riskLevel: "high",
    approvalRequired: true,
    confidence: 0.96,
    ruleType: "profit_margin",
    settingPath: "profitMarginRules.minMarginPercent",
    operator: "minimum",
    parsedValue: 18,
    affectedAgents: ["pricing-profitability-agent", "marketing-growth-agent"],
    status: "applied"
  },
  {
    id: "applied-rule-cod-rto",
    sourceInstruction: "Auto-block COD only if RTO risk is above 75%.",
    domain: "rto_ndr",
    condition: "rto_risk_score is greater than 75 and payment method is COD",
    action: "draft COD block rule and require seller approval before external write",
    riskLevel: "high",
    approvalRequired: true,
    confidence: 0.94,
    ruleType: "cod_rto",
    settingPath: "codRtoRules.rtoRiskThreshold",
    operator: "greater_than",
    parsedValue: 75,
    affectedAgents: ["rto-ndr-engine", "profit-leakage-engine"],
    status: "applied"
  }
];
