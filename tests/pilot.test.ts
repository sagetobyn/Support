import { describe, expect, it } from "vitest";
import { calculatePilotOutcome, createPilotFromAudit, generatePilotFinalReview, updatePilotDay } from "@/lib/pilot";
import { buildPilotHandoffPack } from "@/features/pilot-handoff";
import { buildPilotReadiness } from "@/features/pilot-readiness";

describe("PilotService outcome scoring", () => {
  it("scores savings >= 3x fee as strong_success", () => {
    expect(calculatePilotOutcome(15000, 4999)).toBe("strong_success");
  });

  it("scores savings >= fee as promising", () => {
    expect(calculatePilotOutcome(6000, 4999)).toBe("promising");
  });

  it("scores savings > 0 but below fee as inconclusive", () => {
    expect(calculatePilotOutcome(1000, 4999)).toBe("inconclusive");
  });

  it("scores savings <= 0 as not_viable", () => {
    expect(calculatePilotOutcome(0, 4999)).toBe("not_viable");
  });

  it("updates daily metrics and generates final review", () => {
    const plan = updatePilotDay(createPilotFromAudit(undefined, 4999), 1, { estimatedSavings: 6000, ndrsContacted: 5, ndrsRescued: 2 });
    const review = generatePilotFinalReview(plan);
    expect(review.outcomeStatus).toBe("promising");
    expect(review.estimatedSavings).toBe(6000);
  });

  it("blocks CEO pilot readiness until required proof exists", () => {
    const readiness = buildPilotReadiness({
      ordersCount: 1200,
      importsCount: 1,
      ndrCount: 36,
      messagesCount: 0,
      savingsEventsCount: 0,
      completedActionCount: 0,
      verifiedSavingsCount: 0,
      dataTrustStatus: "ready",
      exportCount: 0
    });

    expect(readiness.status).toBe("not_ready");
    expect(readiness.requiredMissingCount).toBe(2);
    expect(readiness.nextStep?.id).toBe("daily-action");
  });

  it("marks a workspace almost ready when only proof hardening remains", () => {
    const readiness = buildPilotReadiness({
      ordersCount: 1200,
      importsCount: 1,
      ndrCount: 36,
      messagesCount: 1,
      savingsEventsCount: 2,
      completedActionCount: 1,
      verifiedSavingsCount: 0,
      dataTrustStatus: "limited",
      exportCount: 0
    });

    expect(readiness.status).toBe("almost_ready");
    expect(readiness.requiredMissingCount).toBe(0);
    expect(readiness.nextStep?.id).toBe("verified-proof");
  });

  it("creates a CEO handoff pack only when operating proof is strong enough", () => {
    const pack = buildPilotHandoffPack({
      brandName: "Demo D2C Brand",
      readinessStatus: "almost_ready",
      dataTrustStatus: "limited",
      orderCount: 1200,
      ndrCount: 40,
      completedActionCount: 2,
      estimatedSavings: 15000,
      verifiedSavings: 0,
      pilotFee: 4999
    });

    expect(pack.status).toBe("ready_to_pitch");
    expect(pack.successCriteria.filter((criterion) => criterion.met)).toHaveLength(4);
    expect(pack.renewalDecision).toContain("Continue one more cycle");
  });

  it("blocks the handoff pack when data trust is not good enough", () => {
    const pack = buildPilotHandoffPack({
      brandName: "Demo D2C Brand",
      readinessStatus: "not_ready",
      dataTrustStatus: "blocked",
      orderCount: 1200,
      ndrCount: 40,
      completedActionCount: 2,
      estimatedSavings: 15000,
      verifiedSavings: 0,
      pilotFee: 4999
    });

    expect(pack.status).toBe("needs_data_first");
    expect(pack.ceoInstruction).toContain("Do not pitch");
    expect(pack.risks[0]).toContain("Data is not reliable");
  });

  it("recommends monthly expansion when verified proof is strong", () => {
    const pack = buildPilotHandoffPack({
      brandName: "Demo D2C Brand",
      readinessStatus: "ready",
      dataTrustStatus: "ready",
      orderCount: 1800,
      ndrCount: 65,
      completedActionCount: 12,
      estimatedSavings: 25000,
      verifiedSavings: 9000,
      pilotFee: 4999
    });

    expect(pack.status).toBe("ready_to_pitch");
    expect(pack.renewalDecision).toContain("monthly control room");
  });
});
