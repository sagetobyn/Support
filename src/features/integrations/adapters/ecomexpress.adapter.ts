import type { AdapterFetchResult, EcomExpressCredentials, IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput } from "../types";

// Ecom Express Shipping API.
// Auth: stateless — username + password sent on each request as form params.
// Endpoints used:
//  - POST /apiv2/manifest_awb_track/  (AWB tracking, multi-AWB allowed)
//  - POST /apiv2/ndr/                 (NDR list)
//
// Response is XML by default; we request JSON via &format=json.

const HOST = "https://api.ecomexpress.in";
const AWB_CHUNK_SIZE = 50;
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

export interface EcomExpressShipment {
  awb_number?: string;
  reference_number?: string;       // seller order ref
  consignee?: string;
  consignee_phone?: string;
  consignee_address?: string;
  consignee_pincode?: string;
  consignee_city?: string;
  consignee_state?: string;
  cod_amount?: number;
  status?: string;
  reason?: string;
  attempts?: number;
  product_name?: string;
  sku?: string;
  quantity?: number;
  pickup_date?: string;
}

const NDR_STATUSES = new Set(["ndr", "undelivered", "non delivery report"]);

function detectPaymentMode(codAmount?: number): "COD" | "Prepaid" | "Unknown" {
  if (codAmount && codAmount > 0) return "COD";
  if (codAmount === 0) return "Prepaid";
  return "Unknown";
}

export function mapEcomExpressShipment(s: EcomExpressShipment): IntegrationOrderInput {
  const isNdr = NDR_STATUSES.has((s.status ?? "").toLowerCase());
  return {
    orderId: s.reference_number ?? s.awb_number ?? `ee-${Date.now()}`,
    awb: s.awb_number,
    customerName: s.consignee,
    phone: s.consignee_phone?.replace(/\D/g, ""),
    addressLine1: s.consignee_address,
    pincode: s.consignee_pincode,
    city: s.consignee_city,
    state: s.consignee_state,
    productName: s.product_name,
    sku: s.sku,
    quantity: s.quantity ?? 1,
    orderValue: s.cod_amount ?? 0,
    paymentMode: detectPaymentMode(s.cod_amount),
    courier: "Ecom Express",
    shipmentStatus: isNdr ? "NDR" : s.status,
    finalStatus: s.status,
    ndrReason: s.reason,
    attemptCount: s.attempts,
    orderDate: s.pickup_date,
    sourcePlatform: "Ecom Express",
    rawData: s as unknown as Record<string, unknown>,
  };
}

async function postWithRetry(url: string, body: URLSearchParams, attempt = 1): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    return postWithRetry(url, body, attempt + 1);
  }
  return res;
}

export class EcomExpressAdapter implements IntegrationAdapter {
  readonly type = "ecomexpress" as const;

  async fetchOrders(credentials: IntegrationCredentials, _since?: Date): Promise<AdapterFetchResult> {
    const creds = credentials as EcomExpressCredentials;
    const all: IntegrationOrderInput[] = [];

    // NDR list (priority)
    const ndrBody = new URLSearchParams({ username: creds.username, password: creds.password, format: "json" });
    const ndrRes = await postWithRetry(`${HOST}/apiv2/ndr/`, ndrBody);
    if (!ndrRes.ok) {
      if (ndrRes.status === 401 || ndrRes.status === 403) {
        throw new Error("Ecom Express auth invalid — verify username/password");
      }
      throw new Error(`Ecom Express NDR error ${ndrRes.status}`);
    }
    const ndrJson = await ndrRes.json() as { shipments?: EcomExpressShipment[] };
    for (const s of ndrJson.shipments ?? []) all.push(mapEcomExpressShipment(s));

    return { orders: all };
  }

  // Refresh tracking for known AWBs (chunked).
  async trackAwbs(credentials: EcomExpressCredentials, awbs: string[]): Promise<IntegrationOrderInput[]> {
    if (awbs.length === 0) return [];
    const all: IntegrationOrderInput[] = [];

    for (let i = 0; i < awbs.length; i += AWB_CHUNK_SIZE) {
      const chunk = awbs.slice(i, i + AWB_CHUNK_SIZE);
      const body = new URLSearchParams({
        username: credentials.username,
        password: credentials.password,
        awb: chunk.join(","),
        format: "json",
      });
      const res = await postWithRetry(`${HOST}/apiv2/manifest_awb_track/`, body);
      if (!res.ok) throw new Error(`Ecom Express track error ${res.status}`);
      const json = await res.json() as { shipments?: EcomExpressShipment[] };
      for (const s of json.shipments ?? []) all.push(mapEcomExpressShipment(s));
    }

    return all;
  }
}
