import type { CustomerIntent } from "@/types/domain";

const intentRules: Array<{ intent: CustomerIntent; confidence: number; patterns: RegExp[] }> = [
  { intent: "confirm_delivery", confidence: 0.92, patterns: [/confirm/i, /yes/i, /deliver/i, /available/i, /ok/i] },
  { intent: "update_address", confidence: 0.9, patterns: [/address/i, /landmark/i, /flat/i, /house/i, /location/i] },
  { intent: "reschedule_today", confidence: 0.88, patterns: [/today/i, /aaj/i] },
  { intent: "reschedule_tomorrow", confidence: 0.9, patterns: [/tomorrow/i, /kal/i] },
  { intent: "share_alternate_phone", confidence: 0.86, patterns: [/alternate/i, /number/i, /phone/i, /mobile/i] },
  { intent: "convert_prepaid", confidence: 0.85, patterns: [/prepaid/i, /pay now/i, /upi/i, /payment link/i] },
  { intent: "cancel_order", confidence: 0.94, patterns: [/cancel/i, /return/i, /do not want/i, /nahi chahiye/i] },
  { intent: "angry_customer", confidence: 0.75, patterns: [/angry/i, /complaint/i, /fraud/i, /bad/i, /worst/i] }
];

export function detectIntent(rawResponse: string): { intent: CustomerIntent; confidence: number } {
  const text = rawResponse.trim();
  if (!text) return { intent: "unknown", confidence: 0.2 };
  for (const rule of intentRules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) return { intent: rule.intent, confidence: rule.confidence };
  }
  if (/\d{4}-\d{2}-\d{2}|[0-3]?\d[/-][0-1]?\d/.test(text)) return { intent: "reschedule_specific_date", confidence: 0.78 };
  return { intent: "unknown", confidence: 0.45 };
}

