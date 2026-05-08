import type { DispatchResult, ExotelCredentials, IntegrationCredentials, MessageDispatch, MessagingAdapter } from "../types";

// Exotel — voice/IVR gateway. Used here for COD confirmation calls before dispatch:
// "Press 1 to confirm your COD order. Press 2 to cancel." This recovers ~10-15% of risky
// COD orders that wouldn't respond to WhatsApp/SMS.
//
// Docs: https://developer.exotel.com/api/voice-call-api/
// Endpoint: POST https://api.exotel.com/v1/Accounts/{sid}/Calls/connect
// Auth: HTTP Basic with sid:apiToken
//
// Two modes:
//  1. Direct call to a hosted IVR app (preferred): pass appId in credentials.
//  2. Custom URL: caller_id → flow → message body spoken to customer.

const HOST = "https://api.exotel.com";
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

interface ExotelCallResponse {
  Call?: {
    Sid?: string;
    Status?: string;          // "queued" | "completed" | "failed" | ...
    DateCreated?: string;
  };
  RestException?: {
    Status?: number;
    Message?: string;
    Code?: string;
  };
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `0${digits}`;       // Exotel India expects "0" prefix
  if (digits.startsWith("91") && digits.length === 12) return `0${digits.slice(2)}`;
  return digits;
}

async function postWithRetry(url: string, body: URLSearchParams, basicAuth: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basicAuth}` },
    body,
  });
  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    return postWithRetry(url, body, basicAuth, attempt + 1);
  }
  return res;
}

export class ExotelAdapter implements MessagingAdapter {
  readonly type = "exotel" as const;
  readonly channel = "voice" as const;

  async sendMessage(credentials: IntegrationCredentials, message: MessageDispatch): Promise<DispatchResult> {
    const creds = credentials as ExotelCredentials;
    const basicAuth = btoa(`${creds.sid}:${creds.apiToken}`);

    const body = new URLSearchParams({
      From: creds.callerId,
      To: normalizePhone(message.to),
      CallerId: creds.callerId,
    });

    if (creds.appId) {
      // Route call through pre-configured Exotel app (recommended for COD confirmation IVR)
      body.set("Url", `http://my.exotel.com/${creds.sid}/exoml/start_voice/${creds.appId}`);
    } else if (message.body) {
      // Speak the message body using Exotel's TTS endpoint pattern
      const ttsParam = encodeURIComponent(message.body);
      body.set("Url", `http://my.exotel.com/${creds.sid}/exoml/start_voice/?text=${ttsParam}`);
    } else {
      return { ok: false, status: "failed", error: "Exotel requires either appId in credentials or message body for TTS" };
    }

    const res = await postWithRetry(`${HOST}/v1/Accounts/${creds.sid}/Calls/connect`, body, basicAuth);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 401) return { ok: false, status: "failed", error: "Exotel auth invalid — verify sid + apiToken" };
      return { ok: false, status: "failed", error: `Exotel error ${res.status}: ${text}` };
    }

    const json = await res.json() as ExotelCallResponse;
    if (json.RestException) {
      return { ok: false, status: "failed", error: json.RestException.Message ?? "Exotel REST error" };
    }
    if (!json.Call?.Sid) {
      return { ok: false, status: "failed", error: "Exotel returned no Call SID" };
    }
    return {
      ok: true,
      status: "queued",       // call is initiated; final status arrives via webhook
      providerMessageId: json.Call.Sid,
      callStatus: json.Call.Status as DispatchResult["callStatus"],
    };
  }
}

export { normalizePhone as normalizePhoneExotel };
