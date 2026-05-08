import type { AdapterFetchResult, IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput, WooCommerceCredentials } from "../types";

// WooCommerce REST API v3 — Orders endpoint.
// Docs: https://woocommerce.github.io/woocommerce-rest-api-docs/#orders
// Auth: Basic Auth with consumer key / secret (HTTPS only).
// Pagination: page + per_page params. Total pages exposed via X-WP-TotalPages header.

const PAGE_SIZE = 100;
const DEFAULT_BACKFILL_DAYS = 60;
const MAX_PAGES_PER_SYNC = 100;        // 100 * 100 = 10k orders / sync
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

// Statuses we skip — these don't need RTO action
const SKIP_STATUSES = new Set(["cancelled", "refunded", "failed", "trash"]);

interface WooAddress {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  postcode?: string;
  city?: string;
  state?: string;
  phone?: string;
}

interface WooLineItem {
  name?: string;
  sku?: string;
  quantity: number;
  price: string;
}

export interface WooOrder {
  id: number;
  number: string;
  date_created: string;
  status: string;
  payment_method: string;
  total: string;
  billing: WooAddress;
  shipping: WooAddress;
  line_items: WooLineItem[];
  meta_data?: Array<{ key: string; value: unknown }>;
  shipping_lines?: Array<{ method_title?: string }>;
}

function detectPaymentMode(order: WooOrder): "COD" | "Prepaid" | "Unknown" {
  const method = order.payment_method?.toLowerCase() ?? "";
  if (!method) return "Unknown";
  if (method === "cod" || method.includes("cash")) return "COD";
  return "Prepaid";
}

// WooCommerce stores tracking via several popular plugins. Check each known meta key.
// Sources: AST (Advanced Shipment Tracking), WooCommerce Shipment Tracking, ST plugin.
const TRACKING_META_KEYS = [
  "_tracking_number",
  "tracking_number",
  "_wc_shipment_tracking_items",
  "_aftership_tracking_number",
];

const COURIER_META_KEYS = [
  "_tracking_provider",
  "tracking_provider",
  "_aftership_tracking_provider_name",
];

function getMetaValue(order: WooOrder, keys: string[]): string | undefined {
  for (const key of keys) {
    const meta = order.meta_data?.find((m) => m.key === key);
    if (meta && meta.value) {
      // Some plugins store an array of objects: [{ tracking_number, tracking_provider }]
      if (Array.isArray(meta.value) && meta.value.length > 0) {
        const first = meta.value[0] as Record<string, unknown>;
        const v = first.tracking_number ?? first.tracking_provider;
        if (v) return String(v);
      }
      if (typeof meta.value === "string") return meta.value;
      if (typeof meta.value === "number") return String(meta.value);
    }
  }
  return undefined;
}

export function mapWooOrder(order: WooOrder): IntegrationOrderInput {
  const address = (order.shipping?.address_1 ? order.shipping : order.billing) ?? order.billing;
  const firstItem = order.line_items?.[0];
  const customerName = [address.first_name, address.last_name].filter(Boolean).join(" ");
  const phone = order.billing?.phone ?? order.shipping?.phone;

  return {
    orderId: String(order.id),
    orderDate: order.date_created,
    customerName: customerName || undefined,
    phone: phone?.replace(/\D/g, ""),
    addressLine1: address.address_1,
    pincode: address.postcode,
    city: address.city,
    state: address.state,
    productName: firstItem?.name,
    sku: firstItem?.sku,
    quantity: firstItem?.quantity ?? 1,
    orderValue: parseFloat(order.total),
    paymentMode: detectPaymentMode(order),
    awb: getMetaValue(order, TRACKING_META_KEYS),
    courier: getMetaValue(order, COURIER_META_KEYS) ?? order.shipping_lines?.[0]?.method_title,
    finalStatus: order.status,
    sourcePlatform: "WooCommerce",
    rawData: order as unknown as Record<string, unknown>,
  };
}

async function fetchWithRetry(url: string, basicAuth: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
    },
  });

  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    const retryAfter = parseFloat(res.headers.get("retry-after") ?? "") * 1000;
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : RETRY_DELAY_MS * attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, basicAuth, attempt + 1);
  }

  return res;
}

export class WooCommerceAdapter implements IntegrationAdapter {
  readonly type = "woocommerce" as const;

  async fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<AdapterFetchResult> {
    const creds = credentials as WooCommerceCredentials;
    const cutoff = since ?? new Date(Date.now() - DEFAULT_BACKFILL_DAYS * 24 * 60 * 60 * 1000);

    const baseUrl = creds.siteUrl.replace(/\/$/, "");
    const basicAuth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);

    const all: IntegrationOrderInput[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= MAX_PAGES_PER_SYNC) {
      const params = new URLSearchParams({
        per_page: String(PAGE_SIZE),
        page: String(page),
        modified_after: cutoff.toISOString(),
        orderby: "modified",
        order: "asc",
      });
      const url = `${baseUrl}/wp-json/wc/v3/orders?${params}`;

      const res = await fetchWithRetry(url, basicAuth);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`WooCommerce API error ${res.status}: ${text}`);
      }

      const orders = await res.json() as WooOrder[];
      for (const order of orders) {
        if (SKIP_STATUSES.has(order.status?.toLowerCase() ?? "")) continue;
        all.push(mapWooOrder(order));
      }

      const totalPagesHeader = res.headers.get("x-wp-totalpages");
      if (totalPagesHeader) totalPages = parseInt(totalPagesHeader, 10) || 1;

      page++;
    }

    return { orders: all };
  }
}

// WooCommerce signs webhooks with HMAC-SHA256 (base64) in X-WC-Webhook-Signature.
// Note: the signature is computed over the raw request body.
export async function verifyWooWebhook(body: string, signatureHeader: string, secret: string): Promise<boolean> {
  if (!signatureHeader) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === signatureHeader;
}
