import { describe, expect, it } from "vitest";
import {
  calculateCalculatorOutputs,
  calculateCodDecomposition,
  calculateRoi,
  calculateSavingsOpportunity,
  defaultCalculatorInputs
} from "@/lib/calculator";

describe("public RTO calculator", () => {
  it("calculates COD orders correctly", () => {
    expect(calculateCalculatorOutputs(defaultCalculatorInputs).codOrders).toBe(1050);
  });

  it("calculates RTO orders correctly", () => {
    expect(calculateCalculatorOutputs(defaultCalculatorInputs).totalRtoOrders).toBe(360);
  });

  it("calculates RTO loss per order correctly", () => {
    expect(calculateCalculatorOutputs(defaultCalculatorInputs).rtoLossPerOrder).toBe(395);
  });

  it("calculates monthly leakage correctly", () => {
    expect(calculateCalculatorOutputs(defaultCalculatorInputs).monthlyRtoLeakage).toBe(142200);
  });

  it("calculates savings at 10/20/30 correctly", () => {
    const result = calculateCalculatorOutputs(defaultCalculatorInputs);
    expect(result.saving10).toBe(14220);
    expect(result.saving20).toBe(28440);
    expect(result.saving30).toBe(42660);
  });

  it("calculates net benefit correctly", () => {
    expect(calculateCalculatorOutputs(defaultCalculatorInputs).netBenefit).toBe(23441);
  });

  it("calculates ROI multiple correctly", () => {
    expect(calculateCalculatorOutputs(defaultCalculatorInputs).roiMultiple).toBeCloseTo(5.689, 3);
    expect(calculateRoi(28440, 4999)).toBeCloseTo(5.689, 3);
  });

  it("infers prepaid RTO correctly when COD RTO is provided", () => {
    const result = calculateCodDecomposition(defaultCalculatorInputs);
    expect(result.prepaidRtoPercentage).toBeCloseTo(7.67, 2);
  });

  it("handles zero prepaid share safely", () => {
    const result = calculateCodDecomposition({ ...defaultCalculatorInputs, codPercentage: 100 });
    expect(result.prepaidOrders).toBe(0);
    expect(result.prepaidRtoPercentage).toBeNull();
  });

  it("handles zero pilot cost safely", () => {
    const result = calculateSavingsOpportunity(100000, 20, 0);
    expect(result.roiMultiple).toBeNull();
  });
});
