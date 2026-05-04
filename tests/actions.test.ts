import { describe, expect, it } from "vitest";
import type { Order } from "@/types/domain";
import { nextActionAfterResponse } from "@/lib/actions";
import { buildActionGroups, isDeliveredNoAction } from "@/lib/actionGroups";

const baseOrder = {
  id: "order-1",
  brandId: "brand-1",
  orderId: "T-1",
  quantity: 1,
  orderValue: 799,
  paymentMode: "COD",
  attemptCount: 0,
  riskScore: 45,
  riskBucket: "Medium",
  riskReasons: ["COD order (+25)"],
  addressQualityScore: 90,
  addressIssues: [],
  recommendedAction: "send_cod_confirmation",
  recommendedActionReason: "Medium-risk COD order should be confirmed.",
  rawData: {},
  createdAt: "2026-05-03T00:00:00.000Z",
  updatedAt: "2026-05-03T00:00:00.000Z"
} satisfies Partial<Order>;

describe("RecommendedActionService", () => {
  it("updates recommendations from customer intents", () => {
    expect(nextActionAfterResponse(baseOrder as Order, "confirm_delivery").action).toBe("ship_normally");
    expect(nextActionAfterResponse(baseOrder as Order, "cancel_order").action).toBe("mark_cancelled");
  });

  it("uses NDR wrong-address and unavailable reasons", () => {
    expect(nextActionAfterResponse({ ...baseOrder, ndrReason: "Wrong address" } as Order, "unknown").action).toBe("request_address_update");
    expect(nextActionAfterResponse({ ...baseOrder, ndrReason: "Customer not available" } as Order, "unknown").action).toBe("request_reattempt");
  });

  it("excludes delivered no-action orders from the daily action queue", () => {
    const delivered = {
      ...baseOrder,
      id: "delivered",
      finalStatus: "Delivered",
      recommendedAction: "no_action",
      recommendedActionReason: "Already delivered"
    } as Order;
    const confirm = {
      ...baseOrder,
      id: "confirm",
      finalStatus: "In Transit",
      recommendedAction: "send_cod_confirmation"
    } as Order;
    const groups = buildActionGroups([delivered, confirm], []);

    expect(isDeliveredNoAction(delivered)).toBe(true);
    expect(Object.values(groups).flat().map((order) => order.id)).not.toContain("delivered");
    expect(groups["Confirm risky COD"].map((order) => order.id)).toContain("confirm");
    expect(Object.keys(groups)).not.toContain("Ship normally");
  });
});
