import type { BrandSettings, NdrCase, Order } from "@/types/domain";
import { isDeliveredNoAction } from "@/lib/actionGroups";
import { createMockMessage, renderTemplate, templateButtons, templates, type TemplateType } from "@/lib/messaging";
import { publishEvent } from "@/shared/events";

export { renderTemplate, templateButtons, templates };

export function canQueueOperationalMessage(order: Order) {
  return !isDeliveredNoAction(order);
}

export function defaultTemplateForStarter(order: Order, ndrCase?: NdrCase): TemplateType {
  if (ndrCase) return "ndr_rescue";
  if (order.riskBucket === "High" || order.riskBucket === "Critical") {
    return order.addressIssues.length ? "address_correction" : "cod_confirmation";
  }
  return order.recommendedAction === "request_address_update" ? "address_correction" : "cod_confirmation";
}

export function queueMockMessage(params: { brand: BrandSettings; order: Order; ndrCase?: NdrCase; templateType: TemplateType }) {
  if (!canQueueOperationalMessage(params.order)) {
    throw new Error("This order is already delivered. Operational messaging is disabled.");
  }
  const message = createMockMessage(params);
  publishEvent({
    type: "message.queued",
    sourceFeature: "messaging",
    entityType: "message",
    entityId: message.id,
    payload: { orderId: message.orderId, ndrCaseId: message.ndrCaseId, templateType: message.templateType }
  });
  return message;
}

