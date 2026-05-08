import type { CashfreeCredentials, IntegrationCredentials, PaymentAdapter, PaymentLinkRequest, PaymentLinkResult } from "../types";

// Cashfree Payment Links API.
// Docs: https://docs.cashfree.com/reference/createpaymentlink
// Endpoint: POST https://api.cashfree.com/pg/links (production)
//           POST https://sandbox.cashfree.com/pg/links (sandbox)
// Auth: x-client-id + x-client-secret headers

const PROD_HOST = "https://api.cashfree.com";
const SANDBOX_HOST = "https://sandbox.cashfree.com";
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const API_VERSION = "2023-08-01";

interface CashfreeLinkResponse {
  link_id?: string;
  link_url?: string;
  link_status?: string;
  message?: string;
  code?: string;
}

async function postWithRetry(url: string, body: object, headers: Record<string, string>, attempt = 1): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    return postWithRetry(url, body, headers, attempt + 1);
  }
  return res;
}

export class CashfreeAdapter implements PaymentAdapter {
  readonly type = "cashfree" as const;

  async createPaymentLink(credentials: IntegrationCredentials, request: PaymentLinkRequest): Promise<PaymentLinkResult> {
    const creds = credentials as CashfreeCredentials;
    const host = creds.environment === "sandbox" ? SANDBOX_HOST : PROD_HOST;

    const expiresInHours = request.expiresInHours ?? 48;
    const expiry = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

    const body = {
      link_id: `${request.orderId}-${Date.now()}`,
      link_amount: request.amount,
      link_currency: "INR",
      link_purpose: request.description ?? `COD-to-prepaid for order ${request.orderId}`,
      customer_details: {
        customer_name: request.customerName,
        customer_phone: request.customerPhone,
      },
      link_meta: { return_url: undefined, notify_url: undefined },
      link_expiry_time: expiry,
      link_notify: { send_sms: !!request.customerPhone, send_email: false },
      link_auto_reminders: true,
      link_partial_payments: false,
    };

    const res = await postWithRetry(`${host}/pg/links`, body, {
      "x-client-id": creds.appId,
      "x-client-secret": creds.secretKey,
      "x-api-version": API_VERSION,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 401) return { ok: false, error: "Cashfree auth invalid — verify appId/secretKey" };
      return { ok: false, error: `Cashfree error ${res.status}: ${text}` };
    }

    const json = await res.json() as CashfreeLinkResponse;
    if (!json.link_url) {
      return { ok: false, error: json.message ?? "Cashfree returned no link_url" };
    }
    return { ok: true, paymentUrl: json.link_url, paymentLinkId: json.link_id };
  }
}
