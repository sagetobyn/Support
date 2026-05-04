export interface AddressQualityResult {
  score: number;
  issues: string[];
  suggestedQuestion: string;
}

const vagueTerms = [
  "near mandir",
  "near temple",
  "near school",
  "near market",
  "main road",
  "bus stand",
  "railway station",
  "beside shop",
  "landmark only"
];

export function checkAddressQuality(input: {
  fullAddress?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  pincode?: string;
  city?: string;
  phone?: string;
  repeatedAddressCount?: number;
}): AddressQualityResult {
  const address = [input.fullAddress, input.addressLine1, input.addressLine2].filter(Boolean).join(" ").trim();
  const normalized = address.toLowerCase();
  const issues: string[] = [];
  let score = 100;

  if (!address) {
    issues.push("Address is missing");
    score -= 50;
  } else if (address.length < 35) {
    issues.push("Address is too short");
    score -= 20;
  }

  if (!/\b(flat|house|h\.?no|room|plot|tower|block|floor|building|apt|apartment|door|ward|gali|lane|street|sector|phase|village)\b/i.test(address)) {
    issues.push("House, flat, building, or street detail is missing");
    score -= 15;
  }

  if (!input.landmark) {
    issues.push("Landmark is missing");
    score -= 10;
  }

  if (!input.city) {
    issues.push("City is missing");
    score -= 10;
  }

  if (!input.pincode || !/^[1-9]\d{5}$/.test(input.pincode)) {
    issues.push("Pincode is not a valid 6 digit Indian pincode");
    score -= 20;
  }

  const vagueHits = vagueTerms.filter((term) => normalized.includes(term));
  if (vagueHits.length) {
    issues.push("Address relies on vague landmark-only directions");
    score -= 15;
  }

  if (vagueHits.length > 2) {
    issues.push("Address has repeated vague terms");
    score -= 10;
  }

  const phoneDigits = (input.phone || "").replace(/\D/g, "");
  if (!phoneDigits || /^(0+|9{10}|1{10}|1234567890)$/.test(phoneDigits)) {
    issues.push("Phone number is missing or looks unavailable");
    score -= 20;
  }

  if ((input.repeatedAddressCount || 0) > 1) {
    issues.push("Same address appears repeatedly in brand data");
    score -= 10;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestedQuestion:
      "Please share house/flat number, building name, nearby landmark, and alternate phone number to avoid delivery failure."
  };
}
