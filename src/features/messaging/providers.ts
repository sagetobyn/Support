import type { BrandSettings, Message, Order } from "@/types/domain";
import { buildWaMeLink, createMockMessage, templateButtons, type TemplateType } from "@/lib/messaging";
import { canQueueOperationalMessage } from "./messaging.service";

export type MessageStatus = Message["status"];
export interface MessageResult {
  ok: boolean;
  providerMessageId?: string;
  status: MessageStatus;
  error?: string;
}

export interface ParsedResponse {
  providerMessageId?: string;
  rawText?: string;
  buttonText?: string;
}

export interface MessagingProvider {
  sendMessage(message: Message): Promise<MessageResult>;
  getMessageStatus(providerMessageId: string): Promise<MessageStatus>;
  parseWebhook(payload: unknown): ParsedResponse;
}

export class MockProvider implements MessagingProvider {
  async sendMessage(message: Message): Promise<MessageResult> {
    return { ok: true, providerMessageId: `mock-${message.id}`, status: "sent" };
  }
  async getMessageStatus() {
    return "sent" as const;
  }
  parseWebhook(payload: unknown) {
    return { rawText: JSON.stringify(payload) };
  }
}

export class WaMeProvider implements MessagingProvider {
  async sendMessage(message: Message): Promise<MessageResult> {
    return { ok: true, providerMessageId: `wa_me-${message.id}`, status: "queued" };
  }
  async getMessageStatus() {
    return "queued" as const;
  }
  parseWebhook(payload: unknown) {
    return { rawText: JSON.stringify(payload) };
  }
}

export class ManualExportProvider implements MessagingProvider {
  async sendMessage(message: Message): Promise<MessageResult> {
    return { ok: true, providerMessageId: `manual-${message.id}`, status: "queued" };
  }
  async getMessageStatus() {
    return "queued" as const;
  }
  parseWebhook(payload: unknown) {
    return { rawText: JSON.stringify(payload) };
  }
}

export class ProviderReadyPlaceholder implements MessagingProvider {
  async sendMessage(): Promise<MessageResult> {
    return { ok: false, status: "failed", error: "Provider-ready placeholder only. Do not enter production secrets in this MVP." };
  }
  async getMessageStatus() {
    return "failed" as const;
  }
  parseWebhook(payload: unknown) {
    return { rawText: JSON.stringify(payload) };
  }
}

export function createProvider(mode: BrandSettings["whatsappProviderMode"]): MessagingProvider {
  if (mode === "wa_me") return new WaMeProvider();
  if (mode === "manual_export") return new ManualExportProvider();
  if (mode === "add_on") return new ProviderReadyPlaceholder();
  return new MockProvider();
}

export function buildWaMeLinkForMessage(message: Message, order: Pick<Order, "phone"> | undefined, defaultCountryCode = "91") {
  return buildWaMeLink(order?.phone, message.messageBody, defaultCountryCode);
}

export function defaultTemplateForContext(order: Order, templateHint?: TemplateType): TemplateType {
  if (templateHint) return templateHint;
  if (/delivered/i.test(order.finalStatus || "")) return "delivered_thank_you";
  if (/ndr|undelivered|failed|exception/i.test(`${order.shipmentStatus} ${order.finalStatus}`)) return "ndr_rescue";
  if (order.recommendedAction === "convert_to_prepaid") return "cod_to_prepaid";
  if (order.addressQualityScore < 60 || order.recommendedAction === "request_address_update") return "address_correction";
  return "cod_confirmation";
}

export function queueProviderReadyMessage(params: { brand: BrandSettings; order: Order; templateType?: TemplateType }) {
  if (!canQueueOperationalMessage(params.order)) throw new Error("Delivered/no-action orders cannot receive operational messages.");
  const templateType = defaultTemplateForContext(params.order, params.templateType);
  const message = createMockMessage({ brand: params.brand, order: params.order, templateType });
  return { ...message, provider: params.brand.whatsappProviderMode === "manual_export" ? "manual_export" : params.brand.whatsappProviderMode === "add_on" ? "provider_ready" : "mock", buttons: templateButtons[templateType] } as Message;
}

export function exportMessagesCsv(messages: Message[]) {
  const headers = ["recipient_phone_masked", "order_id", "template_type", "message_body", "suggested_buttons", "category", "estimated_cost"];
  const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [
    headers.join(","),
    ...messages.map((message) =>
      [message.recipientPhoneMasked, message.orderId || "", message.templateType, message.messageBody, (message.buttons || []).join("|"), message.category || "", message.estimatedCost || 0].map(quote).join(",")
    )
  ].join("\n");
}

export const whatsappPricingNote = "Actual WhatsApp provider pricing varies by provider, category, country, and service window. This is an estimate.";
