import type { BrandSettings, ImportSummary, Order } from "@/types/domain";
import { scoreOrder } from "@/lib/riskScoring";

export const csvAliases: Record<string, string[]> = {
  order_id: ["order_id", "order id", "order", "order no", "order number", "name", "shopify_order_id", "id"],
  awb: ["awb", "waybill", "way bill", "tracking number", "tracking_number", "shipment id", "shipment_id", "tracking", "shipment awb", "courier awb"],
  order_date: ["order_date", "order date", "date", "created at"],
  customer_name: ["customer_name", "customer name", "buyer name", "customer", "consignee"],
  phone: ["phone", "mobile", "customer phone", "customer_phone", "contact", "customer_mobile", "mobile number", "consignee phone"],
  email: ["email", "customer email"],
  address_line_1: ["address_line_1", "address 1", "address line 1"],
  address_line_2: ["address_line_2", "address 2", "address line 2"],
  full_address: ["address", "full_address", "shipping address", "shipping_address", "customer address", "full address", "consignee address", "delivery address"],
  landmark: ["landmark", "nearby landmark"],
  pincode: ["pincode", "pin", "pin code", "zip", "postal code", "postal_code", "postcode"],
  city: ["city", "destination city"],
  state: ["state", "destination state"],
  sku: ["sku", "variant sku", "item sku", "product sku"],
  product_name: ["product_name", "product", "item name", "product name", "title"],
  quantity: ["quantity", "qty", "item quantity"],
  order_value: ["order value", "order_value", "amount", "total", "total_price", "value", "cod amount", "order amount", "invoice value", "declared value"],
  payment_mode: ["payment_mode", "payment mode", "payment", "cod/prepaid", "payment_method", "payment method"],
  courier: ["courier", "carrier", "logistics partner", "logistics_partner", "shipping partner", "courier_name", "courier company", "courier partner", "logistics"],
  source_platform: ["source_platform", "source", "platform", "sales channel"],
  campaign_name: ["campaign_name", "campaign", "utm_campaign", "utm campaign", "ad campaign", "source campaign"],
  store_id: ["store_id", "store id", "store"],
  source_store_name: ["source_store_name", "store name", "source store"],
  utm_source: ["utm_source", "utm source"],
  utm_medium: ["utm_medium", "utm medium"],
  utm_campaign: ["utm_campaign", "utm campaign"],
  ad_id: ["ad_id", "ad id", "adset id", "creative id"],
  category: ["category", "product category"],
  gross_margin: ["gross_margin", "gross margin", "margin"],
  discount_amount: ["discount_amount", "discount", "coupon discount"],
  shipping_charge: ["shipping_charge", "shipping charge"],
  cod_fee_actual: ["cod_fee_actual", "actual cod fee"],
  courier_charge_actual: ["courier_charge_actual", "actual courier charge"],
  customer_type: ["customer_type", "customer type", "new repeat"],
  first_time_customer: ["first_time_customer", "first time customer", "new customer"],
  return_reason: ["return_reason", "return reason"],
  support_reason: ["support_reason", "support reason"],
  shipment_status: ["status", "shipment_status", "shipment status", "courier status", "tracking status", "current status", "awb status"],
  ndr_reason: ["ndr reason", "ndr_reason", "failed reason", "failure reason", "undelivered reason", "exception reason", "remark", "courier remark"],
  attempt_count: ["attempt_count", "attempt count", "attempts", "delivery attempts"],
  final_status: ["final status", "final_status", "delivery status", "outcome", "final outcome"]
};

const requiredFields = ["order_id"];
const proMaxImportRows = 10000;

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function canonicalHeader(header: string) {
  const normalized = normalizeHeader(header);
  for (const [canonical, values] of Object.entries(csvAliases)) {
    if (values.map(normalizeHeader).includes(normalized)) return canonical;
  }
  return normalized.replace(/\s+/g, "_");
}

export function normalizePaymentMode(value?: string): "COD" | "Prepaid" | "Unknown" {
  const normalized = (value || "").toLowerCase();
  if (/(cod|cash|cash on delivery)/.test(normalized)) return "COD";
  if (/(prepaid|online|upi|paid|razorpay|card|wallet|netbanking)/.test(normalized)) return "Prepaid";
  return "Unknown";
}

