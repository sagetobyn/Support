import { describe, expect, it } from "vitest";
import { defaultBrand } from "@/data/seed";
import type { SavingsEvent } from "@/types/domain";
import {
  calculateSavingsLedger,
  calculateWeeklyNorthStarMetric,
  normalizeSavingsConfidence,
  normalizeSavingsStatus,
  savingsProofStatus
} from "@/features/savings-ledger";

function savingsEvent(patch: Partial<SavingsEvent>): SavingsEvent {
  return {
    id: patch.id || "saving-test",
    brandId: defaultBrand.id,
    orderId: patch.orderId || "order-test",
    eventType: patch.eventType || "ndr_rescued_delivered",
    estimatedSaving: patch.estimatedSaving ?? 0,
    actualSaving: patch.actualSaving,
    formulaNote: patch.formulaNote,
    confidence: patch.confidence,
    status: patch.status,
    note: patch.note,
    calculation: patch.calculation || { formula: "test formula" },
    createdAt: patch.createdAt || "2026-05-05T10:00:00.000Z"
  };
}

describe("savings ledger North Star metric", () => {
  it("counts verified and confidence-labeled rupees without counting pending or rejected proof", () => {
    const events: SavingsEvent[] = [
      savingsEvent({ id: "verified", status: "verified", estimatedSaving: 500, actualSaving: 450, confidence: "high" }),
      savingsEvent({ id: "estimated", status: "estimated", eventType: "cancelled_before_shipping", estimatedSaving: 200, confidence: "high" }),
      savingsEvent({ id: "pending", status: "pending", eventType: "cod_converted_prepaid", estimatedSaving: 300, confidence: "medium" }),
      savingsEvent({ id: "rejected", status: "rejected", eventType: "address_corrected_delivered", estimatedSaving: 400, confidence: "high" }),
      savingsEvent({ id: "loss", status: "verified", eventType: "rto_loss_recorded", estimatedSaving: 900, actualSaving: 900 }),
      savingsEvent({ id: "outside", status: "estimated", estimatedSaving: 100, createdAt: "2026-04-28T10:00:00.000Z" })
    ];

    const metric = calculateWeeklyNorthStarMetric(events, {
      start: "2026-05-04T00:00:00.000Z",
      end: "2026-05-11T00:00:00.000Z"
    });

    expect(metric.label).toBe("Rupees recovered/protected per seller per week");
    expect(metric.rupeesRecoveredOrProtected).toBe(650);
    expect(metric.verifiedRupees).toBe(450);
    expect(metric.confidenceLabeledRupees).toBe(200);
    expect(metric.pendingRupees).toBe(300);
    expect(metric.rejectedRupees).toBe(400);
    expect(metric.includedEventCount).toBe(2);
    expect(metric.pendingEventCount).toBe(1);
    expect(metric.rejectedEventCount).toBe(1);
    expect(metric.excludedEventCount).toBe(1);
    expect(metric.confidenceBreakdown.verified).toBe(450);
    expect(metric.confidenceBreakdown.high).toBe(200);
    expect(metric.formula).toContain("pending and rejected events do not count");
  });

  it("keeps pending and legacy adjusted statuses clear in ledger summaries", () => {
    const pending = savingsEvent({ status: "pending", estimatedSaving: 300 });
    const adjusted = savingsEvent({ id: "adjusted", status: "adjusted", estimatedSaving: 250, confidence: 0.9 });
    const ledger = calculateSavingsLedger([pending, adjusted], [], defaultBrand);

    expect(normalizeSavingsStatus(pending)).toBe("pending");
    expect(normalizeSavingsStatus(adjusted)).toBe("estimated");
    expect(normalizeSavingsConfidence(adjusted)).toBe("high");
    expect(savingsProofStatus(pending).label).toBe("Pending");
    expect(savingsProofStatus(adjusted).label).toBe("Estimated");
    expect(ledger.pendingSavings).toBe(300);
    expect(ledger.confidenceLabeledSavings).toBe(250);
    expect(ledger.estimatedEventCount).toBe(1);
    expect(ledger.pendingEventCount).toBe(1);
  });
});
