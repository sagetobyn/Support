import {
  ANONYMIZED_AUDIT_DISALLOWED_FIELDS,
  ANONYMIZED_AUDIT_OPTIONAL_FIELDS,
  ANONYMIZED_AUDIT_REQUIRED_FIELDS,
  detectDisallowedAnonymizedCsvFields
} from "@/features/imports/anonymizedCsvValidator";

export const ANONYMIZED_CSV_SCHEMA_DOC_PATH = "docs/ANONYMIZED_CSV_GUIDE.md";
export const ANONYMIZED_CSV_SCHEMA_ANCHOR = "#anonymized-csv-schema";
export const SAMPLE_CSV_FIELD_COVERAGE_DOC_PATH = "docs/SAMPLE_CSV_FIELD_COVERAGE.md";
export const SAMPLE_CSV_FIELD_COVERAGE_ANCHOR = "#csv-field-coverage";

export { ANONYMIZED_AUDIT_DISALLOWED_FIELDS, ANONYMIZED_AUDIT_OPTIONAL_FIELDS, ANONYMIZED_AUDIT_REQUIRED_FIELDS };

export function detectDisallowedAuditFields(rawHeaders: string[]) {
  return detectDisallowedAnonymizedCsvFields(rawHeaders).map((field) => field.header);
}

export const AUDIT_MODE_REGISTRY = [
  {
    id: "summary",
    label: "Leakage check",
    title: "Mode 1: Summary leakage check",
    boundary: "No CSV and no customer-level rows. Use monthly operating numbers only.",
    sellerAction: "Share monthly orders, COD share, RTO rate, AOV, cost assumptions, and known problem clusters.",
    nextStep: "Use this when the seller is not ready to share any order export."
  },
  {
    id: "csv",
    label: "CSV profit audit",
    title: "Mode 2: Anonymized CSV profit audit",
    boundary: "Order-level rows are allowed only after removing customer identity fields.",
    sellerAction: `Upload these required columns: ${ANONYMIZED_AUDIT_REQUIRED_FIELDS.join(", ")}.`,
    nextStep: "Use this to identify pincode, courier, SKU, payment-mode, and NDR leakage drivers."
  },
  {
    id: "pilot",
    label: "Rescue pilot prep",
    title: "Mode 3: Rescue pilot preparation",
    boundary: "Still no live integrations here. Customer contact data belongs only in a separately agreed rescue pilot workflow.",
    sellerAction: "Prepare baseline exports, owner names, manual action process, cost assumptions, and approval rules.",
    nextStep: "Use this only after the leakage check or anonymized CSV profit audit shows a real recovery opportunity."
  }
] as const;

export type AuditModeId = (typeof AUDIT_MODE_REGISTRY)[number]["id"];

export const auditModeById = Object.fromEntries(AUDIT_MODE_REGISTRY.map((mode) => [mode.id, mode])) as Record<
  AuditModeId,
  (typeof AUDIT_MODE_REGISTRY)[number]
>;
