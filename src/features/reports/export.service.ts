import type { ActionItem, AuditLog, ImportRecord, Message, MonthlyStrategyReport, Order, PolicyRecommendation, SavingsEvent, Store, WeeklyReport } from "@/types/domain";
import { publishEvent } from "@/shared/events";

export interface ReportPackageInput {
  stores: Store[];
  imports: ImportRecord[];
  orders: Order[];
  actions: ActionItem[];
  messages: Message[];
  savingsEvents: SavingsEvent[];
  policyRecommendations: PolicyRecommendation[];
  weeklyReports: WeeklyReport[];
  monthlyStrategyReports: MonthlyStrategyReport[];
  audits: AuditLog[];
}

export function exportReportsPackage(input: ReportPackageInput) {
  const createdAt = new Date().toISOString();
  const data = { createdAt, storage_version: "pro_v1", ...input };
  publishEvent({ type: "export.created", sourceFeature: "reports", entityType: "export", entityId: `export-${Date.now()}`, payload: { sections: Object.keys(input) } });
  return JSON.stringify(data, null, 2);
}

export function exportRowsCsv<T extends Record<string, unknown>>(rows: T[]) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => quote(row[header])).join(","))].join("\n");
}
