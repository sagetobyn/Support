export const PAID_AUDIT_DOC_PATH = "docs/PAID_AUDIT_DELIVERABLES.md";

export const PAID_AUDIT_OFFER = {
  title: "COD/RTO/NDR Profit Audit",
  priceInr: 999,
  priceLabel: "₹999",
  dataBoundary: "Summary numbers or an anonymized order/shipment/NDR CSV only",
  timelineLabel: "1 business day target",
  timelineDetail: "Target: 1 business day after usable data is shared",
  paymentIntegration: false
} as const;

export const PAID_AUDIT_DELIVERABLES = [
  {
    label: "Seller snapshot",
    detail: "Monthly orders, COD share, RTO rate, average order value, and the cost assumptions used for the leakage estimate."
  },
  {
    label: "Leakage estimate",
    detail: "Estimated monthly COD/RTO leakage with the formula basis and a plain-English warning when the sample is too thin."
  },
  {
    label: "Top leakage drivers",
    detail: "Where available from anonymized CSV: pincode, courier, SKU/product, payment mode, and NDR reason concentration."
  },
  {
    label: "First action preview",
    detail: "Manual confirmation, address correction, reattempt, hold, cancellation, or courier-review actions to test first."
  },
  {
    label: "Rescue pilot fit",
    detail: "A go/no-go recommendation for a CSV-first rescue pilot, including the first action queue to prepare."
  },
  {
    label: "Privacy and data-quality notes",
    detail: "Accepted fields, missing fields, rejected PII fields, and what must be cleaned before any rescue pilot discussion."
  }
] as const;

export const PAID_AUDIT_PROCESS = [
  {
    step: "1",
    title: "Share the right data",
    detail: "Start with summary numbers or the anonymized CSV schema. Customer names, phones, emails, and full addresses are not accepted."
  },
  {
    step: "2",
    title: "Validate assumptions",
    detail: "Confirm cost inputs, COD share, RTO rate, sample window, and any known problem pincodes, couriers, products, or NDR reasons."
  },
  {
    step: "3",
    title: "Receive the profit audit artifact",
    detail: "Get a written leakage estimate, driver table, first action preview, and rescue-pilot-fit recommendation."
  },
  {
    step: "4",
    title: "Choose the next step",
    detail: "Use the artifact to decide between stopping, sharing a cleaner anonymized CSV, or preparing a separate rescue pilot."
  }
] as const;

export const PAID_AUDIT_SAMPLE_OUTLINE = [
  "1. Seller snapshot and assumptions",
  "2. Estimated COD/RTO/NDR leakage",
  "3. Top leakage drivers from summary or anonymized CSV",
  "4. First manual actions to test",
  "5. Rescue pilot fit and preparation checklist",
  "6. Appendix: data quality, missing fields, and PII boundary"
] as const;

export const PAID_AUDIT_NOT_INCLUDED = [
  "No checkout or payment integration inside Wembro",
  "No real WhatsApp sending from this audit",
  "No courier API push from this audit",
  "No Shopify or WooCommerce sync from this audit",
  "No guaranteed savings claim"
] as const;

export function buildPaidAuditOfferCopy() {
  return [
    `${PAID_AUDIT_OFFER.priceLabel} ${PAID_AUDIT_OFFER.title}`,
    `Data accepted: ${PAID_AUDIT_OFFER.dataBoundary}.`,
    `Timeline: ${PAID_AUDIT_OFFER.timelineDetail}.`,
    "",
    "Deliverables:",
    ...PAID_AUDIT_DELIVERABLES.map((item) => `- ${item.label}: ${item.detail}`),
    "",
    "Process:",
    ...PAID_AUDIT_PROCESS.map((item) => `${item.step}. ${item.title}: ${item.detail}`),
    "",
    "Sample profit audit outline:",
    ...PAID_AUDIT_SAMPLE_OUTLINE.map((item) => `- ${item}`),
    "",
    "Not included:",
    ...PAID_AUDIT_NOT_INCLUDED.map((item) => `- ${item}`)
  ].join("\n");
}
