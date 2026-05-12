import { describe, expect, it } from "vitest";
import { calculateRtoLeakageEstimate, calculateSavingsPlan } from "@/features/calculator";
import { qualifyCalculatorLead } from "@/features/leads";
import { buildPilotGoNoGo } from "@/features/pilot-readiness";
import { calculatePilotBreakEven } from "@/lib/roi";
import { calculateCalculatorOutputs } from "@/lib/calculator";
import {
  highLeakageCalculatorFixture,
  lowLeakageCalculatorFixture,
  validPilotOwnerFixture
} from "./fixtures/preSales";

describe("pre-sales deterministic funnel", () => {
  it("keeps low leakage sellers on the free path and blocks pilot pitching", () => {
    const outputs = calculateCalculatorOutputs(lowLeakageCalculatorFixture);
    const qualification = qualifyCalculatorLead({
      monthlyOrders: lowLeakageCalculatorFixture.monthlyOrders,
      codPercentage: lowLeakageCalculatorFixture.codPercentage,
      rtoPercentage: lowLeakageCalculatorFixture.overallRtoPercentage,
      monthlyLeakage: outputs.monthlyRtoLeakage,
      category: lowLeakageCalculatorFixture.category
    });
    const gate = buildPilotGoNoGo({
      dataTrustStatus: "blocked",
      monthlyOrders: lowLeakageCalculatorFixture.monthlyOrders,
      monthlyLeakage: outputs.monthlyRtoLeakage,
      pilotFee: lowLeakageCalculatorFixture.pilotSoftwareCost,
      opsOwnerAssigned: false,
      completedActionCount: 0,
      estimatedSavings: 0,
      ndrCount: 0
    });

    expect(outputs.rtoLossPerOrder).toBe(395);
    expect(outputs.totalRtoOrders).toBe(4);
    expect(outputs.monthlyRtoLeakage).toBe(1580);
    expect(outputs.netBenefit).toBeLessThan(0);
    expect(qualification.stage).toBe("bad_fit");
    expect(qualification.primaryCtaLabel).toBe("Keep leakage check");
    expect(gate.recommendation).toBe("stop");
    expect(gate.gates.filter((item) => item.status === "fail").map((item) => item.id)).toEqual([
      "data-trust",
      "leakage-size",
      "ops-owner",
      "action-proof"
    ]);
  });

  it("routes high COD/RTO leakage through pilot qualification with visible fee logic", () => {
    const outputs = calculateCalculatorOutputs(highLeakageCalculatorFixture);
    const qualification = qualifyCalculatorLead({
      monthlyOrders: highLeakageCalculatorFixture.monthlyOrders,
      codPercentage: highLeakageCalculatorFixture.codPercentage,
      rtoPercentage: highLeakageCalculatorFixture.overallRtoPercentage,
      monthlyLeakage: outputs.monthlyRtoLeakage,
      category: highLeakageCalculatorFixture.category
    });
    const breakEven = calculatePilotBreakEven({
      pilotFee: highLeakageCalculatorFixture.pilotSoftwareCost,
      rtoLossPerOrder: outputs.rtoLossPerOrder,
      estimatedSavings: outputs.targetSaving
    });
    const gate = buildPilotGoNoGo({
      dataTrustStatus: "limited",
      monthlyOrders: highLeakageCalculatorFixture.monthlyOrders,
      monthlyLeakage: outputs.monthlyRtoLeakage,
      pilotFee: highLeakageCalculatorFixture.pilotSoftwareCost,
      opsOwnerAssigned: true,
      ownerDiscipline: validPilotOwnerFixture,
      completedActionCount: 2,
      estimatedSavings: outputs.targetSaving,
      ndrCount: 20
    });

    expect(outputs.totalRtoOrders).toBe(480);
    expect(outputs.monthlyRtoLeakage).toBe(189600);
    expect(outputs.targetSaving).toBe(37920);
    expect(outputs.paybackStatus).toBe("Estimated positive payback");
    expect(qualification.stage).toBe("pilot_candidate");
    expect(qualification.primaryCtaHref).toBe("/pilot");
    expect(breakEven.breakEvenSavedOrders).toBe(13);
    expect(breakEven.remainingSavedOrdersToBreakEven).toBe(0);
    expect(breakEven.caveat).toContain("verified only when saved orders are confirmed");
    expect(gate.recommendation).toBe("continue");
    expect(gate.passedGateCount).toBe(4);
  });

  it("clamps formula edge cases instead of overstating leakage or ROI", () => {
    const leakage = calculateRtoLeakageEstimate({
      monthlyOrders: 10,
      overallRtoPercentage: 140,
      forwardShippingCost: -70,
      returnShippingCost: 0,
      packagingCost: 0,
      estimatedCac: 0,
      codFee: 5,
      supportOpsCost: null,
      averageOrderValue: 1000,
      grossMarginPercentage: 150
    });
    const savings = calculateSavingsPlan(10000, 150, 0);
    const breakEven = calculatePilotBreakEven({
      pilotFee: -4999,
      rtoLossPerOrder: -395,
      estimatedSavings: -2000
    });

    expect(leakage.rtoLossPerOrder).toBe(5);
    expect(leakage.totalRtoOrders).toBe(10);
    expect(leakage.monthlyRtoLeakage).toBe(50);
    expect(leakage.contributionMargin).toBe(1000);
    expect(savings.targetSaving).toBe(10000);
    expect(savings.roiMultiple).toBeNull();
    expect(breakEven.pilotFee).toBe(0);
    expect(breakEven.rtoLossPerOrder).toBe(0);
    expect(breakEven.breakEvenSavedOrders).toBe(0);
    expect(breakEven.currentEstimatedSavings).toBe(0);
  });
});
