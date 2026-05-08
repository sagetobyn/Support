import { describe, expect, it } from "vitest";
import { defaultBrand, seedOrders } from "@/data/seed";
import { buildNdrCases } from "@/lib/ndrCases";
import { planConfigs } from "@/features/plans";
import { buildLeakageAtlas } from "@/features/leakage-atlas";
import { buildProfitMissions, getMissionProgress, getNextProfitMission } from "@/features/missions";
import { dashboardLearningTracks, dataReadinessChecklist, formulaCards, glossaryTerms, operatingMethodology } from "@/features/learning";

describe("premium profit recovery dashboard", () => {
  it("maps each pricing tier to seller outcomes and visible modules", () => {
    expect(planConfigs.free.primaryOutcome).toContain("awareness");
    expect(planConfigs.audit.unlockedModules).toContain("Top leakage drivers");
    expect(planConfigs.pilot.unlockedModules).toContain("Daily priority queue");
    expect(planConfigs.starter.gatedModules).toContain("Full priority work queue");
    expect(planConfigs.growth.unlockedModules).toContain("Full priority work queue");
    expect(planConfigs.pro.unlockedModules).toContain("Executive reporting");
    expect(planConfigs.pro.gatedModules).toContain("Real automated courier action push");
  });

  it("builds a one-action-at-a-time mission queue by risk, SLA urgency, and leakage", () => {
    const ndrCases = buildNdrCases(seedOrders);
    const missions = buildProfitMissions(seedOrders, defaultBrand, ndrCases);
    expect(missions.length).toBeGreaterThan(0);
    expect(["Critical", "High"]).toContain(missions[0].priority);
    expect(missions[0].estimatedLeakage).toBeGreaterThan(0);
    expect(missions[0].priorityFactors.map((factor) => factor.label)).toEqual(["Impact", "Urgency", "Frequency", "Confidence"]);
    expect(missions[0].priorityFactors.find((factor) => factor.label === "Impact")?.value).toContain("Rs");
    expect(getNextProfitMission(seedOrders, defaultBrand, ndrCases)?.order.id).toBe(missions[0].order.id);
  });

  it("tracks mission progress and recognizes an empty completed state", () => {
    const actionable = seedOrders.filter((order) => order.recommendedAction !== "no_action").slice(0, 5);
    const openProgress = getMissionProgress(actionable);
    expect(openProgress.total).toBeGreaterThan(0);
    expect(openProgress.complete).toBe(false);
    const doneProgress = getMissionProgress(actionable.map((order) => ({ ...order, actionStatus: "done" as const })));
    expect(doneProgress.percent).toBe(100);
    expect(doneProgress.complete).toBe(true);
  });

  it("builds Leakage Atlas drivers with workflow routes", () => {
    const ndrCases = buildNdrCases(seedOrders);
    const drivers = buildLeakageAtlas(seedOrders, ndrCases, defaultBrand);
    expect(drivers.map((driver) => driver.id)).toEqual(["cod_risk", "ndr_sla", "address_quality", "courier_pincode", "sku", "campaign", "savings_proof"]);
    expect(drivers.find((driver) => driver.id === "cod_risk")?.route.view).toBe("missions");
    expect(drivers.find((driver) => driver.id === "ndr_sla")?.route.view).toBe("ndr");
    expect(drivers.some((driver) => driver.estimatedLeakage > 0)).toBe(true);
  });

  it("defines seller learning content for formulas, terms, methodology, and data readiness", () => {
    expect(formulaCards.map((card) => card.title)).toContain("Estimated RTO loss per order");
    expect(formulaCards.find((card) => card.id === "cod-rto-rate")?.formula).toContain("COD orders marked RTO");
    expect(glossaryTerms.map((term) => term.term)).toEqual(expect.arrayContaining(["COD", "RTO", "NDR", "SLA", "Recoverable leakage"]));
    expect(operatingMethodology.map((step) => step.title)).toEqual(["Diagnose leakage", "Prioritize work", "Act within SLA", "Record outcome", "Review policy"]);
    expect(dataReadinessChecklist.some((item) => item.field === "NDR reason and NDR time")).toBe(true);
    expect(dashboardLearningTracks.find((track) => track.module === "Priority Work Queue")?.targetView).toBe("missions");
  });
});
