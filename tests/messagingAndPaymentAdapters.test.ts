import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AiSensyAdapter } from "@/features/integrations/messaging-adapters/aisensy.adapter";
import { Msg91Adapter, normalizePhoneMsg91 } from "@/features/integrations/messaging-adapters/msg91.adapter";
import { ExotelAdapter, normalizePhoneExotel } from "@/features/integrations/messaging-adapters/exotel.adapter";
import { RazorpayAdapter } from "@/features/integrations/payment-adapters/razorpay.adapter";
import { CashfreeAdapter } from "@/features/integrations/payment-adapters/cashfree.adapter";
import { categoryForType } from "@/features/integrations";

function mockFetch(impl: (url: string, init?: RequestInit) => { ok: boolean; status?: number; json?: unknown; text?: string }) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const result = impl(url, init);
    return {
      ok: result.ok,
      status: result.status ?? (result.ok ? 200 : 500),
      headers: { get: () => null },
      json: async () => result.json,
      text: async () => result.text ?? JSON.stringify(result.json ?? {}),
    } as unknown as Response;
  });
}

describe("categoryForType", () => {
  it("classifies sources, messaging, and payment types correctly", () => {
    expect(categoryForType("shopify")).toBe("source");
    expect(categoryForType("amazon")).toBe("source");
    expect(categoryForType("delhivery")).toBe("source");
    expect(categoryForType("aisensy")).toBe("messaging");
    expect(categoryForType("msg91")).toBe("messaging");
    expect(categoryForType("exotel")).toBe("messaging");
    expect(categoryForType("razorpay")).toBe("payment");
    expect(categoryForType("cashfree")).toBe("payment");
  });
});

