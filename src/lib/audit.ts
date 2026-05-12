import {
  calculateCalculatorOutputs,
  defaultCalculatorInputs,
  type CalculatorInputs,
  type SellerCategory,
  type ShippingPlatform
} from "@/lib/calculator";
import { groupByCourier, groupByNdrReason, groupByPincode, groupBySku, type GroupMetric } from "@/lib/reporting";
import { parseCsvLine, parseMoney, normalizePaymentMode } from "@/lib/csvImport";
import { calculateRtoLossPerOrder } from "@/features/calculator";
import {
  ANONYMIZED_AUDIT_REQUIRED_FIELDS,
  validateAnonymizedAuditCsvSchema,
  type AnonymizedAuditCsvSchemaValidation
} from "@/features/imports/anonymizedCsvValidator";

export type AuditMode = "summary" | "csv" | "pilot";
export type AuditStatus = "draft" | "calculated" | "report_ready" | "pilot_recommended" | "pilot_started";

export interface SummaryAuditInputs {
  brandName: string;
  contact?: string;
  category: SellerCategory;
  monthlyOrders: number;
  codPercentage: number;
  overallRtoPercentage: number;
  codRtoPercentage?: number | null;
  averageOrderValue: number;
  forwardShippingCost: number;
  returnShippingCost: number;
  packagingCost: number;
  estimatedCac: number;
  codFee: number;
  supportOpsCost: number;
  shippingPlatform: ShippingPlatform | string;
  knownRtoReasons?: string[];
  problemPincodes?: string[];
  problemCouriers?: string[];
  pilotSoftwareCost?: number;
}

export interface AuditRow {
  order_id: string;
  pincode: string;
  payment_mode: "COD" | "Prepaid" | "Unknown";
  order_value: number;
  courier: string;
  shipment_status: string;
  ndr_reason: string;
  final_status: string;
  order_date?: string;
  sku?: string;
  product_name?: string;
  city?: string;
  state?: string;
  source_platform?: string;
  campaign_name?: string;
  attempt_count?: number;
  estimated_loss?: number;
}

export interface CsvAuditParseResult {
  rows: AuditRow[];
  previewRows: AuditRow[];
  invalidRows: Array<{ row: number; issues: string[]; raw: Record<string, string> }>;
  missingFields: string[];
  disallowedFields: string[];
  schemaValidation: AnonymizedAuditCsvSchemaValidation;
  columnMapping: Record<string, string>;
}

export interface AuditRecommendation {
  title: string;
  body: string;
  action: string;
}

export interface AuditSession {
  id: string;
  created_at: string;
  mode: AuditMode;
  brand_name: string;
  category: string;
  contact?: string;
  summary_inputs?: SummaryAuditInputs;
  csv_file_name?: string;
  row_count?: number;
  calculated_metrics: AuditMetrics;
  recommendations: AuditRecommendation[];
  status: AuditStatus;
}

export interface AuditMetrics {
  monthlyOrders: number;
  codPercentage: number;
  rtoPercentage: number;
  codRtoPercentage: number | null;
  totalRtoOrders: number;
  rtoLossPerOrder: number;
  monthlyLeakage: number;
  codLeakage: number | null;
  savings10: number;
  savings20: number;
  savings30: number;
  pincodeLeakage?: GroupMetric[];
  courierLeakage?: GroupMetric[];
  skuLeakage?: GroupMetric[];
  ndrReasonLeakage?: GroupMetric[];
  dataQuality?: {
    validRows: number;
    invalidRows: number;
    missingFields: string[];
  };
}

const csvAliases: Record<keyof AuditRow, string[]> = {
  order_id: ["order_id", "order id", "order", "name", "id", "order number"],
  pincode: ["pincode", "pin code", "postal code", "postcode", "zip"],
  payment_mode: ["payment_mode", "payment mode", "payment", "payment_method", "cod/prepaid"],
  order_value: ["order_value", "amount", "total", "order amount", "invoice value", "cod amount"],
  courier: ["courier", "carrier", "logistics", "courier partner"],
  shipment_status: ["shipment_status", "shipment status", "status", "courier status", "current status"],
  ndr_reason: ["ndr_reason", "ndr reason", "failed reason", "failure reason", "undelivered reason"],
  final_status: ["final_status", "final status", "outcome", "delivery status"],
  order_date: ["order_date", "order date", "date", "created at"],
  sku: ["sku", "variant sku", "item sku"],
  product_name: ["product_name", "product", "product name", "item name"],
  city: ["city", "destination city"],
  state: ["state", "destination state"],
  source_platform: ["source_platform", "source", "platform", "sales channel"],
  campaign_name: ["campaign_name", "campaign", "utm campaign"],
  attempt_count: ["attempt_count", "attempt count", "attempts", "delivery attempts"],
  estimated_loss: ["estimated_loss"]
};

