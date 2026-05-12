import { formatNumber } from "@/lib/reporting";

export type AuditConfidenceReasonKey = "summaryOnly" | "lowSample" | "dataQualityGaps" | "usableOrderData";

const REQUIRED_FIELD_GUIDANCE: Record<string, { cleanup: string; impact: string }> = {
  pincode: {
    cleanup: "Add pincode to rank geography leakage without uploading full addresses.",
    impact: "Missing pincode blocks geography leakage ranking."
  },
  courier: {
    cleanup: "Add courier to compare courier-lane RTO leakage.",
    impact: "Missing courier blocks courier-lane leakage ranking."
  },
  ndr_reason: {
    cleanup: "Add ndr_reason to rank failed-delivery reasons before they become RTO.",
    impact: "Missing ndr_reason blocks NDR reason leakage ranking."
  },
  shipment_status: {
    cleanup: "Add shipment_status to separate delivered, in-transit, NDR, and RTO orders.",
    impact: "Missing shipment_status limits RTO/NDR outcome classification."
  },
  final_status: {
    cleanup: "Add final_status to confirm delivered versus RTO outcomes.",
    impact: "Missing final_status limits delivered-versus-RTO classification."
  }
};

export function auditConfidenceReason(reason: AuditConfidenceReasonKey): string {
  if (reason === "summaryOnly") {
    return "Summary leakage check inputs size the leakage but do not prove pincode, courier, SKU, or NDR concentration.";
  }
  if (reason === "lowSample") {
    return "The anonymized CSV sample is too small for strong driver confidence.";
  }
  if (reason === "dataQualityGaps") {
    return "Order-level data exists, but sample size or data-quality gaps limit confidence.";
  }
  return "Usable order-level data is available with enough rows for a stronger directional audit.";
}

export function summaryOnlyLimitation(): string {
  return "Weak data caveat: summary leakage check inputs only size leakage; they cannot prove pincode, courier, SKU, or NDR driver concentration.";
}

export function lowSampleLimitation(validRows: number): string {
  return `Weak data caveat: only ${formatNumber(validRows)} valid rows were used, so pincode, courier, SKU, and NDR rankings are directional.`;
}

export function reportLowSampleLimitation(orderVolume: number): string {
  return `Weak data caveat: only ${formatNumber(orderVolume)} rows are in this report, so pincode, courier, SKU, and NDR rankings are directional.`;
}

export function invalidRowsExcludedLimitation(invalidRows: number): string {
  return `${formatNumber(invalidRows)} invalid rows were excluded from the audit output.`;
}

export function missingAuditFieldLimitation(field: string): string {
  return `Missing ${field} limits the audit: ${requiredFieldImpact(field)}`;
}

export function driverRankingNeedsCsvLimitation(): string {
  return "Upload an anonymized CSV to rank pincode, courier, SKU, and NDR leakage drivers.";
}

export function estimatedSavingsLimitation(): string {
  return "Savings are estimates from cost assumptions, not guaranteed or verified recovered money.";
}

export function missingAuditFieldCleanupInstruction(field: string): string {
  const guidance = REQUIRED_FIELD_GUIDANCE[field];
  return `${field}: ${guidance?.cleanup ?? "Add this required anonymized audit column."}`;
}

export function missingAuditFieldBlockingIssue(field: string): string {
  return `Missing required anonymized audit field: ${field}. ${requiredFieldImpact(field)}`;
}

export function missingAuditFieldWarning(field: string): string {
  return `${field} is required for COD/RTO/NDR leakage analysis. ${requiredFieldImpact(field)}`;
}

function requiredFieldImpact(field: string): string {
  return REQUIRED_FIELD_GUIDANCE[field]?.impact ?? "Missing this field limits COD/RTO/NDR leakage analysis.";
}
