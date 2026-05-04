import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { importOrdersFromCsv } from "@/lib/csvImport";
import { defaultBrand } from "@/data/seed";

describe("Large pilot sample data", () => {
  it("contains a commercially credible order mix", () => {
    const csv = readFileSync("sample-data/rto-pilot-sample-large.csv", "utf8");
    const summary = importOrdersFromCsv({ csv, brandId: defaultBrand.id, settings: defaultBrand });
    const codOrders = summary.orders.filter((order) => order.paymentMode === "COD");
    const rtoOrders = summary.orders.filter((order) => /rto/i.test(order.finalStatus || ""));

    expect(summary.successCount).toBeGreaterThanOrEqual(500);
    expect(codOrders.length / summary.successCount).toBeGreaterThanOrEqual(0.6);
    expect(codOrders.length / summary.successCount).toBeLessThanOrEqual(0.75);
    expect(rtoOrders.length / summary.successCount).toBeGreaterThanOrEqual(0.18);
    expect(rtoOrders.length / summary.successCount).toBeLessThanOrEqual(0.28);
  });
});
