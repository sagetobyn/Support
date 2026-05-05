export type MarketingRoute = "/" | "/product" | "/pricing" | "/calculator" | "/audit" | "/pilot" | "/dashboard" | "/personas/founder" | "/personas/operations" | "/personas/growth-lead";

export interface ServiceModule {
  id: string;
  name: string;
  problem: string;
  outcome: string;
  proof: string;
  route: MarketingRoute;
}

export interface RecoveryStep {
  label: string;
  title: string;
  description: string;
}

export interface PersonaContent {
  slug: "founder" | "operations" | "growth-lead";
  name: string;
  eyebrow: string;
  headline: string;
  subhead: string;
  pains: string[];
  useCases: string[];
  primaryCta: string;
  primaryHref: MarketingRoute;
  secondaryCta: string;
  secondaryHref: MarketingRoute;
  proofMetric: string;
  proofLabel: string;
}

export const navLinks: Array<{ label: string; href: MarketingRoute }> = [
  { label: "Product", href: "/product" },
  { label: "Personas", href: "/personas/founder" },
  { label: "Pricing", href: "/pricing" },
  { label: "Calculator", href: "/calculator" }
];

export const serviceModules: ServiceModule[] = [
  {
    id: "leakage-check",
    name: "Leakage Check",
    problem: "The seller does not know whether RTO is a small nuisance or a material profit leak.",
    outcome: "Estimate monthly COD/RTO loss in minutes without uploading customer data.",
    proof: "Privacy-safe awareness before any sales call.",
    route: "/calculator"
  },
  {
    id: "profit-audit",
    name: "Profit Audit",
    problem: "RTO loss is scattered across courier, pincode, SKU, campaign, and NDR reasons.",
    outcome: "Identify the top leakage drivers and the cost of doing nothing.",
    proof: "Summary or anonymized CSV audit with pilot recommendation.",
    route: "/audit"
  },
  {
    id: "rescue-pilot",
    name: "14-Day Rescue Pilot",
    problem: "Diagnosis alone does not change order outcomes.",
    outcome: "Turn leakage drivers into a daily COD/NDR rescue workflow.",
    proof: "Day-by-day action plan, savings ledger, and final review.",
    route: "/pilot"
  },
  {
    id: "daily-control-room",
    name: "Daily Control Room",
    problem: "Ops teams drown in order tables and miss the highest-value intervention.",
    outcome: "Show urgent NDRs, COD risk, recoverable leakage, and the next action first.",
    proof: "Priority work queue, Leakage Analysis, NDR Management, and Savings Ledger.",
    route: "/dashboard"
  },
  {
    id: "founder-intelligence",
    name: "Founder Intelligence",
    problem: "Founders need decisions, not screenshots and raw exports.",
    outcome: "Convert weekly operations into one driver, one decision, one policy test, and savings proof.",
    proof: "Weekly executive report, policy simulator, and monthly strategy.",
    route: "/dashboard"
  },
  {
    id: "methodology-help",
    name: "Methodology & Help",
    problem: "Teams cannot maximize value if formulas and operating rules are unclear.",
    outcome: "Teach formulas, terms, data requirements, and the correct operating rhythm inside the product.",
    proof: "A built-in enablement section for sellers and operators.",
    route: "/dashboard"
  }
];

export const recoverySteps: RecoveryStep[] = [
  {
    label: "01",
    title: "Measure the leak",
    description: "Use summary numbers or anonymized CSV to estimate where COD/RTO/NDR loss is concentrated."
  },
  {
    label: "02",
    title: "Choose the mission",
    description: "Prioritize urgent NDRs, risky COD orders, address corrections, courier lanes, and prepaid opportunities."
  },
  {
    label: "03",
    title: "Act with context",
    description: "Give ops teams one recommended action at a time with reason, urgency, and estimated leakage."
  },
  {
    label: "04",
    title: "Prove the value",
    description: "Track estimated and verified savings so founders can see whether the workflow paid for itself."
  }
];

