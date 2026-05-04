export const sellerCategories = [
  "Fashion",
  "Footwear",
  "Beauty",
  "Accessories",
  "Wellness / Ayurveda",
  "Gadgets",
  "Home Decor",
  "General D2C"
] as const;

export const shippingPlatforms = [
  "Shiprocket",
  "NimbusPost",
  "Delhivery",
  "Xpressbees",
  "Bluedart",
  "DTDC",
  "Ekart",
  "Shadowfax",
  "Manual / Other"
] as const;

export type SellerCategory = (typeof sellerCategories)[number];
export type ShippingPlatform = (typeof shippingPlatforms)[number];

export interface CalculatorInputs {
  monthlyOrders: number;
  codPercentage: number;
  overallRtoPercentage: number;
  codRtoPercentage?: number | null;
  averageOrderValue: number;
  grossMarginPercentage: number;
  forwardShippingCost: number;
  returnShippingCost: number;
  packagingCost: number;
  estimatedCac: number;
  codFee: number;
  supportOpsCost: number;
  pilotSoftwareCost: number;
  targetRtoReductionPercentage: number;
  category: SellerCategory;
  shippingPlatform: ShippingPlatform;
}

export interface CodDecomposition {
  codOrders: number;
  prepaidOrders: number;
  totalRtoOrders: number;
  codRtoOrders: number | null;
  prepaidRtoPercentage: number | null;
  codRtoShareOfTotalRto: number | null;
}

export interface SavingsOpportunity {
  saving10: number;
  saving20: number;
  saving30: number;
  targetSaving: number;
  netBenefit: number;
  roiMultiple: number | null;
  paybackStatus: "Estimated positive payback" | "Needs higher volume, higher RTO, or lower pilot cost";
}

export interface CalculatorOutputs extends CodDecomposition, SavingsOpportunity {
  rtoLossPerOrder: number;
  contributionMargin: number;
  monthlyRtoLeakage: number;
  codDrivenRtoLeakage: number | null;
  dailyRtoLeakage: number;
  lossPer100Orders: number;
}

export const defaultCalculatorInputs: CalculatorInputs = {
  monthlyOrders: 1500,
  codPercentage: 70,
  overallRtoPercentage: 24,
  codRtoPercentage: 31,
  averageOrderValue: 1299,
  grossMarginPercentage: 45,
  forwardShippingCost: 70,
  returnShippingCost: 75,
  packagingCost: 25,
  estimatedCac: 180,
  codFee: 25,
  supportOpsCost: 20,
  pilotSoftwareCost: 4999,
  targetRtoReductionPercentage: 20,
  category: "Fashion",
  shippingPlatform: "Shiprocket"
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cleanPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return clamp(value, 0, 100);
}

function cleanNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculateRtoLeakage(input: Pick<CalculatorInputs, "forwardShippingCost" | "returnShippingCost" | "packagingCost" | "estimatedCac" | "codFee" | "supportOpsCost" | "averageOrderValue" | "grossMarginPercentage" | "monthlyOrders" | "overallRtoPercentage">) {
  const monthlyOrders = cleanNumber(input.monthlyOrders);
  const overallRtoPercentage = cleanPercent(input.overallRtoPercentage);
  const rtoLossPerOrder =
    cleanNumber(input.forwardShippingCost) +
    cleanNumber(input.returnShippingCost) +
    cleanNumber(input.packagingCost) +
    cleanNumber(input.estimatedCac) +
    cleanNumber(input.codFee) +
    cleanNumber(input.supportOpsCost);
  const totalRtoOrders = monthlyOrders * (overallRtoPercentage / 100);
  const monthlyRtoLeakage = totalRtoOrders * rtoLossPerOrder;

  return {
    rtoLossPerOrder,
    contributionMargin: cleanNumber(input.averageOrderValue) * (cleanPercent(input.grossMarginPercentage) / 100),
    totalRtoOrders,
    monthlyRtoLeakage,
    dailyRtoLeakage: monthlyRtoLeakage / 30,
    lossPer100Orders: monthlyOrders > 0 ? (monthlyRtoLeakage / monthlyOrders) * 100 : 0
  };
}

