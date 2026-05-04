import type { NormalizedNdrReason } from "@/types/domain";

export interface NdrPlaybook {
  id: string;
  reason: NormalizedNdrReason;
  steps: string[];
  defaultTemplate: string;
  escalationRule: string;
  slaHours: number;
  enabled: boolean;
}

const playbookData: Record<NormalizedNdrReason, Omit<NdrPlaybook, "id" | "reason">> = {
  customer_unavailable: { steps: ["WhatsApp rescue", "Ask for reattempt slot", "Call fallback for high value", "Mark unresolved after SLA"], defaultTemplate: "ndr_rescue", escalationRule: "Escalate after SLA or high-value no response.", slaHours: 12, enabled: true },
  wrong_address: { steps: ["Address correction message", "Ask for landmark/alternate phone", "Update courier action manually", "Call if no response"], defaultTemplate: "address_correction", escalationRule: "Escalate when no corrected address within SLA.", slaHours: 12, enabled: true },
  customer_refused: { steps: ["Call customer", "Capture refusal reason", "Use support script for expectation mismatch", "RTO review if low margin or third attempt"], defaultTemplate: "refusal_reason_capture", escalationRule: "Founder/ops review for high-value refusals.", slaHours: 8, enabled: true },
  phone_unreachable: { steps: ["Call fallback", "Request alternate phone", "Hold/RTO review if no response"], defaultTemplate: "alternate_phone_request", escalationRule: "Escalate after two failed contacts.", slaHours: 12, enabled: true },
  payment_issue: { steps: ["UPI/prepaid link placeholder", "Reattempt after payment/confirmation"], defaultTemplate: "cod_to_prepaid", escalationRule: "Escalate if payment is not confirmed before next OFD.", slaHours: 12, enabled: true },
  delayed_delivery: { steps: ["Send delay note", "Monitor courier", "Reattempt confirmation if OFD"], defaultTemplate: "ofd_reminder", escalationRule: "Courier escalation after 24 hours.", slaHours: 24, enabled: true },
  out_of_delivery_area: { steps: ["Confirm alternate address", "Courier escalation note", "Review pincode policy"], defaultTemplate: "address_correction", escalationRule: "Policy review if repeated in same pincode.", slaHours: 24, enabled: true },
  courier_fake_attempt: { steps: ["Courier escalation note", "Ask customer confirmation", "Monitor courier lane"], defaultTemplate: "courier_issue_customer_confirmation", escalationRule: "Courier policy review if lane repeats.", slaHours: 12, enabled: true },
  customer_requested_future_delivery: { steps: ["Confirm delivery slot", "Request reattempt", "Send reminder before OFD"], defaultTemplate: "reattempt_scheduling", escalationRule: "Escalate if date slips twice.", slaHours: 24, enabled: true },
  customer_shifted: { steps: ["Collect new address", "Check serviceability", "RTO review if not serviceable"], defaultTemplate: "address_correction", escalationRule: "Escalate if alternate pincode is not serviceable.", slaHours: 12, enabled: true },
  door_locked: { steps: ["Ask reattempt slot", "Send OFD reminder", "Call if high value"], defaultTemplate: "reattempt_scheduling", escalationRule: "Escalate after repeated locked-door attempts.", slaHours: 12, enabled: true },
  other: { steps: ["Read courier remark", "Call customer if unclear", "Ops review"], defaultTemplate: "ndr_rescue", escalationRule: "Manual review.", slaHours: 12, enabled: true }
};

export const defaultNdrPlaybooks: NdrPlaybook[] = Object.entries(playbookData).map(([reason, data]) => ({ id: `playbook-${reason}`, reason: reason as NormalizedNdrReason, ...data }));

export function getNdrPlaybook(reason: NormalizedNdrReason, playbooks = defaultNdrPlaybooks) {
  return playbooks.find((playbook) => playbook.reason === reason) || playbooks.find((playbook) => playbook.reason === "other");
}

export function shouldEscalatePlaybook(playbook: NdrPlaybook, hoursSinceNdr: number, attemptCount = 0) {
  return hoursSinceNdr >= playbook.slaHours || attemptCount >= 3;
}
