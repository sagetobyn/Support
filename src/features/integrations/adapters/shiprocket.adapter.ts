import type { IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput, ShiprocketCredentials } from "../types";

// Shiprocket REST API
// Auth: POST https://apiv2.shiprocket.in/v1/external/auth/login → { token }
// Orders: GET https://apiv2.shiprocket.in/v1/external/orders?per_page=100
// NDR: GET https://apiv2.shiprocket.in/v1/external/ndr/shipments/all

interface ShiprocketOrderItem {
  name?: string;
  sku?: string;
  units?: number;
  selling_price?: string;
}

interface ShiprocketOrder {
  id: number;
  channel_order_id?: string;
  created_at: string;
  status: string;
  payment_method?: string;
  total?: number;
  customer_name?: string;
  customer_phone?: string;
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

interface ShiprocketNdrShipment {
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
}

async function refreshToken(creds: ShiprocketCredentials): Promise<string> {
  const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });

  if (!res.ok) throw new Error(`Shiprocket auth failed: ${res.status}`);
  const json = await res.json() as { token?: string };
  if (!json.token) throw new Error("Shiprocket auth: no token in response");
  return json.token;
}

function getToken(creds: ShiprocketCredentials): Promise<string> {
  if (creds.jwtToken && creds.jwtExpiresAt && new Date(creds.jwtExpiresAt) > new Date()) {
    return Promise.resolve(creds.jwtToken);
  }
  return refreshToken(creds);
}

function detectPaymentMode(method?: string): "COD" | "Prepaid" | "Unknown" {
  if (!method) return "Unknown";
  const lower = method.toLowerCase();
  if (lower.includes("cod") || lower.includes("cash")) return "COD";
  return "Prepaid";
}

function mapOrder(order: ShiprocketOrder): IntegrationOrderInput {
  const firstItem = order.products?.[0];
  return {
    orderId: order.channel_order_id ?? String(order.id),
    orderDate: order.created_at,
    customerName: order.customer_name,
    phone: order.customer_phone?.replace(/\D/g, ""),
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

function mapNdrShipment(ndr: ShiprocketNdrShipment): IntegrationOrderInput {
  return {
    orderId: ndr.channel_order_id ?? ndr.order_id ?? ndr.awb ?? `sr-${Date.now()}`,
    awb: ndr.awb,
    customerName: ndr.customer_name,
    phone: ndr.customer_phone?.replace(/\D/g, ""),
    pincode: ndr.delivery_pincode,
    city: ndr.delivery_city,
    orderValue: ndr.cod_amount ?? 0,
    paymentMode: ndr.cod_amount ? "COD" : "Unknown",
    courier: ndr.courier_name,
    shipmentStatus: "NDR",
    finalStatus: ndr.status,
    ndrReason: ndr.ndr_reason,
    sourcePlatform: "Shiprocket",
    rawData: ndr as unknown as Record<string, unknown>,
  };
}

export class ShiprocketAdapter implements IntegrationAdapter {
  readonly type = "shiprocket" as const;

  async fetchOrders(credentials: IntegrationCredentials, since?: Date): Promise<IntegrationOrderInput[]> {
    const creds = credentials as ShiprocketCredentials;
    const token = await getToken(creds);
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    // Fetch NDR cases first (highest priority for RTO recovery)
    const ndrRes = await fetch("https://apiv2.shiprocket.in/v1/external/ndr/shipments/all?per_page=100", { headers });
    if (!ndrRes.ok) throw new Error(`Shiprocket NDR error ${ndrRes.status}`);
    const ndrJson = await ndrRes.json() as { data?: ShiprocketNdrShipment[] };
    const ndrOrders = (ndrJson.data ?? []).map(mapNdrShipment);

    // Fetch recent orders
    const orderParams = new URLSearchParams({ per_page: "100" });
    if (since) orderParams.set("from", since.toISOString().split("T")[0]);
    const orderRes = await fetch(`https://apiv2.shiprocket.in/v1/external/orders?${orderParams}`, { headers });
    if (!orderRes.ok) throw new Error(`Shiprocket orders error ${orderRes.status}`);
    const orderJson = await orderRes.json() as { data?: ShiprocketOrder[] };
    const regularOrders = (orderJson.data ?? []).map(mapOrder);

    // Dedupe by orderId (NDR rows take precedence — they have richer status)
    const seen = new Set<string>();
    const result: IntegrationOrderInput[] = [];
    for (const o of [...ndrOrders, ...regularOrders]) {
      if (!seen.has(o.orderId)) {
        seen.add(o.orderId);
        result.push(o);
      }
    }
    return result;
  }
}
