import type { AuditSession } from "@/lib/audit";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/reporting";

export type PreSalesProofSnippetInput = {
  sourceLabel: string;
  brandName?: string;
  monthlyOrders: number;
  codPercentage: number;
  rtoPercentage: number;
  monthlyLeakage: number;
  rtoLossPerOrder: number;
  formulaBasis: string;
  nextStep: string;
  firstAction?: string;
  evidenceNote?: string;
};

const privacyLine =
  "Privacy: summary or anonymized data only; no customer names, phones, emails, full addresses, order IDs, or AWBs are included.";

const estimateLine = "Label: estimate only, not verified savings and not a guaranteed ROI claim.";

function sellerLabel(brandName?: string) {
  return brandName?.trim() || "This seller";
}

export function buildPreSalesProofSnippet(input: PreSalesProofSnippetInput) {
  const lines = [
    `${sellerLabel(input.brandName)} - COD/RTO/NDR leakage follow-up`,
    estimateLine,
    `${input.sourceLabel}: estimated monthly leakage is ${formatCurrency(input.monthlyLeakage)} at ${formatCurrency(input.rtoLossPerOrder, { perOrder: true })}.`,
    `Assumptions: ${formatNumber(input.monthlyOrders)} monthly orders, ${formatPercent(input.codPercentage)} COD, ${formatPercent(input.rtoPercentage)} RTO.`,
    `Formula basis: ${input.formulaBasis}.`
  ];

  if (input.evidenceNote) lines.push(`Evidence note: ${input.evidenceNote}`);
  if (input.firstAction) lines.push(`First action to discuss: ${input.firstAction}`);
  lines.push(`Recommended next step: ${input.nextStep}`);
  lines.push(privacyLine);

  return lines.join("\n");
}

export function buildCalculatorPreSalesProofSnippet(input: {
  brandName?: string;
  monthlyOrders: number;
  codPercentage: number;
  rtoPercentage: number;
  monthlyLeakage: number;
  rtoLossPerOrder: number;
  formulaBasis: string;
  nextStep: string;
}) {
  return buildPreSalesProofSnippet({
    ...input,
    sourceLabel: "Leakage check",
    evidenceNote: "Built from seller-entered summary numbers, before any CSV or customer-level data."
  });
}

export function buildAuditPreSalesProofSnippet(input: {
  session: AuditSession;
  firstAction: string;
  topLeak: string;
}) {
  const metrics = input.session.calculated_metrics;
  const evidenceNote = input.session.mode === "csv"
    ? `Anonymized CSV profit audit with ${formatNumber(input.session.row_count || 0)} usable rows. Top leak to validate: ${input.topLeak}.`
    : `Summary leakage check. Top leak to validate: ${input.topLeak}.`;

  return buildPreSalesProofSnippet({
    sourceLabel: "Profit audit",
    brandName: input.session.brand_name,
    monthlyOrders: metrics.monthlyOrders,
    codPercentage: metrics.codPercentage,
    rtoPercentage: metrics.rtoPercentage,
    monthlyLeakage: metrics.monthlyLeakage,
    rtoLossPerOrder: metrics.rtoLossPerOrder,
    formulaBasis: "RTO loss per order x estimated RTO orders",
    nextStep: input.session.mode === "csv"
      ? "Use the top leak and first action to decide whether a narrow rescue pilot is worth planning."
      : "Confirm assumptions with anonymized CSV before pitching a rescue pilot.",
    firstAction: input.firstAction,
    evidenceNote
  });
}
