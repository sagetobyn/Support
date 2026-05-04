import { describe, expect, it } from "vitest";
import { generateAuditRecommendations, parseAnonymizedAuditCsv, generateCsvAudit } from "@/lib/audit";

describe("AuditService recommendations", () => {
  it("recommends COD confirmation for high COD and high RTO", () => {
    const recommendations = generateAuditRecommendations({ codPercentage: 72, rtoPercentage: 24 });
    expect(recommendations.map((item) => item.action).join(" ")).toContain("COD confirmation");
  });

  it("recommends address correction for wrong address reasons", () => {
    const recommendations = generateAuditRecommendations({ codPercentage: 40, rtoPercentage: 12, knownRtoReasons: ["wrong_address"] });
    expect(recommendations.map((item) => item.action).join(" ")).toContain("landmark");
  });

  it("recommends NDR rescue or reattempt for customer unavailable", () => {
    const recommendations = generateAuditRecommendations({ codPercentage: 40, rtoPercentage: 12, knownRtoReasons: ["customer_unavailable"] });
    expect(recommendations.map((item) => item.action).join(" ")).toContain("reattempt");
  });

  it("recommends courier review for known courier problems", () => {
    const recommendations = generateAuditRecommendations({ codPercentage: 40, rtoPercentage: 12, problemCouriers: ["Xpressbees"] });
    expect(recommendations.map((item) => item.title).join(" ")).toContain("courier");
  });

  it("recommends pincode policy for problem pincodes", () => {
    const recommendations = generateAuditRecommendations({ codPercentage: 40, rtoPercentage: 12, problemPincodes: ["395007"] });
    expect(recommendations.map((item) => item.action).join(" ")).toContain("pincodes");
  });

  it("parses anonymized CSV without customer data", () => {
    const csv = `order_id,pincode,payment_mode,order_value,courier,shipment_status,ndr_reason,final_status,sku
O-1,395007,COD,1999,Xpressbees,RTO,customer_refused,RTO,DRESS-RED-S
O-2,560095,Prepaid,1299,Delhivery,Delivered,none,Delivered,KURTI-BLU-M`;
    const parsed = parseAnonymizedAuditCsv(csv, 425);
    const audit = generateCsvAudit({ brandName: "Demo", category: "Fashion", csvFileName: "audit.csv", rows: parsed.rows, rtoLossPerOrder: 425 });

    expect(parsed.rows).toHaveLength(2);
    expect(parsed.invalidRows).toHaveLength(0);
    expect(audit.calculated_metrics.monthlyLeakage).toBe(425);
    expect(audit.calculated_metrics.codRtoPercentage).toBe(100);
  });
});
