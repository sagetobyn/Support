import type { AdapterFetchResult, IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput, MeeshoCredentials } from "../types";

// Meesho Supplier API (Partner Integration).
// Note: Meesho's full API is restricted to onboarded integration partners.
// Endpoints used:
//  - POST  /partner-api/v1/order/list      (paginated orders)
//  - POST  /partner-api/v1/order/details   (line items + customer)
//
// Meesho's RTO rate is the highest of any Indian marketplace (often 35-45%),
// making this adapter the single highest-impact for sellers' bottom line.

const HOST = "https://api.meesho.com";
const PAGE_SIZE = 100;
const MAX_PAGES = 100;          // Meesho sellers can have 5000+ orders/day, allow deeper paging
const DEFAULT_BACKFILL_DAYS = 60;
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

export interface MeeshoOrder {
  order_id: string;
  sub_order_id?: string;
  order_date?: string;
  order_status?: string;          // "PENDING" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED" | "RTO" | "RTO_INITIATED"
  payment_method?: "COD" | "PREPAID";
  total_amount?: number;
  awb_number?: string;
  courier_partner?: string;
  shipping_status?: string;
  ndr_reason?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_pincode?: string;
  customer_city?: string;
  customer_state?: string;
  product_name?: string;
  sku?: string;
  quantity?: number;
}

const SKIP_STATUSES = new Set(["CANCELLED"]);
const NDR_STATUSES = new Set(["RTO_INITIATED", "RTO", "UNDELIVERED"]);

function detectPaymentMode(payment?: "COD" | "PREPAID"): "COD" | "Prepaid" | "Unknown" {
  if (payment === "COD") return "COD";
  if (payment === "PREPAID") return "Prepaid";
  return "Unknown";
}

export function mapMeeshoOrder(order: MeeshoOrder): IntegrationOrderInput {
  const isNdr = NDR_STATUSES.has(order.order_status ?? "");
  return {
    orderId: order.sub_order_id ?? order.order_id,
    orderDate: order.order_date,
    customerName: order.customer_name,
    phone: order.customer_phone?.replace(/\D/g, ""),
    addressLine1: order.customer_address,
    pincode: order.customer_pincode,
    city: order.customer_city,
    state: order.customer_state,
    productName: order.product_name,
    sku: order.sku,
    quantity: order.quantity ?? 1,
    orderValue: order.total_amount ?? 0,
    paymentMode: detectPaymentMode(order.payment_method),
    awb: order.awb_number,
    courier: order.courier_partner,
    shipmentStatus: isNdr ? "NDR" : order.shipping_status,
    finalStatus: order.order_status,
    ndrReason: order.ndr_reason,
    sourcePlatform: "Meesho",
    rawData: order as unknown as Record<string, unknown>,
  };
}

async function fetchWithRetry(url: string, body: object, creds: MeeshoCredentials, attempt = 1): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": creds.apiKey,
      "X-API-SECRET": creds.apiSecret,
    },
    body: JSON.stringify(body),
  });
  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    const retryAfter = parseFloat(res.headers.get("retry-after") ?? "") * 1000;
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : RETRY_DELAY_MS * attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, body, creds, attempt + 1);
  }
  return res;
}

export class MeeshoAdapter implements IntegrationAdapter {
  readonly type = "meesho" as const;

  async fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<AdapterFetchResult> {
    const creds = credentials as MeeshoCredentials;
    const cutoff = since ?? new Date(Date.now() - DEFAULT_BACKFILL_DAYS * 24 * 60 * 60 * 1000);

    const all: IntegrationOrderInput[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const body = {
        from_date: cutoff.toISOString().split("T")[0],
        to_date: new Date().toISOString().split("T")[0],
        page,
        page_size: PAGE_SIZE,
      };

      const res = await fetchWithRetry(`${HOST}/partner-api/v1/order/list`, body, creds);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 401 || res.status === 403) {
          throw new Error("Meesho auth invalid — verify apiKey/apiSecret and partner onboarding status");
        }
        throw new Error(`Meesho orders error ${res.status}: ${text}`);
      }

      const json = await res.json() as { data?: MeeshoOrder[]; total?: number };
      const orders = json.data ?? [];
      if (orders.length === 0) break;

      for (const order of orders) {
        if (SKIP_STATUSES.has(order.order_status ?? "")) continue;
        all.push(mapMeeshoOrder(order));
      }

      if (orders.length < PAGE_SIZE) break;
    }

    return { orders: all };
  }
}
