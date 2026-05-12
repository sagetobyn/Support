import type { BrandSettings } from "@/types/domain";

export const STANDARD_ESTIMATE_DAYS = 30;
export const COD_TO_PREPAID_RISK_REDUCTION_RATE = 0.35;

export const CALCULATOR_FORMULA_REGISTRY = {
  rtoLossPerOrder: {
    id: "rtoLossPerOrder",
    label: "Loss per returned order",
    formula: "Forward shipping + return shipping + packaging + estimated CAC + COD fee + support ops cost"
  },
  monthlyRtoLeakage: {
    id: "monthlyRtoLeakage",
    label: "Estimated monthly leakage",
    formula: "Estimated RTO orders x loss per returned order"
  },
  savingsAtReduction: {
    id: "savingsAtReduction",
    label: "Savings at reduction target",
    formula: "Estimated monthly leakage x selected RTO reduction"
  },
  netBenefit: {
    id: "netBenefit",
    label: "Net estimated benefit",
    formula: "Target savings - pilot/software cost"
  },
  roiMultiple: {
    id: "roiMultiple",
    label: "ROI multiple",
    formula: "Target savings / pilot/software cost"
  },
  codConvertedPrepaid: {
    id: "codConvertedPrepaid",
    label: "COD converted to prepaid",
    formula: "35% of loss per returned order as risk reduction"
  }
} as const;

export const calculatorFormulaList = Object.values(CALCULATOR_FORMULA_REGISTRY);

export interface RtoCostAssumptions {
  forwardShippingCost: number;
  returnShippingCost: number;
  packagingCost: number;
  estimatedCac: number;
  codFee: number;
  supportOpsCost?: number | null;
}

export interface MarginAssumptions {
  averageOrderValue: number;
  grossMarginPercentage?: number | null;
}

export interface RtoLeakageInputs extends RtoCostAssumptions, MarginAssumptions {
  monthlyOrders: number;
  overallRtoPercentage: number;
}

export interface SavingsPlan {
  saving10: number;
  saving20: number;
  saving30: number;
  targetSaving: number;
  netBenefit: number;
  roiMultiple: number | null;
}

export function cleanNumber(value: number | null | undefined) {
  return Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
}

export function cleanPercent(value: number | null | undefined) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Number(value)));
}

export function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculateRtoLossPerOrder(input: RtoCostAssumptions) {
  return (
    cleanNumber(input.forwardShippingCost) +
    cleanNumber(input.returnShippingCost) +
    cleanNumber(input.packagingCost) +
    cleanNumber(input.estimatedCac) +
    cleanNumber(input.codFee) +
    cleanNumber(input.supportOpsCost)
  );
}

export function calculateCancelledBeforeShippingSaving(input: RtoCostAssumptions) {
  return cleanNumber(input.forwardShippingCost) + cleanNumber(input.packagingCost) + cleanNumber(input.estimatedCac);
}

export function calculateCodConvertedPrepaidSaving(input: RtoCostAssumptions) {
  return Math.round(calculateRtoLossPerOrder(input) * COD_TO_PREPAID_RISK_REDUCTION_RATE);
}

export function calculateContributionMargin(input: MarginAssumptions) {
  return cleanNumber(input.averageOrderValue) * (cleanPercent(input.grossMarginPercentage) / 100);
}

export function calculateRtoLeakageEstimate(input: RtoLeakageInputs) {
  const monthlyOrders = cleanNumber(input.monthlyOrders);
  const totalRtoOrders = monthlyOrders * (cleanPercent(input.overallRtoPercentage) / 100);
  const rtoLossPerOrder = calculateRtoLossPerOrder(input);
  const monthlyRtoLeakage = totalRtoOrders * rtoLossPerOrder;

  return {
    rtoLossPerOrder,
    contributionMargin: calculateContributionMargin(input),
    totalRtoOrders,
    monthlyRtoLeakage,
    dailyRtoLeakage: monthlyRtoLeakage / STANDARD_ESTIMATE_DAYS,
    lossPer100Orders: monthlyOrders > 0 ? (monthlyRtoLeakage / monthlyOrders) * 100 : 0
  };
}

export function calculateSavingsAtReduction(monthlyRtoLeakage: number, reductionPercentage: number) {
  return cleanNumber(monthlyRtoLeakage) * (cleanPercent(reductionPercentage) / 100);
}

export function calculateRoiMultiple(targetSaving: number, pilotSoftwareCost: number) {
  const pilotCost = cleanNumber(pilotSoftwareCost);
  if (pilotCost <= 0) return null;
  return cleanNumber(targetSaving) / pilotCost;
}

export function calculateSavingsPlan(monthlyRtoLeakage: number, targetRtoReductionPercentage: number, pilotSoftwareCost: number): SavingsPlan {
  const leakage = cleanNumber(monthlyRtoLeakage);
  const pilotCost = cleanNumber(pilotSoftwareCost);
  const targetSaving = calculateSavingsAtReduction(leakage, targetRtoReductionPercentage);

  return {
    saving10: calculateSavingsAtReduction(leakage, 10),
    saving20: calculateSavingsAtReduction(leakage, 20),
    saving30: calculateSavingsAtReduction(leakage, 30),
    targetSaving,
    netBenefit: targetSaving - pilotCost,
    roiMultiple: calculateRoiMultiple(targetSaving, pilotCost)
  };
}

export function brandToRtoCostAssumptions(settings: BrandSettings): RtoCostAssumptions {
  return {
    forwardShippingCost: settings.forwardShippingCost,
    returnShippingCost: settings.returnShippingCost,
    packagingCost: settings.packagingCost,
    estimatedCac: settings.estimatedCac,
    codFee: settings.codFee,
    supportOpsCost: settings.supportOpsCost
  };
}
