import type { BrandSettings, Message, NdrCase, Order } from "@/types/domain";
import { maskPhone } from "@/lib/privacy";

export type TemplateType =
  | "cod_confirmation"
  | "address_correction"
  | "ofd_reminder"
  | "ndr_rescue"
  | "reattempt_scheduling"
  | "alternate_phone_request"
  | "cod_to_prepaid"
  | "cancellation_confirmation"
  | "final_delivery_attempt"
  | "delivered_thank_you"
  | "courier_issue_customer_confirmation"
  | "refusal_reason_capture";

export const templates: Record<TemplateType, string> = {
  cod_confirmation:
    "Hi {{customer_name}}, your {{brand_name}} order {{order_id}} worth ₹{{order_value}} is ready. Please confirm so we can avoid delivery delay.",
  address_correction:
    "Hi {{customer_name}}, your {{brand_name}} order {{order_id}} may have an incomplete address. Please share house number, building name, nearby landmark, and alternate phone.",
  ofd_reminder:
    "Hi {{customer_name}}, your order {{order_id}} is out for delivery today via {{courier_name}}. If COD, please keep ₹{{order_value}} ready.",
  ndr_rescue:
    "Hi {{customer_name}}, delivery failed for your {{brand_name}} order {{order_id}}. Please choose what you want to do.",
  reattempt_scheduling:
    "Hi {{customer_name}}, please confirm the best date/time for reattempt of order {{order_id}}.",
  alternate_phone_request:
    "Hi {{customer_name}}, courier could not reach you for order {{order_id}}. Please share an alternate phone number for delivery.",
  cod_to_prepaid:
    "Hi {{customer_name}}, you can convert order {{order_id}} to prepaid using {{payment_link}} for smoother delivery.",
  cancellation_confirmation:
    "Hi {{customer_name}}, your cancellation request for order {{order_id}} has been recorded.",
  final_delivery_attempt:
    "Hi {{customer_name}}, this may be the final delivery attempt for order {{order_id}}. Please confirm reattempt to avoid return.",
  delivered_thank_you:
    "Hi {{customer_name}}, thank you. Your {{brand_name}} order {{order_id}} is marked delivered.",
  courier_issue_customer_confirmation:
    "Hi {{customer_name}}, courier marked an issue on order {{order_id}}. Please confirm if a delivery attempt was actually made.",
  refusal_reason_capture:
    "Hi {{customer_name}}, we saw order {{order_id}} was refused. Please share the reason so we can help."
};

export const templateButtons: Record<TemplateType, string[]> = {
  cod_confirmation: ["Confirm order", "Update address", "Convert to prepaid", "Cancel order"],
  address_correction: ["Update address", "Share alternate number"],
  ofd_reminder: ["Confirm available", "Share alternate number"],
  ndr_rescue: ["Reattempt today", "Reattempt tomorrow", "Update address", "Share alternate number", "Cancel"],
  reattempt_scheduling: ["Reattempt today", "Reattempt tomorrow", "Update address"],
  alternate_phone_request: ["Share alternate number", "Call me"],
  cod_to_prepaid: ["Convert to prepaid", "Confirm COD"],
  cancellation_confirmation: ["Confirm cancel", "Call me"],
  final_delivery_attempt: ["Reattempt today", "Update address", "Cancel"],
  delivered_thank_you: ["Delivered"],
  courier_issue_customer_confirmation: ["Attempt made", "No attempt made", "Call me"],
  refusal_reason_capture: ["Wrong item", "Price issue", "No longer needed", "Call me"]
};

export const templateCategories: Record<TemplateType, NonNullable<Message["category"]>> = {
  cod_confirmation: "utility",
  address_correction: "utility",
  ofd_reminder: "utility",
  ndr_rescue: "utility",
  reattempt_scheduling: "utility",
  alternate_phone_request: "utility",
  cod_to_prepaid: "marketing",
  cancellation_confirmation: "utility",
  final_delivery_attempt: "utility",
  delivered_thank_you: "service",
  courier_issue_customer_confirmation: "utility",
  refusal_reason_capture: "utility"
};

export function estimateMessageCost(category: NonNullable<Message["category"]>, brand: BrandSettings) {
  if (category === "marketing") return brand.messageCostMarketing ?? 0.78;
  if (category === "service") return brand.messageCostService ?? 0;
  if (category === "authentication") return brand.messageCostUtility ?? 0.11;
  return brand.messageCostUtility ?? 0.11;
}

export function totalEstimatedMessagingCost(messages: Message[]) {
  return messages.reduce((sum, message) => sum + (message.estimatedCost || 0), 0);
}

export function renderTemplate(template: TemplateType, order: Order, brand: BrandSettings, extra: Record<string, string | number> = {}) {
  const values: Record<string, string | number> = {
    brand_name: brand.name,
    customer_name: order.customerName || "there",
    order_id: order.orderId,
    awb: order.awb || "",
    product_name: order.productName || "",
    order_value: order.orderValue || 0,
    address: order.fullAddress || order.addressLine1 || "",
    pincode: order.pincode || "",
    payment_link: "payment-link-placeholder",
    delivery_date: "today",
    courier_name: order.courier || "your courier",
    ...extra
  };

  return templates[template].replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? ""));
}

export function createMockMessage(params: {
  brand: BrandSettings;
  order: Order;
  ndrCase?: NdrCase;
  templateType: TemplateType;
}): Message {
  const now = new Date().toISOString();
  const category = templateCategories[params.templateType];
  return {
    id: `msg-${params.order.orderId}-${now}`,
    brandId: params.brand.id,
    orderId: params.order.id,
    ndrCaseId: params.ndrCase?.id,
    channel: "whatsapp",
    provider: "mock",
    templateType: params.templateType,
    category,
    estimatedCost: estimateMessageCost(category, params.brand),
    buttons: templateButtons[params.templateType],
    recipientPhoneMasked: maskPhone(params.order.phone),
    messageBody: renderTemplate(params.templateType, params.order, params.brand),
    status: "queued",
    createdAt: now
  };
}
