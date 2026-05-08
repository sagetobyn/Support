export interface IntegrationReadinessCard {
  name: string;
  status: "not connected" | "planned" | "placeholder";
  category: "storefront" | "courier" | "messaging" | "payment" | "support" | "finance";
  dataNeeded: string[];
  unlocks: string[];
  currentWorkaround: string;
  automationStage: AutomationStageId;
  productionBlocker: string;
  nextStep: string;
  warning?: string;
}

export type AutomationStageId = "manual_csv" | "recommendation_only" | "draft_action" | "human_approved" | "trusted_automation";

export const automationStages: Array<{
  id: AutomationStageId;
  label: string;
  description: string;
}> = [
  { id: "manual_csv", label: "Manual CSV", description: "Seller uploads or exports files. No external system writes happen." },
  { id: "recommendation_only", label: "Recommendation only", description: "Wembro explains what to do, but the seller executes elsewhere." },
  { id: "draft_action", label: "Draft action", description: "Wembro prepares messages, exports, or tasks for human review." },
  { id: "human_approved", label: "Human-approved execution", description: "A user approves each provider action before it is sent." },
  { id: "trusted_automation", label: "Trusted automation", description: "Rules can run automatically after audit, permissions, and rollback controls exist." }
];

export interface ProductionTrustInput {
  ordersCount: number;
  messagesCount: number;
  responsesCount: number;
  importsCount: number;
  audits: Array<{ action: string; createdAt: string }>;
  localOnly: boolean;
}

export function buildProductionTrustSummary(input: ProductionTrustInput) {
  const exportCount = input.audits.filter((audit) => audit.action === "export_created").length;
  const deletionCount = input.audits.filter((audit) => audit.action === "data_deleted").length;
  const importAuditCount = input.audits.filter((audit) => audit.action === "csv_imported" || audit.action === "csv_uploaded").length;
  const hasOperationalData = input.ordersCount > 0 || input.messagesCount > 0 || input.responsesCount > 0;
  const blockers = [
    input.localOnly ? "Local browser storage only; no tenant-isolated server storage yet." : "",
    hasOperationalData && !exportCount ? "No export audit recorded for the current workspace." : "",
    input.importsCount > 0 && !importAuditCount ? "Import history exists without matching audit coverage." : ""
  ].filter(Boolean);

  return {
    status: blockers.length ? "pilot_safe" : "ready_for_review",
    headline: blockers.length ? "Pilot-safe, not production-ready" : "Production controls ready for review",
    detail: blockers.length
      ? "Use this for controlled pilots with CSV data, visible exports, and manual governance."
      : "Core privacy, export, and audit signals are visible enough for a production readiness review.",
    exportCount,
    deletionCount,
    importAuditCount,
    blockers,
    controls: [
      { label: "Storage", value: input.localOnly ? "Local-only" : "Server-backed", status: input.localOnly ? "planned" : "ready" },
      { label: "Audit trail", value: `${input.audits.length} events`, status: input.audits.length ? "ready" : "planned" },
      { label: "Exports", value: `${exportCount} logged`, status: exportCount ? "ready" : "planned" },
      { label: "Deletion", value: `${deletionCount} logged`, status: deletionCount ? "ready" : "available" }
    ]
  };
}

export const integrationReadinessCards: IntegrationReadinessCard[] = [
  {
    name: "Shopify / WooCommerce",
    status: "placeholder",
    category: "storefront",
    dataNeeded: ["orders", "payment mode", "customer location", "fulfillment status"],
    unlocks: ["automatic order import", "real-time risk scoring"],
    currentWorkaround: "CSV upload",
    automationStage: "manual_csv",
    productionBlocker: "Needs OAuth app setup, tenant isolation, field mapping, retry handling, and import audit logs.",
    nextStep: "Keep CSV template stable, then add read-only order import."
  },
  {
    name: "Shiprocket / NimbusPost / Delhivery",
    status: "placeholder",
    category: "courier",
    dataNeeded: ["shipment status", "NDR reason", "courier attempts", "AWB"],
    unlocks: ["fresh NDR rescue queue", "courier action handoff"],
    currentWorkaround: "Courier CSV import/export",
    automationStage: "recommendation_only",
    productionBlocker: "Needs provider contracts, webhook validation, AWB matching, and approval logs before courier pushes.",
    nextStep: "Start with courier CSV import plus exportable action packets."
  },
  {
    name: "WhatsApp provider",
    status: "placeholder",
    category: "messaging",
    dataNeeded: ["template ids", "sender", "webhook secret"],
    unlocks: ["real message sending", "reply capture"],
    currentWorkaround: "Mock outbox and manual export",
    automationStage: "draft_action",
    productionBlocker: "Needs approved templates, sender setup, opt-out handling, webhook signatures, and per-message approval.",
    nextStep: "Keep mock outbox, then add provider-ready drafts and response capture."
  },
  {
    name: "Payment links",
    status: "planned",
    category: "payment",
    dataNeeded: ["payment link provider", "order amount", "customer phone"],
    unlocks: ["prepaid conversion tracking"],
    currentWorkaround: "Placeholder payment links",
    automationStage: "recommendation_only",
    productionBlocker: "Needs payment provider account, reconciliation, expiry handling, and refund/cancel policy.",
    nextStep: "Generate prepaid offer recommendations without collecting payment credentials."
  },
  {
    name: "Helpdesk",
    status: "planned",
    category: "support",
    dataNeeded: ["ticket id", "support reason", "customer response"],
    unlocks: ["support-informed RTO actions"],
    currentWorkaround: "Manual response capture",
    automationStage: "manual_csv",
    productionBlocker: "Needs ticket permissions, customer consent boundaries, and support reason taxonomy.",
    nextStep: "Use manual response capture until support fields prove action value."
  },
  {
    name: "Accounting / reconciliation",
    status: "planned",
    category: "finance",
    dataNeeded: ["COD remittance", "shipping invoices", "returns charges"],
    unlocks: ["cashflow reconciliation"],
    currentWorkaround: "Export report package",
    automationStage: "manual_csv",
    productionBlocker: "Needs invoice formats, remittance matching, and finance-approved variance rules.",
    nextStep: "Export reports for manual finance review before reconciliation automation."
  }
];

export const productionSecretsWarning = "Do not enter production secrets in this MVP.";

export function automationStageLabel(stageId: AutomationStageId) {
  return automationStages.find((stage) => stage.id === stageId)?.label || "Manual CSV";
}

export function buildIntegrationReadinessSummary(cards = integrationReadinessCards) {
  const byStage = automationStages.map((stage) => ({
    ...stage,
    count: cards.filter((card) => card.automationStage === stage.id).length
  }));
  const nextStage = byStage.find((stage) => stage.count > 0 && stage.id !== "trusted_automation") || byStage[0];
  const readyForAutomation = cards.filter((card) => card.automationStage === "human_approved" || card.automationStage === "trusted_automation").length;

  return {
    total: cards.length,
    readyForAutomation,
    safestNextStage: nextStage,
    headline: "Integrations stay provider-safe until CSV proof is repeatable.",
    principle: "Progress from insight to recommendation, draft action, human approval, then trusted automation.",
    byStage
  };
}

export function placeholderWebhookUrl(baseUrl = "https://wembro.example.com") {
  return `${baseUrl}/api/webhooks/provider-placeholder`;
}
