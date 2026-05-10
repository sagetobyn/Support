import { describe, expect, it } from "vitest";
import {
  canClaimAutomated,
  evidenceIsComplete,
  getAutomationCapabilityMatrix
} from "@/features/automation-capabilities";

describe("Automation capability matrix", () => {
  it("maps the complete seller operations vision across 14 workstreams", () => {
    const matrix = getAutomationCapabilityMatrix();

    expect(matrix.operatingLoop).toEqual(["DATA", "INSIGHT", "DECISION", "ACTION", "LEARNING"]);
    expect(matrix.workstreams).toHaveLength(14);
    expect(matrix.capabilities.length).toBeGreaterThanOrEqual(125);
    expect(matrix.summary.totalCapabilities).toBe(matrix.capabilities.length);
  });

  it("labels current automation truth instead of overclaiming full automation", () => {
    const matrix = getAutomationCapabilityMatrix();

    expect(matrix.summary.statusCounts.missing).toBeGreaterThan(0);
    expect(matrix.summary.statusCounts.ui_only).toBeGreaterThan(0);
    expect(matrix.summary.statusCounts.mock).toBeGreaterThan(0);
    expect(matrix.summary.statusCounts.local_automation).toBeGreaterThan(0);
    expect(matrix.summary.statusCounts.autonomous_execution).toBe(0);
    expect(matrix.summary.falseAutomationClaimCount).toBe(0);
    expect(matrix.falseAutomationClaims).toHaveLength(0);
  });

  it("requires proof before any capability can claim automation", () => {
    const matrix = getAutomationCapabilityMatrix();
    const localAutomation = matrix.capabilities.find((capability) => capability.status === "local_automation");
    const missing = matrix.capabilities.find((capability) => capability.status === "missing");

    expect(localAutomation).toBeDefined();
    expect(localAutomation?.evidence.dataInput).toBe(true);
    expect(localAutomation?.evidence.decisionLogic).toBe(true);
    expect(localAutomation ? evidenceIsComplete(localAutomation.evidence) : false).toBe(true);
    expect(localAutomation ? canClaimAutomated(localAutomation) : true).toBe(false);
    expect(missing ? canClaimAutomated(missing) : true).toBe(false);
  });

  it("keeps WhatsApp as one manual-chaos/support channel, not the product objective", () => {
    const matrix = getAutomationCapabilityMatrix();
    const whatsapp = matrix.capabilities.find((capability) => capability.manualTask === "Using WhatsApp for operations");
    const ndr = matrix.capabilities.find((capability) => capability.manualTask === "Managing NDR reports");

    expect(matrix.objective).toContain("non-physical ecommerce work");
    expect(whatsapp?.workstreamId).toBe("hidden_manual_work");
    expect(whatsapp?.status).not.toBe("autonomous_execution");
    expect(ndr?.workstreamId).toBe("courier_shipping");
    expect(ndr?.status).toBe("local_automation");
  });
});
