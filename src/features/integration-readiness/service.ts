export interface IntegrationReadinessCard {
  name: string;
  status: "not connected" | "planned" | "placeholder";
  dataNeeded: string[];
  unlocks: string[];
  currentWorkaround: string;
  warning?: string;
}

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
  { name: "Shopify / WooCommerce", status: "placeholder", dataNeeded: ["orders", "payment mode", "customer location", "fulfillment status"], unlocks: ["automatic order import", "real-time risk scoring"], currentWorkaround: "CSV upload" },
  { name: "Shiprocket / NimbusPost / Delhivery", status: "placeholder", dataNeeded: ["shipment status", "NDR reason", "courier attempts", "AWB"], unlocks: ["fresh NDR rescue queue", "courier action handoff"], currentWorkaround: "Courier CSV import/export" },
  { name: "WhatsApp provider", status: "placeholder", dataNeeded: ["template ids", "sender", "webhook secret"], unlocks: ["real message sending", "reply capture"], currentWorkaround: "Mock outbox and manual export" },
  { name: "Payment links", status: "planned", dataNeeded: ["payment link provider", "order amount", "customer phone"], unlocks: ["prepaid conversion tracking"], currentWorkaround: "Placeholder payment links" },
  { name: "Helpdesk", status: "planned", dataNeeded: ["ticket id", "support reason", "customer response"], unlocks: ["support-informed RTO actions"], currentWorkaround: "Manual response capture" },
  { name: "Accounting / reconciliation", status: "planned", dataNeeded: ["COD remittance", "shipping invoices", "returns charges"], unlocks: ["cashflow reconciliation"], currentWorkaround: "Export report package" }
];

export const productionSecretsWarning = "Do not enter production secrets in this MVP.";

export function placeholderWebhookUrl(baseUrl = "https://rtoshield.example.com") {
  return `${baseUrl}/api/webhooks/provider-placeholder`;
}
