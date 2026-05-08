import type { IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput, WooCommerceCredentials } from "../types";

// WooCommerce REST API v3 — Orders endpoint.
// Docs: https://woocommerce.github.io/woocommerce-rest-api-docs/#orders
// Uses Basic Auth with consumer key / secret.

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

interface WooShipping {
  tracking_number?: string;
  tracking_company?: string;
}

interface WooOrder {
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
  if (method === "cod") return "COD";
  if (!method) return "Unknown";
  return "Prepaid";
}

function getMetaValue(order: WooOrder, key: string): string | undefined {
  const meta = order.meta_data?.find((m) => m.key === key);
  return meta ? String(meta.value) : undefined;
}

function mapWooOrder(order: WooOrder): IntegrationOrderInput {
  const address = order.shipping ?? order.billing;
  const firstItem = order.line_items?.[0];
  const customerName = [address.first_name, address.last_name].filter(Boolean).join(" ");

  return {
    orderId: String(order.id),
    orderDate: order.date_created,
    customerName: customerName || undefined,
    phone: (order.billing.phone ?? address.phone)?.replace(/\D/g, ""),
    addressLine1: address.address_1,
    pincode: address.postcode,
    city: address.city,
    state: address.state,
    productName: firstItem?.name,
    sku: firstItem?.sku,
    quantity: firstItem?.quantity ?? 1,
    orderValue: parseFloat(order.total),
    paymentMode: detectPaymentMode(order),
    awb: getMetaValue(order, "_tracking_number") ?? getMetaValue(order, "tracking_number"),
    courier: order.shipping_lines?.[0]?.method_title,
    finalStatus: order.status,
    sourcePlatform: "WooCommerce",
    rawData: order as unknown as Record<string, unknown>,
  };
}

export class WooCommerceAdapter implements IntegrationAdapter {
  readonly type = "woocommerce" as const;

  async fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<IntegrationOrderInput[]> {
    const creds = credentials as WooCommerceCredentials;
    const params = new URLSearchParams({ per_page: "100" });
    if (since) params.set("after", since.toISOString());

    const baseUrl = creds.siteUrl.replace(/\/$/, "");
    const url = `${baseUrl}/wp-json/wc/v3/orders?${params}`;
    const basicAuth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WooCommerce API error ${res.status}: ${text}`);
    }

    const orders = await res.json() as WooOrder[];
    return orders.map(mapWooOrder);
  }
}

// WooCommerce signs webhooks with HMAC-SHA256 in the X-WC-Webhook-Signature header.
export async function verifyWooWebhook(body: string, signatureHeader: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === signatureHeader;
}
