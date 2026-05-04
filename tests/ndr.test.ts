import { describe, expect, it } from "vitest";
import { normalizeNdrReason } from "@/lib/ndr";
import { buildNdrCases } from "@/lib/ndrCases";
import { updateNdrCaseState } from "@/features/ndr";
import type { Order } from "@/types/domain";

describe("NDRNormalizationService", () => {
  it("maps courier unavailable reasons", () => {
    const result = normalizeNdrReason("Consignee unavailable");
    expect(result.normalizedReason).toBe("customer_unavailable");
    expect(result.recommendedAction).toBe("request_reattempt");
  });

  it("maps wrong address reasons", () => {
    const result = normalizeNdrReason("Incorrect address");
    expect(result.normalizedReason).toBe("wrong_address");
    expect(result.recommendedAction).toBe("request_address_update");
  });

  it("falls back to other", () => {
    const result = normalizeNdrReason("Unmapped carrier text");
    expect(result.normalizedReason).toBe("other");
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("maps common courier reasons and returns a template recommendation", () => {
    expect(normalizeNdrReason("Door locked").normalizedReason).toBe("door_locked");
    expect(normalizeNdrReason("Phone not reachable").normalizedReason).toBe("phone_unreachable");
    expect(normalizeNdrReason("Cash not ready").normalizedReason).toBe("payment_issue");
    expect(normalizeNdrReason("Customer requested future delivery").recommendedTemplate).toBe("reattempt_scheduling");
  });

  it("creates NDR cases from failed statuses and updates state from actions", () => {
    const order = {
      id: "order-1",
      brandId: "brand-1",
      orderId: "T-1",
      quantity: 1,
      orderValue: 999,
      paymentMode: "COD",
      shipmentStatus: "Failed delivery",
      ndrReason: "Customer not available",
      attemptCount: 1,
      riskScore: 55,
      riskBucket: "Medium",
      riskReasons: [],
      addressQualityScore: 90,
      addressIssues: [],
      recommendedAction: "request_reattempt",
      recommendedActionReason: "Customer unavailable",
      rawData: {},
      createdAt: "2026-05-03T00:00:00.000Z",
      updatedAt: "2026-05-03T00:00:00.000Z"
    } as Order;
    const [ndrCase] = buildNdrCases([order]);
    const updated = updateNdrCaseState(ndrCase, { state: "reattempt_requested" });

    expect(ndrCase.ndrReasonNormalized).toBe("customer_unavailable");
    expect(updated.state).toBe("reattempt_requested");
    expect(updated.updatedAt).not.toBe(ndrCase.updatedAt);
  });
});
