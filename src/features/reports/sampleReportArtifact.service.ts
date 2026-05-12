import { calculateCalculatorOutputs, defaultCalculatorInputs } from "@/lib/calculator";
import { formatCurrency, formatNumber } from "@/lib/reporting";

export const sampleReportSeller = {
  brand: "Nazrana Streetwear",
  category: "Fashion D2C",
  monthlyOrders: 1800,
  codPercentage: 72,
  overallRto: 24,
  codRto: 31,
  averageOrderValue: 1299,
  forwardShippingCost: 70,
  returnShippingCost: 75,
  packagingCost: 25,
  estimatedCac: 180,
  codFee: 25,
  supportOpsCost: 50,
  pilotFee: 4999
} as const;

export const sampleReportFictionalNotice =
  "Fictional demo data. This is not a real customer result, not verified savings, and not a guaranteed ROI claim.";

export const sampleReportOutputs = calculateCalculatorOutputs({
  ...defaultCalculatorInputs,
  monthlyOrders: sampleReportSeller.monthlyOrders,
  codPercentage: sampleReportSeller.codPercentage,
  overallRtoPercentage: sampleReportSeller.overallRto,
  codRtoPercentage: sampleReportSeller.codRto,
  averageOrderValue: sampleReportSeller.averageOrderValue,
  forwardShippingCost: sampleReportSeller.forwardShippingCost,
  returnShippingCost: sampleReportSeller.returnShippingCost,
  packagingCost: sampleReportSeller.packagingCost,
  estimatedCac: sampleReportSeller.estimatedCac,
  codFee: sampleReportSeller.codFee,
  supportOpsCost: sampleReportSeller.supportOpsCost,
  pilotSoftwareCost: sampleReportSeller.pilotFee
});

const monthlyLoss = sampleReportOutputs.monthlyRtoLeakage;
const codLeakage = sampleReportOutputs.codDrivenRtoLeakage || 0;
const prepaidLeakage = monthlyLoss - codLeakage;
const ndrLeakage = monthlyLoss * 0.46;
const courierPincodeLeakage = monthlyLoss * 0.34;

export const sampleReportDecision = {
  eyebrow: "Fictional profit audit sample",
  label: "Decision",
  headline: "Decision: approve a COD/RTO/NDR profit audit before any rescue pilot",
  summary: `${sampleReportSeller.brand} looks like a profit audit candidate because COD RTO is materially higher than overall RTO. The first profit audit artifact should validate whether COD intent, pincode concentration, and NDR delay explain the leakage before the seller commits to a rescue pilot.`,
  nextStep: "Ask for summary inputs first. If the seller wants driver ranking, request an anonymized CSV with no customer name, phone, email, or full address.",
  notAClaim: sampleReportFictionalNotice
} as const;

export const sampleReportMetrics = [
  { label: "Brand shape", value: sampleReportSeller.brand },
  { label: "Monthly orders", value: formatNumber(sampleReportSeller.monthlyOrders) },
  { label: "COD share", value: `${sampleReportSeller.codPercentage}%` },
  { label: "Overall RTO", value: `${sampleReportSeller.overallRto}%` },
  { label: "COD RTO", value: `${sampleReportSeller.codRto}%` },
  { label: "Estimated leakage", value: formatCurrency(monthlyLoss) }
] as const;

export const sampleReportAssumptions = [
  { label: "Average order value", value: formatCurrency(sampleReportSeller.averageOrderValue) },
  { label: "Forward shipping", value: formatCurrency(sampleReportSeller.forwardShippingCost) },
  { label: "Return shipping", value: formatCurrency(sampleReportSeller.returnShippingCost) },
  { label: "Packaging", value: formatCurrency(sampleReportSeller.packagingCost) },
  { label: "Estimated CAC", value: formatCurrency(sampleReportSeller.estimatedCac) },
  { label: "COD fee", value: formatCurrency(sampleReportSeller.codFee) }
] as const;

export const sampleReportLeakageBreakdown = [
  {
    label: "COD-driven RTO",
    amount: formatCurrency(codLeakage),
    note: "Calculated from COD order share, COD RTO, average order value, shipping, packaging, CAC, and COD fee assumptions."
  },
  {
    label: "Prepaid RTO",
    amount: formatCurrency(prepaidLeakage),
    note: "Kept separate so COD policy is not over-applied to prepaid orders."
  },
  {
    label: "NDR-related leakage",
    amount: formatCurrency(ndrLeakage),
    note: "Directional estimate only until anonymized NDR reasons are uploaded."
  },
  {
    label: "Courier/pincode concentration",
    amount: formatCurrency(courierPincodeLeakage),
    note: "Directional estimate only until pincode and courier rows are validated."
  }
] as const;

