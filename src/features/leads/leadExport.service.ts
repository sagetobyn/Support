import type { CalculatorLead, CalculatorLeadConsentSnapshot } from "./types";

export const CALCULATOR_LEAD_PRIVACY_STATEMENT =
  "Leakage check calculator lead. No customer names, phones, emails, addresses, order IDs, AWBs, or customer-level rows were collected.";

export function createCalculatorLeadConsentSnapshot(consentFlag: boolean, capturedAt: string): CalculatorLeadConsentSnapshot {
  return {
    summaryOnly: true,
    noCustomerLevelData: true,
    consentFlag,
    capturedAt,
    statement: CALCULATOR_LEAD_PRIVACY_STATEMENT
  };
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

export function buildCalculatorLeadCsv(leads: CalculatorLead[]) {
  const columns: Array<{ header: string; value: (lead: CalculatorLead) => unknown }> = [
    { header: "id", value: (lead) => lead.id },
    { header: "createdAt", value: (lead) => lead.createdAt },
    { header: "brandName", value: (lead) => lead.brandName },
    { header: "contactName", value: (lead) => lead.contactName },
    { header: "contact", value: (lead) => lead.contact },
    { header: "category", value: (lead) => lead.category },
    { header: "shippingPlatform", value: (lead) => lead.shippingPlatform },
    { header: "monthlyOrders", value: (lead) => lead.monthlyOrders },
    { header: "codPercentage", value: (lead) => lead.codPercentage },
    { header: "rtoPercentage", value: (lead) => lead.rtoPercentage },
    { header: "averageOrderValue", value: (lead) => lead.averageOrderValue },
    { header: "assumptionMonthlyLeakage", value: (lead) => lead.assumptions?.monthlyLeakage ?? "" },
    { header: "assumptionDailyLeakage", value: (lead) => lead.assumptions?.dailyLeakage ?? "" },
    { header: "assumptionRtoLossPerOrder", value: (lead) => lead.assumptions?.rtoLossPerOrder ?? "" },
    { header: "assumptionSavingAt10", value: (lead) => lead.assumptions?.savingAt10 ?? "" },
    { header: "assumptionSavingAt20", value: (lead) => lead.assumptions?.savingAt20 ?? "" },
    { header: "assumptionSavingAt30", value: (lead) => lead.assumptions?.savingAt30 ?? "" },
    { header: "assumptionPilotSoftwareCost", value: (lead) => lead.assumptions?.pilotSoftwareCost ?? "" },
    { header: "assumptionTargetRtoReductionPercentage", value: (lead) => lead.assumptions?.targetRtoReductionPercentage ?? "" },
    { header: "assumptionGrossMarginPercentage", value: (lead) => lead.assumptions?.grossMarginPercentage ?? "" },
    { header: "assumptionForwardShippingCost", value: (lead) => lead.assumptions?.forwardShippingCost ?? "" },
    { header: "assumptionReturnShippingCost", value: (lead) => lead.assumptions?.returnShippingCost ?? "" },
    { header: "assumptionPackagingCost", value: (lead) => lead.assumptions?.packagingCost ?? "" },
    { header: "assumptionEstimatedCac", value: (lead) => lead.assumptions?.estimatedCac ?? "" },
    { header: "assumptionCodFee", value: (lead) => lead.assumptions?.codFee ?? "" },
    { header: "assumptionSupportOpsCost", value: (lead) => lead.assumptions?.supportOpsCost ?? "" },
    { header: "assumptionFormulaBasis", value: (lead) => lead.assumptions?.formulaBasis ?? "" },
    { header: "qualificationStage", value: (lead) => lead.qualification?.stage || "" },
    { header: "qualificationScore", value: (lead) => lead.qualification?.score ?? "" },
    { header: "qualificationTitle", value: (lead) => lead.qualification?.title || "" },
    { header: "nextStepRecommendation", value: (lead) => lead.qualification?.nextStep || "" },
    { header: "consentFlag", value: (lead) => lead.privacyConsent?.consentFlag ?? lead.consent },
    { header: "consentCapturedAt", value: (lead) => lead.privacyConsent?.capturedAt || lead.createdAt },
    { header: "consentSummaryOnly", value: (lead) => lead.privacyConsent?.summaryOnly ?? true },
    { header: "consentNoCustomerLevelData", value: (lead) => lead.privacyConsent?.noCustomerLevelData ?? true },
    { header: "privacyStatement", value: (lead) => lead.privacyConsent?.statement || CALCULATOR_LEAD_PRIVACY_STATEMENT },
    { header: "notes", value: (lead) => lead.notes }
  ];

  return [
    columns.map((column) => column.header).join(","),
    ...leads.map((lead) => columns.map((column) => csvEscape(column.value(lead))).join(","))
  ].join("\n");
}
