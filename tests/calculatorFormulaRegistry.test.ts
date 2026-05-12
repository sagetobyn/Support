import { describe, expect, it } from "vitest";
import { defaultBrand } from "@/data/seed";
import { generateCsvAudit, generateSummaryAudit, parseAnonymizedAuditCsv } from "@/lib/audit";
import { calculateCalculatorOutputs, defaultCalculatorInputs } from "@/lib/calculator";
import { estimatedRtoLossPerOrder } from "@/lib/roi";
import {
  CALCULATOR_FORMULA_REGISTRY,
  calculateRtoLossPerOrder,
  calculateSavingsPlan,
  calculatorFormulaList
} from "@/features/calculator";

describe("calculator formula registry", () => {
  it("keeps public calculator and ROI loss assumptions aligned", () => {
    expect(calculateCalculatorOutputs(defaultCalculatorInputs).rtoLossPerOrder).toBe(calculateRtoLossPerOrder(defaultCalculatorInputs));
    expect(estimatedRtoLossPerOrder(defaultBrand)).toBe(calculateRtoLossPerOrder(defaultBrand));
  });

  it("exposes seller-readable formula labels", () => {
    expect(calculatorFormulaList.map((formula) => formula.label)).toContain("Loss per returned order");
    expect(CALCULATOR_FORMULA_REGISTRY.monthlyRtoLeakage.formula).toContain("Estimated RTO orders");
  });

  it("uses the same reduction math for summary audits and CSV reports", () => {
    const summary = generateSummaryAudit({
      brandName: "Demo",
      category: "Fashion",
      monthlyOrders: 100,
      codPercentage: 70,
      overallRtoPercentage: 20,
      codRtoPercentage: 25,
      averageOrderValue: 1000,
      forwardShippingCost: 70,
      returnShippingCost: 75,
      packagingCost: 25,
      estimatedCac: 180,
      codFee: 25,
      supportOpsCost: 20,
      shippingPlatform: "Shiprocket",
      pilotSoftwareCost: 4999
    });
    const lossPerOrder = summary.calculated_metrics.rtoLossPerOrder;
    const csv = `order_id,pincode,payment_mode,order_value,courier,shipment_status,ndr_reason,final_status,sku
O-1,395007,COD,1999,Xpressbees,RTO,customer_refused,RTO,DRESS-RED-S
O-2,560095,Prepaid,1299,Delhivery,Delivered,none,Delivered,KURTI-BLU-M`;
    const parsed = parseAnonymizedAuditCsv(csv, lossPerOrder);
    const report = generateCsvAudit({ brandName: "Demo", category: "Fashion", csvFileName: "audit.csv", rows: parsed.rows, rtoLossPerOrder: lossPerOrder });
    const expectedCsvSavings = calculateSavingsPlan(report.calculated_metrics.monthlyLeakage, 20, 4999);

    expect(summary.calculated_metrics.savings20).toBe(summary.calculated_metrics.monthlyLeakage * 0.2);
    expect(report.calculated_metrics.rtoLossPerOrder).toBe(lossPerOrder);
    expect(report.calculated_metrics.savings20).toBe(expectedCsvSavings.saving20);
  });
});
