import {
  calculateCalculatorOutputs,
  calculateRoi,
  calculateSavingsOpportunity,
  defaultCalculatorInputs,
  type CalculatorInputs
} from "@/lib/calculator";

export interface RtoCalculatorInputs {
  monthlyOrders: number;
  codPercentage: number;
  rtoPercentage: number;
  codRtoPercentage?: number | null;
  averageOrderValue: number;
  grossMarginPercentage?: number;
  forwardShippingCost: number;
  returnShippingCost: number;
  packagingCost: number;
  estimatedCac: number;
  codFee: number;
  supportOpsCost?: number;
  pilotSoftwareCost: number;
  targetRtoReductionPercentage?: number;
}

export interface RtoCalculatorOutputs {
  codOrdersPerMonth: number;
  prepaidOrdersPerMonth: number;
  estimatedRtoOrdersPerMonth: number;
  codRtoOrders: number | null;
  inferredPrepaidRtoPercentage: number | null;
  estimatedRtoLossPerOrder: number;
  contributionMargin: number;
  estimatedMonthlyRtoLeakage: number;
  codDrivenRtoLeakage: number | null;
  estimatedDailyRtoLeakage: number;
  lossPer100Orders: number;
  savingsAt10: number;
  savingsAt20: number;
  savingsAt30: number;
  targetSaving: number;
  netBenefitAtTarget: number;
  netBenefitAt20: number;
  roiMultipleAtTarget: number | null;
  roiMultipleAt20: number | null;
  paybackStatus: string;
}

export const defaultRtoCalculatorInputs: RtoCalculatorInputs = {
  monthlyOrders: defaultCalculatorInputs.monthlyOrders,
  codPercentage: defaultCalculatorInputs.codPercentage,
  rtoPercentage: defaultCalculatorInputs.overallRtoPercentage,
  codRtoPercentage: defaultCalculatorInputs.codRtoPercentage,
  averageOrderValue: defaultCalculatorInputs.averageOrderValue,
  grossMarginPercentage: defaultCalculatorInputs.grossMarginPercentage,
  forwardShippingCost: defaultCalculatorInputs.forwardShippingCost,
  returnShippingCost: defaultCalculatorInputs.returnShippingCost,
  packagingCost: defaultCalculatorInputs.packagingCost,
  estimatedCac: defaultCalculatorInputs.estimatedCac,
  codFee: defaultCalculatorInputs.codFee,
  supportOpsCost: defaultCalculatorInputs.supportOpsCost,
  pilotSoftwareCost: defaultCalculatorInputs.pilotSoftwareCost,
  targetRtoReductionPercentage: defaultCalculatorInputs.targetRtoReductionPercentage
};

function toCalculatorInputs(input: RtoCalculatorInputs): CalculatorInputs {
  return {
    monthlyOrders: input.monthlyOrders,
    codPercentage: input.codPercentage,
    overallRtoPercentage: input.rtoPercentage,
    codRtoPercentage: input.codRtoPercentage,
    averageOrderValue: input.averageOrderValue,
    grossMarginPercentage: input.grossMarginPercentage ?? defaultCalculatorInputs.grossMarginPercentage,
    forwardShippingCost: input.forwardShippingCost,
    returnShippingCost: input.returnShippingCost,
    packagingCost: input.packagingCost,
    estimatedCac: input.estimatedCac,
    codFee: input.codFee,
    supportOpsCost: input.supportOpsCost ?? 0,
    pilotSoftwareCost: input.pilotSoftwareCost,
    targetRtoReductionPercentage: input.targetRtoReductionPercentage ?? 20,
    category: "Fashion",
    shippingPlatform: "Shiprocket"
  };
}

export function rtoLossPerOrder(input: Pick<RtoCalculatorInputs, "forwardShippingCost" | "returnShippingCost" | "packagingCost" | "estimatedCac" | "codFee"> & { supportOpsCost?: number }) {
  return input.forwardShippingCost + input.returnShippingCost + input.packagingCost + input.estimatedCac + input.codFee + (input.supportOpsCost || 0);
}

export function savingsForReduction(monthlyLeakage: number, reductionPercentage: number) {
  return monthlyLeakage * (reductionPercentage / 100);
}

export function netBenefit(savings: number, pilotSoftwareCost: number) {
  return savings - pilotSoftwareCost;
}

export function roiMultiple(savings: number, pilotSoftwareCost: number) {
  return calculateRoi(savings, pilotSoftwareCost);
}

export function calculateRtoLoss(input: RtoCalculatorInputs): RtoCalculatorOutputs {
  const normalized = toCalculatorInputs(input);
  const output = calculateCalculatorOutputs(normalized);
  const at20 = calculateSavingsOpportunity(output.monthlyRtoLeakage, 20, normalized.pilotSoftwareCost);

  return {
    codOrdersPerMonth: output.codOrders,
    prepaidOrdersPerMonth: output.prepaidOrders,
    estimatedRtoOrdersPerMonth: output.totalRtoOrders,
    codRtoOrders: output.codRtoOrders,
    inferredPrepaidRtoPercentage: output.prepaidRtoPercentage,
    estimatedRtoLossPerOrder: output.rtoLossPerOrder,
    contributionMargin: output.contributionMargin,
    estimatedMonthlyRtoLeakage: output.monthlyRtoLeakage,
    codDrivenRtoLeakage: output.codDrivenRtoLeakage,
    estimatedDailyRtoLeakage: output.dailyRtoLeakage,
    lossPer100Orders: output.lossPer100Orders,
    savingsAt10: output.saving10,
    savingsAt20: output.saving20,
    savingsAt30: output.saving30,
    targetSaving: output.targetSaving,
    netBenefitAtTarget: output.netBenefit,
    netBenefitAt20: at20.netBenefit,
    roiMultipleAtTarget: output.roiMultiple,
    roiMultipleAt20: at20.roiMultiple,
    paybackStatus: output.paybackStatus
  };
}
