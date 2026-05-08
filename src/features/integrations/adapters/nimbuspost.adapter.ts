import type { AdapterFetchResult, IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput, NimbusPostCredentials } from "../types";

// NimbusPost — major Shiprocket alternative for Indian D2C.
// Docs: https://docs.nimbuspost.com/
// Auth: POST /api/v1/users/login → { data: { token } }
// Endpoints:
//  - GET /api/v1/shipments?per_page=100&page=N
//  - GET /api/v1/shipments/ndr (NDR list)

const HOST = "https://api.nimbuspost.com";
const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const DEFAULT_BACKFILL_DAYS = 60;
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const JWT_LIFETIME_MS = 23 * 60 * 60 * 1000;

export interface NimbusPostShipment {
  id?: number;
  order_number?: string;
  awb?: string;
  courier?: string;
  status?: string;
  ndr_reason?: string;
  ndr_attempts?: number;
  payment_method?: "COD" | "PREPAID";
  amount?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_pincode?: string;
  product_name?: string;
  sku?: string;
  quantity?: number;
  created_at?: string;
}

const NDR_STATUSES = new Set(["ndr", "undelivered", "rto-initiated"]);

function detectPaymentMode(method?: "COD" | "PREPAID"): "COD" | "Prepaid" | "Unknown" {
  if (method === "COD") return "COD";
  if (method === "PREPAID") return "Prepaid";
  return "Unknown";
}

export function mapNimbusPostShipment(s: NimbusPostShipment): IntegrationOrderInput {
  const isNdr = NDR_STATUSES.has((s.status ?? "").toLowerCase());
  return {
    orderId: s.order_number ?? String(s.id ?? `nb-${Date.now()}`),
    awb: s.awb,
    customerName: s.customer_name,
    phone: s.customer_phone?.replace(/\D/g, ""),
    addressLine1: s.customer_address,
    pincode: s.customer_pincode,
    city: s.customer_city,
    state: s.customer_state,
    productName: s.product_name,
    sku: s.sku,
    quantity: s.quantity ?? 1,
    orderValue: s.amount ?? 0,
    paymentMode: detectPaymentMode(s.payment_method),
    courier: s.courier,
    shipmentStatus: isNdr ? "NDR" : s.status,
    finalStatus: s.status,
    ndrReason: s.ndr_reason,
    attemptCount: s.ndr_attempts,
    orderDate: s.created_at,
    sourcePlatform: "NimbusPost",
    rawData: s as unknown as Record<string, unknown>,
  };
}

async function refreshToken(creds: NimbusPostCredentials): Promise<string> {
  const res = await fetch(`${HOST}/api/v1/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });
  if (!res.ok) throw new Error(`NimbusPost auth failed (${res.status})`);
  const json = await res.json() as { data?: { token?: string }; token?: string };
  const token = json.data?.token ?? json.token;
  if (!token) throw new Error("NimbusPost auth: no token in response");
  return token;
}

async function ensureToken(creds: NimbusPostCredentials): Promise<{ token: string; refreshed: boolean }> {
  if (creds.jwtToken && creds.jwtExpiresAt && new Date(creds.jwtExpiresAt) > new Date()) {
    return { token: creds.jwtToken, refreshed: false };
  }
  const token = await refreshToken(creds);
  return { token, refreshed: true };
}

async function fetchWithRetry(url: string, token: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    const delay = RETRY_DELAY_MS * attempt;
    await new Promise((r) => setTimeout(r, delay));
    return fetchWithRetry(url, token, attempt + 1);
  }
  return res;
}

export class NimbusPostAdapter implements IntegrationAdapter {
  readonly type = "nimbuspost" as const;

  async fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<AdapterFetchResult> {
    const creds = credentials as NimbusPostCredentials;
    const cutoff = since ?? new Date(Date.now() - DEFAULT_BACKFILL_DAYS * 24 * 60 * 60 * 1000);
    const { token, refreshed } = await ensureToken(creds);

    const all: IntegrationOrderInput[] = [];
    const fromDate = cutoff.toISOString().split("T")[0];

    // NDR list first (priority)
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetchWithRetry(`${HOST}/api/v1/shipments/ndr?per_page=${PAGE_SIZE}&page=${page}`, token);
      if (!res.ok) {
        if (res.status === 401) throw new Error("NimbusPost token invalid — try reconnecting");
        break;  // NDR endpoint may not be available for all plans; degrade gracefully
      }
      const json = await res.json() as { data?: NimbusPostShipment[] };
      const rows = json.data ?? [];
      if (rows.length === 0) break;
      for (const r of rows) all.push(mapNimbusPostShipment(r));
      if (rows.length < PAGE_SIZE) break;
    }

    // All shipments
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetchWithRetry(`${HOST}/api/v1/shipments?per_page=${PAGE_SIZE}&page=${page}&from_date=${fromDate}`, token);
      if (!res.ok) {
        if (res.status === 401) throw new Error("NimbusPost token invalid — try reconnecting");
        throw new Error(`NimbusPost shipments error ${res.status}`);
      }
      const json = await res.json() as { data?: NimbusPostShipment[] };
      const rows = json.data ?? [];
      if (rows.length === 0) break;
      for (const r of rows) all.push(mapNimbusPostShipment(r));
      if (rows.length < PAGE_SIZE) break;
    }

    // Dedupe by orderId — NDR rows take precedence
    const seen = new Set<string>();
    const result: IntegrationOrderInput[] = [];
    for (const o of all) {
      if (!seen.has(o.orderId)) {
        seen.add(o.orderId);
        result.push(o);
      }
    }

    const updatedCredentials: NimbusPostCredentials | undefined = refreshed
      ? { ...creds, jwtToken: token, jwtExpiresAt: new Date(Date.now() + JWT_LIFETIME_MS).toISOString() }
      : undefined;

    return { orders: result, updatedCredentials };
  }
}
