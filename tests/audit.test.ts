import { describe, expect, it } from "vitest";
import { generateAuditRecommendations, generateSummaryAudit, parseAnonymizedAuditCsv, generateCsvAudit } from "@/lib/audit";
import { defaultCalculatorInputs } from "@/lib/calculator";
import {
  ANONYMIZED_AUDIT_REQUIRED_FIELDS,
  AUDIT_MODE_REGISTRY,
  PAID_AUDIT_DELIVERABLES,
  PAID_AUDIT_NOT_INCLUDED,
  PAID_AUDIT_OFFER,
  PAID_AUDIT_PROCESS,
  PAID_AUDIT_SAMPLE_OUTLINE,
  SAVED_AUDIT_LOCAL_ONLY_LABEL,
  buildSavedAuditSessionCard,
  buildSavedAuditSessionExport,
  buildPaidAuditOfferCopy,
  detectDisallowedAuditFields
} from "@/features/audit";
import { buildAuditExecutiveSummary } from "@/features/reports";

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

  it("keeps audit modes and anonymized CSV fields precise", () => {
    expect(AUDIT_MODE_REGISTRY.map((mode) => mode.id)).toEqual(["summary", "csv", "pilot"]);
    expect(ANONYMIZED_AUDIT_REQUIRED_FIELDS).toEqual([
      "order_id",
      "pincode",
      "payment_mode",
      "order_value",
      "courier",
      "shipment_status",
      "ndr_reason",
      "final_status"
    ]);

    const empty = parseAnonymizedAuditCsv("");
    expect(empty.missingFields).toEqual([...ANONYMIZED_AUDIT_REQUIRED_FIELDS]);
  });

  it("flags disallowed PII columns in anonymized audit uploads", () => {
    const csv = `order_id,pincode,payment_mode,order_value,courier,shipment_status,ndr_reason,final_status,customer_phone,email,full_address
O-1,395007,COD,1999,Xpressbees,RTO,customer_refused,RTO,9999999999,buyer@example.com,"12 Buyer Street"`;
    const parsed = parseAnonymizedAuditCsv(csv, 425);

    expect(parsed.rows).toHaveLength(1);
    expect(parsed.disallowedFields).toEqual(["customer_phone", "email", "full_address"]);
    expect(parsed.schemaValidation.canGenerateAudit).toBe(false);
    expect(parsed.schemaValidation.cleanupInstructions.join(" ")).toContain("Remove phone");
    expect(detectDisallowedAuditFields(["order_id", "whatsapp_number", "buyer_name"])).toEqual(["whatsapp_number", "buyer_name"]);
  });

  it("defines the profit audit artifact without live integration claims", () => {
    expect(PAID_AUDIT_OFFER.priceInr).toBe(999);
    expect(PAID_AUDIT_OFFER.paymentIntegration).toBe(false);
    expect(PAID_AUDIT_DELIVERABLES.length).toBeGreaterThanOrEqual(5);
    expect(PAID_AUDIT_PROCESS.length).toBeGreaterThanOrEqual(4);
    expect(PAID_AUDIT_SAMPLE_OUTLINE.join(" ")).toContain("PII boundary");

    const copy = buildPaidAuditOfferCopy();
    expect(copy).toContain("₹999 COD/RTO/NDR Profit Audit");
    expect(copy).toContain("anonymized order/shipment/NDR CSV");
    expect(copy).toContain("No checkout or payment integration");
    expect(copy).toContain("No real WhatsApp sending");
    expect(copy).toContain("No courier API push");
    expect(PAID_AUDIT_NOT_INCLUDED.join(" ")).toContain("No guaranteed savings claim");

    const lowerCopy = copy.toLowerCase();
    for (const forbidden of ["inventory", "settlement", "marketplace health", "cashflow", "chatbot", "machine learning", "guaranteed roi"]) {
      expect(lowerCopy).not.toContain(forbidden);
    }
  });

  it("starts CSV audit output with one top leak, confidence, and ranked actions", () => {
    const csv = `order_id,pincode,payment_mode,order_value,courier,shipment_status,ndr_reason,final_status,sku
O-1,395007,COD,1999,Xpressbees,RTO,customer_refused,RTO,DRESS-RED-S
O-2,395007,COD,1599,Xpressbees,RTO,customer_refused,RTO,DRESS-RED-M
O-3,560095,COD,1299,Delhivery,Delivered,none,Delivered,KURTI-BLU-M
O-4,560095,Prepaid,899,Delhivery,Delivered,none,Delivered,KURTI-BLU-S`;
    const parsed = parseAnonymizedAuditCsv(csv, 500);
    const audit = generateCsvAudit({ brandName: "Demo", category: "Fashion", csvFileName: "audit.csv", rows: parsed.rows, rtoLossPerOrder: 500 });
    const summary = buildAuditExecutiveSummary(audit);

    expect(summary.topLeak.driverType).toBe("Pincode");
    expect(summary.topLeak.label).toBe("395007");
    expect(summary.firstAction.rank).toBe(1);
    expect(summary.rankedActions[0].priorityLabel).toBe("First");
    expect(summary.confidence.label).toBe("Low");
    expect(summary.limitations.join(" ")).toContain("Weak data caveat");
  });

  it("uses consistent limitation messages for missing audit driver fields", () => {
    const csv = `order_id,pincode,payment_mode,order_value,courier,shipment_status,ndr_reason,final_status,sku
O-1,395007,COD,1999,Xpressbees,RTO,customer_refused,RTO,DRESS-RED-S
O-2,560095,COD,1299,Delhivery,Delivered,none,Delivered,KURTI-BLU-M`;
    const parsed = parseAnonymizedAuditCsv(csv, 500);
    const audit = generateCsvAudit({
      brandName: "Limited Demo",
      category: "Fashion",
      csvFileName: "audit.csv",
      rows: parsed.rows,
      missingFields: ["pincode", "courier", "ndr_reason"],
      rtoLossPerOrder: 500
    });
    const summary = buildAuditExecutiveSummary(audit);
    const limitationCopy = summary.limitations.join(" ");

    expect(limitationCopy).toContain("Missing pincode blocks geography leakage ranking.");
    expect(limitationCopy).toContain("Missing courier blocks courier-lane leakage ranking.");
    expect(limitationCopy).toContain("Missing ndr_reason blocks NDR reason leakage ranking.");
    expect(limitationCopy).toContain("not guaranteed or verified recovered money");
  });

  it("keeps the summary leakage check decisive but caveated", () => {
    const audit = generateSummaryAudit({
      ...defaultCalculatorInputs,
      brandName: "Summary Demo",
      contact: "",
      category: "Fashion",
      monthlyOrders: 900,
      codPercentage: 72,
      overallRtoPercentage: 24,
      codRtoPercentage: 30,
      shippingPlatform: "Shiprocket",
      knownRtoReasons: ["customer_unavailable"],
      problemPincodes: [],
      problemCouriers: []
    });
    const summary = buildAuditExecutiveSummary(audit);

    expect(summary.topLeak.driverType).toBe("COD RTO");
    expect(summary.firstAction.action).toContain("COD confirmation");
    expect(summary.confidence.label).toBe("Low");
    expect(summary.limitations.join(" ")).toContain("summary leakage check inputs only");
  });

  it("formats saved audit sessions with local-only next actions", () => {
    const rows = Array.from({ length: 320 }, (_, index) => {
      const rto = index < 180;
      return [
        `O-${index + 1}`,
        "395007",
        "COD",
        "1499",
        "Xpressbees",
        rto ? "RTO" : "Delivered",
        rto ? "customer_refused" : "none",
        rto ? "RTO" : "Delivered"
      ].join(",");
    });
    const parsed = parseAnonymizedAuditCsv(`order_id,pincode,payment_mode,order_value,courier,shipment_status,ndr_reason,final_status\n${rows.join("\n")}`, 500);
    const audit = {
      ...generateCsvAudit({ brandName: "Saved Seller", category: "Fashion", csvFileName: "audit.csv", rows: parsed.rows, rtoLossPerOrder: 500 }),
      id: "audit-saved-demo",
      created_at: "2026-05-12T10:00:00.000Z"
    };

    const card = buildSavedAuditSessionCard(audit);
    expect(card.title).toBe("Saved Seller");
    expect(card.modeLabel).toBe("Anonymized CSV profit audit");
    expect(card.qualificationLabel).toBe("Rescue pilot candidate");
    expect(card.nextAction).toContain("rescue pilot planner");
    expect(card.leakageLabel).toContain("estimated leakage");
    expect(SAVED_AUDIT_LOCAL_ONLY_LABEL).toContain("browser only");

    const auditExport = buildSavedAuditSessionExport(audit);
    expect(auditExport.fileName).toBe("saved-seller-profit-audit-session.json");
    const parsedExport = JSON.parse(auditExport.json);
    expect(parsedExport.localOnly).toBe(true);
    expect(parsedExport.privacyNote).toContain("Nothing is synced");
    expect(parsedExport.session.id).toBe("audit-saved-demo");
  });
});
