import { describe, expect, it } from "vitest";
import { currentStarterPlan, getStarterLimitWarning, getUpgradePlaceholder, planConfigs } from "@/features/plans";

describe("StarterPlanConfig", () => {
  it("defines Starter behavior and disabled integration placeholders", () => {
    expect(planConfigs.starter.priceMonthlyInr).toBe(2999);
    expect(currentStarterPlan.limits.monthly_order_limit).toBe(500);
    expect(currentStarterPlan.limits.csv_upload).toBe(true);
    expect(currentStarterPlan.limits.risk_scoring).toBe("basic_rules");
    expect(currentStarterPlan.limits.real_whatsapp_api).toBe(false);
    expect(currentStarterPlan.limits.integrations).toBe(false);
  });

  it("warns above 500 orders and provides Growth/Pro placeholder copy", () => {
    expect(getStarterLimitWarning(501)).toContain("Starter order limit exceeded");
    expect(getStarterLimitWarning(500)).toBe("");
    expect(getUpgradePlaceholder()).toContain("Growth/Pro");
  });
});

