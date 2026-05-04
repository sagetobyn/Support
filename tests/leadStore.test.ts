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
      contact: "asha@example.com",
      notes: "summary only",
      consent: true
    }, storage);

    expect(listCalculatorLeads(storage)).toHaveLength(1);
    expect(exportLeadsCsv([lead])).toContain("Demo Brand");
    expect(deleteLead(lead.id, storage)).toHaveLength(0);
  });
});
