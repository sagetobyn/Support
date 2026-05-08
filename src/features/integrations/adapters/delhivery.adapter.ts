import type { AdapterFetchResult, DelhiveryCredentials, IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput } from "../types";

// Delhivery Tracking + NDR APIs.
// Docs: https://developer.delhivery.com/
// NDR pull: GET https://track.delhivery.com/api/p/pn-packages?token=<token>&filter_by=s&tab=ndr
// AWB tracking: GET https://track.delhivery.com/api/v1/packages/json/?waybill=AWB1,AWB2,...
//
// Limits observed in practice:
//  - Bulk tracking: ~50 AWBs per call
//  - NDR list: paginated via offset
//  - Rate limit: ~5 req/sec per token (Delhivery doesn't publish, observed empirically)

const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const AWB_CHUNK_SIZE = 50;
const NDR_PAGE_SIZE = 100;
const MAX_NDR_PAGES = 50;       // 50 * 100 = 5000 NDRs (the seller has bigger problems if they hit this)

interface DelhiveryPackage {
  AWB?: string;
  "Receiver Phone"?: string;
  "Destination"?: string;
  "Origin"?: string;
  "COD Amount"?: string;
  "Payment Type"?: string;
  "Scans"?: Array<{ "Scan"?: string; "ScanDetail"?: string; "ScanDateTime"?: string; "Instructions"?: string }>;
  "Status"?: string;
  "Consignee Name"?: string;
  "Ref Id"?: string;       // seller's order ID
  "PinCode"?: string;
  "PickedupDate"?: string;
}

export interface DelhiveryNdrRow {
  waybill?: string;
  ref_id?: string;
  consignee?: string;
  consignee_phone?: string;
  city?: string;
  pincode?: string;
  cod_amount?: string;
  product_quantity?: string;
  status?: string;
  reason?: string;
  last_updated?: string;
  attempts?: number;
}

// Map Delhivery's textual NDR reasons to the categories the existing ndr.ts normalizer recognizes.
// Delhivery uses phrases like "CNA - Consignee not available", "Customer refused" etc.
// Our normalizeNdrReason() in src/lib/ndr.ts already handles these patterns, but pre-clean obvious noise.
export function cleanDelhiveryNdrReason(raw?: string): string {
  if (!raw) return "";
  // Strip common Delhivery prefixes like "CNA - ", "DEL - ", numeric codes
  return raw.replace(/^[A-Z]{2,4}\s*[-:]\s*/i, "").replace(/^\d+\s*[-:]\s*/, "").trim();
}

export function mapDelhiveryNdrRow(row: DelhiveryNdrRow): IntegrationOrderInput {
  const codAmount = parseFloat(row.cod_amount ?? "0");
  return {
    orderId: row.ref_id || row.waybill || `dlv-ndr-${Date.now()}`,
    awb: row.waybill,
    customerName: row.consignee,
    phone: row.consignee_phone?.replace(/\D/g, ""),
    pincode: row.pincode,
    city: row.city,
    orderValue: codAmount,
    paymentMode: codAmount > 0 ? "COD" : "Unknown",
    courier: "Delhivery",
    shipmentStatus: "NDR",
    finalStatus: row.status,
    ndrReason: cleanDelhiveryNdrReason(row.reason),
    attemptCount: row.attempts,
    sourcePlatform: "Delhivery",
    rawData: row as unknown as Record<string, unknown>,
  };
}

export function mapDelhiveryPackage(pkg: DelhiveryPackage): IntegrationOrderInput {
  const lastScan = (pkg.Scans ?? []).at(-1);
  const codAmount = parseFloat(pkg["COD Amount"] ?? "0");
  const paymentType = (pkg["Payment Type"] ?? "").toLowerCase();
  const paymentMode = paymentType.includes("cod") || codAmount > 0 ? "COD" : (paymentType ? "Prepaid" : "Unknown");

  // Detect NDR from the latest scan's Instructions field
  const isNdr = /ndr|undelivered|attempt|consignee not available|cna/i.test(`${lastScan?.Scan ?? ""} ${lastScan?.Instructions ?? ""}`);

  return {
    orderId: pkg["Ref Id"] || pkg.AWB || "unknown",
    awb: pkg.AWB,
    customerName: pkg["Consignee Name"],
    phone: pkg["Receiver Phone"]?.replace(/\D/g, ""),
    pincode: pkg["PinCode"] ?? pkg["Destination"],
    orderValue: codAmount,
    paymentMode,
    courier: "Delhivery",
    shipmentStatus: lastScan?.Scan,
    finalStatus: pkg.Status,
    ndrReason: isNdr ? cleanDelhiveryNdrReason(lastScan?.Instructions) : undefined,
    sourcePlatform: "Delhivery",
    rawData: pkg as unknown as Record<string, unknown>,
  };
}

async function fetchWithRetry(url: string, apiToken: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, { headers: { Authorization: `Token ${apiToken}` } });

  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    const retryAfter = parseFloat(res.headers.get("retry-after") ?? "") * 1000;
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : RETRY_DELAY_MS * attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, apiToken, attempt + 1);
  }

  return res;
}

export class DelhiveryAdapter implements IntegrationAdapter {
  readonly type = "delhivery" as const;

  // Default sync: pull active NDRs (highest-priority data for RTO recovery)
  async fetchOrders(credentials: IntegrationCredentials, _since?: Date): Promise<AdapterFetchResult> {
    const creds = credentials as DelhiveryCredentials;
    const all: IntegrationOrderInput[] = [];

    for (let page = 0; page < MAX_NDR_PAGES; page++) {
      const offset = page * NDR_PAGE_SIZE;
      const url = `https://track.delhivery.com/api/p/pn-packages?token=${creds.apiToken}&filter_by=s&tab=ndr&format=json&offset=${offset}&limit=${NDR_PAGE_SIZE}`;
      const res = await fetchWithRetry(url, creds.apiToken);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Delhivery NDR API error ${res.status}: ${text}`);
      }

      const json = await res.json() as { objects?: DelhiveryNdrRow[] };
      const rows = json.objects ?? [];
      if (rows.length === 0) break;

      for (const row of rows) all.push(mapDelhiveryNdrRow(row));
      if (rows.length < NDR_PAGE_SIZE) break;
    }

    return { orders: all };
  }

  // Refresh tracking status for a list of known AWBs. Used by the nightly refresh flow.
  async trackAwbs(credentials: DelhiveryCredentials, awbs: string[]): Promise<IntegrationOrderInput[]> {
    if (awbs.length === 0) return [];
    const all: IntegrationOrderInput[] = [];

    for (let i = 0; i < awbs.length; i += AWB_CHUNK_SIZE) {
      const chunk = awbs.slice(i, i + AWB_CHUNK_SIZE);
      const url = `https://track.delhivery.com/api/v1/packages/json/?waybill=${chunk.join(",")}&format=json`;
      const res = await fetchWithRetry(url, credentials.apiToken);
      if (!res.ok) throw new Error(`Delhivery track error ${res.status}`);

      const json = await res.json() as { ShipmentData?: Array<{ Shipment?: DelhiveryPackage }> };
      for (const item of json.ShipmentData ?? []) {
        if (item.Shipment) all.push(mapDelhiveryPackage(item.Shipment));
      }
    }

    return all;
  }
}
