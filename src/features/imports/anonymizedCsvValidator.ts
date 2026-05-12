import { canonicalCsvHeader, normalizeCsvHeader } from "@/lib/csvImport";
import {
  missingAuditFieldBlockingIssue,
  missingAuditFieldCleanupInstruction,
  missingAuditFieldWarning
} from "@/features/reports/auditLimitations.service";

export const ANONYMIZED_AUDIT_REQUIRED_FIELDS = [
  "order_id",
  "pincode",
  "payment_mode",
  "order_value",
  "courier",
  "shipment_status",
  "ndr_reason",
  "final_status"
] as const;

export const ANONYMIZED_AUDIT_OPTIONAL_FIELDS = [
  "order_date",
  "sku",
  "product_name",
  "city",
  "state",
  "source_platform",
  "campaign_name",
  "attempt_count"
] as const;

export const ANONYMIZED_AUDIT_DISALLOWED_FIELDS = [
  {
    field: "customer_name",
    label: "Customer name",
    aliases: ["customer_name", "customer name", "buyer_name", "buyer name", "consignee_name", "consignee name", "recipient_name", "recipient name"],
    action: "Remove the customer name column before uploading an anonymized audit CSV."
  },
  {
    field: "phone",
    label: "Phone or WhatsApp number",
    aliases: ["phone", "phone_number", "phone number", "customer_phone", "customer phone", "mobile", "mobile_number", "mobile number", "whatsapp", "whatsapp_number", "alternate_phone", "alternate phone", "consignee phone"],
    action: "Remove phone, mobile, WhatsApp, and alternate-phone columns before upload."
  },
  {
    field: "email",
    label: "Customer email",
    aliases: ["email", "email_address", "email address", "customer_email", "customer email", "buyer_email", "buyer email"],
    action: "Remove customer email columns before upload."
  },
  {
    field: "full_address",
    label: "Full address or address lines",
    aliases: ["address", "full_address", "full address", "shipping_address", "shipping address", "billing_address", "billing address", "customer_address", "customer address", "delivery_address", "delivery address", "address_line_1", "address line 1", "address_line_2", "address line 2", "landmark", "nearby_landmark", "nearby landmark"],
    action: "Remove full address, address line, and landmark columns. Keep only pincode, city, and state for the public audit."
  },
  {
    field: "customer_id",
    label: "Customer ID or profile link",
    aliases: ["customer_id", "customer id", "buyer_id", "buyer id", "profile_link", "profile link", "customer_profile", "customer profile"],
    action: "Remove customer IDs and profile links before upload."
  }
] as const;

export type AnonymizedAuditRequiredField = (typeof ANONYMIZED_AUDIT_REQUIRED_FIELDS)[number];

export interface DisallowedAnonymizedCsvField {
  field: (typeof ANONYMIZED_AUDIT_DISALLOWED_FIELDS)[number]["field"];
  label: string;
  header: string;
  canonicalHeader: string;
  action: string;
}

export interface AnonymizedAuditCsvSchemaValidation {
  rawHeaders: string[];
  canonicalHeaders: string[];
  columnMapping: Record<string, string>;
  missingRequiredFields: string[];
  disallowedFields: DisallowedAnonymizedCsvField[];
  warnings: string[];
  blockingIssues: string[];
  cleanupInstructions: string[];
  canGenerateAudit: boolean;
}

export function detectDisallowedAnonymizedCsvFields(rawHeaders: string[]): DisallowedAnonymizedCsvField[] {
  const detected: DisallowedAnonymizedCsvField[] = [];

  rawHeaders.forEach((header) => {
    const normalizedHeader = normalizeCsvHeader(header);
    const canonicalHeader = canonicalCsvHeader(header);
    const match = ANONYMIZED_AUDIT_DISALLOWED_FIELDS.find((field) =>
      field.field === canonicalHeader ||
      field.aliases.some((alias) => normalizeCsvHeader(alias) === normalizedHeader || normalizeCsvHeader(alias) === normalizeCsvHeader(canonicalHeader))
    );

    if (match) {
      detected.push({
        field: match.field,
        label: match.label,
        header,
        canonicalHeader,
        action: match.action
      });
    }
  });

  return detected;
}

export function validateAnonymizedAuditCsvSchema(rawHeaders: string[]): AnonymizedAuditCsvSchemaValidation {
  const canonicalHeaders = rawHeaders.map(canonicalCsvHeader);
  const columnMapping = Object.fromEntries(canonicalHeaders.map((header, index) => [header, rawHeaders[index]]));
  const headerSet = new Set(canonicalHeaders);
  const missingRequiredFields = ANONYMIZED_AUDIT_REQUIRED_FIELDS.filter((field) => !headerSet.has(field));
  const disallowedFields = detectDisallowedAnonymizedCsvFields(rawHeaders);
  const cleanupInstructions = [
    ...disallowedFields.map((field) => `${field.header}: ${field.action}`),
    ...missingRequiredFields.map(missingAuditFieldCleanupInstruction)
  ];
  const blockingIssues = [
    ...disallowedFields.map((field) => `Remove ${field.label.toLowerCase()} column "${field.header}".`),
    ...missingRequiredFields.map(missingAuditFieldBlockingIssue)
  ];
  const warnings = [
    ...disallowedFields.map((field) => `${field.header} looks like ${field.label.toLowerCase()} and cannot be used in anonymized audit mode.`),
    ...missingRequiredFields.map(missingAuditFieldWarning)
  ];

  return {
    rawHeaders,
    canonicalHeaders,
    columnMapping,
    missingRequiredFields,
    disallowedFields,
    warnings,
    blockingIssues,
    cleanupInstructions,
    canGenerateAudit: blockingIssues.length === 0
  };
}
