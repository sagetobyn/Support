import { describe, expect, it } from "vitest";
import { generateCsvAudit, generateSummaryAudit, parseAnonymizedAuditCsv } from "@/lib/audit";
import { calculatePilotOutcome, calculatePilotProgress, createPilotFromAudit, generatePilotFinalReview, updatePilotDay } from "@/lib/pilot";
import { buildPilotExecutionTracker } from "@/features/pilot-execution";
import { buildAuditToPilotHandoff, buildPilotFinalReviewTemplate, buildPilotHandoffPack } from "@/features/pilot-handoff";
import { buildPilotGoNoGo, buildPilotGoNoGoFromPlan, buildPilotReadiness, evaluatePilotOwnerDiscipline } from "@/features/pilot-readiness";
import { buildPilotDailyLogRows, buildPilotWorkflowCalendar } from "@/features/pilot-workflow";

const validOwnerDiscipline = {
  ownerRole: "Ops lead",
  ownerName: "Asha",
  morningWindow: "10:00-11:00",
  afternoonWindow: "15:00-16:00",
  eveningWindow: "18:00-19:00",
  escalationChannel: "Founder escalation group"
};

describe("PilotService outcome scoring", () => {
  it("scores savings >= 3x fee as strong_success", () => {
    expect(calculatePilotOutcome(15000, 4999)).toBe("strong_success");
  });

  it("scores savings >= fee as promising", () => {
    expect(calculatePilotOutcome(6000, 4999)).toBe("promising");
  });

  it("scores savings > 0 but below fee as inconclusive", () => {
    expect(calculatePilotOutcome(1000, 4999)).toBe("inconclusive");
  });

  it("scores savings <= 0 as not_viable", () => {
    expect(calculatePilotOutcome(0, 4999)).toBe("not_viable");
  });

  it("updates daily metrics and generates final review", () => {
    const plan = updatePilotDay(createPilotFromAudit(undefined, 4999), 1, { estimatedSavings: 6000, ndrsContacted: 5, ndrsRescued: 2 });
    const review = generatePilotFinalReview(plan);
    expect(review.outcomeStatus).toBe("promising");
    expect(review.estimatedSavings).toBe(6000);
  });

  it("blocks CEO pilot readiness until required proof exists", () => {
    const readiness = buildPilotReadiness({
      ordersCount: 1200,
      importsCount: 1,
      ndrCount: 36,
      messagesCount: 0,
      savingsEventsCount: 0,
      completedActionCount: 0,
      verifiedSavingsCount: 0,
      dataTrustStatus: "ready",
      exportCount: 0,
      ownerDiscipline: validOwnerDiscipline
    });

    expect(readiness.status).toBe("not_ready");
    expect(readiness.requiredMissingCount).toBe(2);
    expect(readiness.nextStep?.id).toBe("daily-action");
  });

  it("marks a workspace almost ready when only proof hardening remains", () => {
    const readiness = buildPilotReadiness({
      ordersCount: 1200,
      importsCount: 1,
      ndrCount: 36,
      messagesCount: 1,
      savingsEventsCount: 2,
      completedActionCount: 1,
      verifiedSavingsCount: 0,
      dataTrustStatus: "limited",
      exportCount: 0,
      ownerDiscipline: validOwnerDiscipline
    });

    expect(readiness.status).toBe("almost_ready");
    expect(readiness.requiredMissingCount).toBe(0);
    expect(readiness.nextStep?.id).toBe("verified-proof");
  });

  it("stops the pilot pitch when hard gates fail", () => {
    const gate = buildPilotGoNoGo({
      dataTrustStatus: "blocked",
      monthlyOrders: 220,
      monthlyLeakage: 6000,
      pilotFee: 4999,
      opsOwnerAssigned: false,
      completedActionCount: 0,
      estimatedSavings: 0,
      ndrCount: 0
    });

    expect(gate.recommendation).toBe("stop");
    expect(gate.headline).toContain("do not pitch");
    expect(gate.failedGateCount).toBe(4);
    expect(gate.gates.filter((item) => item.status === "fail").map((item) => item.id)).toEqual([
      "data-trust",
      "leakage-size",
      "ops-owner",
      "action-proof"
    ]);
  });

  it("narrows the pilot when only action proof is missing", () => {
    const gate = buildPilotGoNoGo({
      dataTrustStatus: "limited",
      monthlyOrders: 1200,
      monthlyLeakage: 24000,
      pilotFee: 4999,
      opsOwnerAssigned: true,
      completedActionCount: 0,
      estimatedSavings: 0,
      ndrCount: 12
    });

    expect(gate.recommendation).toBe("narrow");
    expect(gate.failedGateCount).toBe(1);
    expect(gate.gates.find((item) => item.id === "action-proof")?.nextAction).toContain("one narrow COD/NDR proof loop");
  });

  it("continues only when data trust, leakage, owner, and action proof pass", () => {
    let plan = createPilotFromAudit(undefined, 4999);
    plan = {
      ...plan,
      ownerDiscipline: validOwnerDiscipline,
      checklist: plan.checklist.map((item) => ({ ...item, complete: true }))
    };
    plan = updatePilotDay(plan, 1, {
      ordersChecked: 120,
      riskyCodFound: 18,
      codConfirmationsQueued: 10,
      ndrCasesFound: 6,
      ndrsContacted: 6,
      ndrsRescued: 2,
      estimatedSavings: 7000
    });
    const progress = calculatePilotProgress(plan);
    const review = generatePilotFinalReview(plan);
    const gate = buildPilotGoNoGoFromPlan(plan, progress, review);

    expect(gate.recommendation).toBe("continue");
    expect(gate.passedGateCount).toBe(4);
    expect(gate.gates.every((item) => item.status === "pass")).toBe(true);
  });

  it("blocks pilot readiness until owner role, cadence, and escalation label exist", () => {
    const readiness = buildPilotReadiness({
      ordersCount: 1200,
      importsCount: 1,
      ndrCount: 36,
      messagesCount: 1,
      savingsEventsCount: 2,
      completedActionCount: 1,
      verifiedSavingsCount: 1,
      dataTrustStatus: "ready",
      exportCount: 1,
      ownerDiscipline: { ...validOwnerDiscipline, eveningWindow: "" }
    });

    expect(readiness.status).toBe("not_ready");
    expect(readiness.nextStep?.id).toBe("owner-discipline");
    expect(readiness.checks.find((check) => check.id === "owner-discipline")?.metric).toContain("evening NDR window");
  });

  it("rejects direct contact details in the escalation channel placeholder", () => {
    const owner = evaluatePilotOwnerDiscipline({
      ...validOwnerDiscipline,
      escalationChannel: "Call 9876543210"
    });

    expect(owner.ready).toBe(false);
    expect(owner.privacyWarning).toContain("not a phone number or email");
  });

  it("creates a CEO handoff pack only when operating proof is strong enough", () => {
    const pack = buildPilotHandoffPack({
      brandName: "Demo D2C Brand",
      readinessStatus: "almost_ready",
      dataTrustStatus: "limited",
      orderCount: 1200,
      ndrCount: 40,
      completedActionCount: 2,
      estimatedSavings: 15000,
      verifiedSavings: 0,
      pilotFee: 4999
    });

    expect(pack.status).toBe("ready_to_pitch");
    expect(pack.successCriteria.filter((criterion) => criterion.met)).toHaveLength(4);
    expect(pack.renewalDecision).toContain("Continue one more cycle");
  });

  it("blocks the handoff pack when data trust is not good enough", () => {
    const pack = buildPilotHandoffPack({
      brandName: "Demo D2C Brand",
      readinessStatus: "not_ready",
      dataTrustStatus: "blocked",
      orderCount: 1200,
      ndrCount: 40,
      completedActionCount: 2,
      estimatedSavings: 15000,
      verifiedSavings: 0,
      pilotFee: 4999
    });

    expect(pack.status).toBe("needs_data_first");
    expect(pack.ceoInstruction).toContain("Do not pitch");
    expect(pack.risks[0]).toContain("Data is not reliable");
  });

  it("recommends monthly expansion when verified proof is strong", () => {
    const pack = buildPilotHandoffPack({
      brandName: "Demo D2C Brand",
      readinessStatus: "ready",
      dataTrustStatus: "ready",
      orderCount: 1800,
      ndrCount: 65,
      completedActionCount: 12,
      estimatedSavings: 25000,
      verifiedSavings: 9000,
      pilotFee: 4999
    });

    expect(pack.status).toBe("ready_to_pitch");
    expect(pack.renewalDecision).toContain("monthly recovery plan");
  });

  it("flags missed pilot days and missing proof before mid-pilot review", () => {
    const plan = updatePilotDay(createPilotFromAudit(undefined, 4999), 1, { ordersChecked: 80, riskyCodFound: 12 });
    const tracker = buildPilotExecutionTracker(plan, 6);

    expect(tracker.days[0].status).toBe("work_logged");
    expect(tracker.missedDays).toBe(4);
    expect(tracker.warnings.join(" ")).toContain("No proof day yet");
    expect(tracker.checkpoints.find((checkpoint) => checkpoint.day === 3)?.status).toBe("needs_attention");
  });

  it("marks proof days and passes execution checkpoints when savings exist", () => {
    let plan = createPilotFromAudit(undefined, 4999);
    plan = {
      ...plan,
      checklist: plan.checklist.map((item, index) => ({ ...item, complete: index < 5 }))
    };
    plan = updatePilotDay(plan, 1, { ordersChecked: 120, riskyCodFound: 18 });
    plan = updatePilotDay(plan, 4, { codConfirmationsQueued: 8, ndrCasesFound: 6, ndrsContacted: 6 });
    plan = updatePilotDay(plan, 8, { ndrCasesFound: 10, ndrsContacted: 8, ndrsRescued: 3, estimatedSavings: 7000 });

    const tracker = buildPilotExecutionTracker(plan, 10);

    expect(tracker.proofDays).toBe(1);
    expect(tracker.days[7].status).toBe("proof_captured");
    expect(tracker.checkpoints.find((checkpoint) => checkpoint.day === 3)?.status).toBe("passed");
    expect(tracker.checkpoints.find((checkpoint) => checkpoint.day === 10)?.status).toBe("passed");
  });

  it("builds a 14-day calendar with review gates and stop conditions", () => {
    const calendar = buildPilotWorkflowCalendar(createPilotFromAudit(undefined, 4999), 1);

    expect(calendar.days).toHaveLength(14);
    expect(calendar.reviewGates.map((gate) => gate.day)).toEqual([3, 7, 10, 14]);
    expect(calendar.days.find((day) => day.day === 10)?.savingsLedgerTie).toContain("order outcome and formula");
    expect(calendar.reviewGates.every((gate) => gate.stopCondition.length > 0)).toBe(true);
  });

  it("summarizes daily log action counts, proof note, blocker, and estimated saving", () => {
    let plan = createPilotFromAudit(undefined, 4999);
    plan = updatePilotDay(plan, 4, {
      ordersChecked: 80,
      riskyCodFound: 12,
      codConfirmationsQueued: 7,
      addressesCorrected: 2,
      prepaidOpportunitiesFound: 3,
      ndrCasesFound: 5,
      ndrsContacted: 4,
      ndrsRescued: 1,
      ordersCancelledBeforeShipping: 2,
      estimatedSavings: 3500,
      proofNote: "7 COD confirmations, 2 address fixes, 1 NDR rescued, and 2 pre-ship cancellations tied to savings ledger entries.",
      blocker: ""
    });
    plan = updatePilotDay(plan, 5, {
      ordersChecked: 40,
      riskyCodFound: 8,
      blocker: "Courier export missing NDR reason for the evening batch."
    });

    const rows = buildPilotDailyLogRows(plan);

    expect(rows[3].actionCount).toBe(19);
    expect(rows[3].actionSummary).toContain("7 COD");
    expect(rows[3].actionSummary).toContain("4/1 NDR");
    expect(rows[3].hasSavingsProof).toBe(true);
    expect(rows[3].reviewLabel).toBe("Proof tied");
    expect(rows[3].estimatedSavings).toBe(3500);
    expect(rows[4].reviewLabel).toBe("Blocked");
    expect(rows[4].blocker).toContain("Courier export");
  });

  it("stops the broad pilot at day 7 when no action was executed", () => {
    let plan = createPilotFromAudit(undefined, 4999);
    plan = {
      ...plan,
      checklist: plan.checklist.map((item) => ({ ...item, complete: true }))
    };
    plan = updatePilotDay(plan, 1, { ordersChecked: 100, riskyCodFound: 15 });

    const calendar = buildPilotWorkflowCalendar(plan, 7);
    const gate = calendar.reviewGates.find((item) => item.day === 7);

    expect(gate?.status).toBe("narrow");
    expect(gate?.decision).toContain("one action");
    expect(gate?.stopCondition).toContain("no action was executed");
  });

  it("passes proof gates only when savings-ledger proof exists", () => {
    let plan = createPilotFromAudit(undefined, 4999);
    plan = {
      ...plan,
      checklist: plan.checklist.map((item) => ({ ...item, complete: true }))
    };
    plan = updatePilotDay(plan, 4, { codConfirmationsQueued: 8, addressesCorrected: 2 });
    plan = updatePilotDay(plan, 8, { ndrCasesFound: 10, ndrsContacted: 9, ndrsRescued: 3, estimatedSavings: 7000 });
    plan = updatePilotDay(plan, 11, { ordersCancelledBeforeShipping: 4, estimatedSavings: 9000 });

    const calendar = buildPilotWorkflowCalendar(plan, 14);

    expect(calendar.days.find((day) => day.day === 8)?.status).toBe("proof_captured");
    expect(calendar.reviewGates.find((item) => item.day === 10)?.status).toBe("continue");
    expect(calendar.reviewGates.find((item) => item.day === 14)?.status).toBe("continue");
  });

  it("builds a final review that keeps estimated and verified savings separate", () => {
    let plan = createPilotFromAudit(undefined, 4999);
    plan = updatePilotDay(plan, 1, { ordersChecked: 120, riskyCodFound: 18, codConfirmationsQueued: 10, estimatedSavings: 6000 });
    const review = generatePilotFinalReview(plan);
    const template = buildPilotFinalReviewTemplate({ plan, finalReview: review, generatedAt: "2026-05-12" });

    expect(template.decision).toBe("narrow");
    expect(template.savings.estimated).toBe(6000);
    expect(template.savings.verified).toBe(0);
    expect(template.markdown).toContain("No savings are marked verified");
    expect(template.markdown).toContain("No real WhatsApp sending");
  });

  it("renews only when verified proof exists", () => {
    let plan = createPilotFromAudit(undefined, 4999);
    plan = updatePilotDay(plan, 1, { ordersChecked: 120, codConfirmationsQueued: 8, estimatedSavings: 7000 });
    plan = updatePilotDay(plan, 2, { ndrCasesFound: 8, ndrsContacted: 8, ndrsRescued: 3, estimatedSavings: 9000 });
    const review = generatePilotFinalReview(plan);
    const unverified = buildPilotFinalReviewTemplate({ plan, finalReview: review, generatedAt: "2026-05-12" });
    const verified = buildPilotFinalReviewTemplate({ plan, finalReview: review, verifiedSavings: 5000, generatedAt: "2026-05-12" });

    expect(unverified.decision).toBe("narrow");
    expect(verified.decision).toBe("renew");
    expect(verified.savings.unverified).toBe(11000);
  });

  it("turns a summary audit into a privacy-labeled CSV-first handoff", () => {
    const audit = generateSummaryAudit({
      brandName: "Summary Seller",
      contact: "",
      category: "Fashion",
      monthlyOrders: 900,
      codPercentage: 72,
      overallRtoPercentage: 24,
      codRtoPercentage: 30,
      averageOrderValue: 1499,
      forwardShippingCost: 70,
      returnShippingCost: 85,
      packagingCost: 25,
      estimatedCac: 120,
      codFee: 35,
      supportOpsCost: 40,
      shippingPlatform: "Shiprocket",
      knownRtoReasons: ["customer_unavailable"],
      problemPincodes: [],
      problemCouriers: [],
      pilotSoftwareCost: 4999
    });

    const handoff = buildAuditToPilotHandoff(audit, "2026-05-12T00:00:00.000Z");

    expect(handoff.status).toBe("needs_csv_first");
    expect(handoff.privacyLabel).toContain("Summary leakage check");
    expect(handoff.nextMission).toContain("anonymized");
    expect(handoff.localTransferNote).toContain("clicks");
  });

  it("marks an anonymized CSV audit ready for a narrow pilot without silent data movement", () => {
    const rows = Array.from({ length: 320 }, (_, index) => {
      const rto = index < 20;
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
    const audit = generateCsvAudit({ brandName: "CSV Seller", category: "Fashion", csvFileName: "audit.csv", rows: parsed.rows, rtoLossPerOrder: 500 });

    const handoff = buildAuditToPilotHandoff(audit, "2026-05-12T00:00:00.000Z");

    expect(handoff.status).toBe("ready_for_pilot");
    expect(handoff.privacyLabel).toContain("Anonymized CSV");
    expect(handoff.nextMission).toContain("rescue pilot");
    expect(handoff.proofRequests.join(" ")).toContain("estimated and verified savings separate");
    expect(handoff.localTransferNote).toContain("No customer-level data is moved silently");
  });
});
