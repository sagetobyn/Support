import type { BrandSettings, NdrCase, Order } from "@/types/domain";
import { importStarterCsv } from "@/features/imports";
import { upsertOrders } from "@/features/orders";
import { detectNdrCases } from "@/features/ndr";

export function runImportPipeline(params: {
  csv: string;
  brandId: string;
  settings: BrandSettings;
  existingOrders: Order[];
  existingNdrCases: NdrCase[];
  importId: string;
}) {
  const summary = importStarterCsv(params);
  const orders = upsertOrders(params.existingOrders, summary.orders);
  const ndrCases = detectNdrCases(orders, params.existingNdrCases);
  return { summary, orders, ndrCases };
}

