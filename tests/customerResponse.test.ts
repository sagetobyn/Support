import { describe, expect, it } from "vitest";
import type { Order } from "@/types/domain";
import { defaultBrand } from "@/data/seed";
import { nextActionAfterResponse } from "@/features/responses";
import { createSavingsEventFromOutcome } from "@/shared/connectors";

const order = {
  id: "order-1",
  brandId: defaultBrand.id,
  orderId: "T-1",
  quantity: 1,
  orderValue: 999,
  paymentMode: "COD",
  attemptCount: 0,
  riskScore: 45,
  riskBucket: "Medium",
  riskReasons: ["COD order (+25)"],
  addressQualityScore: 90,
  addressIssues: [],
  recommendedAction: "send_cod_confirmation",
  recommendedActionReason: "Confirm COD",
  rawData: {},
  createdAt: "2026-05-03T00:00:00.000Z",
  updatedAt: "2026-05-03T00:00:00.000Z"
} satisfies Partial<Order>;

describe("CustomerResponseFeature", () => {
  it("maps manual intents to next actions", () => {
    expect(nextActionAfterResponse(order as Order, "confirm_delivery").action).toBe("ship_normally");
    expect(nextActionAfterResponse(order as Order, "reschedule_tomorrow").action).toBe("request_reattempt");
  });

  it("creates savings events for cancellation before shipping", () => {
    const event = createSavingsEventFromOutcome({ brand: defaultBrand, order: order as Order, eventType: "cancelled_before_shipping" });
    expect(event.eventType).toBe("cancelled_before_shipping");
    expect(event.estimatedSaving).toBe(defaultBrand.forwardShippingCost + defaultBrand.packagingCost + defaultBrand.estimatedCac);
  });
});

