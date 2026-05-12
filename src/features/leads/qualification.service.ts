export type LeadQualificationStage = "bad_fit" | "free_check" | "paid_audit_candidate" | "pilot_candidate";

export interface LeadQualificationInput {
  monthlyOrders: number;
  codPercentage: number;
  rtoPercentage: number;
  monthlyLeakage: number;
  category: string;
}

export interface LeadQualificationResult {
  stage: LeadQualificationStage;
  score: number;
  title: string;
  summary: string;
  nextStep: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  leadCtaLabel: string;
  reasons: string[];
}

const strongestCategories = new Set(["Fashion", "Footwear", "Beauty", "Accessories", "Wellness / Ayurveda", "Gadgets"]);

function cleanNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function categoryPoints(category: string) {
  if (strongestCategories.has(category)) return 12;
  if (category === "Home Decor" || category === "General D2C") return 8;
  return 4;
}

function scoreVolume(monthlyOrders: number) {
  if (monthlyOrders >= 2000) return 22;
  if (monthlyOrders >= 500) return 18;
  if (monthlyOrders >= 200) return 10;
  if (monthlyOrders >= 100) return 5;
  return 0;
}

function scoreCod(codPercentage: number) {
  if (codPercentage >= 65) return 22;
  if (codPercentage >= 50) return 18;
  if (codPercentage >= 35) return 10;
  if (codPercentage >= 20) return 5;
  return 0;
}

function scoreRto(rtoPercentage: number) {
  if (rtoPercentage >= 22) return 22;
  if (rtoPercentage >= 15) return 18;
  if (rtoPercentage >= 10) return 10;
  if (rtoPercentage >= 7) return 5;
  return 0;
}

function scoreLeakage(monthlyLeakage: number) {
  if (monthlyLeakage >= 150000) return 22;
  if (monthlyLeakage >= 75000) return 18;
  if (monthlyLeakage >= 30000) return 10;
  if (monthlyLeakage >= 10000) return 5;
  return 0;
}

function buildReasons(input: Required<LeadQualificationInput>) {
  const reasons: string[] = [];
  if (input.monthlyOrders < 100) reasons.push("Order volume is still too small for a profit audit to be useful.");
  else reasons.push(`${Math.round(input.monthlyOrders).toLocaleString("en-IN")} monthly orders gives enough signal for a leakage check.`);

  if (input.codPercentage < 25) reasons.push("COD share is low, so the COD/RTO wedge may not be the biggest leak yet.");
  else reasons.push(`${Math.round(input.codPercentage)}% COD means failed-delivery leakage is worth measuring.`);

  if (input.rtoPercentage < 8) reasons.push("Return rate is not severe enough to push a rescue pilot.");
  else reasons.push(`${Math.round(input.rtoPercentage)}% RTO makes post-checkout recovery worth investigating.`);

  if (input.monthlyLeakage < 15000) reasons.push("Estimated monthly leakage is low; keep this as a free benchmark for now.");
  else reasons.push(`Estimated leakage is high enough to justify a privacy-safe profit audit.`);

  if (categoryPoints(input.category) >= 8) reasons.push(`${input.category} is inside Wembro's early D2C/RTO focus.`);
  else reasons.push("Category fit is uncertain, so qualify with a leakage check before asking for data.");

  return reasons;
}

function resultFor(stage: LeadQualificationStage, score: number, reasons: string[]): LeadQualificationResult {
  if (stage === "pilot_candidate") {
    return {
      stage,
      score,
      title: "Rescue pilot candidate",
      summary: "This looks like a strong COD/RTO/NDR rescue pilot case.",
      nextStep: "Use the profit audit to confirm assumptions, then plan a rescue pilot with daily action and savings proof.",
      primaryCtaLabel: "Plan rescue pilot",
      primaryCtaHref: "/pilot",
      secondaryCtaLabel: "Confirm with profit audit",
      secondaryCtaHref: "/audit",
      leadCtaLabel: "Save and plan rescue pilot",
      reasons
    };
  }

  if (stage === "paid_audit_candidate") {
    return {
      stage,
      score,
      title: "Profit audit candidate",
      summary: "There is enough visible leakage to justify a written COD/RTO/NDR profit audit.",
      nextStep: "Start with a privacy-safe profit audit; upload anonymized CSV only if the estimate looks useful.",
      primaryCtaLabel: "Start profit audit",
      primaryCtaHref: "/audit",
      secondaryCtaLabel: "See sample profit audit",
      secondaryCtaHref: "/sample-report",
      leadCtaLabel: "Save and start profit audit",
      reasons
    };
  }

  if (stage === "free_check") {
    return {
      stage,
      score,
      title: "Leakage check first",
      summary: "There may be leakage, but the next move is education and a light summary check.",
      nextStep: "Review the sample profit audit and keep refining assumptions before paying for anything.",
      primaryCtaLabel: "See sample profit audit",
      primaryCtaHref: "/sample-report",
      secondaryCtaLabel: "Open profit audit",
      secondaryCtaHref: "/audit",
      leadCtaLabel: "Save leakage check",
      reasons
    };
  }

  return {
    stage,
    score,
    title: "Bad fit for now",
    summary: "A profit audit or rescue pilot would be premature from these numbers.",
    nextStep: "Keep the free estimate, improve order volume or COD/RTO signal, and revisit when the leakage is clearer.",
    primaryCtaLabel: "Keep leakage check",
    primaryCtaHref: "#calculator",
    secondaryCtaLabel: "See sample profit audit",
    secondaryCtaHref: "/sample-report",
    leadCtaLabel: "Save leakage check",
    reasons
  };
}

export function qualifyCalculatorLead(input: LeadQualificationInput): LeadQualificationResult {
  const normalized = {
    monthlyOrders: cleanNumber(input.monthlyOrders),
    codPercentage: cleanNumber(input.codPercentage),
    rtoPercentage: cleanNumber(input.rtoPercentage),
    monthlyLeakage: cleanNumber(input.monthlyLeakage),
    category: input.category || "General D2C"
  };
  const score =
    scoreVolume(normalized.monthlyOrders) +
    scoreCod(normalized.codPercentage) +
    scoreRto(normalized.rtoPercentage) +
    scoreLeakage(normalized.monthlyLeakage) +
    categoryPoints(normalized.category);
  const reasons = buildReasons(normalized);

  if (
    normalized.monthlyOrders < 100 ||
    normalized.codPercentage < 20 ||
    normalized.rtoPercentage < 7 ||
    normalized.monthlyLeakage < 10000
  ) {
    return resultFor("bad_fit", score, reasons);
  }

  if (score >= 88 && normalized.monthlyOrders >= 500 && normalized.codPercentage >= 50 && normalized.rtoPercentage >= 15 && normalized.monthlyLeakage >= 75000) {
    return resultFor("pilot_candidate", score, reasons);
  }

  if (score >= 62 && normalized.monthlyLeakage >= 30000 && normalized.rtoPercentage >= 10) {
    return resultFor("paid_audit_candidate", score, reasons);
  }

  return resultFor("free_check", score, reasons);
}
