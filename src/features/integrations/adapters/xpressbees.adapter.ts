import type { AdapterFetchResult, IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput, XpressBeesCredentials } from "../types";

// XpressBees Shipping API
// Docs: https://shipment.xpressbees.com/docs
// Auth: POST /api/users/login → { data: token }
// Endpoints:
//  - GET /api/shipments?page=N (recent shipments)
//  - GET /api/shipments/ndr (NDR list)

const HOST = "https://shipment.xpressbees.com";
const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const DEFAULT_BACKFILL_DAYS = 60;
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const TOKEN_LIFETIME_MS = 23 * 60 * 60 * 1000;

export interface XpressBeesShipment {
  awb_number?: string;
  order_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_pincode?: string;
  customer_city?: string;
  customer_state?: string;
  cod_amount?: number;
  payment_mode?: string;        // "COD" | "Prepaid"
  status?: string;
  ndr_reason?: string;
  attempts?: number;
  product_name?: string;
  sku?: string;
  quantity?: number;
  created_at?: string;
}

const NDR_STATUSES = new Set(["ndr", "undelivered", "out for delivery - ndr"]);

function detectPaymentMode(method?: string, codAmount?: number): "COD" | "Prepaid" | "Unknown" {
  const m = (method ?? "").toLowerCase();
  if (m === "cod" || (codAmount && codAmount > 0)) return "COD";
  if (m === "prepaid") return "Prepaid";
  return "Unknown";
}

export function mapXpressBeesShipment(s: XpressBeesShipment): IntegrationOrderInput {
  const isNdr = NDR_STATUSES.has((s.status ?? "").toLowerCase());
  return {
    orderId: s.order_number ?? s.awb_number ?? `xb-${Date.now()}`,
    awb: s.awb_number,
    customerName: s.customer_name,
    phone: s.customer_phone?.replace(/\D/g, ""),
    addressLine1: s.customer_address,
    pincode: s.customer_pincode,
    city: s.customer_city,
    state: s.customer_state,
    productName: s.product_name,
    sku: s.sku,
    quantity: s.quantity ?? 1,
    orderValue: s.cod_amount ?? 0,
    paymentMode: detectPaymentMode(s.payment_mode, s.cod_amount),
    courier: "XpressBees",
    shipmentStatus: isNdr ? "NDR" : s.status,
    finalStatus: s.status,
    ndrReason: s.ndr_reason,
    attemptCount: s.attempts,
    orderDate: s.created_at,
    sourcePlatform: "XpressBees",
    rawData: s as unknown as Record<string, unknown>,
  };
}

async function refreshToken(creds: XpressBeesCredentials): Promise<string> {
  const res = await fetch(`${HOST}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });
  if (!res.ok) throw new Error(`XpressBees auth failed (${res.status})`);
  const json = await res.json() as { data?: string; token?: string };
  const token = (typeof json.data === "string" ? json.data : undefined) ?? json.token;
  if (!token) throw new Error("XpressBees auth: no token in response");
  return token;
}

async function ensureToken(creds: XpressBeesCredentials): Promise<{ token: string; refreshed: boolean }> {
  if (creds.bearerToken && creds.bearerExpiresAt && new Date(creds.bearerExpiresAt) > new Date()) {
    return { token: creds.bearerToken, refreshed: false };
  }
  return { token: await refreshToken(creds), refreshed: true };
}

async function fetchWithRetry(url: string, token: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    return fetchWithRetry(url, token, attempt + 1);
  }
  return res;
}

export class XpressBeesAdapter implements IntegrationAdapter {
  readonly type = "xpressbees" as const;

  async fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<AdapterFetchResult> {
    const creds = credentials as XpressBeesCredentials;
    const cutoff = since ?? new Date(Date.now() - DEFAULT_BACKFILL_DAYS * 24 * 60 * 60 * 1000);
    const { token, refreshed } = await ensureToken(creds);

    const all: IntegrationOrderInput[] = [];

    // NDR first
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetchWithRetry(`${HOST}/api/shipments/ndr?page=${page}&per_page=${PAGE_SIZE}`, token);
      if (!res.ok) {
        if (res.status === 401) throw new Error("XpressBees token invalid — try reconnecting");
        break;
      }
      const json = await res.json() as { data?: XpressBeesShipment[] };
      const rows = json.data ?? [];
      if (rows.length === 0) break;
      for (const r of rows) all.push(mapXpressBeesShipment(r));
      if (rows.length < PAGE_SIZE) break;
    }

    // Recent shipments
    const fromDate = cutoff.toISOString().split("T")[0];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetchWithRetry(`${HOST}/api/shipments?page=${page}&per_page=${PAGE_SIZE}&from_date=${fromDate}`, token);
      if (!res.ok) {
        if (res.status === 401) throw new Error("XpressBees token invalid — try reconnecting");
        throw new Error(`XpressBees shipments error ${res.status}`);
      }
      const json = await res.json() as { data?: XpressBeesShipment[] };
      const rows = json.data ?? [];
      if (rows.length === 0) break;
      for (const r of rows) all.push(mapXpressBeesShipment(r));
      if (rows.length < PAGE_SIZE) break;
    }

    // Dedupe NDR over regular
    const seen = new Set<string>();
    const result: IntegrationOrderInput[] = [];
    for (const o of all) {
      if (!seen.has(o.orderId)) { seen.add(o.orderId); result.push(o); }
    }

    const updatedCredentials: XpressBeesCredentials | undefined = refreshed
      ? { ...creds, bearerToken: token, bearerExpiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS).toISOString() }
      : undefined;

    return { orders: result, updatedCredentials };
  }
}
