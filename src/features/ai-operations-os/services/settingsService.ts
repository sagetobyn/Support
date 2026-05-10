import { aiOperationsWorkspace } from "../data/mockOperatingSystem";
import type { SellerRuleDraft } from "../domain/types";

export function getSellerSettings() {
  return aiOperationsWorkspace.settings;
}

export function convertInstructionToRuleDraft(instruction: string): SellerRuleDraft {
  const normalized = instruction.toLowerCase();
  const isMarginRule = normalized.includes("margin") || normalized.includes("price");
  const isMessageRule = normalized.includes("message") || normalized.includes("whatsapp") || normalized.includes("support");
  const isCodRule = normalized.includes("cod") || normalized.includes("rto");
  const isModelRule = normalized.includes("model") || normalized.includes("settlement");

  if (isMarginRule) {
    return {
      id: "rule-draft-margin-preview",
      sourceInstruction: instruction,
      domain: "pricing_profitability",
      condition: "projected_margin_percent is below configured floor",
      action: "block price or discount change and create approval task",
      riskLevel: "high",
      approvalRequired: true,
      confidence: 0.91
    };
  }

  if (isCodRule) {
    return {
      id: "rule-draft-cod-preview",
      sourceInstruction: instruction,
      domain: "rto_ndr",
      condition: "rto_risk_score is above configured threshold and payment method is COD",
      action: "draft COD block recommendation for affected pincode or marketplace",
      riskLevel: "high",
      approvalRequired: true,
      confidence: 0.88
    };
  }

  if (isModelRule) {
    return {
      id: "rule-draft-model-preview",
      sourceInstruction: instruction,
      domain: "model_control",
      condition: "agent domain matches settlement_reconciliation",
      action: "use stronger model configuration with lower creativity and higher reasoning depth",
      riskLevel: "medium",
      approvalRequired: true,
      confidence: 0.86
    };
  }

  if (isMessageRule) {
    return {
      id: "rule-draft-message-preview",
      sourceInstruction: instruction,
      domain: "customer_support",
      condition: "customer message is ready for dispatch",
      action: "apply support tone and quiet-hour policy before sending",
      riskLevel: "medium",
      approvalRequired: false,
      confidence: 0.84
    };
  }

  return {
    id: "rule-draft-general-preview",
    sourceInstruction: instruction,
    domain: "general_operations",
    condition: "instruction matches seller preference",
    action: "create reviewable setting draft before applying",
    riskLevel: "medium",
    approvalRequired: true,
    confidence: 0.72
  };
}

