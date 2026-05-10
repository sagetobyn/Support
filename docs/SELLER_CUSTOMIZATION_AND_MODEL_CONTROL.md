# Seller Customization And Model Control

## Purpose

Sellers should control how the AI Operations OS behaves without editing code. Settings must be structured, auditable, and explainable.

## Seller Settings

Settings should cover:

- Company profile.
- Marketplace preferences.
- Risk appetite.
- Profit margin rules.
- COD rules.
- Pincode rules.
- Return handling rules.
- Claim thresholds.
- Inventory reorder rules.
- Customer support tone.
- Warranty policy.
- Supplier escalation rules.
- Marketing budget rules.
- Ad spend rules.
- Listing content rules.
- Automation approval rules.
- Notification preferences.
- User and team permissions.
- Audit settings.

## Model Control

Each agent can have its own model configuration:

- Provider.
- Model name.
- Temperature or creativity.
- Reasoning depth.
- Max budget or cost limit.
- Fallback model.
- Safe mode.
- Prompt template.
- System instructions.
- Brand voice.
- Support tone.
- Marketing tone.
- Finance strictness.
- Approval requirements by risk level.

## Prompt-to-Configure

The future prompt-to-config flow converts seller instructions into structured settings.

Examples:

- "Do not auto-send customer messages after 9 PM."
- "Use a polite Hindi-English tone for customer support."
- "Never reduce price below 18% margin."
- "Auto-block COD only if RTO risk is above 75%."
- "Use the stronger model for settlement reconciliation."
- "Make marketing copy more premium and less discount-heavy."
- "Send me only critical alerts on WhatsApp."
- "Auto-generate claims but ask me before submitting."
- "For Meesho, be more aggressive with RTO prevention."

## Conversion Flow

1. Seller enters natural language instruction.
2. Parser extracts intent, target domain, risk, threshold, condition, and action.
3. System generates a structured rule draft.
4. Seller reviews preview.
5. Rule is applied, versioned, and logged.
6. Relevant agents and automation policies read the new rule.

## Mock Rule Schema

```ts
type SellerRuleDraft = {
  id: string;
  sourceInstruction: string;
  domain: string;
  condition: string;
  action: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  approvalRequired: boolean;
  confidence: number;
};
```

This first architecture increment can mock conversion. Real parsing should be added only after core rules and policy execution are stable.

## Phase 8 Mock Foundation

Status: implemented as frontend-safe services and mock UI.

Implemented service boundaries:

- `modelControlService`: provider catalog, agent-specific model rows, prompt templates, safe mode, fallback model, budgets, and provider readiness.
- `promptToConfigService`: deterministic natural-language parser, structured rule preview, and mock apply flow.
- `settingsService`: route-facing settings overview for brand voice, tones, profit rules, COD/RTO rules, approval rules, notifications, and applied rules.

Implemented settings contracts:

- Model provider abstraction with OpenAI, Anthropic, Google, local/private, and mock parser providers.
- Agent-specific model configuration for the Phase 5 agents.
- Prompt template settings per agent.
- Brand voice, support tone, marketing tone, finance strictness, and language preference.
- Profit margin rules.
- COD/RTO rules.
- Automation approval rules.
- Notification preferences.
- Structured prompt-to-config rules with `settingPath`, `operator`, `parsedValue`, affected agents, preview/apply status, and audit summary.

Current mock prompt:

> "Never reduce price below 18% margin and auto-block COD only if RTO risk is above 75%."

The mock parser converts this into:

- A profit-margin rule that sets `settings.minMarginPercent` to `18`.
- A COD/RTO rule that sets `settings.codBlockRiskThreshold` to `75`.

Current limits:

- No real LLM call.
- No provider API key lookup.
- No persistent database write.
- Mock apply only updates client-side preview state in the UI.
- Real LLM parsing can be plugged into `promptToConfigService` later by preserving the same `PromptToConfigPreview` output contract.
