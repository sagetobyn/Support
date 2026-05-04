import { beforeEach, describe, expect, it } from "vitest";
import type { Order } from "@/types/domain";
import { defaultBrand } from "@/data/seed";
import { clearEvents, listEvents } from "@/shared/events";
import { defaultTemplateForStarter, queueMockMessage, renderTemplate } from "@/features/messaging";

const baseOrder = {
  id: "order-1",
  brandId: defaultBrand.id,
  orderId: "T-1",
  customerName: "Rahul",
  phone: "9876543210",
  fullAddress: "House 10, Block A, Pune",
  quantity: 1,
  orderValue: 1499,
  paymentMode: "COD",
  attemptCount: 0,
  riskScore: 70,
  riskBucket: "High",
  riskReasons: ["COD order (+25)"],
  addressQualityScore: 60,
  addressIssues: ["Landmark is missing"],
  recommendedAction: "request_address_update",
  recommendedActionReason: "Fix address",
  rawData: {},
  createdAt: "2026-05-03T00:00:00.000Z",
  updatedAt: "2026-05-03T00:00:00.000Z"
} satisfies Partial<Order>;

describe("MessagingFeature", () => {
  beforeEach(() => clearEvents());

  it("renders variables and queues mock messages through events", () => {
    const body = renderTemplate("cod_confirmation", baseOrder as Order, defaultBrand);
    expect(body).toContain("Rahul");
    expect(body).toContain("T-1");

    const message = queueMockMessage({ brand: defaultBrand, order: baseOrder as Order, templateType: "cod_confirmation" });
    expect(message.status).toBe("queued");
    expect(listEvents("message.queued")).toHaveLength(1);
  });

  it("blocks operational messaging for delivered no-action orders and defaults NDR to rescue", () => {
    const delivered = { ...baseOrder, finalStatus: "Delivered", recommendedAction: "no_action" } as Order;
    expect(() => queueMockMessage({ brand: defaultBrand, order: delivered, templateType: "cod_confirmation" })).toThrow(/delivered/i);
    expect(defaultTemplateForStarter(baseOrder as Order, { id: "ndr-1" } as never)).toBe("ndr_rescue");
  });
});

