export interface IntegrationReadinessCard {
  name: string;
  status: "not connected" | "planned" | "placeholder";
  dataNeeded: string[];
  unlocks: string[];
  currentWorkaround: string;
  warning?: string;
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
