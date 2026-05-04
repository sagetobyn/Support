import { describe, expect, it } from "vitest";
import { calculatePilotOutcome, createPilotFromAudit, generatePilotFinalReview, updatePilotDay } from "@/lib/pilot";

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
});
