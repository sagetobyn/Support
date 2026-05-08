import type { IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput, ShopifyCredentials } from "../types";

// Shopify Admin REST API — Orders endpoint.
// Docs: https://shopify.dev/docs/api/admin-rest/latest/resources/order
// Requires scope: read_orders

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

interface ShopifyOrder {
  id: number;
  name: string;           // e.g. "#1001"
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  gateway: string;        // "Cash on Delivery" for COD
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
  if (gateway === "") return "Unknown";
  return "Prepaid";
}

function mapShopifyOrder(order: ShopifyOrder): IntegrationOrderInput {
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
    finalStatus: order.fulfillment_status ?? undefined,
    sourcePlatform: "Shopify",
    rawData: order as unknown as Record<string, unknown>,
  };
}

export class ShopifyAdapter implements IntegrationAdapter {
  readonly type = "shopify" as const;

  async fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<IntegrationOrderInput[]> {
    const creds = credentials as ShopifyCredentials;
    const params = new URLSearchParams({ limit: "250", status: "any" });
    if (since) params.set("created_at_min", since.toISOString());

    const url = `https://${creds.shopUrl}/admin/api/2024-10/orders.json?${params}`;
    const res = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": creds.accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Shopify API error ${res.status}: ${text}`);
    }

    const json = await res.json() as { orders: ShopifyOrder[] };
    return (json.orders ?? []).map(mapShopifyOrder);
  }
}

// Verify that an incoming webhook came from Shopify using HMAC-SHA256.
// Call this in the webhook route before processing.
export async function verifyShopifyWebhook(body: string, hmacHeader: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === hmacHeader;
}
