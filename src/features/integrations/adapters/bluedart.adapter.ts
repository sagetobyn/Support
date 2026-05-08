import type { AdapterFetchResult, BluedartCredentials, IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput } from "../types";

// Bluedart Tracking API.
// Bluedart is a premium courier — they don't expose an "all orders" or "all NDR" endpoint
// like aggregators do. Instead, sellers query specific AWBs.
//
// fetchOrders() therefore returns an empty list (this adapter is meant to be used via
// trackAwbs() during the nightly tracking refresh, not as a primary order source).
//
// Endpoint: POST https://apigateway.bluedart.com/in/transportation/tracking/v1/shipment
// Auth: API key (license key) + login_id + password — sent in body.
//
// Trigger trackAwbs() from a scheduled job once Bluedart AWBs are flagged in the DB
// from the e-commerce platform sync.

const HOST = "https://apigateway.bluedart.com";
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const AWB_CHUNK_SIZE = 25;       // Bluedart's tracking endpoint limits to ~25 AWBs/call

interface BluedartScan {
  ScanCode?: string;
  ScanDate?: string;
  ScanType?: string;
  ScanGroupType?: string;
  Scan?: string;                  // human-readable scan
  ReceivedBy?: string;
  ScannedLocation?: string;
}

export interface BluedartShipment {
  WaybillNo?: string;
  RefNo?: string;                 // seller's order ID
  Status?: string;
  StatusType?: string;            // "Delivered" | "InTransit" | "Undelivered" | ...
  StatusDate?: string;
  Origin?: string;
  Destination?: string;
  PickupDate?: string;
  Consignee?: string;
  ConsigneePincode?: string;
  ConsigneePhone?: string;
  ProductCode?: string;
  COD?: boolean;
  CODAmount?: number;
  Scans?: BluedartScan[];
  ProductDescription?: string;
}

export function mapBluedartShipment(s: BluedartShipment): IntegrationOrderInput {
  const lastScan = (s.Scans ?? []).at(-1);
  const isUndelivered = (s.StatusType ?? "").toLowerCase() === "undelivered" ||
    /undeliver|ndr|attempt|cna/i.test(`${lastScan?.Scan ?? ""} ${lastScan?.ScanType ?? ""}`);

  return {
    orderId: s.RefNo ?? s.WaybillNo ?? `bd-${Date.now()}`,
    awb: s.WaybillNo,
    customerName: s.Consignee,
    phone: s.ConsigneePhone?.replace(/\D/g, ""),
    pincode: s.ConsigneePincode ?? s.Destination,
    productName: s.ProductDescription,
    quantity: 1,
    orderValue: s.CODAmount ?? 0,
    paymentMode: s.COD || (s.CODAmount && s.CODAmount > 0) ? "COD" : "Prepaid",
    courier: "Bluedart",
    shipmentStatus: isUndelivered ? "NDR" : s.Status ?? lastScan?.Scan,
    finalStatus: s.StatusType ?? s.Status,
    ndrReason: isUndelivered ? lastScan?.Scan : undefined,
    orderDate: s.PickupDate,
    sourcePlatform: "Bluedart",
    rawData: s as unknown as Record<string, unknown>,
  };
}

async function postWithRetry(url: string, body: object, apiKey: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", JWTToken: apiKey },
    body: JSON.stringify(body),
  });
  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    return postWithRetry(url, body, apiKey, attempt + 1);
  }
  return res;
}

export class BluedartAdapter implements IntegrationAdapter {
  readonly type = "bluedart" as const;

  // Bluedart has no "list orders / list NDRs" endpoint. fetchOrders is a no-op;
  // sellers connect this to enable trackAwbs() refresh of Bluedart-shipped orders.
  async fetchOrders(_credentials: IntegrationCredentials, _since?: Date): Promise<AdapterFetchResult> {
    return { orders: [] };
  }

  async trackAwbs(credentials: BluedartCredentials, awbs: string[]): Promise<IntegrationOrderInput[]> {
    if (awbs.length === 0) return [];
    const all: IntegrationOrderInput[] = [];

    for (let i = 0; i < awbs.length; i += AWB_CHUNK_SIZE) {
      const chunk = awbs.slice(i, i + AWB_CHUNK_SIZE);
      const body = {
        Request: {
          LoginID: credentials.loginId,
          LicenceKey: credentials.apiKey,
          Password: credentials.apiPassword,
          AWBNo: chunk,
        },
      };
      const res = await postWithRetry(`${HOST}/in/transportation/tracking/v1/shipment`, body, credentials.apiKey);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Bluedart auth invalid — verify license key, login ID, and password");
        }
        throw new Error(`Bluedart tracking error ${res.status}`);
      }
      const json = await res.json() as { Shipment?: BluedartShipment[] };
      for (const s of json.Shipment ?? []) all.push(mapBluedartShipment(s));
    }

    return all;
  }
}
