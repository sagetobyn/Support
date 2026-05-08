import type { AdapterFetchResult, AmazonCredentials, IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput } from "../types";

// Amazon Selling Partner API (SP-API) — Orders + Order Items.
// Docs: https://developer-docs.amazon.com/sp-api/docs/orders-api-v0-reference
// Auth: Login With Amazon (LWA) → access_token (1h lifetime). Refreshed from refresh_token.
//
// Endpoints used:
//  - POST  https://api.amazon.com/auth/o2/token  (LWA refresh)
//  - GET   https://sellingpartnerapi-eu.amazon.com/orders/v0/orders   (region eu covers India)
//  - GET   https://sellingpartnerapi-eu.amazon.com/orders/v0/orders/{orderId}/orderItems
//  - GET   https://sellingpartnerapi-eu.amazon.com/orders/v0/orders/{orderId}/address
//
// India Marketplace ID: A21TJRUUN4KGV
// Note: SP-API previously required AWS Sigv4 signing, but Amazon dropped that requirement
// in 2023 — only LWA bearer token is needed now.

const REGION_HOSTS: Record<AmazonCredentials["region"], string> = {
  in: "https://sellingpartnerapi-eu.amazon.com",   // India is served from EU host
  eu: "https://sellingpartnerapi-eu.amazon.com",
  us: "https://sellingpartnerapi-na.amazon.com",
};

const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const DEFAULT_BACKFILL_DAYS = 60;
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const ACCESS_TOKEN_TTL_MS = 50 * 60 * 1000;       // refresh ~10min before 1h expiry

interface AmazonAddress {
  Name?: string;
  AddressLine1?: string;
  City?: string;
  StateOrRegion?: string;
  PostalCode?: string;
  Phone?: string;
  CountryCode?: string;
}

interface AmazonMoney {
  CurrencyCode?: string;
  Amount?: string;
}

export interface AmazonOrder {
  AmazonOrderId: string;
  PurchaseDate: string;
  OrderStatus: string;        // "Pending" | "Unshipped" | "Shipped" | "Canceled" | ...
  PaymentMethod?: string;     // "COD" | "Other"
  PaymentMethodDetails?: string[];
  OrderTotal?: AmazonMoney;
  ShippingAddress?: AmazonAddress;
  BuyerInfo?: { BuyerName?: string; BuyerEmail?: string };
  EarliestShipDate?: string;
  LatestShipDate?: string;
  IsBusinessOrder?: boolean;
  IsReplacementOrder?: boolean;
}

interface AmazonOrderItem {
  ASIN?: string;
  SellerSKU?: string;
  Title?: string;
  QuantityOrdered: number;
  ItemPrice?: AmazonMoney;
}

const SKIP_STATUSES = new Set(["Canceled", "InvoiceUnconfirmed"]);

function detectPaymentMode(order: AmazonOrder): "COD" | "Prepaid" | "Unknown" {
  const method = order.PaymentMethod?.toLowerCase() ?? "";
  const details = order.PaymentMethodDetails?.join(" ").toLowerCase() ?? "";
  if (method === "cod" || details.includes("cod") || details.includes("cash on delivery")) return "COD";
  if (method === "other" && !details) return "Unknown";
  return "Prepaid";
}

export function mapAmazonOrder(
  order: AmazonOrder,
  items: AmazonOrderItem[] = [],
  shippingAddress?: AmazonAddress,
): IntegrationOrderInput {
  const firstItem = items[0];
  const totalQty = items.reduce((sum, item) => sum + (item.QuantityOrdered || 0), 0);
  const address = shippingAddress ?? order.ShippingAddress;

  return {
    orderId: order.AmazonOrderId,
    orderDate: order.PurchaseDate,
    customerName: order.BuyerInfo?.BuyerName ?? address?.Name,
    phone: address?.Phone?.replace(/\D/g, ""),
    addressLine1: address?.AddressLine1,
    pincode: address?.PostalCode,
    city: address?.City,
    state: address?.StateOrRegion,
    productName: firstItem?.Title,
    sku: firstItem?.SellerSKU,
    quantity: totalQty || firstItem?.QuantityOrdered || 1,
    orderValue: parseFloat(order.OrderTotal?.Amount ?? "0"),
    paymentMode: detectPaymentMode(order),
    finalStatus: order.OrderStatus,
    sourcePlatform: "Amazon",
    rawData: { order, items } as unknown as Record<string, unknown>,
  };
}

