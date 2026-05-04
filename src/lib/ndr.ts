import type { NormalizedNdrReason, RecommendedAction } from "@/types/domain";

export interface NdrNormalizationResult {
  normalizedReason: NormalizedNdrReason;
  confidence: number;
  recommendedMessage: string;
  recommendedAction: RecommendedAction;
  recommendedTemplate: string;
}

const rules: Array<{ reason: NormalizedNdrReason; action: RecommendedAction; message: string; patterns: RegExp[] }> = [
  {
    reason: "customer_unavailable",
    action: "request_reattempt",
    message: "Ask customer to choose a reattempt slot.",
    patterns: [/customer not available/i, /not available/i, /unavailable/i, /consignee absent/i, /customer not at/i]
  },
  {
    reason: "customer_refused",
    action: "call_customer",
    message: "Confirm refusal reason and cancel or reattempt only if customer reconfirms.",
    patterns: [/refus/i, /did not accept/i, /not want/i, /rejected/i]
  },
  {
    reason: "wrong_address",
    action: "request_address_update",
    message: "Ask for house number, landmark, pincode, and alternate phone.",
    patterns: [/wrong address/i, /incorrect address/i, /incomplete address/i, /insufficient address/i, /address insufficient/i, /address issue/i, /cannot locate/i]
  },
  {
    reason: "phone_unreachable",
    action: "call_customer",
    message: "Try WhatsApp and alternate number before final attempt.",
    patterns: [/phone not reachable/i, /no response on phone/i, /no response/i, /not reachable/i, /switched off/i, /call not/i]
  },
  {
    reason: "payment_issue",
    action: "convert_to_prepaid",
    message: "Offer payment link or ask customer to keep COD amount ready.",
    patterns: [/cash not ready/i, /cash/i, /cod amount/i, /payment/i, /change not/i, /no money/i]
  },
  {
    reason: "customer_requested_future_delivery",
    action: "request_reattempt",
    message: "Capture preferred reattempt date and share with courier.",
    patterns: [/future delivery/i, /reschedule/i, /tomorrow/i, /later/i, /next day/i]
  },
  {
    reason: "out_of_delivery_area",
    action: "escalate_to_ops",
    message: "Review pincode/courier serviceability and escalate to ops.",
    patterns: [/out of delivery/i, /oda/i, /non serviceable/i, /beyond delivery/i]
  },
  {
    reason: "courier_fake_attempt",
    action: "escalate_to_ops",
    message: "Collect customer proof and review courier attempt quality.",
    patterns: [/fake attempt/i, /customer says no attempt/i, /no attempt/i]
  },
  {
    reason: "customer_shifted",
    action: "request_address_update",
    message: "Ask customer for updated address or cancellation.",
    patterns: [/shifted/i, /moved/i]
  },
  {
    reason: "door_locked",
    action: "request_reattempt",
    message: "Ask customer for an available delivery slot.",
    patterns: [/door locked/i, /premises locked/i, /office closed/i]
  },
  {
    reason: "delayed_delivery",
    action: "escalate_to_ops",
    message: "Send delay update and watch for cancellation risk.",
    patterns: [/delay/i, /weather/i, /hub/i, /misroute/i]
  }
];

export function normalizeNdrReason(raw?: string): NdrNormalizationResult {
  const value = (raw || "").trim();
  if (!value) {
    return {
      normalizedReason: "other",
      confidence: 0.2,
      recommendedMessage: "Review the courier reason manually.",
      recommendedAction: "escalate_to_ops",
      recommendedTemplate: "ndr_rescue"
    };
  }

  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(value))) {
      return {
        normalizedReason: rule.reason,
        confidence: 0.9,
        recommendedMessage: rule.message,
        recommendedAction: rule.action,
        recommendedTemplate: templateForReason(rule.reason)
      };
    }
  }

  return {
    normalizedReason: "other",
    confidence: 0.45,
    recommendedMessage: "Review the NDR reason and choose next action.",
    recommendedAction: "escalate_to_ops",
    recommendedTemplate: "ndr_rescue"
  };
}

function templateForReason(reason: NormalizedNdrReason) {
  if (reason === "wrong_address" || reason === "customer_shifted") return "address_correction";
  if (reason === "phone_unreachable") return "alternate_phone_request";
  if (reason === "payment_issue") return "cod_to_prepaid";
  if (reason === "customer_unavailable" || reason === "door_locked" || reason === "customer_requested_future_delivery") {
    return "reattempt_scheduling";
  }
  return "ndr_rescue";
}
