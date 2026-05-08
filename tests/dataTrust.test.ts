import { describe, expect, it } from "vitest";
import { buildDataTrust, getAnalysisTrust, trustBadgeLabel } from "@/features/imports";
import type { ImportRecord } from "@/types/domain";

const baseImport: ImportRecord = {
  id: "import-1",
  brandId: "brand-1",
  filename: "orders.csv",
  sourceType: "csv",
  rowCount: 100,
  successCount: 100,
  errorCount: 0,
  created: 100,
  updated: 0,
  missingFields: [],
  createdAt: "2026-05-08T00:00:00.000Z"
};

describe("data trust summary", () => {
  it("treats empty workspaces as not ready", () => {
    const trust = buildDataTrust(undefined, 0, 0);

    expect(trust.status).toBe("empty");
    expect(trust.headline).toContain("No operational data");
  });

  it("marks complete imports as ready", () => {
    const trust = buildDataTrust({
      ...baseImport,
      dataQualityScore: 94,
      analysisReadiness: [
        { area: "RTO/NDR leakage", status: "ready", reason: "ready" },
        { area: "Pincode and courier analysis", status: "ready", reason: "ready" }
      ]
    }, 80, 100);

    expect(trust.status).toBe("ready");
    expect(trust.readyCount).toBe(2);
    expect(trust.readiness).toHaveLength(2);
  });

  it("surfaces blocked and limited insight areas", () => {
    const trust = buildDataTrust({
      ...baseImport,
      dataQualityScore: 72,
      analysisReadiness: [
        { area: "RTO/NDR leakage", status: "limited", reason: "shipment status is thin" },
        { area: "Pincode and courier analysis", status: "blocked", reason: "requires pincode and courier" }
      ]
    }, 90, 100);

    expect(trust.status).toBe("limited");
    expect(trust.issues.map((issue) => issue.area)).toEqual(["Pincode and courier analysis", "RTO/NDR leakage"]);
    expect(trust.detail).toContain("Pincode and courier analysis");
  });

  it("returns operator-facing trust labels for a specific analysis area", () => {
    const trust = buildDataTrust({
      ...baseImport,
      dataQualityScore: 72,
      analysisReadiness: [
        { area: "Pincode and courier analysis", status: "limited", reason: "courier field is missing" },
        { area: "SKU leakage", status: "ready", reason: "sku exists" }
      ]
    }, 90, 100);

    const pincodeTrust = getAnalysisTrust(trust, "pincodeCourier");
    const campaignTrust = getAnalysisTrust(trust, "campaign");

    expect(pincodeTrust.status).toBe("limited");
    expect(trustBadgeLabel(pincodeTrust)).toBe("Directional");
    expect(campaignTrust.status).toBe("ready");
    expect(trustBadgeLabel(campaignTrust)).toBe("Reliable");
  });
});
