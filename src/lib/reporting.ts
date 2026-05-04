export function formatCurrency(value: number, options: { perOrder?: boolean } = {}) {
  const formatted = `₹${Math.round(Number.isFinite(value) ? value : 0).toLocaleString("en-IN")}`;
  return options.perOrder ? `${formatted}/order` : formatted;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not applicable";
  return `${Math.round(value * 10) / 10}%`;
}

export function formatNumber(value: number) {
  return Math.round(Number.isFinite(value) ? value : 0).toLocaleString("en-IN");
}

export interface GroupableAuditRow {
  pincode?: string;
  courier?: string;
  sku?: string;
  product_name?: string;
  ndr_reason?: string;
  final_status?: string;
  shipment_status?: string;
  order_value?: number;
  estimated_loss?: number;
}

export interface GroupMetric {
  label: string;
  total: number;
  rto: number;
  ndr: number;
  loss: number;
  rate: number;
}

function isRto(row: GroupableAuditRow) {
  return /rto|return to origin/i.test(`${row.final_status || ""} ${row.shipment_status || ""}`);
}

function isNdr(row: GroupableAuditRow) {
  return /ndr|undelivered|failed|exception/i.test(`${row.ndr_reason || ""} ${row.shipment_status || ""}`);
}

export function groupAuditRows(rows: GroupableAuditRow[], selector: (row: GroupableAuditRow) => string | undefined, limit = 5): GroupMetric[] {
  const groups = new Map<string, GroupMetric>();
  for (const row of rows) {
    const key = selector(row)?.trim();
    if (!key) continue;
    const current = groups.get(key) || { label: key, total: 0, rto: 0, ndr: 0, loss: 0, rate: 0 };
    current.total += 1;
    current.rto += isRto(row) ? 1 : 0;
    current.ndr += isNdr(row) ? 1 : 0;
    current.loss += isRto(row) ? row.estimated_loss || 0 : 0;
    current.rate = current.total ? current.rto / current.total : 0;
    groups.set(key, current);
  }
  return [...groups.values()].sort((a, b) => b.loss - a.loss || b.rto - a.rto || b.rate - a.rate).slice(0, limit);
}

export function groupByPincode(rows: GroupableAuditRow[], limit = 5) {
  return groupAuditRows(rows, (row) => row.pincode, limit);
}

export function groupByCourier(rows: GroupableAuditRow[], limit = 5) {
  return groupAuditRows(rows, (row) => row.courier, limit);
}

export function groupBySku(rows: GroupableAuditRow[], limit = 5) {
  return groupAuditRows(rows, (row) => row.sku || row.product_name, limit);
}

export function groupByNdrReason(rows: GroupableAuditRow[], limit = 6) {
  return groupAuditRows(rows, (row) => row.ndr_reason, limit);
}
