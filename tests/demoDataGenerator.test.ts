import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { demoProfiles, generateDemoOrders, generateDemoWorkspace, ordersToCsv } from "@/features/demo";
import { importOrdersFromCsv } from "@/lib/csvImport";
import { defaultBrand } from "@/data/seed";

describe("Demo data generator", () => {
  it("generates the requested number of realistic D2C orders", () => {
    const orders = generateDemoOrders({ profileId: "fashion", orderCount: 1200, seed: 42 });
    const codOrders = orders.filter((order) => order.paymentMode === "COD");
    const prepaidOrders = orders.filter((order) => order.paymentMode === "Prepaid");
    const rtoOrders = orders.filter((order) => /rto/i.test(order.finalStatus || ""));
    const ndrOrders = orders.filter((order) => /ndr|undelivered/i.test(`${order.finalStatus} ${order.shipmentStatus}`));

    expect(orders).toHaveLength(1200);
    expect(codOrders.length).toBeGreaterThan(500);
    expect(prepaidOrders.length).toBeGreaterThan(200);
    expect(rtoOrders.length).toBeGreaterThan(120);
    expect(ndrOrders.length).toBeGreaterThan(80);
    expect(new Set(orders.map((order) => order.pincode)).size).toBeGreaterThanOrEqual(8);
    expect(new Set(orders.map((order) => order.courier)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(orders.map((order) => order.sku)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(orders.map((order) => order.campaignName)).size).toBeGreaterThanOrEqual(3);
  });

  it("builds a complete Pro demo workspace and CSV export", () => {
    const workspace = generateDemoWorkspace({ profileId: "gadget", orderCount: 1000, seed: 77 });
    const csv = ordersToCsv(workspace.orders);
    const imported = importOrdersFromCsv({ csv, brandId: workspace.brand.id, settings: workspace.brand });

    expect(workspace.profile).toBe(demoProfiles.gadget);
    expect(workspace.brand.name).toContain("Gadget");
    expect(workspace.orders).toHaveLength(1000);
    expect(workspace.ndrCases.length).toBeGreaterThan(80);
    expect(workspace.savingsEvents.length).toBeGreaterThan(20);
    expect(imported.successCount).toBe(1000);
    expect(imported.dataQualityScore).toBeGreaterThan(85);
  });

  it("ships requested local sample CSV datasets", () => {
    const fashion = readFileSync("sample-data/demo-fashion-pro.csv", "utf8");
    const footwear = readFileSync("sample-data/demo-footwear-growth.csv", "utf8");
    const beauty = readFileSync("sample-data/demo-beauty-starter.csv", "utf8");
    const imported = importOrdersFromCsv({ csv: fashion, brandId: defaultBrand.id, settings: defaultBrand });

    expect(fashion.split(/\r?\n/)).toHaveLength(1401);
    expect(footwear.split(/\r?\n/)).toHaveLength(901);
    expect(beauty.split(/\r?\n/)).toHaveLength(651);
    expect(imported.successCount).toBeGreaterThanOrEqual(1000);
    expect(imported.orders[0].campaignName).toBeTruthy();
    expect(imported.orders[0].sku).toBeTruthy();
    expect(imported.orders[0].courier).toBeTruthy();
  });
});
