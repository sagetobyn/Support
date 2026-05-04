import type { BrandSettings, Order, SavingsEvent } from "@/types/domain";
import { cancelledBeforeShippingSaving, codConvertedPrepaidSaving, ndrRescuedDeliveredSaving } from "@/features/roi";
import { publishEvent } from "@/shared/events";

export function createSavingsEventFromOutcome(params: {
  brand: BrandSettings;
  order: Order;
  eventType: SavingsEvent["eventType"];
}) {
  const now = new Date().toISOString();
  const amount =
    params.eventType === "cancelled_before_shipping"
      ? cancelledBeforeShippingSaving(params.brand)
      : params.eventType === "cod_converted_prepaid"
        ? codConvertedPrepaidSaving(params.brand)
        : params.eventType === "ndr_rescued_delivered" || params.eventType === "address_corrected_delivered"
          ? ndrRescuedDeliveredSaving(params.brand)
          : 0;
  const event: SavingsEvent = {
    id: `saving-${params.eventType}-${params.order.id}-${now}`,
    brandId: params.brand.id,
    orderId: params.order.id,
    eventType: params.eventType,
    estimatedSaving: amount,
    calculation: { formula: params.eventType },
    createdAt: now
  };
  publishEvent({
    type: "savings.event.created",
    sourceFeature: "roi",
    entityType: "savings_event",
    entityId: event.id,
    payload: { eventType: event.eventType, estimatedSaving: event.estimatedSaving, orderId: event.orderId }
  });
  return event;
}

