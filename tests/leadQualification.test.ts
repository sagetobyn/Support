import { describe, expect, it } from "vitest";
import { qualifyCalculatorLead } from "@/features/leads";

describe("calculator lead qualification", () => {
  it("keeps very low-fit sellers on the free path", () => {
    const result = qualifyCalculatorLead({
      monthlyOrders: 80,
      codPercentage: 12,
      rtoPercentage: 5,
      monthlyLeakage: 5000,
      category: "Fashion"
    });

    expect(result.stage).toBe("bad_fit");
    expect(result.primaryCtaLabel).toBe("Keep leakage check");
    expect(result.summary).toContain("premature");
  });

  it("routes uncertain but relevant sellers to the leakage check first", () => {
    const result = qualifyCalculatorLead({
      monthlyOrders: 220,
      codPercentage: 35,
      rtoPercentage: 9,
      monthlyLeakage: 12000,
      category: "Beauty"
    });

    expect(result.stage).toBe("free_check");
    expect(result.primaryCtaHref).toBe("/sample-report");
  });

  it("routes meaningful leakage to a profit audit candidate", () => {
    const result = qualifyCalculatorLead({
      monthlyOrders: 600,
      codPercentage: 55,
      rtoPercentage: 12,
      monthlyLeakage: 50000,
      category: "Footwear"
    });

    expect(result.stage).toBe("paid_audit_candidate");
    expect(result.primaryCtaHref).toBe("/audit");
  });

  it("routes strong COD/RTO leakage to a rescue pilot candidate", () => {
    const result = qualifyCalculatorLead({
      monthlyOrders: 1500,
      codPercentage: 70,
      rtoPercentage: 24,
      monthlyLeakage: 142200,
      category: "Fashion"
    });

    expect(result.stage).toBe("pilot_candidate");
    expect(result.primaryCtaHref).toBe("/pilot");
    expect(result.reasons.join(" ")).toContain("COD");
  });
});
