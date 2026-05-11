import { describe, expect, it } from "vitest";
import {
  canClaimAutomated,
  evidenceIsComplete,
  getAutomationCapabilityMatrix
} from "@/features/automation-capabilities";

describe("Automation capability matrix", () => {
  it("maps the future seller operations vision without making it the current promise", () => {
    const matrix = getAutomationCapabilityMatrix();

    expect(matrix.operatingLoop).toEqual(["DATA", "INSIGHT", "DECISION", "ACTION", "LEARNING"]);
    expect(matrix.objective).toContain("current customer promise remains CSV-first COD/RTO/NDR");
    expect(matrix.workstreams).toHaveLength(14);
    expect(matrix.capabilities.length).toBeGreaterThanOrEqual(125);
    expect(matrix.summary.totalCapabilities).toBe(matrix.capabilities.length);
  });

  it("labels current automation truth instead of overclaiming automation", () => {
    const matrix = getAutomationCapabilityMatrix();

    expect(matrix.summary.statusCounts.missing).toBeGreaterThan(0);
    expect(matrix.summary.statusCounts.ui_only).toBeGreaterThan(0);
    expect(matrix.summary.statusCounts.mock).toBeGreaterThan(0);
    expect(matrix.summary.statusCounts.local_automation).toBeGreaterThan(0);
    expect(matrix.summary.statusCounts.autonomous_execution).toBe(0);
    expect(matrix.summary.falseAutomationClaimCount).toBe(0);
    expect(matrix.falseAutomationClaims).toHaveLength(0);
    expect(matrix.statusDefinitions.find((definition) => definition.status === "local_automation")?.label).toBe("Local workflow proof");
    expect(matrix.statusDefinitions.find((definition) => definition.status === "local_automation")?.canClaimAutomated).toBe(false);
  });

  it("requires external execution proof before any capability can claim automation", () => {
    const matrix = getAutomationCapabilityMatrix();
    const localAutomation = matrix.capabilities.find((capability) => capability.status === "local_automation");
    const missing = matrix.capabilities.find((capability) => capability.status === "missing");

    expect(localAutomation).toBeDefined();
    expect(localAutomation?.evidence.dataInput).toBe(true);
    expect(localAutomation?.evidence.decisionLogic).toBe(true);
    expect(localAutomation ? evidenceIsComplete(localAutomation.evidence) : true).toBe(false);
    expect(localAutomation ? canClaimAutomated(localAutomation) : true).toBe(false);
    expect(missing ? canClaimAutomated(missing) : true).toBe(false);

    const approvalWithoutExecutionProof = localAutomation
      ? {
          ...localAutomation,
          status: "approval_execution" as const,
          evidence: { ...localAutomation.evidence, externalExecution: false }
        }
      : undefined;

    const approvalWithExecutionProof = approvalWithoutExecutionProof
      ? {
          ...approvalWithoutExecutionProof,
          evidence: { ...approvalWithoutExecutionProof.evidence, externalExecution: true }
        }
      : undefined;

    expect(approvalWithoutExecutionProof ? canClaimAutomated(approvalWithoutExecutionProof) : true).toBe(false);
    expect(approvalWithExecutionProof ? canClaimAutomated(approvalWithExecutionProof) : false).toBe(true);
  });

  it("keeps WhatsApp as one manual-chaos/support channel, not the product objective", () => {
    const matrix = getAutomationCapabilityMatrix();
    const whatsapp = matrix.capabilities.find((capability) => capability.manualTask === "Using WhatsApp for operations");
    const ndr = matrix.capabilities.find((capability) => capability.manualTask === "Managing NDR reports");

    expect(matrix.objective).toContain("manual/export-only execution");
    expect(whatsapp?.workstreamId).toBe("hidden_manual_work");
    expect(whatsapp?.status).not.toBe("autonomous_execution");
    expect(ndr?.workstreamId).toBe("courier_shipping");
    expect(ndr?.status).toBe("local_automation");
  });
});
