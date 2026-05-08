import type { AiSensyCredentials, DispatchResult, IntegrationCredentials, MessageDispatch, MessagingAdapter } from "../types";

// AiSensy — Indian WhatsApp Business Solution Provider (BSP).
// Docs: https://docs.aisensy.com/api/send-template-message
// Endpoint: POST https://backend.aisensy.com/campaign/t1/api/v2
//
// AiSensy expects a pre-approved campaign template by name, with `userName`, `source`,
// and an array of template parameters in order.

const HOST = "https://backend.aisensy.com";
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

interface AiSensyResponse {
  status?: string;       // "success" | "error"
  message?: string;
  submitted_message_id?: string;
}

async function postWithRetry(url: string, body: object, attempt = 1): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    return postWithRetry(url, body, attempt + 1);
  }
  return res;
}

// AiSensy templates take ordered positional parameters: convert {customer_name, order_id, ...}
// into ["Rahul", "ORD-123", ...] in the order the seller defined in their campaign.
// We pass them in alphabetical key order; sellers can override by passing a `_order` key.
function paramsToTemplateValues(variables: Record<string, string> | undefined): string[] {
  if (!variables) return [];
  const ordered = variables._order ? variables._order.split(",") : Object.keys(variables).sort();
  return ordered.filter((k) => k !== "_order").map((k) => variables[k] ?? "");
}

export class AiSensyAdapter implements MessagingAdapter {
  readonly type = "aisensy" as const;
  readonly channel = "whatsapp" as const;

  async sendMessage(credentials: IntegrationCredentials, message: MessageDispatch): Promise<DispatchResult> {
    const creds = credentials as AiSensyCredentials;
    if (!message.templateName) return { ok: false, status: "failed", error: "AiSensy requires templateName (matches your campaign name)" };

    const body = {
      apiKey: creds.apiKey,
      campaignName: message.templateName,
      destination: message.to,
      userName: message.variables?.customer_name ?? "Customer",
      source: "rtoshield",
      templateParams: paramsToTemplateValues(message.variables),
      // AiSensy uses ISO-639 language codes
      language: { code: message.language === "hi" ? "hi" : message.language === "hinglish" ? "en" : "en", policy: "deterministic" },
    };

    const res = await postWithRetry(`${HOST}/campaign/t1/api/v2`, body);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) {
        return { ok: false, status: "failed", error: "AiSensy API key invalid — verify in AiSensy dashboard" };
      }
      return { ok: false, status: "failed", error: `AiSensy error ${res.status}: ${text}` };
    }

    const json = await res.json() as AiSensyResponse;
    if (json.status !== "success") {
      return { ok: false, status: "failed", error: json.message ?? "Unknown AiSensy error" };
    }
    return { ok: true, status: "sent", providerMessageId: json.submitted_message_id };
  }
}
