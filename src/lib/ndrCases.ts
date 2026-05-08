import type { BrandSettings, NdrCase, Order } from "@/types/domain";
import { normalizeNdrReason } from "@/lib/ndr";

export function isNdrOrder(order: Pick<Order, "shipmentStatus" | "ndrReason" | "finalStatus">) {
  return Boolean(
    order.ndrReason ||
      /ndr|undelivered|failed|exception/i.test(order.shipmentStatus || "") ||
      /in[_\s-]?ndr/i.test(order.finalStatus || "")
  );
}

function hoursBetween(startIso: string, endIso = new Date().toISOString()) {
  return Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / 36e5);
}

function urgencyFor(hoursSinceNdr: number, attemptCount: number, slaHours: number) {
  if (hoursSinceNdr >= slaHours || attemptCount >= 3) return "Critical" as const;
  if (hoursSinceNdr >= 6) return "High" as const;
  if (hoursSinceNdr >= 2) return "Medium" as const;
  return "Low" as const;
}

export function buildNdrCases(orders: Order[], existingCases: NdrCase[] = [], settings?: Pick<BrandSettings, "ndrSlaHours">): NdrCase[] {
  const existing = new Map(existingCases.map((item) => [item.orderId, item]));
  return orders
    .filter(isNdrOrder)
    .map((order) => {
      const previous = existing.get(order.id);
      const normalized = normalizeNdrReason(order.ndrReason || order.shipmentStatus);
      const urgent = order.attemptCount >= 2;
      const orderDateIso = order.orderDate ? new Date(order.orderDate).toISOString() : "";
      const createdAt =
        previous?.ndrCreatedAt ||
        (orderDateIso && !Number.isNaN(new Date(orderDateIso).getTime()) ? orderDateIso : order.updatedAt);
      const slaHours = settings?.ndrSlaHours || 12;
      const hoursSinceNdr = hoursBetween(createdAt);
      const slaDeadline = new Date(new Date(createdAt).getTime() + slaHours * 36e5).toISOString();
      const urgency = urgencyFor(hoursSinceNdr, order.attemptCount, slaHours);
      const state = previous?.state || (urgent ? "call_needed" : "new");
      return {
        id: previous?.id || `ndr-${order.id}`,
        brandId: order.brandId,
        orderId: order.id,
        awb: order.awb,
        courier: order.courier,
        ndrReasonRaw: order.ndrReason || order.shipmentStatus || "Unknown",
        ndrReasonNormalized: normalized.normalizedReason,
        confidence: normalized.confidence,
        attemptCount: order.attemptCount,
        ndrCreatedAt: createdAt,
        hoursSinceNdr,
        slaDeadline,
        urgency,
        customerResponseStatus: order.customerResponseStatus || "uncontacted",
        recommendedAction: order.recommendedAction || normalized.recommendedAction,
        actionStatus: previous?.actionStatus || (urgency === "Critical" ? "urgent" : "uncontacted"),
        finalOutcome: previous?.finalOutcome || order.finalStatus,
        state,
        timeline:
          previous?.timeline?.length
            ? previous.timeline
            : [
                {
                  id: `tl-${order.id}-created`,
                  type: "ndr_created",
                  label: `NDR created from ${order.ndrReason || order.shipmentStatus || order.finalStatus || "courier status"}`,
                  createdAt
                }
              ],
        notes: previous?.notes || [],
        updatedAt: previous?.updatedAt || order.updatedAt
      };
    });
}
