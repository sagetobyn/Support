import { describe, expect, it } from "vitest";
import {
  buildSampleReportForwardableText,
  sampleReportAssumptions,
  sampleReportCtaLadder,
  sampleReportDecision,
  sampleReportFictionalNotice,
  sampleReportPaidArtifactIncludes,
  sampleReportPrintSummary,
  sampleReportProofNotes,
  sampleReportRankedActions,
  sampleReportTopLeaks
} from "@/features/reports";

describe("sample profit audit artifact", () => {
  it("starts with a founder decision and a concrete first action", () => {
    expect(sampleReportDecision.headline).toMatch(/^Decision:/);
    expect(sampleReportTopLeaks[0].title).toContain("COD RTO");
    expect(sampleReportTopLeaks[0].firstAction).toContain("manual COD confirmation");
    expect(sampleReportRankedActions[0].title).toBe("Validate the COD gap");
  });

  it("keeps fictional data and proof boundaries visible", () => {
    const copy = [
      sampleReportFictionalNotice,
      sampleReportDecision.summary,
      sampleReportDecision.nextStep,
      ...sampleReportProofNotes,
      ...sampleReportPaidArtifactIncludes
    ].join(" ");

    expect(copy).toContain("Fictional demo data");
    expect(copy).toContain("not a real customer result");
    expect(copy).toContain("not verified savings");
    expect(copy).toContain("No live WhatsApp sending");
    expect(copy).toContain("courier API push");
    expect(copy).toContain("No customer-level data");
  });

  it("keeps assumptions inspectable and INR-formatted", () => {
    expect(sampleReportAssumptions.map((assumption) => assumption.label)).toEqual([
      "Average order value",
      "Forward shipping",
      "Return shipping",
      "Packaging",
      "Estimated CAC",
      "COD fee"
    ]);
    expect(sampleReportAssumptions.every((assumption) => assumption.value.startsWith("₹"))).toBe(true);
  });

  it("keeps the print summary one-page focused with the fictional label intact", () => {
    expect(sampleReportPrintSummary.title).toBe("One-page founder print summary");
    expect(sampleReportPrintSummary.decision).toMatch(/^Decision:/);
    expect(sampleReportPrintSummary.topLeak.title).toContain("COD RTO");
    expect(sampleReportPrintSummary.nextActions).toHaveLength(3);
    expect(sampleReportPrintSummary.assumptions).toHaveLength(6);
    expect(sampleReportPrintSummary.boundary).toContain("Fictional demo data");
    expect(sampleReportPrintSummary.footerNote).toContain("summary numbers first");
    expect(sampleReportPrintSummary.footerNote).toContain("anonymized CSV");
  });

  it("keeps the forwardable summary narrow to COD/RTO/NDR profit recovery", () => {
    const forwardableText = buildSampleReportForwardableText();
    const allCopy = [
      forwardableText,
      ...sampleReportProofNotes,
      ...sampleReportPaidArtifactIncludes,
      ...sampleReportTopLeaks.map((leak) => `${leak.title} ${leak.evidence} ${leak.firstAction} ${leak.proofNote}`)
    ].join(" ").toLowerCase();

    expect(forwardableText).toContain("Decision:");
    expect(forwardableText).toContain("Top leak:");
    expect(forwardableText).toContain("First action:");

    for (const forbidden of ["inventory", "settlement", "marketplace health", "cashflow", "chatbot", "machine learning"]) {
      expect(allCopy).not.toContain(forbidden);
    }
  });

  it("routes sample report CTAs to audit and pilot before any protected dashboard path", () => {
    expect(sampleReportCtaLadder.map((cta) => cta.href)).toEqual(["/audit", "/pilot", "/calculator"]);
    expect(sampleReportCtaLadder[0].label).toContain("privacy-safe profit audit");
    expect(sampleReportCtaLadder[0].note).toContain("summary numbers");
    expect(sampleReportCtaLadder[1].note).toContain("repeatable COD/RTO/NDR action queue");
    expect(sampleReportCtaLadder.some((cta) => cta.href === "/dashboard")).toBe(false);
  });
});