const requiredFields = ANONYMIZED_AUDIT_REQUIRED_FIELDS as readonly (keyof AuditRow)[];
const defaultRtoLossPerOrder = calculateRtoLossPerOrder(defaultCalculatorInputs);

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function canonicalHeader(header: string) {
  const normalized = normalizeHeader(header);
  for (const [canonical, aliases] of Object.entries(csvAliases)) {
    if (aliases.map(normalizeHeader).includes(normalized)) return canonical;
  }
  return normalized.replace(/\s+/g, "_");
}

function isRtoStatus(status: string) {
  return /rto|return to origin/i.test(status);
}

function isNdrStatus(status: string, ndrReason = "") {
  return /ndr|undelivered|failed|exception/i.test(`${status} ${ndrReason}`);
}

function toCalculatorInput(input: SummaryAuditInputs): CalculatorInputs {
  return {
    ...defaultCalculatorInputs,
    monthlyOrders: input.monthlyOrders,
    codPercentage: input.codPercentage,
    overallRtoPercentage: input.overallRtoPercentage,
    codRtoPercentage: input.codRtoPercentage,
    averageOrderValue: input.averageOrderValue,
    forwardShippingCost: input.forwardShippingCost,
    returnShippingCost: input.returnShippingCost,
    packagingCost: input.packagingCost,
    estimatedCac: input.estimatedCac,
    codFee: input.codFee,
    supportOpsCost: input.supportOpsCost,
    pilotSoftwareCost: input.pilotSoftwareCost ?? defaultCalculatorInputs.pilotSoftwareCost,
    category: input.category,
    shippingPlatform: (input.shippingPlatform || defaultCalculatorInputs.shippingPlatform) as ShippingPlatform
  };
}

export function generateAuditRecommendations(input: {
  codPercentage: number;
  rtoPercentage: number;
  codRtoPercentage?: number | null;
  inferredPrepaidRtoPercentage?: number | null;
  knownRtoReasons?: string[];
  problemPincodes?: string[];
  problemCouriers?: string[];
  pincodeLeakage?: GroupMetric[];
  courierLeakage?: GroupMetric[];
  ndrReasonLeakage?: GroupMetric[];
}): AuditRecommendation[] {
  const recommendations: AuditRecommendation[] = [];
  const reasons = [...(input.knownRtoReasons || []), ...(input.ndrReasonLeakage || []).map((item) => item.label)].join(" ").toLowerCase();

  if (input.codPercentage > 60 && input.rtoPercentage > 18) {
    recommendations.push({
      title: "Start with risky COD confirmation",
      body: "COD share and RTO are both high, so payment-mode policy is likely the first commercial lever.",
      action: "Run COD confirmation and COD-to-prepaid tests for high-risk orders above ₹999."
    });
  }

  if (input.rtoPercentage > 20 || /customer_unavailable|unavailable|door_locked/.test(reasons)) {
    recommendations.push({
      title: "Run NDR rescue within 12 hours",
      body: "NDR is the warning stage before RTO becomes a realized loss.",
      action: "Queue WhatsApp plus call fallback and request reattempt for customer unavailable and door locked cases."
    });
  }

  if (input.codRtoPercentage && input.inferredPrepaidRtoPercentage !== null && input.inferredPrepaidRtoPercentage !== undefined && input.codRtoPercentage - input.inferredPrepaidRtoPercentage >= 8) {
    recommendations.push({
      title: "Review payment-mode policy",
      body: "COD RTO appears meaningfully higher than inferred prepaid RTO.",
      action: "Test prepaid-only, partial-prepaid, or confirmation rules for specific risky cohorts."
    });
  }

  if (/wrong_address|incorrect address|address/.test(reasons)) {
    recommendations.push({
      title: "Fix weak address before dispatch",
      body: "Address-quality leakage is preventable before the courier attempts delivery.",
      action: "Ask for landmark, house/flat number, and alternate phone before shipping weak-address COD orders."
    });
  }

  if (/customer_refused|refused/.test(reasons)) {
    recommendations.push({
      title: "Correct expectation before shipment",
      body: "Refusal often points to weak buyer intent, product expectation mismatch, or COD friction.",
      action: "Confirm COD intent and restate product, price, and delivery expectation before dispatch."
    });
  }

  if (/phone_unreachable|unreachable/.test(reasons)) {
    recommendations.push({
      title: "Add phone validation and call fallback",
      body: "Phone unreachable cases need validation before dispatch and faster fallback during NDR.",
      action: "Verify phone for risky COD and call high-value NDR cases."
    });
  }

  if ((input.problemPincodes || []).length || (input.pincodeLeakage || []).length) {
    recommendations.push({
      title: "Create pincode verification rules",
      body: "Known pincode concentration usually means blanket policies are too blunt.",
      action: "Apply COD confirmation, partial-prepaid, or prepaid-only tests to the highest-leakage pincodes."
    });
  }

  if ((input.problemCouriers || []).length || (input.courierLeakage || []).length) {
    recommendations.push({
      title: "Review courier allocation",
      body: "Courier leakage should be checked by pincode cluster before making broad courier changes.",
      action: "Run a 14-day switchback test for the courier-pincode pairs with concentrated RTO/NDR."
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      title: "Start with measurement",
      body: "The summary numbers do not show a single obvious driver yet.",
      action: "Use an anonymized CSV audit to identify pincode, courier, SKU, and NDR reason concentration."
    });
  }

  return recommendations;
}