export function calculateCodDecomposition(input: Pick<CalculatorInputs, "monthlyOrders" | "codPercentage" | "overallRtoPercentage" | "codRtoPercentage">): CodDecomposition {
  const monthlyOrders = cleanNumber(input.monthlyOrders);
  const codPercentage = cleanPercent(input.codPercentage);
  const overallRtoPercentage = cleanPercent(input.overallRtoPercentage);
  const codOrders = monthlyOrders * (codPercentage / 100);
  const prepaidOrders = monthlyOrders - codOrders;
  const totalRtoOrders = monthlyOrders * (overallRtoPercentage / 100);
  const codRtoPercentage = input.codRtoPercentage === null || input.codRtoPercentage === undefined ? null : cleanPercent(input.codRtoPercentage);

  if (codRtoPercentage === null) {
    return { codOrders, prepaidOrders, totalRtoOrders, codRtoOrders: null, prepaidRtoPercentage: null, codRtoShareOfTotalRto: null };
  }

  const codRtoOrders = codOrders * (codRtoPercentage / 100);
  const codShare = monthlyOrders > 0 ? codOrders / monthlyOrders : 0;
  const prepaidShare = monthlyOrders > 0 ? prepaidOrders / monthlyOrders : 0;
  const inferred = prepaidShare > 0 ? ((overallRtoPercentage / 100 - codShare * (codRtoPercentage / 100)) / prepaidShare) * 100 : null;

  return {
    codOrders,
    prepaidOrders,
    totalRtoOrders,
    codRtoOrders,
    prepaidRtoPercentage: inferred === null ? null : roundTo(clamp(inferred, 0, 100), 3),
    codRtoShareOfTotalRto: totalRtoOrders > 0 ? codRtoOrders / totalRtoOrders : null
  };
}

export function calculateSavingsOpportunity(monthlyRtoLeakage: number, targetRtoReductionPercentage: number, pilotSoftwareCost: number): SavingsOpportunity {
  const leakage = cleanNumber(monthlyRtoLeakage);
  const target = cleanPercent(targetRtoReductionPercentage);
  const pilotCost = cleanNumber(pilotSoftwareCost);
  const targetSaving = leakage * (target / 100);
  const netBenefit = targetSaving - pilotCost;

  return {
    saving10: leakage * 0.1,
    saving20: leakage * 0.2,
    saving30: leakage * 0.3,
    targetSaving,
    netBenefit,
    roiMultiple: pilotCost > 0 ? targetSaving / pilotCost : null,
    paybackStatus: netBenefit > 0 ? "Estimated positive payback" : "Needs higher volume, higher RTO, or lower pilot cost"
  };
}

export function calculateRoi(targetSaving: number, pilotSoftwareCost: number) {
  const pilotCost = cleanNumber(pilotSoftwareCost);
  if (pilotCost <= 0) return null;
  return cleanNumber(targetSaving) / pilotCost;
}

export function estimateExpectedProfit(params: {
  riskBucket: "Low" | "Medium" | "High" | "Critical";
  contributionMargin: number;
  rtoLossPerOrder: number;
  interventionCost?: number;
  discountOrIncentive?: number;
}) {
  const riskProbabilities = { Low: 0.05, Medium: 0.15, High: 0.3, Critical: 0.5 };
  const pRto = riskProbabilities[params.riskBucket];
  const pSuccess = 1 - pRto;
  return pSuccess * params.contributionMargin - pRto * params.rtoLossPerOrder - cleanNumber(params.interventionCost || 0) - cleanNumber(params.discountOrIncentive || 0);
}

export function calculateCalculatorOutputs(input: CalculatorInputs): CalculatorOutputs {
  const leakage = calculateRtoLeakage(input);
  const decomposition = calculateCodDecomposition(input);
  const savings = calculateSavingsOpportunity(leakage.monthlyRtoLeakage, input.targetRtoReductionPercentage, input.pilotSoftwareCost);

  return {
    ...decomposition,
    ...savings,
    rtoLossPerOrder: leakage.rtoLossPerOrder,
    contributionMargin: leakage.contributionMargin,
    monthlyRtoLeakage: leakage.monthlyRtoLeakage,
    codDrivenRtoLeakage: decomposition.codRtoOrders === null ? null : decomposition.codRtoOrders * leakage.rtoLossPerOrder,
    dailyRtoLeakage: leakage.dailyRtoLeakage,
    lossPer100Orders: leakage.lossPer100Orders
  };
}
