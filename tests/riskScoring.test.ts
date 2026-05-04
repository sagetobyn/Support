import { describe, expect, it } from "vitest";
import { defaultBrand } from "@/data/seed";
import { scoreOrder } from "@/lib/riskScoring";

describe("RiskScoringService", () => {
  it("scores weak high-value COD orders as critical with explainable reasons", () => {
    const result = scoreOrder(
      {
        orderId: "T-1",
        paymentMode: "COD",
        orderValue: 2499,
        fullAddress: "near mandir",
        pincode: "201001",
        city: "Ghaziabad"
      },
      { settings: defaultBrand, historicalPincodeRtoRate: 0.36, customerPreviousRto: 1 }
    );

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.bucket).toBe("Critical");
    expect(result.reasons.join(" ")).toContain("COD");
    expect(result.recommendedAction).toBe("hold_order");
  });

  it("lets low-risk prepaid orders ship normally", () => {
    const result = scoreOrder(
      {
        orderId: "T-2",
        paymentMode: "Prepaid",
        orderValue: 799,
        fullAddress: "Flat 12, Tower B, Green Residency, Baner Road, Pune",
        landmark: "Near D Mart",
        pincode: "411045",
        city: "Pune",
        phone: "9876543210"
      },
      { settings: defaultBrand }
    );

    expect(result.bucket).toBe("Low");
    expect(result.recommendedAction).toBe("ship_normally");
  });

  it("uses NDR reason overrides for wrong address", () => {
    const result = scoreOrder(
      {
        orderId: "T-3",
        paymentMode: "COD",
        orderValue: 799,
        fullAddress: "House 10, Block A, Market Road, Ghaziabad",
        landmark: "Near school",
        pincode: "201001",
        city: "Ghaziabad",
        shipmentStatus: "Undelivered",
        finalStatus: "In NDR",
        ndrReason: "Address insufficient"
      },
      { settings: defaultBrand }
    );

    expect(result.recommendedAction).toBe("request_address_update");
    expect(result.reasons.join(" ")).toContain("wrong_address");
  });

  it("caps critical risk at 100 and returns reasons", () => {
    const result = scoreOrder(
      {
        orderId: "T-4",
        paymentMode: "COD",
        orderValue: 3999,
        fullAddress: "near temple",
        pincode: "000000",
        city: "",
        ndrReason: "Customer refused delivery"
      },
      { settings: defaultBrand, historicalPincodeRtoRate: 0.5, customerPreviousRto: 2, repeatedPhoneCount: 3, phonePreviousCancelledOrRto: true }
    );

    expect(result.score).toBe(100);
    expect(result.bucket).toBe("Critical");
    expect(result.reasons.length).toBeGreaterThan(3);
  });
});