describe("AiSensyAdapter sendMessage", () => {
  let originalFetch: typeof fetch;
  beforeEach(() => { originalFetch = global.fetch; });
  afterEach(() => { global.fetch = originalFetch; });

  it("sends a templated WhatsApp message and returns providerMessageId on success", async () => {
    global.fetch = mockFetch(() => ({ ok: true, json: { status: "success", submitted_message_id: "asy-1" } })) as unknown as typeof fetch;
    const adapter = new AiSensyAdapter();
    const result = await adapter.sendMessage(
      { apiKey: "test-key" },
      { channel: "whatsapp", to: "919876543210", templateName: "ndr_rescue_v1", variables: { customer_name: "Rahul", order_id: "T-1" } }
    );
    expect(result.ok).toBe(true);
    expect(result.status).toBe("sent");
    expect(result.providerMessageId).toBe("asy-1");
  });

  it("returns failure when templateName is missing", async () => {
    const adapter = new AiSensyAdapter();
    const result = await adapter.sendMessage({ apiKey: "k" }, { channel: "whatsapp", to: "919876543210" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/templateName/);
  });

  it("returns auth-specific error on 401", async () => {
    global.fetch = mockFetch(() => ({ ok: false, status: 401, text: "Unauthorized" })) as unknown as typeof fetch;
    const adapter = new AiSensyAdapter();
    const result = await adapter.sendMessage({ apiKey: "bad" }, { channel: "whatsapp", to: "919876543210", templateName: "x" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/API key invalid/);
  });

  it("propagates AiSensy error when status is not 'success'", async () => {
    global.fetch = mockFetch(() => ({ ok: true, json: { status: "error", message: "Template not approved" } })) as unknown as typeof fetch;
    const adapter = new AiSensyAdapter();
    const result = await adapter.sendMessage({ apiKey: "k" }, { channel: "whatsapp", to: "919876543210", templateName: "x" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Template not approved");
  });
});

describe("MSG91 phone normalization + send", () => {
  let originalFetch: typeof fetch;
  beforeEach(() => { originalFetch = global.fetch; });
  afterEach(() => { global.fetch = originalFetch; });

  it("normalizes Indian phones to country-code-prefixed digits", () => {
    expect(normalizePhoneMsg91("9876543210")).toBe("919876543210");
    expect(normalizePhoneMsg91("+91 98765-43210")).toBe("919876543210");
    expect(normalizePhoneMsg91("919876543210")).toBe("919876543210");
  });

  it("sends an SMS via /api/v5/flow/ on success", async () => {
    global.fetch = mockFetch(() => ({ ok: true, json: { type: "success", request_id: "msg91-req-1" } })) as unknown as typeof fetch;
    const adapter = new Msg91Adapter();
    const result = await adapter.sendMessage(
      { authKey: "a", senderId: "RTOSHL" },
      { channel: "sms", to: "9876543210", templateId: "TPL-1", variables: { name: "Rahul" } }
    );
    expect(result.ok).toBe(true);
    expect(result.providerMessageId).toBe("msg91-req-1");
  });

  it("fails when no template ID is provided and no default is set", async () => {
    const adapter = new Msg91Adapter();
    const result = await adapter.sendMessage({ authKey: "a", senderId: "S" }, { channel: "sms", to: "9876543210" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/template_id/);
  });

  it("uses defaultTemplateId from credentials when message has no templateId", async () => {
    let captured = "";
    global.fetch = mockFetch((_url, init) => {
      captured = init?.body as string;
      return { ok: true, json: { type: "success", request_id: "x" } };
    }) as unknown as typeof fetch;
    const adapter = new Msg91Adapter();
    await adapter.sendMessage(
      { authKey: "a", senderId: "S", defaultTemplateId: "DEFAULT-TPL" },
      { channel: "sms", to: "9876543210" }
    );
    expect(captured).toContain("DEFAULT-TPL");
  });
});

describe("Exotel adapter", () => {
  let originalFetch: typeof fetch;
  beforeEach(() => { originalFetch = global.fetch; });
  afterEach(() => { global.fetch = originalFetch; });

  it("normalizes Indian phones to leading-zero format Exotel expects", () => {
    expect(normalizePhoneExotel("9876543210")).toBe("09876543210");
    expect(normalizePhoneExotel("+91 98765 43210")).toBe("09876543210");
    expect(normalizePhoneExotel("919876543210")).toBe("09876543210");
  });

  it("places a call via the SID-scoped Calls/connect endpoint", async () => {
    let calledUrl = "";
    global.fetch = mockFetch((url) => {
      calledUrl = url;
      return { ok: true, json: { Call: { Sid: "exo-call-1", Status: "queued" } } };
    }) as unknown as typeof fetch;
    const adapter = new ExotelAdapter();
    const result = await adapter.sendMessage(
      { sid: "abc123", apiToken: "tok", callerId: "08047185000", appId: "12345" },
      { channel: "voice", to: "9876543210" }
    );
    expect(result.ok).toBe(true);
    expect(result.status).toBe("queued");
    expect(result.providerMessageId).toBe("exo-call-1");
    expect(calledUrl).toContain("/v1/Accounts/abc123/Calls/connect");
  });

  it("requires either appId or message body for TTS", async () => {
    const adapter = new ExotelAdapter();
    const result = await adapter.sendMessage(
      { sid: "s", apiToken: "t", callerId: "c" },
      { channel: "voice", to: "9876543210" }
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/appId.*body/i);
  });
});

describe("Razorpay payment links", () => {
  let originalFetch: typeof fetch;
  beforeEach(() => { originalFetch = global.fetch; });
  afterEach(() => { global.fetch = originalFetch; });

  it("creates a payment link, converting rupees to paise", async () => {
    let capturedBody = "";
    global.fetch = mockFetch((_url, init) => {
      capturedBody = init?.body as string;
      return { ok: true, json: { id: "plink_X", short_url: "https://rzp.io/i/abc", status: "created" } };
    }) as unknown as typeof fetch;
    const adapter = new RazorpayAdapter();
    const result = await adapter.createPaymentLink(
      { keyId: "rzp_test_x", keySecret: "y" },
      { amount: 1499, orderId: "ORD-1", customerPhone: "9876543210", customerName: "Rahul" }
    );
    expect(result.ok).toBe(true);
    expect(result.paymentUrl).toBe("https://rzp.io/i/abc");
    expect(result.paymentLinkId).toBe("plink_X");
    expect(capturedBody).toContain('"amount":149900');     // 1499 * 100
    expect(capturedBody).toContain('"reference_id":"ORD-1"');
  });

  it("returns auth-specific error on 401", async () => {
    global.fetch = mockFetch(() => ({ ok: false, status: 401 })) as unknown as typeof fetch;
    const adapter = new RazorpayAdapter();
    const result = await adapter.createPaymentLink({ keyId: "k", keySecret: "s" }, { amount: 100, orderId: "X" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/auth invalid/i);
  });
});

describe("Cashfree payment links", () => {
  let originalFetch: typeof fetch;
  beforeEach(() => { originalFetch = global.fetch; });
  afterEach(() => { global.fetch = originalFetch; });

  it("creates a payment link in production env by default", async () => {
    let calledUrl = "";
    global.fetch = mockFetch((url) => {
      calledUrl = url;
      return { ok: true, json: { link_id: "L-1", link_url: "https://cf.link/abc", link_status: "ACTIVE" } };
    }) as unknown as typeof fetch;
    const adapter = new CashfreeAdapter();
    const result = await adapter.createPaymentLink(
      { appId: "x", secretKey: "y" },
      { amount: 599, orderId: "ORD-9", customerPhone: "9876543210" }
    );
    expect(result.ok).toBe(true);
    expect(result.paymentUrl).toBe("https://cf.link/abc");
    expect(calledUrl).toContain("https://api.cashfree.com");
  });

  it("uses sandbox host when environment is set to sandbox", async () => {
    let calledUrl = "";
    global.fetch = mockFetch((url) => {
      calledUrl = url;
      return { ok: true, json: { link_id: "L-2", link_url: "https://sandbox.cashfree.com/x" } };
    }) as unknown as typeof fetch;
    const adapter = new CashfreeAdapter();
    await adapter.createPaymentLink({ appId: "x", secretKey: "y", environment: "sandbox" }, { amount: 100, orderId: "X" });
    expect(calledUrl).toContain("sandbox.cashfree.com");
  });
});