export const dashboardHighlights = [
  "Daily Profit Briefing instead of a generic dashboard",
  "Priority Work Queue for one-action-at-a-time recovery",
  "Leakage Analysis that opens the exact workflow behind each driver",
  "Savings Ledger that separates estimated value from verified proof",
  "Founder reports that summarize decisions, not just metrics"
];

export const personaPages: PersonaContent[] = [
  {
    slug: "founder",
    name: "Founder",
    eyebrow: "For owners and ecommerce heads",
    headline: "Know if COD is growing revenue or quietly burning profit.",
    subhead: "RTOShield gives founders a calm weekly story: leakage, driver, recommended decision, policy test, and savings proof.",
    pains: [
      "RTO looks like a courier issue until the monthly margin leak becomes obvious.",
      "Teams report activity, but not protected profit.",
      "COD, prepaid incentives, courier switches, and campaign quality are reviewed in separate places."
    ],
    useCases: [
      "Run a privacy-safe leakage check before sharing customer data.",
      "Review weekly executive reports with one clear policy decision.",
      "Use the simulator before changing COD rules or courier allocation."
    ],
    primaryCta: "View pricing",
    primaryHref: "/pricing",
    secondaryCta: "Open dashboard",
    secondaryHref: "/dashboard",
    proofMetric: "1 decision",
    proofLabel: "per weekly report"
  },
  {
    slug: "operations",
    name: "Operations Team",
    eyebrow: "For support, logistics, and fulfilment teams",
    headline: "Stop scanning order tables. Work the order that protects the most profit now.",
    subhead: "The dashboard turns COD risk and NDR urgency into a focused action queue with recommended steps, SLA context, and outcome tracking.",
    pains: [
      "NDR cases get noticed after the rescue window has almost closed.",
      "Operators jump between courier exports, WhatsApp notes, and spreadsheets.",
      "Everyone is busy, but nobody can prove which actions protected money."
    ],
    useCases: [
      "Start each shift with the Daily Briefing.",
      "Use Priority Work Queue to clear high-value actions first.",
      "Record customer response, reattempt, delivery, cancellation, or RTO outcome."
    ],
    primaryCta: "Open work queue",
    primaryHref: "/dashboard",
    secondaryCta: "Create pilot plan",
    secondaryHref: "/pilot",
    proofMetric: "SLA first",
    proofLabel: "NDR rescue rhythm"
  },
  {
    slug: "growth-lead",
    name: "Growth Lead",
    eyebrow: "For performance marketing and revenue teams",
    headline: "See which campaigns create orders that survive delivery.",
    subhead: "Connect low-intent COD demand, campaign leakage, prepaid conversion, SKU issues, and courier performance before scaling spend.",
    pains: [
      "Campaign ROAS looks fine before RTO and failed delivery costs are included.",
      "Prepaid incentives are applied broadly instead of to high-risk COD moments.",
      "SKU and promise mismatch remain hidden inside returns and NDR data."
    ],
    useCases: [
      "Compare campaign leakage when UTM data exists.",
      "Identify prepaid opportunities on high-value risky COD orders.",
      "Run controlled policy tests before scaling or pausing campaigns."
    ],
    primaryCta: "Explore product",
    primaryHref: "/product",
    secondaryCta: "Run leakage check",
    secondaryHref: "/calculator",
    proofMetric: "Campaign quality",
    proofLabel: "after delivery reality"
  }
];

export const trustSignals = [
  "Privacy-safe calculator and anonymized audit path",
  "CSV-first workflow before any heavy integration commitment",
  "Transparent formulas and methodology inside the product",
  "No inventory, cashflow, or ERP clutter in the profit recovery core",
  "Directional estimates separated from verified savings"
];

export const representativeProof = [
  {
    title: "Before",
    copy: "Founder sees RTO rate, courier complaints, and support backlog, but cannot identify the highest-value action."
  },
  {
    title: "During",
    copy: "Ops team works urgent NDRs and risky COD orders from one priority queue with estimated leakage attached."
  },
  {
    title: "After",
    copy: "Weekly report shows what changed, what value was protected, and which policy test should run next."
  }
];
