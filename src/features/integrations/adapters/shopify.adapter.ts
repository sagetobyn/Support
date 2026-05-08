import type { AdapterFetchResult, IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput, ShopifyCredentials } from "../types";

// Shopify Admin REST API — Orders endpoint.
// Docs: https://shopify.dev/docs/api/admin-rest/latest/resources/order
// Requires scope: read_orders

const SHOPIFY_API_VERSION = "2024-10";
const PAGE_SIZE = 250;
const DEFAULT_BACKFILL_DAYS = 60;
const MAX_PAGES_PER_SYNC = 40;        // safety cap: 40 * 250 = 10,000 orders / sync
const RATE_LIMIT_RETRY_DELAY_MS = 2000;
const MAX_RATE_LIMIT_RETRIES = 3;

interface ShopifyAddress {
  address1?: string;
  zip?: string;
  city?: string;
  province?: string;
  phone?: string;
  name?: string;
}

interface ShopifyLineItem {
  name?: string;
  sku?: string;
  quantity: number;
  price: string;
}

interface ShopifyFulfillment {
  tracking_number?: string;
  tracking_company?: string;
  shipment_status?: string;
  status?: string;
}

export interface ShopifyOrder {
  id: number;
  name: string;
  created_at: string;
  cancelled_at?: string | null;
  financial_status: string | null;
  fulfillment_status: string | null;
  gateway: string;
  total_price: string;
  customer?: { first_name?: string; last_name?: string; phone?: string };
  shipping_address?: ShopifyAddress;
  billing_address?: ShopifyAddress;
  line_items: ShopifyLineItem[];
  fulfillments: ShopifyFulfillment[];
  note?: string;
  tags?: string;
}

function detectPaymentMode(order: ShopifyOrder): "COD" | "Prepaid" | "Unknown" {
  const gateway = order.gateway?.toLowerCase() ?? "";
  if (gateway.includes("cash") || gateway.includes("cod")) return "COD";
  if (!gateway) return "Unknown";
  return "Prepaid";
}

export function mapShopifyOrder(order: ShopifyOrder): IntegrationOrderInput {
  const fulfillment = order.fulfillments?.[0];
  const address = order.shipping_address ?? order.billing_address;
  const firstItem = order.line_items?.[0];
  const customerName = [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(" ") || address?.name;
  const phone = order.customer?.phone ?? address?.phone;

  return {
    orderId: String(order.id),
    orderDate: order.created_at,
    customerName: customerName || undefined,
    phone: phone?.replace(/\D/g, ""),
    addressLine1: address?.address1,
    pincode: address?.zip,
    city: address?.city,
    state: address?.province,
    productName: firstItem?.name,
    sku: firstItem?.sku,
    quantity: firstItem?.quantity ?? 1,
    orderValue: parseFloat(order.total_price),
    paymentMode: detectPaymentMode(order),
    awb: fulfillment?.tracking_number,
    courier: fulfillment?.tracking_company,
    shipmentStatus: fulfillment?.shipment_status ?? fulfillment?.status,
    finalStatus: order.cancelled_at ? "cancelled" : (order.fulfillment_status ?? undefined),
    sourcePlatform: "Shopify",
    rawData: order as unknown as Record<string, unknown>,
  };
}

// Shopify uses cursor pagination. The next-page URL is in the Link header:
//   Link: <https://shop.myshopify.com/admin/api/X/orders.json?page_info=ABC&limit=250>; rel="next"
export function parseNextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const parts = linkHeader.split(",");
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

async function fetchWithRetry(url: string, accessToken: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 429 && attempt <= MAX_RATE_LIMIT_RETRIES) {
    const retryAfter = parseFloat(res.headers.get("retry-after") ?? "") * 1000;
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : RATE_LIMIT_RETRY_DELAY_MS * attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, accessToken, attempt + 1);
  }

  return res;
}

export class ShopifyAdapter implements IntegrationAdapter {
  readonly type = "shopify" as const;

  async fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<AdapterFetchResult> {
    const creds = credentials as ShopifyCredentials;
    const cutoff = since ?? new Date(Date.now() - DEFAULT_BACKFILL_DAYS * 24 * 60 * 60 * 1000);

    const initialParams = new URLSearchParams({
      limit: String(PAGE_SIZE),
      status: "any",
      updated_at_min: cutoff.toISOString(),
    });

    let nextUrl: string | null = `https://${creds.shopUrl}/admin/api/${SHOPIFY_API_VERSION}/orders.json?${initialParams}`;
    const all: IntegrationOrderInput[] = [];

    for (let page = 0; page < MAX_PAGES_PER_SYNC && nextUrl; page++) {
      const res: Response = await fetchWithRetry(nextUrl, creds.accessToken);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Shopify API error ${res.status}: ${text}`);
      }

      const json = await res.json() as { orders?: ShopifyOrder[] };
      const orders = json.orders ?? [];
      for (const order of orders) {
        if (order.cancelled_at && (!order.fulfillments || order.fulfillments.length === 0)) continue;
        all.push(mapShopifyOrder(order));
      }

      nextUrl = parseNextPageUrl(res.headers.get("link"));
    }

    return { orders: all };
  }
}

// Verify that an incoming webhook came from Shopify using HMAC-SHA256.
export async function verifyShopifyWebhook(body: string, hmacHeader: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === hmacHeader;
}