export function generateActionPreview(recommendations: AuditRecommendation[]) {
  return recommendations.slice(0, 6).map((item, index) => ({
    id: `action-${index + 1}`,
    group: item.title,
    action: item.action,
    reason: item.body
  }));
}

export function generateSummaryAudit(input: SummaryAuditInputs): AuditSession {
  const calculator = calculateCalculatorOutputs(toCalculatorInput(input));
  const recommendations = generateAuditRecommendations({
    codPercentage: input.codPercentage,
    rtoPercentage: input.overallRtoPercentage,
    codRtoPercentage: input.codRtoPercentage,
    inferredPrepaidRtoPercentage: calculator.prepaidRtoPercentage,
    knownRtoReasons: input.knownRtoReasons,
    problemPincodes: input.problemPincodes,
    problemCouriers: input.problemCouriers
  });

  return {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    created_at: new Date().toISOString(),
    mode: "summary",
    brand_name: input.brandName,
    category: input.category,
    contact: input.contact,
    summary_inputs: input,
    row_count: 0,
    calculated_metrics: {
      monthlyOrders: input.monthlyOrders,
      codPercentage: input.codPercentage,
      rtoPercentage: input.overallRtoPercentage,
      codRtoPercentage: input.codRtoPercentage ?? null,
      totalRtoOrders: calculator.totalRtoOrders,
      rtoLossPerOrder: calculator.rtoLossPerOrder,
      monthlyLeakage: calculator.monthlyRtoLeakage,
      codLeakage: calculator.codDrivenRtoLeakage,
      savings10: calculator.saving10,
      savings20: calculator.saving20,
      savings30: calculator.saving30
    },
    recommendations,
    status: recommendations.length ? "pilot_recommended" : "calculated"
  };
}

export function parseAnonymizedAuditCsv(csv: string, rtoLossPerOrder = defaultRtoLossPerOrder): CsvAuditParseResult {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length);
  if (!lines.length) {
    const schemaValidation = validateAnonymizedAuditCsvSchema([]);
    return { rows: [], previewRows: [], invalidRows: [], missingFields: requiredFields.map(String), disallowedFields: [], schemaValidation, columnMapping: {} };
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const schemaValidation = validateAnonymizedAuditCsvSchema(rawHeaders);
  const disallowedFields = schemaValidation.disallowedFields.map((field) => field.header);
  const headers = rawHeaders.map(canonicalHeader);
  const columnMapping = Object.fromEntries(headers.map((header, index) => [header, rawHeaders[index]]));
  const rawRows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
  });
  const missingFields = schemaValidation.missingRequiredFields;
  const invalidRows: CsvAuditParseResult["invalidRows"] = [];
  const rows: AuditRow[] = [];

  rawRows.forEach((raw, index) => {
    const issues: string[] = [];
    if (!raw.order_id) issues.push("Missing order_id");
    if (!raw.pincode || !/^[1-9]\d{5}$/.test(raw.pincode)) issues.push("Invalid pincode");
    if (normalizePaymentMode(raw.payment_mode) === "Unknown") issues.push("Unknown payment_mode");
    if (Number.isNaN(parseMoney(raw.order_value))) issues.push("Invalid order_value");
    if (!raw.courier) issues.push("Missing courier");
    if (!raw.shipment_status) issues.push("Missing shipment_status");
    if (!raw.final_status) issues.push("Missing final_status");
    if (!raw.ndr_reason) issues.push("Missing ndr_reason");
    if (issues.length) {
      invalidRows.push({ row: index + 2, issues, raw });
      return;
    }

    const finalStatus = String(raw.final_status || "");
    rows.push({
      order_id: String(raw.order_id),
      pincode: String(raw.pincode),
      payment_mode: normalizePaymentMode(String(raw.payment_mode || "")),
      order_value: parseMoney(raw.order_value),
      courier: String(raw.courier || ""),
      shipment_status: String(raw.shipment_status || ""),
      ndr_reason: String(raw.ndr_reason || ""),
      final_status: finalStatus,
      order_date: String(raw.order_date || ""),
      sku: String(raw.sku || ""),
      product_name: String(raw.product_name || ""),
      city: String(raw.city || ""),
      state: String(raw.state || ""),
      source_platform: String(raw.source_platform || ""),
      campaign_name: String(raw.campaign_name || ""),
      attempt_count: Number(raw.attempt_count || 0),
      estimated_loss: isRtoStatus(finalStatus) ? rtoLossPerOrder : 0
    });
  });

  return { rows, previewRows: rows.slice(0, 10), invalidRows, missingFields, disallowedFields, schemaValidation, columnMapping };
}

