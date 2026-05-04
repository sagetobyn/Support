import { describe, expect, it } from "vitest";
import { defaultBrand, seedOrders, seedSavingsEvents } from "@/data/seed";
import { calculateRoi, cancelledBeforeShippingSaving, estimatedRtoLossPerOrder, ndrRescuedDeliveredSaving } from "@/lib/roi";

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
  });
});
