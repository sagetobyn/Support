import type { AdapterFetchResult, FlipkartCredentials, IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput } from "../types";

// Flipkart Seller API
// Docs: https://seller.flipkart.com/api-docs
// Auth: OAuth2 client_credentials grant — POST /oauth-service/oauth/token
// Endpoints:
//  - GET /sellers/v3/shipments  (combined orders + shipments view)
//  - GET /sellers/v2/orders/search

const HOST = "https://api.flipkart.net";
const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const DEFAULT_BACKFILL_DAYS = 60;
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const ACCESS_TOKEN_TTL_MS = 23 * 60 * 60 * 1000; // Flipkart tokens last ~24h

export interface FlipkartShipment {
  shipmentId: string;
  orderId: string;
  orderItemId?: string;
  dispatchByDate?: string;
  orderDate?: string;
  orderState?: string;       // "approved" | "packing" | "ready_to_dispatch" | "shipped" | "delivered" | "cancelled" | "returned" | ...
  paymentType?: "COD" | "PREPAID";
  amount?: number;
  trackingId?: string;
  courierName?: string;
  shippingAddress?: {
    addressLine1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    contactName?: string;
    phone?: string;
  };
  productId?: string;
  productTitle?: string;
  sku?: string;
  quantity?: number;
}

const SKIP_STATES = new Set(["cancelled", "rejected"]);

function detectPaymentMode(payment?: "COD" | "PREPAID"): "COD" | "Prepaid" | "Unknown" {
  if (payment === "COD") return "COD";
  if (payment === "PREPAID") return "Prepaid";
  return "Unknown";
}

export function mapFlipkartShipment(shipment: FlipkartShipment): IntegrationOrderInput {
  const address = shipment.shippingAddress;
  return {
    orderId: shipment.orderId,
    awb: shipment.trackingId,
    orderDate: shipment.orderDate,
    customerName: address?.contactName,
    phone: address?.phone?.replace(/\D/g, ""),
    addressLine1: address?.addressLine1,
    pincode: address?.pincode,
    city: address?.city,
    state: address?.state,
    productName: shipment.productTitle,
    sku: shipment.sku ?? shipment.productId,
    quantity: shipment.quantity ?? 1,
    orderValue: shipment.amount ?? 0,
    paymentMode: detectPaymentMode(shipment.paymentType),
    courier: shipment.courierName,
    shipmentStatus: shipment.orderState,
    finalStatus: shipment.orderState,
    sourcePlatform: "Flipkart",
    rawData: shipment as unknown as Record<string, unknown>,
  };
}

async function refreshAccessToken(creds: FlipkartCredentials): Promise<string> {
  const basicAuth = btoa(`${creds.applicationId}:${creds.applicationSecret}`);
  const res = await fetch(`${HOST}/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_Api`, {
    method: "POST",
    headers: { Authorization: `Basic ${basicAuth}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Flipkart OAuth failed (${res.status}): ${text || "check applicationId/applicationSecret"}`);
  }

  const json = await res.json() as { access_token?: string };
  if (!json.access_token) throw new Error("Flipkart OAuth: no access_token in response");
  return json.access_token;
}

async function ensureToken(creds: FlipkartCredentials): Promise<{ token: string; refreshed: boolean }> {
  if (creds.accessToken && creds.accessTokenExpiresAt && new Date(creds.accessTokenExpiresAt) > new Date()) {
    return { token: creds.accessToken, refreshed: false };
  }
  const token = await refreshAccessToken(creds);
  return { token, refreshed: true };
}

async function fetchWithRetry(url: string, token: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    const retryAfter = parseFloat(res.headers.get("retry-after") ?? "") * 1000;
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : RETRY_DELAY_MS * attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, token, attempt + 1);
  }
  return res;
}

export class FlipkartAdapter implements IntegrationAdapter {
  readonly type = "flipkart" as const;

  async fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<AdapterFetchResult> {
    const creds = credentials as FlipkartCredentials;
    const cutoff = since ?? new Date(Date.now() - DEFAULT_BACKFILL_DAYS * 24 * 60 * 60 * 1000);
    const { token, refreshed } = await ensureToken(creds);

    const all: IntegrationOrderInput[] = [];
    let nextPage = `${HOST}/sellers/v3/shipments?modifiedAfter=${cutoff.toISOString()}&size=${PAGE_SIZE}`;

    for (let page = 0; page < MAX_PAGES && nextPage; page++) {
      const res = await fetchWithRetry(nextPage, token);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 401) throw new Error("Flipkart auth invalid — token may have been revoked");
        throw new Error(`Flipkart shipments error ${res.status}: ${text}`);
      }

      const json = await res.json() as { shipments?: FlipkartShipment[]; nextPageUrl?: string };
      const shipments = json.shipments ?? [];
      for (const shipment of shipments) {
        if (SKIP_STATES.has(shipment.orderState?.toLowerCase() ?? "")) continue;
        all.push(mapFlipkartShipment(shipment));
      }

      nextPage = json.nextPageUrl ? `${HOST}${json.nextPageUrl}` : "";
      if (!nextPage) break;
    }

    const updatedCredentials: FlipkartCredentials | undefined = refreshed
      ? { ...creds, accessToken: token, accessTokenExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString() }
      : undefined;

    return { orders: all, updatedCredentials };
  }
}
