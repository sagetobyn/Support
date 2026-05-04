import type { BrandSettings, Order } from "@/types/domain";
import { analyzeCsvImport, importOrdersFromCsv } from "@/lib/csvImport";
import { currentStarterPlan } from "@/features/plans";
import { publishEvent } from "@/shared/events";

export { analyzeCsvImport };

export function importStarterCsv(params: {
  csv: string;
  brandId: string;
  settings: BrandSettings;
  existingOrders?: Order[];
  importId?: string;
}) {
  const rows = analyzeCsvImport(params.csv).rows;
  const limitedRows = rows.length > currentStarterPlan.limits.max_import_rows_per_file;
  const csv = limitedRows ? rebuildCsvFromRows(rows.slice(0, currentStarterPlan.limits.max_import_rows_per_file)) : params.csv;
  const summary = importOrdersFromCsv({ ...params, csv });
  publishEvent({
    type: "csv.imported",
    sourceFeature: "imports",
    entityType: "import",
    entityId: params.importId,
    payload: {
      rowCount: summary.rowCount,
      successCount: summary.successCount,
      errorCount: summary.errorCount,
      limitedRows
    }
  });
  return {
    ...summary,
    limitedRows,
    limitWarning: limitedRows
      ? "Starter supports up to 1000 rows per import and 500 orders/month. Upgrade for larger volume."
      : ""
  };
}

function rebuildCsvFromRows(rows: Array<Record<string, string>>) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const quote = (value: string) => `"${String(value || "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => quote(row[header])).join(","))].join("\n");
}
