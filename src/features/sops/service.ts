export interface SopTemplate {
  id: string;
  title: string;
  purpose: string;
  whenToUse: string;
  steps: string[];
  owner: string;
  output: string;
  successMetric: string;
}

export const sopTemplates: SopTemplate[] = [
  { id: "cod-verification", title: "COD verification SOP", purpose: "Confirm customer intent before dispatch.", whenToUse: "High-risk or high-value COD orders.", steps: ["Open daily action queue", "Check risk reason", "Send COD confirmation", "Hold until confirmed", "Cancel before shipping when customer declines"], owner: "Ops", output: "Confirmed/held/cancelled order", successMetric: "Lower COD RTO rate" },
  { id: "address-correction", title: "Address correction SOP", purpose: "Fix weak addresses before courier spend.", whenToUse: "Address score below threshold or wrong-address NDR.", steps: ["Send address correction template", "Collect landmark and alternate phone", "Update courier manually", "Record response"], owner: "Ops", output: "Corrected address note", successMetric: "Lower wrong-address NDR" },
  { id: "ndr-rescue", title: "NDR rescue SOP", purpose: "Rescue failed deliveries before RTO.", whenToUse: "Any new NDR case.", steps: ["Review normalized reason", "Use playbook", "Contact within SLA", "Request reattempt/address/call", "Mark delivered/RTO outcome"], owner: "Ops", output: "NDR action and outcome", successMetric: "Delivered after NDR" },
  { id: "courier-escalation", title: "Courier escalation SOP", purpose: "Escalate repeat courier lane failures.", whenToUse: "Courier fake attempt or high-loss lane.", steps: ["Export affected orders", "Send courier escalation note", "Track 14-day switchback test", "Review lane metrics"], owner: "Founder/Ops", output: "Courier test decision", successMetric: "Lower courier-pincode RTO" },
  { id: "cod-to-prepaid", title: "COD-to-prepaid SOP", purpose: "Convert risky COD without destroying margin.", whenToUse: "Open prepaid opportunities.", steps: ["Check max safe incentive", "Queue prepaid offer", "Record accepted/declined", "Create saving on accepted"], owner: "Ops", output: "Prepaid conversion status", successMetric: "Prepaid acceptance and avoided RTO exposure" },
  { id: "weekly-founder-review", title: "Weekly founder review SOP", purpose: "Turn ops work into decisions.", whenToUse: "Every weekly review.", steps: ["Generate weekly founder report", "Review top leakage drivers", "Accept/test/dismiss policies", "Pick next week focus"], owner: "Founder", output: "Weekly focus list", successMetric: "Net verified benefit" }
];

export function sopToText(sop: SopTemplate) {
  return `${sop.title}\nPurpose: ${sop.purpose}\nWhen to use: ${sop.whenToUse}\nOwner: ${sop.owner}\nSteps:\n${sop.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\nOutput: ${sop.output}\nSuccess metric: ${sop.successMetric}`;
}
