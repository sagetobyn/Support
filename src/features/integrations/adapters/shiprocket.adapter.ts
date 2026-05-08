import type { AdapterFetchResult, IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput, ShiprocketCredentials } from "../types";

// Shiprocket REST API
// Auth: POST https://apiv2.shiprocket.in/v1/external/auth/login → { token, ... } (24h expiry)
// Orders: GET https://apiv2.shiprocket.in/v1/external/orders?per_page=100&page=N
// NDR: GET https://apiv2.shiprocket.in/v1/external/ndr/all?per_page=100&page=N

const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const DEFAULT_BACKFILL_DAYS = 60;
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const JWT_LIFETIME_MS = 23 * 60 * 60 * 1000; // refresh slightly before 24h

interface ShiprocketOrderItem {
  name?: string;
  sku?: string;
  units?: number;
  selling_price?: string;
}

export interface ShiprocketOrder {
  id: number;
  channel_order_id?: string;
  created_at: string;
  status: string;
  payment_method?: string;
  total?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  pickup_pincode?: string;
  delivery_pincode?: string;
  delivery_city?: string;
  delivery_state?: string;
  products?: ShiprocketOrderItem[];
  awb_code?: string;
  courier_name?: string;
  shipment_status?: string;
}

export interface ShiprocketNdrShipment {
  awb?: string;
  order_id?: string;
  channel_order_id?: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_pincode?: string;
  delivery_city?: string;
  cod_amount?: number;
  ndr_reason?: string;
  ndr_date?: string;
  status?: string;
  courier_name?: string;
  attempts?: number;
}

export function detectPaymentMode(method?: string, codAmount?: number): "COD" | "Prepaid" | "Unknown" {
  if (!method && (codAmount === undefined || codAmount === null)) return "Unknown";
  const lower = (method ?? "").toLowerCase();
  if (lower.includes("cod") || lower.includes("cash") || (codAmount && codAmount > 0)) return "COD";
  if (!method) return "Unknown";
  return "Prepaid";
}

export function mapShiprocketOrder(order: ShiprocketOrder): IntegrationOrderInput {
  const firstItem = order.products?.[0];
  return {
    orderId: order.channel_order_id ?? String(order.id),
    orderDate: order.created_at,
    customerName: order.customer_name,
    phone: order.customer_phone?.replace(/\D/g, ""),
    addressLine1: order.delivery_address,
    pincode: order.delivery_pincode,
    city: order.delivery_city,
    state: order.delivery_state,
    productName: firstItem?.name,
    sku: firstItem?.sku,
    quantity: firstItem?.units ?? 1,
    orderValue: order.total ?? 0,
    paymentMode: detectPaymentMode(order.payment_method),
    awb: order.awb_code,
    courier: order.courier_name,
    shipmentStatus: order.shipment_status,
    finalStatus: order.status,
    sourcePlatform: "Shiprocket",
    rawData: order as unknown as Record<string, unknown>,
  };
}

export function mapShiprocketNdr(ndr: ShiprocketNdrShipment): IntegrationOrderInput {
  return {
    orderId: ndr.channel_order_id ?? ndr.order_id ?? ndr.awb ?? `sr-ndr-${Date.now()}`,
    awb: ndr.awb,
    customerName: ndr.customer_name,
    phone: ndr.customer_phone?.replace(/\D/g, ""),
    pincode: ndr.delivery_pincode,
    city: ndr.delivery_city,
    orderValue: ndr.cod_amount ?? 0,
    paymentMode: ndr.cod_amount && ndr.cod_amount > 0 ? "COD" : "Unknown",
    courier: ndr.courier_name,
    shipmentStatus: "NDR",
    finalStatus: ndr.status,
    ndrReason: ndr.ndr_reason,
    attemptCount: ndr.attempts,
    sourcePlatform: "Shiprocket",
    rawData: ndr as unknown as Record<string, unknown>,
  };
}

// Dedupe NDR + orders by orderId. NDR rows take precedence (richer status).
export function dedupe(ndrs: IntegrationOrderInput[], orders: IntegrationOrderInput[]): IntegrationOrderInput[] {
  const seen = new Set<string>();
  const result: IntegrationOrderInput[] = [];
  for (const o of [...ndrs, ...orders]) {
    if (!seen.has(o.orderId)) {
      seen.add(o.orderId);
      result.push(o);
    }
  }
  return result;
}

async function refreshToken(creds: ShiprocketCredentials): Promise<string> {
  const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Shiprocket auth failed (${res.status}): ${text || "check email/password"}`);
  }

  const json = await res.json() as { token?: string };
  if (!json.token) throw new Error("Shiprocket auth: no token in response");
  return json.token;
}

async function ensureToken(creds: ShiprocketCredentials): Promise<{ token: string; refreshed: boolean }> {
  if (creds.jwtToken && creds.jwtExpiresAt && new Date(creds.jwtExpiresAt) > new Date()) {
    return { token: creds.jwtToken, refreshed: false };
  }
  const token = await refreshToken(creds);
  return { token, refreshed: true };
}

async function fetchWithRetry(url: string, token: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });

  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    const retryAfter = parseFloat(res.headers.get("retry-after") ?? "") * 1000;
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : RETRY_DELAY_MS * attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, token, attempt + 1);
  }

  return res;
}

export class ShiprocketAdapter implements IntegrationAdapter {
  readonly type = "shiprocket" as const;

  async fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<AdapterFetchResult> {
    const creds = credentials as ShiprocketCredentials;
    const cutoff = since ?? new Date(Date.now() - DEFAULT_BACKFILL_DAYS * 24 * 60 * 60 * 1000);

    const { token, refreshed } = await ensureToken(creds);

    // Pull NDR cases first (priority for RTO recovery)
    const ndrOrders: IntegrationOrderInput[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `https://apiv2.shiprocket.in/v1/external/ndr/all?per_page=${PAGE_SIZE}&page=${page}`;
      const res = await fetchWithRetry(url, token);
      if (!res.ok) {
        if (res.status === 401) throw new Error(`Shiprocket auth invalid — token may have been revoked`);
        throw new Error(`Shiprocket NDR error ${res.status}`);
      }
      const json = await res.json() as { data?: ShiprocketNdrShipment[] };
      const rows = json.data ?? [];
      if (rows.length === 0) break;
      for (const row of rows) ndrOrders.push(mapShiprocketNdr(row));
      if (rows.length < PAGE_SIZE) break;
    }

    // Pull recent orders
    const regularOrders: IntegrationOrderInput[] = [];
    const fromDate = cutoff.toISOString().split("T")[0];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const params = new URLSearchParams({ per_page: String(PAGE_SIZE), page: String(page), from: fromDate });
      const url = `https://apiv2.shiprocket.in/v1/external/orders?${params}`;
      const res = await fetchWithRetry(url, token);
      if (!res.ok) throw new Error(`Shiprocket orders error ${res.status}`);
      const json = await res.json() as { data?: ShiprocketOrder[] };
      const rows = json.data ?? [];
      if (rows.length === 0) break;
      for (const row of rows) regularOrders.push(mapShiprocketOrder(row));
      if (rows.length < PAGE_SIZE) break;
    }

    const orders = dedupe(ndrOrders, regularOrders);

    // If we refreshed the token, hand it back so the orchestrator persists it
    const updatedCredentials: ShiprocketCredentials | undefined = refreshed
      ? { ...creds, jwtToken: token, jwtExpiresAt: new Date(Date.now() + JWT_LIFETIME_MS).toISOString() }
      : undefined;

    return { orders, updatedCredentials };
  }
}
