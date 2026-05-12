import { describe, expect, it } from "vitest";
import { generateCsvAudit, parseAnonymizedAuditCsv } from "@/lib/audit";
import { buildAuditPreSalesProofSnippet, buildCalculatorPreSalesProofSnippet } from "@/features/leads";

describe("pre-sales proof snippet", () => {
  it("builds a calculator snippet with estimate labels and assumptions", () => {
    const snippet = buildCalculatorPreSalesProofSnippet({
      brandName: "Demo D2C",
      monthlyOrders: 1200,
      codPercentage: 68,
      rtoPercentage: 21,
      monthlyLeakage: 98000,
      rtoLossPerOrder: 420,
      formulaBasis: "Forward shipping + return shipping + packaging + estimated CAC + COD fee + support ops cost",
      nextStep: "Start with a privacy-safe profit audit."
    });

    expect(snippet).toContain("Demo D2C - COD/RTO/NDR leakage follow-up");
    expect(snippet).toContain("Label: estimate only");
    expect(snippet).toContain("Assumptions:");
    expect(snippet).toContain("Recommended next step:");
    expect(snippet).toContain("Privacy:");
    expect(snippet).toContain("not verified savings");
  });

  it("keeps audit snippets free of row-level identifiers", () => {
    const csv = `order_id,pincode,payment_mode,order_value,courier,shipment_status,ndr_reason,final_status
O-SECRET-1,395007,COD,1999,Xpressbees,RTO,customer_refused,RTO
O-SECRET-2,560095,Prepaid,1299,Delhivery,Delivered,none,Delivered`;
    const parsed = parseAnonymizedAuditCsv(csv, 425);
    const audit = generateCsvAudit({ brandName: "Audit Seller", category: "Fashion", csvFileName: "audit.csv", rows: parsed.rows, rtoLossPerOrder: 425 });
    const snippet = buildAuditPreSalesProofSnippet({
      session: audit,
      topLeak: "Pincode: 395007",
      firstAction: "Rank pincode-courier pairs before any rescue pilot."
    });

    expect(snippet).toContain("Profit audit:");
    expect(snippet).toContain("Anonymized CSV profit audit");
    expect(snippet).toContain("First action to discuss:");
    expect(snippet).not.toContain("O-SECRET");
    expect(snippet).not.toContain("buyer@example.com");
    expect(snippet).not.toContain("9999999999");
  });
});
