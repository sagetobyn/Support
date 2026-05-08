import type { DispatchResult, IntegrationCredentials, MessageDispatch, MessagingAdapter, Msg91Credentials } from "../types";

// MSG91 — major Indian SMS gateway with DLT compliance.
// Docs: https://docs.msg91.com/p/tf9GTextN/e/p3T2y_xPRy/
// Endpoint: POST https://control.msg91.com/api/v5/flow/
//
// MSG91 SMS uses a "flow" template (DLT-approved) with variables passed by name.
// Auth header: authkey

const HOST = "https://control.msg91.com";
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

interface Msg91Response {
  type?: string;        // "success" | "error"
  message?: string;
  request_id?: string;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // MSG91 expects country code prefix without +; default to 91 (India) if missing
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

async function postWithRetry(url: string, body: object, authKey: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", authkey: authKey },
    body: JSON.stringify(body),
  });
  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    return postWithRetry(url, body, authKey, attempt + 1);
  }
  return res;
}

export class Msg91Adapter implements MessagingAdapter {
  readonly type = "msg91" as const;
  readonly channel = "sms" as const;

  async sendMessage(credentials: IntegrationCredentials, message: MessageDispatch): Promise<DispatchResult> {
    const creds = credentials as Msg91Credentials;
    const templateId = message.templateId ?? creds.defaultTemplateId;
    if (!templateId) return { ok: false, status: "failed", error: "MSG91 requires a DLT template_id" };

    const body = {
      template_id: templateId,
      sender: creds.senderId,
      short_url: "0",
      mobiles: normalizePhone(message.to),
      // MSG91 flow API takes named variables — the sender DLT template defines which keys are required
      ...(message.variables ?? {}),
    };

    const res = await postWithRetry(`${HOST}/api/v5/flow/`, body, creds.authKey);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 401) return { ok: false, status: "failed", error: "MSG91 auth key invalid" };
      return { ok: false, status: "failed", error: `MSG91 error ${res.status}: ${text}` };
    }

    const json = await res.json() as Msg91Response;
    if (json.type !== "success") {
      return { ok: false, status: "failed", error: json.message ?? "MSG91 returned non-success" };
    }
    return { ok: true, status: "sent", providerMessageId: json.request_id };
  }
}

export { normalizePhone as normalizePhoneMsg91 };
