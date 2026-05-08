import type { IntegrationCredentials, PaymentAdapter, PaymentLinkRequest, PaymentLinkResult, RazorpayCredentials } from "../types";

// Razorpay Payment Links API.
// Docs: https://razorpay.com/docs/api/payments/payment-links/
// Endpoint: POST https://api.razorpay.com/v1/payment_links
// Auth: HTTP Basic with key_id : key_secret

const HOST = "https://api.razorpay.com";
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

interface RazorpayLinkResponse {
  id?: string;                    // "plink_xxx"
  short_url?: string;             // "https://rzp.io/i/xxxxxx"
  status?: string;                // "created" | "paid" | "expired"
  error?: { description?: string; code?: string };
}

async function postWithRetry(url: string, body: object, basicAuth: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${basicAuth}` },
    body: JSON.stringify(body),
  });
  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    return postWithRetry(url, body, basicAuth, attempt + 1);
  }
  return res;
}

export class RazorpayAdapter implements PaymentAdapter {
  readonly type = "razorpay" as const;

  async createPaymentLink(credentials: IntegrationCredentials, request: PaymentLinkRequest): Promise<PaymentLinkResult> {
    const creds = credentials as RazorpayCredentials;
    const basicAuth = btoa(`${creds.keyId}:${creds.keySecret}`);

    const expiresInSeconds = (request.expiresInHours ?? 48) * 60 * 60;
    const expireBy = Math.floor(Date.now() / 1000) + expiresInSeconds;

    const body = {
      // Razorpay expects amount in paise (₹1 = 100 paise)
      amount: Math.round(request.amount * 100),
      currency: "INR",
      accept_partial: false,
      reference_id: request.orderId,
      description: request.description ?? `COD-to-prepaid for order ${request.orderId}`,
      customer: {
        name: request.customerName,
        contact: request.customerPhone,
      },
      notify: { sms: !!request.customerPhone, email: false },
      reminder_enable: true,
      expire_by: expireBy,
      notes: { orderId: request.orderId },
      callback_url: undefined,
      callback_method: "get",
    };

    const res = await postWithRetry(`${HOST}/v1/payment_links`, body, basicAuth);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 401) return { ok: false, error: "Razorpay auth invalid — verify keyId/keySecret" };
      return { ok: false, error: `Razorpay error ${res.status}: ${text}` };
    }

    const json = await res.json() as RazorpayLinkResponse;
    if (!json.short_url || !json.id) {
      return { ok: false, error: json.error?.description ?? "Razorpay returned no payment link" };
    }
    return { ok: true, paymentUrl: json.short_url, paymentLinkId: json.id };
  }
}
