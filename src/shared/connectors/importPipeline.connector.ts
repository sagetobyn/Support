import type { BrandSettings, NdrCase, Order } from "@/types/domain";
import { importStarterCsv } from "@/features/imports";
import { upsertOrders } from "@/features/orders";
import { detectNdrCases } from "@/features/ndr";
import { currentProPlan } from "@/features/plans";

export function runImportPipeline(params: {
  csv: string;
  brandId: string;
  settings: BrandSettings;
  existingOrders: Order[];
  existingNdrCases: NdrCase[];
  importId: string;
}) {
  const summary = importStarterCsv({ ...params, maxRows: currentProPlan.limits.max_import_rows_per_file });
  const orders = upsertOrders(params.existingOrders, summary.orders);
  const ndrCases = detectNdrCases(orders, params.existingNdrCases);
  return { summary, orders, ndrCases };
}