export function generateCsvAudit(params: {
  brandName: string;
  contact?: string;
  category: SellerCategory | string;
  csvFileName: string;
  rows: AuditRow[];
  invalidRowCount?: number;
  missingFields?: string[];
  rtoLossPerOrder?: number;
  pilotSoftwareCost?: number;
}): AuditSession {
  const rtoLossPerOrder = params.rtoLossPerOrder || defaultRtoLossPerOrder;
  const codRows = params.rows.filter((row) => row.payment_mode === "COD");
  const rtoRows = params.rows.filter((row) => isRtoStatus(`${row.final_status} ${row.shipment_status}`));
  const codRtoRows = codRows.filter((row) => isRtoStatus(`${row.final_status} ${row.shipment_status}`));
  const monthlyLeakage = rtoRows.length * rtoLossPerOrder;
  const codLeakage = codRtoRows.length * rtoLossPerOrder;
  const codPercentage = params.rows.length ? (codRows.length / params.rows.length) * 100 : 0;
  const rtoPercentage = params.rows.length ? (rtoRows.length / params.rows.length) * 100 : 0;
  const codRtoPercentage = codRows.length ? (codRtoRows.length / codRows.length) * 100 : null;
  const enrichedRows = params.rows.map((row) => ({ ...row, estimated_loss: isRtoStatus(`${row.final_status} ${row.shipment_status}`) ? rtoLossPerOrder : 0 }));
  const pincodeLeakage = groupByPincode(enrichedRows);
  const courierLeakage = groupByCourier(enrichedRows);
  const skuLeakage = groupBySku(enrichedRows);
  const ndrReasonLeakage = groupByNdrReason(enrichedRows.filter((row) => isNdrStatus(row.shipment_status, row.ndr_reason)));
  const recommendations = generateAuditRecommendations({
    codPercentage,
    rtoPercentage,
    codRtoPercentage,
    pincodeLeakage,
    courierLeakage,
    ndrReasonLeakage
  });

  return {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    created_at: new Date().toISOString(),
    mode: "csv",
    brand_name: params.brandName,
    category: params.category,
    contact: params.contact,
    csv_file_name: params.csvFileName,
    row_count: params.rows.length,
    calculated_metrics: {
      monthlyOrders: params.rows.length,
      codPercentage,
      rtoPercentage,
      codRtoPercentage,
      totalRtoOrders: rtoRows.length,
      rtoLossPerOrder,
      monthlyLeakage,
      codLeakage,
      savings10: monthlyLeakage * 0.1,
      savings20: monthlyLeakage * 0.2,
      savings30: monthlyLeakage * 0.3,
      pincodeLeakage,
      courierLeakage,
      skuLeakage,
      ndrReasonLeakage,
      dataQuality: {
        validRows: params.rows.length,
        invalidRows: params.invalidRowCount || 0,
        missingFields: params.missingFields || []
      }
    },
    recommendations,
    status: "report_ready"
  };
}

export function exportAuditSessionsCsv(sessions: AuditSession[]) {
  const headers = ["id", "created_at", "mode", "brand_name", "category", "contact", "row_count", "monthlyLeakage", "savings20", "status"];
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
  return [
    headers.join(","),
    ...sessions.map((session) =>
      [
        session.id,
        session.created_at,
        session.mode,
        session.brand_name,
        session.category,
        session.contact,
        session.row_count || 0,
        session.calculated_metrics.monthlyLeakage,
        session.calculated_metrics.savings20,
        session.status
      ].map(escape).join(",")
    )
  ].join("\n");
}
