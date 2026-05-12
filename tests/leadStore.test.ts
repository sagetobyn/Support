import { describe, expect, it } from "vitest";
import { deleteLead, exportLeadsCsv, listCalculatorLeads, saveCalculatorLead } from "@/lib/leadStore";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => map.delete(key),
    setItem: (key, value) => map.set(key, value)
  };
}

describe("LeadStore", () => {
  it("saves, lists, exports, and deletes calculator leads", () => {
    const storage = memoryStorage();
    const lead = saveCalculatorLead({
      brandName: "Demo Brand",
      contactName: "Asha",
      category: "Fashion",
      monthlyOrders: 1500,
      codPercentage: 70,
      rtoPercentage: 24,
      averageOrderValue: 1299,
      shippingPlatform: "Shiprocket",
      assumptions: {
        monthlyLeakage: 142200,
        dailyLeakage: 4740,
        rtoLossPerOrder: 395,
        savingAt10: 14220,
        savingAt20: 28440,
        savingAt30: 42660,
        pilotSoftwareCost: 15000,
        targetRtoReductionPercentage: 20,
        grossMarginPercentage: 55,
        forwardShippingCost: 70,
        returnShippingCost: 85,
        packagingCost: 30,
        estimatedCac: 180,
        codFee: 20,
        supportOpsCost: 10,
        formulaBasis: "Forward shipping + return shipping + packaging + estimated CAC + COD fee + support ops cost"
      },
      qualification: {
        stage: "pilot_candidate",
        score: 92,
        title: "Rescue pilot candidate",
        nextStep: "Plan a rescue pilot."
      },
      contact: "asha@example.com",
      notes: "summary only",
      consent: true
    }, storage);

    expect(listCalculatorLeads(storage)).toHaveLength(1);
    expect(lead.privacyConsent).toMatchObject({
      consentFlag: true,
      noCustomerLevelData: true,
      summaryOnly: true
    });

    const csv = exportLeadsCsv([lead]);
    const [header] = csv.split("\n");
    expect(csv).toContain("Demo Brand");
    expect(csv).toContain("pilot_candidate");
    expect(csv).toContain("142200");
    expect(csv).toContain("Plan a rescue pilot.");
    expect(csv).toContain("Leakage check calculator lead.");
    expect(header).toContain("assumptionMonthlyLeakage");
    expect(header).toContain("consentFlag");
    expect(header).toContain("consentCapturedAt");
    expect(header).toContain("nextStepRecommendation");
    expect(header).toContain("privacyStatement");
    expect(header).not.toMatch(/customerName|customerPhone|phone|address|orderId|awb/i);
    expect(deleteLead(lead.id, storage)).toHaveLength(0);
  });
});