export function parseMoney(value?: string | number) {
  if (typeof value === "number") return value;
  const cleaned = String(value || "").replace(/[₹,\s]/g, "").replace(/inr/gi, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseCsvText(csv: string, manualMapping: Record<string, string> = {}) {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length);
  if (!lines.length) return { rows: [] as Array<Record<string, string>>, mapping: {} as Record<string, string> };
  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map((header) => manualMapping[header] || canonicalHeader(header));
  const mapping = Object.fromEntries(headers.map((header, index) => [header, rawHeaders[index]]));
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
  return { rows, mapping };
}

export function analyzeCsvImport(csv: string, manualMapping: Record<string, string> = {}) {
  const parsed = parseCsvText(csv, manualMapping);
  const presentFields = new Set(parsed.rows.flatMap((row) => Object.keys(row).filter((key) => String(row[key] || "").trim())));
  const missingFields = requiredFields.filter((field) => !presentFields.has(field));
  const invalidRows: ImportSummary["invalidRows"] = [];

  parsed.rows.forEach((raw, index) => {
    const issues: string[] = [];
    if (!raw.order_id) issues.push("Missing order_id");
    if (issues.length) invalidRows.push({ row: index + 2, issues, raw });
  });

  return {
    rows: parsed.rows,
    columnMapping: parsed.mapping,
    missingFields,
    previewRows: parsed.rows.slice(0, 20),
    invalidRows,
    dataQualityWarnings: collectDataQualityWarnings(parsed.rows),
    dataQualityScore: dataQualityScore(parsed.rows),
    fieldsPresent: [...presentFields],
    analysisUnlockedByAddingMissingFields: missingAnalysisHints(parsed.rows),
    planLimitWarnings: parsed.rows.length > proMaxImportRows ? ["Pro supports up to 10,000 rows per import. Larger imports are available in Scale."] : []
  };
}

function collectDataQualityWarnings(rows: Array<Record<string, string>>) {
  const warnings = new Set<string>();
  const awbs = new Map<string, number>();
  const orderIds = new Map<string, number>();
  for (const raw of rows) {
    if (!raw.phone) warnings.add("missing phone");
    if (!raw.pincode) warnings.add("missing pincode");
    else if (!/^[1-9]\d{5}$/.test(raw.pincode)) warnings.add("invalid pincode");
    if (Number.isNaN(parseMoney(raw.order_value))) warnings.add("missing order value");
    if (normalizePaymentMode(raw.payment_mode) === "Unknown") warnings.add("missing payment mode");
    if (!raw.courier) warnings.add("missing courier");
    if (!raw.final_status) warnings.add("missing final status");
    if (/ndr|undelivered|failed|exception/i.test(raw.shipment_status || "") && !raw.ndr_reason) warnings.add("missing NDR reason for failed shipment");
    if (parseMoney(raw.order_value) > 25000) warnings.add("suspiciously high order value");
    if (raw.awb) awbs.set(raw.awb, (awbs.get(raw.awb) || 0) + 1);
    if (raw.order_id) orderIds.set(raw.order_id, (orderIds.get(raw.order_id) || 0) + 1);
  }
  if ([...awbs.values()].some((count) => count > 1)) warnings.add("duplicate AWB");
  if ([...orderIds.values()].some((count) => count > 1)) warnings.add("duplicate order ID");
  return [...warnings];
}

function dataQualityScore(rows: Array<Record<string, string>>) {
  if (!rows.length) return 0;
  let penalty = 0;
  for (const raw of rows) {
    if (normalizePaymentMode(raw.payment_mode) === "Unknown") penalty += 20;
    if (!raw.final_status) penalty += 20;
    if (Number.isNaN(parseMoney(raw.order_value))) penalty += 15;
    if (!raw.pincode) penalty += 15;
    if (!raw.courier) penalty += 10;
    if (/ndr|undelivered|failed|exception/i.test(raw.shipment_status || "") && !raw.ndr_reason) penalty += 10;
    if (!raw.sku) penalty += 5;
    if (!raw.campaign_name && !raw.utm_source && !raw.utm_campaign) penalty += 5;
    if (raw.pincode && !/^[1-9]\d{5}$/.test(raw.pincode)) penalty += 10;
  }
  return Math.max(0, 100 - Math.round(penalty / rows.length));
}

function missingAnalysisHints(rows: Array<Record<string, string>>) {
  const hasAny = (fields: string[]) => rows.some((row) => fields.some((field) => row[field]));
  return [
    !hasAny(["campaign_name", "utm_source", "utm_medium", "utm_campaign", "ad_id"]) ? "Campaign leakage analysis is limited because campaign_name/utm fields are missing." : "",
    !hasAny(["sku", "product_name"]) ? "SKU/product leakage analysis improves when sku and product_name are uploaded." : "",
    !hasAny(["gross_margin"]) ? "Margin-aware prioritization improves when gross_margin is uploaded." : "",
    !hasAny(["store_id", "source_store_name"]) ? "Multi-store reporting improves when store_id or source_store_name is uploaded." : ""
  ].filter(Boolean);
}

function rtoLike(status?: string) {
  return /rto|return to origin/i.test(status || "");
}

function activeLike(order: Partial<Order>) {
  return !/delivered|rto|cancel/i.test(`${order.finalStatus || ""} ${order.shipmentStatus || ""}`);
}

function buildContextOrders(rows: Array<Record<string, string>>, existingOrders: Order[], brandId: string): Partial<Order>[] {
  return [
    ...existingOrders,
    ...rows.map((raw, index) => ({
      id: `preview-${index}`,
      brandId,
      orderId: raw.order_id,
      awb: raw.awb,
      phone: raw.phone,
      pincode: raw.pincode,
      courier: raw.courier,
      sku: raw.sku,
      campaignName: raw.campaign_name,
      orderValue: parseMoney(raw.order_value),
      finalStatus: raw.final_status,
      shipmentStatus: raw.shipment_status,
      paymentMode: normalizePaymentMode(raw.payment_mode)
    }))
  ];
}

function ratesForOrder(order: Partial<Order>, contextOrders: Partial<Order>[]) {
  const rtoOrders = contextOrders.filter((item) => rtoLike(item.finalStatus));
  const datasetAverageRtoRate = contextOrders.length ? rtoOrders.length / contextOrders.length : 0;
  const samePincode = contextOrders.filter((item) => item.pincode && item.pincode === order.pincode);
  const pincodeRto = samePincode.length ? samePincode.filter((item) => rtoLike(item.finalStatus)).length / samePincode.length : 0;
  const sameCourier = contextOrders.filter((item) => item.courier && item.courier === order.courier);
  const courierRtoRate = sameCourier.length ? sameCourier.filter((item) => rtoLike(item.finalStatus)).length / sameCourier.length : 0;
  const sameCourierPincode = contextOrders.filter((item) => item.pincode === order.pincode && item.courier === order.courier);
  const courierPincodeRtoRate = sameCourierPincode.length
    ? sameCourierPincode.filter((item) => rtoLike(item.finalStatus)).length / sameCourierPincode.length
    : 0;
  const sameSku = contextOrders.filter((item) => item.sku && item.sku === order.sku);
  const skuRtoRate = sameSku.length ? sameSku.filter((item) => rtoLike(item.finalStatus)).length / sameSku.length : 0;
  const sameCampaign = contextOrders.filter((item) => item.campaignName && item.campaignName === order.campaignName);
  const campaignRtoRate = sameCampaign.length ? sameCampaign.filter((item) => rtoLike(item.finalStatus)).length / sameCampaign.length : 0;
  const samePhone = contextOrders.filter((item) => item.phone && item.phone === order.phone);
  return {
    datasetAverageRtoRate,
    historicalPincodeRtoRate: pincodeRto,
    pincodeSampleSize: samePincode.length,
    courierRtoRate,
    courierSampleSize: sameCourier.length,
    courierPincodeRtoRate,
    courierPincodeSampleSize: sameCourierPincode.length,
    skuRtoRate,
    skuSampleSize: sameSku.length,
    campaignRtoRate,
    campaignSampleSize: sameCampaign.length,
    repeatedPhoneCount: samePhone.filter(activeLike).length,
    customerPreviousRto: samePhone.filter((item) => rtoLike(item.finalStatus)).length,
    phonePreviousCancelledOrRto: samePhone.some((item) => /rto|cancel/i.test(item.finalStatus || ""))
  };
}

export function importOrdersFromCsv(params: {
  csv: string;
  brandId: string;
  settings: BrandSettings;
  existingOrders?: Order[];
  importId?: string;
  storeId?: string;
  manualMapping?: Record<string, string>;
}): ImportSummary {
  const analysis = analyzeCsvImport(params.csv, params.manualMapping);
  const existingOrders = params.existingOrders || [];
  const existing = new Map(existingOrders.map((order) => [`${order.orderId}|${order.awb || ""}`, order]));
  const invalidRowsByNumber = new Map(analysis.invalidRows.map((row) => [row.row, row]));
  const errors: ImportSummary["errors"] = analysis.invalidRows.map((row) => ({ row: row.row, message: row.issues.join("; ") }));
  const orders: Order[] = [];
  const contextOrders = buildContextOrders(analysis.rows, existingOrders, params.brandId);
  let created = 0;
  let updated = 0;

  analysis.rows.forEach((raw, index) => {
    if (invalidRowsByNumber.has(index + 2)) return;

    const key = `${raw.order_id}|${raw.awb || ""}`;
    const previous = existing.get(key);
    const base: Partial<Order> = {
      brandId: params.brandId,
      importId: params.importId,
      orderId: String(raw.order_id),
      awb: String(raw.awb || ""),
      orderDate: String(raw.order_date || ""),
      customerName: String(raw.customer_name || ""),
      phone: String(raw.phone || ""),
      email: String(raw.email || ""),
      addressLine1: String(raw.address_line_1 || ""),
      addressLine2: String(raw.address_line_2 || ""),
      fullAddress: String(raw.full_address || [raw.address_line_1, raw.address_line_2].filter(Boolean).join(" ")),
      landmark: String(raw.landmark || ""),
      pincode: String(raw.pincode || ""),
      city: String(raw.city || ""),
      state: String(raw.state || ""),
      sku: String(raw.sku || ""),
      productName: String(raw.product_name || ""),
      quantity: Number(raw.quantity || 1),
      orderValue: parseMoney(raw.order_value),
      paymentMode: normalizePaymentMode(String(raw.payment_mode || "")),
      courier: String(raw.courier || ""),
      shipmentStatus: String(raw.shipment_status || ""),
      ndrReason: String(raw.ndr_reason || ""),
      attemptCount: Number(raw.attempt_count || 0),
      finalStatus: String(raw.final_status || ""),
      sourcePlatform: String(raw.source_platform || ""),
      campaignName: String(raw.campaign_name || ""),
      utmSource: String(raw.utm_source || ""),
      utmMedium: String(raw.utm_medium || ""),
      utmCampaign: String(raw.utm_campaign || ""),
      adId: String(raw.ad_id || ""),
      storeId: String(raw.store_id || params.storeId || ""),
      sourceStoreName: String(raw.source_store_name || ""),
      grossMargin: parseMoney(raw.gross_margin),
      discountAmount: parseMoney(raw.discount_amount) || 0,
      shippingCharge: parseMoney(raw.shipping_charge) || 0,
      codFeeActual: parseMoney(raw.cod_fee_actual) || 0,
      courierChargeActual: parseMoney(raw.courier_charge_actual) || 0,
      customerType: String(raw.customer_type || ""),
      firstTimeCustomer: /yes|true|1|first|new/i.test(raw.first_time_customer || raw.customer_type || ""),
      returnReason: String(raw.return_reason || ""),
      supportReason: String(raw.support_reason || ""),
      confirmationStatus: previous?.confirmationStatus || "unconfirmed",
      customerResponseStatus: previous?.customerResponseStatus,
      actionStatus: previous?.actionStatus || "open",
      rawData: raw
    };
    const dataQualityWarnings = [
      !base.customerName ? "Missing customer_name" : "",
      !base.phone ? "Missing phone" : "",
      !base.fullAddress ? "Missing full_address" : ""
    ].filter(Boolean);
    base.rawData = dataQualityWarnings.length ? { ...raw, data_quality_warnings: dataQualityWarnings } : raw;

    const scored = scoreOrder(base, { settings: params.settings, ...ratesForOrder(base, contextOrders) });
    const now = new Date().toISOString();
    orders.push({
      id: previous?.id || `${params.brandId}-${base.orderId}-${base.awb || index}`,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
      ...base,
      quantity: base.quantity || 1,
      orderValue: base.orderValue || 0,
      paymentMode: base.paymentMode || "Unknown",
      attemptCount: base.attemptCount || 0,
      riskScore: scored.score,
      riskBucket: scored.bucket,
      riskReasons: scored.reasons,
      addressQualityScore: scored.addressQualityScore,
      addressIssues: scored.addressIssues,
      recommendedAction: scored.recommendedAction,
      recommendedActionReason: scored.recommendedActionReason
    } as Order);

    if (previous) updated += 1;
    else created += 1;
  });

  return {
    rowCount: analysis.rows.length,
    successCount: orders.length,
    errorCount: errors.length,
    errors,
    created,
    updated,
    orders,
    missingFields: analysis.missingFields,
    columnMapping: analysis.columnMapping,
    previewRows: analysis.previewRows,
    invalidRows: analysis.invalidRows,
    dataQualityWarnings: analysis.dataQualityWarnings,
    dataQualityScore: analysis.dataQualityScore,
    planLimitWarnings: [
      ...(analysis.planLimitWarnings || []),
      existingOrders.length + orders.length > (params.settings.monthlyOrderLimit || 2000)
        ? `Growth order limit warning: ${existingOrders.length + orders.length}/${params.settings.monthlyOrderLimit || 2000} orders this month.`
        : ""
    ].filter(Boolean)
  };
}
