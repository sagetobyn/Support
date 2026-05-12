import { describe, expect, it } from "vitest";
import { defaultBrand, seedOrders, seedSavingsEvents } from "@/data/seed";
import {
  calculatePilotBreakEven,
  calculateRoi,
  cancelledBeforeShippingSaving,
  codConvertedPrepaidSaving,
  estimatedRtoLossPerOrder,
  ndrRescuedDeliveredSaving
} from "@/lib/roi";

describe("ROICalculationService", () => {
  it("calculates loss and savings from settings", () => {
    const roi = calculateRoi(seedOrders, seedSavingsEvents, defaultBrand);
    expect(estimatedRtoLossPerOrder(defaultBrand)).toBe(
      defaultBrand.forwardShippingCost +
        defaultBrand.returnShippingCost +
        defaultBrand.packagingCost +
        defaultBrand.estimatedCac +
        defaultBrand.codFee +
        (defaultBrand.supportOpsCost || 0)
    );
    expect(roi.totalOrders).toBe(seedOrders.length);
    expect(roi.estimatedSavings).toBeGreaterThan(0);
    expect(roi.netBenefit).toBe(roi.estimatedSavings - defaultBrand.softwareCost);
  });

  it("calculates core savings formulas", () => {
    expect(cancelledBeforeShippingSaving(defaultBrand)).toBe(defaultBrand.forwardShippingCost + defaultBrand.packagingCost + defaultBrand.estimatedCac);
    expect(ndrRescuedDeliveredSaving(defaultBrand)).toBe(estimatedRtoLossPerOrder(defaultBrand));
    expect(codConvertedPrepaidSaving(defaultBrand)).toBe(Math.round(estimatedRtoLossPerOrder(defaultBrand) * 0.35));
  });

  it("calculates pilot break-even saved orders from RTO loss assumptions", () => {
    const breakEven = calculatePilotBreakEven({
      pilotFee: 4999,
      rtoLossPerOrder: 395,
      estimatedSavings: 1200
    });

    expect(breakEven.breakEvenSavedOrders).toBe(13);
    expect(breakEven.currentSavedOrderEquivalent).toBe(3);
    expect(breakEven.remainingSavingsToBreakEven).toBe(3799);
    expect(breakEven.remainingSavedOrdersToBreakEven).toBe(10);
    expect(breakEven.label).toBe("Estimated break-even only");
    expect(breakEven.formula).toContain("pilot fee / assumed RTO loss per order");
    expect(breakEven.caveat).toContain("seller cost assumptions");
  });

  it("keeps pilot break-even safe when the RTO loss assumption is missing", () => {
    const breakEven = calculatePilotBreakEven({
      pilotFee: 4999,
      rtoLossPerOrder: 0,
      estimatedSavings: 600
    });

    expect(breakEven.breakEvenSavedOrders).toBe(0);
    expect(breakEven.currentSavedOrderEquivalent).toBe(0);
    expect(breakEven.remainingSavedOrdersToBreakEven).toBe(0);
    expect(breakEven.remainingSavingsToBreakEven).toBe(4399);
  });
});
