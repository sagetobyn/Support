import type { DelhiveryCredentials, IntegrationAdapter, IntegrationCredentials, IntegrationOrderInput } from "../types";

// Delhivery Tracking API
// Docs: https://developer.delhivery.com/
// Endpoint: GET https://track.delhivery.com/api/v1/packages/json/?waybill=<AWB>
// For NDR pull: GET https://track.delhivery.com/api/p/pn-packages?token=<token>&filter_by=s&tab=ndr

interface DelhiveryPackage {
  AWB?: string;
  "Receiver Phone"?: string;
  "Destination"?: string;
  "Origin"?: string;
  "COD Amount"?: string;
  "Payment Type"?: string;
  "Scans"?: Array<{ "Scan"?: string; "ScanDetail"?: string; "ScanDateTime"?: string }>;
  "Status"?: string;
  "Consignee Name"?: string;
  "Ref Id"?: string;  // seller's order ID
}

interface DelhiveryNdrRow {
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
}

function mapNdrRow(row: DelhiveryNdrRow): IntegrationOrderInput {
  const paymentMode = row.cod_amount && parseFloat(row.cod_amount) > 0 ? "COD" : "Unknown";
  return {
    orderId: row.ref_id ?? row.waybill ?? `dlv-${Date.now()}`,
    awb: row.waybill,
    phone: row.consignee_phone?.replace(/\D/g, ""),
    pincode: row.pincode,
    city: row.city,
    orderValue: parseFloat(row.cod_amount ?? "0"),
    paymentMode,
    courier: "Delhivery",
    shipmentStatus: row.status ?? "NDR",
    finalStatus: row.status,
    ndrReason: row.reason,
    sourcePlatform: "Delhivery",
    rawData: row as unknown as Record<string, unknown>,
  };
}

export class DelhiveryAdapter implements IntegrationAdapter {
  readonly type = "delhivery" as const;

  async fetchOrders(credentials: IntegrationCredentials, _since?: Date): Promise<IntegrationOrderInput[]> {
    const creds = credentials as DelhiveryCredentials;

    // Pull active NDR cases — this is the highest-value pull for RTO recovery
    const url = `https://track.delhivery.com/api/p/pn-packages?token=${creds.apiToken}&filter_by=s&tab=ndr&format=json`;
    const res = await fetch(url, {
      headers: { Authorization: `Token ${creds.apiToken}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Delhivery API error ${res.status}: ${text}`);
    }

    const json = await res.json() as { objects?: DelhiveryNdrRow[] };
    return (json.objects ?? []).map(mapNdrRow);
  }

  // Track individual AWBs — useful when refreshing status for known orders.
  async trackAwbs(credentials: DelhiveryCredentials, awbs: string[]): Promise<IntegrationOrderInput[]> {
    const joined = awbs.join(",");
    const url = `https://track.delhivery.com/api/v1/packages/json/?waybill=${joined}&format=json`;
    const res = await fetch(url, {
      headers: { Authorization: `Token ${credentials.apiToken}` },
    });

    if (!res.ok) throw new Error(`Delhivery track error ${res.status}`);

    const json = await res.json() as { ShipmentData?: Array<{ Shipment?: DelhiveryPackage }> };
    return (json.ShipmentData ?? []).map((item) => {
      const pkg = item.Shipment ?? {};
      const lastScan = (pkg.Scans ?? []).at(-1);
      const paymentMode = (pkg["Payment Type"] ?? "").toLowerCase().includes("cod") ? "COD" : "Prepaid";
      return {
        orderId: pkg["Ref Id"] ?? pkg.AWB ?? "unknown",
        awb: pkg.AWB,
        customerName: pkg["Consignee Name"],
        pincode: pkg.Destination,
        orderValue: parseFloat(pkg["COD Amount"] ?? "0"),
        paymentMode: paymentMode as "COD" | "Prepaid",
        courier: "Delhivery",
        shipmentStatus: lastScan?.Scan,
        finalStatus: pkg.Status,
        sourcePlatform: "Delhivery",
        rawData: pkg as unknown as Record<string, unknown>,
      };
    });
  }
}