async function refreshAccessToken(creds: AmazonCredentials): Promise<string> {
  const res = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: creds.refreshToken,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Amazon LWA token refresh failed (${res.status}): ${text || "check refreshToken/clientId/clientSecret"}`);
  }

  const json = await res.json() as { access_token?: string };
  if (!json.access_token) throw new Error("Amazon LWA: no access_token in response");
  return json.access_token;
}

async function ensureAccessToken(creds: AmazonCredentials): Promise<{ accessToken: string; refreshed: boolean }> {
  if (creds.accessToken && creds.accessTokenExpiresAt && new Date(creds.accessTokenExpiresAt) > new Date()) {
    return { accessToken: creds.accessToken, refreshed: false };
  }
  const accessToken = await refreshAccessToken(creds);
  return { accessToken, refreshed: true };
}

async function fetchWithRetry(url: string, accessToken: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, { headers: { "x-amz-access-token": accessToken } });
  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    const retryAfter = parseFloat(res.headers.get("retry-after") ?? "") * 1000;
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : RETRY_DELAY_MS * attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, accessToken, attempt + 1);
  }
  return res;
}

export class AmazonAdapter implements IntegrationAdapter {
  readonly type = "amazon" as const;

  async fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<AdapterFetchResult> {
    const creds = credentials as AmazonCredentials;
    const host = REGION_HOSTS[creds.region];
    const cutoff = since ?? new Date(Date.now() - DEFAULT_BACKFILL_DAYS * 24 * 60 * 60 * 1000);

    const { accessToken, refreshed } = await ensureAccessToken(creds);

    const all: IntegrationOrderInput[] = [];
    let nextToken: string | undefined;

    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams();
      if (nextToken) {
        params.set("NextToken", nextToken);
      } else {
        params.set("MarketplaceIds", creds.marketplaceId);
        params.set("LastUpdatedAfter", cutoff.toISOString());
        params.set("MaxResultsPerPage", String(PAGE_SIZE));
      }

      const url = `${host}/orders/v0/orders?${params}`;
      const res = await fetchWithRetry(url, accessToken);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 401 || res.status === 403) {
          throw new Error(`Amazon SP-API auth invalid — refresh token may be expired or scopes insufficient`);
        }
        throw new Error(`Amazon SP-API orders error ${res.status}: ${text}`);
      }

      const json = await res.json() as { payload?: { Orders?: AmazonOrder[]; NextToken?: string } };
      const orders = json.payload?.Orders ?? [];
      for (const order of orders) {
        if (SKIP_STATUSES.has(order.OrderStatus)) continue;

        // Order-items + shipping address are separate API calls — best-effort, skip on error
        let items: AmazonOrderItem[] = [];
        let address: AmazonAddress | undefined;
        try {
          const itemsRes = await fetchWithRetry(`${host}/orders/v0/orders/${order.AmazonOrderId}/orderItems`, accessToken);
          if (itemsRes.ok) {
            const itemsJson = await itemsRes.json() as { payload?: { OrderItems?: AmazonOrderItem[] } };
            items = itemsJson.payload?.OrderItems ?? [];
          }
        } catch { /* continue without items */ }

        try {
          const addrRes = await fetchWithRetry(`${host}/orders/v0/orders/${order.AmazonOrderId}/address`, accessToken);
          if (addrRes.ok) {
            const addrJson = await addrRes.json() as { payload?: { ShippingAddress?: AmazonAddress } };
            address = addrJson.payload?.ShippingAddress;
          }
        } catch { /* continue without address */ }

        all.push(mapAmazonOrder(order, items, address));
      }

      nextToken = json.payload?.NextToken;
      if (!nextToken) break;
    }

    const updatedCredentials: AmazonCredentials | undefined = refreshed
      ? { ...creds, accessToken, accessTokenExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS).toISOString() }
      : undefined;

    return { orders: all, updatedCredentials };
  }
}
