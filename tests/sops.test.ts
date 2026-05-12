import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pilotOperatorSop, pilotOperatorSopToMarkdown, sopTemplates } from "@/features/sops";

describe("Pilot operator SOP", () => {
  it("ships a documented pilot operator SOP artifact", () => {
    expect(existsSync("docs/PILOT_OPERATOR_SOP.md")).toBe(true);
    expect(pilotOperatorSop.docPath).toBe("docs/PILOT_OPERATOR_SOP.md");
    expect(pilotOperatorSop.routine.map((block) => block.id)).toEqual(["morning", "afternoon", "evening"]);
  });

  it("keeps the SOP manual and provider-agnostic", () => {
    expect(pilotOperatorSop.providerBoundary).toContain("No live WhatsApp sending");
    expect(pilotOperatorSop.providerBoundary).toContain("courier API push");
    expect(pilotOperatorSop.providerBoundary).toContain("Shopify/WooCommerce sync");
    expect(pilotOperatorSop.workflows.map((workflow) => workflow.id)).toEqual(["ndr", "address", "prepaid", "call"]);
  });

  it("requires proof logging before savings claims", () => {
    expect(pilotOperatorSop.proofLogging.join(" ")).toContain("Never mark savings verified");
    expect(pilotOperatorSop.proofLogging.join(" ")).toContain("one action to one COD/RTO/NDR outcome");
    expect(pilotOperatorSopToMarkdown()).toContain("## Proof logging rules");
  });

  it("links the pilot SOP into the dashboard playbook registry", () => {
    const template = sopTemplates.find((sop) => sop.id === "pilot-operator");

    expect(template?.docPath).toBe("docs/PILOT_OPERATOR_SOP.md");
    expect(template?.routeHref).toBe("/pilot#operator-sop");
    expect(template?.steps.join(" ")).toContain("Evening");
  });
});
