import { describe, expect, it } from "vitest";
import type { Order } from "@/types/domain";
import { defaultBrand } from "@/data/seed";
import {
  courierLeakageRecommendation,
  estimatedLeakageForOrder,
  findPrepaidConversionOpportunities,
  pincodeLeakageRecommendation
} from "@/lib/profitRecovery";

const baseOrder = {
  id: "order-1",
  brandId: "brand-1",
  orderId: "T-1",
  quantity: 1,
  orderValue: 1499,
  paymentMode: "COD",
  attemptCount: 0,
  riskScore: 68,
  riskBucket: "High",
  riskReasons: ["COD order (+25)", "High historical pincode RTO (+15)"],
  addressQualityScore: 82,
  addressIssues: [],
  recommendedAction: "send_cod_confirmation",
  recommendedActionReason: "High-risk order needs explicit customer confirmation before dispatch.",
  rawData: {},
  createdAt: "2026-05-03T00:00:00.000Z",
  updatedAt: "2026-05-03T00:00:00.000Z"
} satisfies Partial<Order>;

describe("ProfitRecoveryService", () => {
  it("detects prepaid conversion opportunities for active high-value COD risk", () => {
    const opportunities = findPrepaidConversionOpportunities([baseOrder as Order], defaultBrand);

    expect(opportunities).toHaveLength(1);
    expect(opportunities[0].recommendedAction).toBe("Offer prepaid incentive");
    expect(opportunities[0].messageExample).toContain("priority dispatch");
    expect(opportunities[0].placeholderPaymentLink).toContain("T-1");
  });

  it("excludes delivered, RTO, and already-converted orders from prepaid opportunities", () => {
    const delivered = { ...baseOrder, id: "delivered", finalStatus: "Delivered" } as Order;
    const rto = { ...baseOrder, id: "rto", finalStatus: "RTO" } as Order;
    const converted = { ...baseOrder, id: "converted", confirmationStatus: "prepaid_converted" } as Order;

    expect(findPrepaidConversionOpportunities([delivered, rto, converted], defaultBrand)).toHaveLength(0);
  });

  it("estimates leakage from risk bucket and records confirmed RTO at full loss", () => {
    const baseLoss =
      defaultBrand.forwardShippingCost +
      defaultBrand.returnShippingCost +
      defaultBrand.packagingCost +
      defaultBrand.estimatedCac +
      defaultBrand.codFee +
      (defaultBrand.supportOpsCost || 0);
    const cogsPct = 1 - (defaultBrand.grossMarginPercent ?? 40) / 100;
    const cogsLoss = Math.round(baseOrder.orderValue * cogsPct);
    const fullRtoLoss = baseLoss + cogsLoss;
    expect(estimatedLeakageForOrder(baseOrder as Order, defaultBrand)).toBe(Math.round(fullRtoLoss * 0.55));
    expect(estimatedLeakageForOrder({ ...baseOrder, finalStatus: "RTO" } as Order, defaultBrand)).toBe(fullRtoLoss);
    expect(estimatedLeakageForOrder({ ...baseOrder, finalStatus: "Delivered" } as Order, defaultBrand)).toBe(0);
  });

  it("generates pincode and courier recommendation text from current metric", () => {
    expect(pincodeLeakageRecommendation({ label: "201001", total: 20, rto: 6, rate: 0.3 })).toContain("prepaid-only");
    expect(courierLeakageRecommendation({ label: "Delhivery", total: 20, rto: 4, rate: 0.2 })).toContain("courier allocation");
  });
});