export const sampleReportTopLeaks = [
  {
    rank: 1,
    title: "COD RTO is the first leak to validate",
    evidence: `${sampleReportSeller.codPercentage}% COD share with ${sampleReportSeller.codRto}% COD RTO versus ${sampleReportSeller.overallRto}% overall RTO.`,
    estimatedImpact: formatCurrency(codLeakage),
    firstAction: "Test a manual COD confirmation rule for high-value first-time COD orders before dispatch.",
    proofNote: "Profit audit proof would show the formula inputs and the anonymized rows used to confirm the COD gap."
  },
  {
    rank: 2,
    title: "RTO is concentrated in a few delivery clusters",
    evidence: "Fictional sample clusters include 395007 and 302001 with higher RTO than the sample average.",
    estimatedImpact: formatCurrency(courierPincodeLeakage),
    firstAction: "Rank pincode-courier pairs and apply stricter COD confirmation only where the data supports it.",
    proofNote: "Profit audit proof would include pincode-level totals, RTO counts, excluded rows, and low-sample caveats."
  },
  {
    rank: 3,
    title: "NDR delay can turn avoidable cases into RTO",
    evidence: "Fictional NDR reasons are customer unavailable, refused, wrong address, and phone unreachable.",
    estimatedImpact: formatCurrency(ndrLeakage),
    firstAction: "Create a daily manual NDR queue for address correction, reattempt request, or cancellation decision.",
    proofNote: "No live message sending or courier push is implied; this is an operator checklist unless integrations are approved."
  }
] as const;

export const sampleReportRankedActions = [
  {
    rank: 1,
    title: "Validate the COD gap",
    owner: "Founder or ops lead",
    action: "Compare COD RTO against prepaid RTO and confirm whether high-risk COD orders deserve a manual pre-dispatch check."
  },
  {
    rank: 2,
    title: "Request anonymized CSV only if useful",
    owner: "Seller ops team",
    action: "Upload order ID, pincode, payment mode, order value, courier, shipment status, NDR reason, and final outcome. Keep names, phones, emails, and full addresses out."
  },
  {
    rank: 3,
    title: "Prepare a rescue pilot decision",
    owner: "Founder",
    action: "Move to a rescue pilot only if the profit audit finds a repeatable COD/RTO/NDR action queue with a believable proof trail."
  }
] as const;

export const sampleReportProofNotes = [
  "This sample uses fictional brand, order, pincode, courier, SKU, and NDR data.",
  "Savings are modeled estimates from assumptions, not verified recovered money and not guaranteed ROI.",
  "A profit audit should show assumptions, formula basis, excluded rows, confidence caveats, and the first action.",
  "No customer-level data is required for the sample or anonymized CSV audit.",
  "No live WhatsApp sending, courier API push, Shopify sync, or WooCommerce sync is included in this artifact."
] as const;

export const sampleReportPaidArtifactIncludes = [
  "One founder decision at the top: leakage check, profit audit candidate, or rescue pilot candidate.",
  "Ranked COD/RTO/NDR leaks with estimated impact and the first manual action.",
  "Assumptions table using INR formatting so the seller can challenge the math.",
  "Privacy boundary: leakage check or anonymized CSV profit audit unless a rescue pilot is explicitly approved.",
  "Proof notes that separate estimates from verified savings."
] as const;

export const sampleReportCtaLadder = [
  {
    label: "Start privacy-safe profit audit",
    href: "/audit",
    style: "primary",
    note: "Begin with summary numbers. Use anonymized CSV only when the seller wants driver ranking."
  },
  {
    label: "Check rescue pilot fit",
    href: "/pilot",
    style: "secondary",
    note: "Move here only after the profit audit finds a repeatable COD/RTO/NDR action queue."
  },
  {
    label: "Re-run leakage check",
    href: "/calculator",
    style: "secondary",
    note: "Adjust assumptions first if the seller is not ready for an audit."
  }
] as const;

export const sampleReportFounderForwardText = [
  sampleReportDecision.headline,
  `Top leak: ${sampleReportTopLeaks[0].title} (${sampleReportTopLeaks[0].estimatedImpact}).`,
  `First action: ${sampleReportTopLeaks[0].firstAction}`,
  `Boundary: ${sampleReportFictionalNotice}`
] as const;

export const sampleReportPrintSummary = {
  title: "One-page founder print summary",
  decision: sampleReportDecision.headline,
  topLeak: sampleReportTopLeaks[0],
  nextActions: sampleReportRankedActions.slice(0, 3),
  assumptions: sampleReportAssumptions,
  boundary: sampleReportFictionalNotice,
  footerNote: "Print/export version: fictional sample only. Use summary numbers first, then anonymized CSV only if the seller wants driver ranking."
} as const;

export function buildSampleReportForwardableText() {
  return sampleReportFounderForwardText.join("\n");
}
