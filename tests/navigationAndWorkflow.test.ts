import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import type { Order, SavingsEvent } from "@/types/domain";
import { buildActionGroups } from "@/lib/actionGroups";
import { estimatedRecoverableLeakage } from "@/lib/profitRecovery";
import { calculateRoi } from "@/lib/roi";
import { defaultBrand, seedOrders } from "@/data/seed";
import { updateSavingEvent } from "@/features/savings-ledger";
import { generateAuditReport } from "@/lib/auditReport";
import { simulatePolicy } from "@/features/policy-simulator";

describe("Navigation and workflow smoke coverage", () => {
  it("keeps key local routes present", () => {
    expect(existsSync("src/app/page.tsx")).toBe(true);
    expect(existsSync("src/app/demo/page.tsx")).toBe(true);
    expect(existsSync("src/app/calculator/page.tsx")).toBe(true);
    expect(existsSync("src/app/sample-report/page.tsx")).toBe(true);
    expect(existsSync("src/app/audit/page.tsx")).toBe(true);
    expect(existsSync("src/app/pilot/page.tsx")).toBe(true);
  });

  it("derives cockpit metrics and recoverable leakage from actionable orders", () => {
    const actionGroups = buildActionGroups(seedOrders, []);
    const actionable = Object.values(actionGroups).flat();
    const roi = calculateRoi(seedOrders, [], defaultBrand);

    expect(roi.totalOrders).toBe(seedOrders.length);
    expect(roi.codOrders).toBeGreaterThan(0);
    expect(actionable.every((order) => !/delivered/i.test(order.finalStatus || "") || order.recommendedAction !== "no_action")).toBe(true);
    expect(estimatedRecoverableLeakage(seedOrders, defaultBrand)).toBeGreaterThan(0);
  });

  it("supports savings status changes and simulator net-benefit formula", () => {
    const event: SavingsEvent = {
      id: "saving-test",
      brandId: defaultBrand.id,
      orderId: seedOrders[0].id,
      eventType: "cod_converted_prepaid",
      estimatedSaving: 200,
      status: "estimated",
      calculation: {},
      createdAt: new Date().toISOString()
    };
    const [verified] = updateSavingEvent([event], event.id, { status: "verified", actualSaving: 250 });
    const simulation = simulatePolicy(seedOrders, defaultBrand, {
      policyType: "cod_verification_high_risk",
      assumedReductionPercent: 20,
      assumedConversionLossPercent: 5,
      assumedInterventionCost: 6,
      pilotDurationDays: 14
    });

    expect(verified.status).toBe("verified");
    expect(verified.actualSaving).toBe(250);
    expect(simulation.netEstimatedBenefit).toBe(simulation.assumedSavedLeakage - simulation.interventionCost - simulation.lostContributionEstimate);
  });

  it("shows low-sample report warnings", () => {
    const report = generateAuditReport(seedOrders.slice(0, 8) as Order[], defaultBrand);
    expect(report.lowSampleSize).toBe(true);
  });
});
