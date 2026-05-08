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

export interface BenefitCard {
  title: string;
  description: string;
  metric: string;
  accent: "green" | "gold" | "copper" | "violet";
}

export interface FeatureCard {
  title: string;
  description: string;
  bullets: string[];
  accent: "green" | "gold" | "blue" | "violet" | "teal";
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

export interface GlossaryTerm {
  term: string;
  short: string;
  long: string;
}

export const navLinks: Array<{ label: string; href: MarketingRoute }> = [
  { label: "Product", href: "/product" },
  { label: "Personas", href: "/personas/founder" },
  { label: "Pricing", href: "/pricing" },
  { label: "Calculator", href: "/calculator" }
];

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: "COD",
    short: "Cash on Delivery",
    long: "Customer pays in cash when the order arrives. Higher chance of refusal at the door."
  },
  {
    term: "RTO",
    short: "Return to Origin",
    long: "Order shipped, but came back undelivered. You pay for shipping both ways and lose the sale."
  },
  {
    term: "NDR",
    short: "Non-Delivery Report",
    long: "Courier tried to deliver but couldn't — wrong address, customer not reachable, etc. You have a short window to rescue it."
  },
  {
    term: "AOV",
    short: "Average Order Value",
    long: "What a typical order is worth on your store."
  }
];

export const serviceModules: ServiceModule[] = [
  {
    id: "leakage-check",
    name: "Leakage Check",
    problem: "You don't know if returned orders are a small problem or eating your profit.",
    outcome: "Get a money figure for what failed deliveries cost you each month — in under 2 minutes.",
    proof: "No customer data needed. Just three numbers from your store.",
    route: "/calculator"
  },
  {
    id: "profit-audit",
    name: "Profit Audit",
    problem: "Failed-delivery losses hide across couriers, pincodes, products, and ad campaigns.",
    outcome: "See exactly where the money leaks — and what it costs you to do nothing.",
    proof: "A clear written report with the top fixes, ranked by what they save you.",
    route: "/audit"
  },
  {
    id: "rescue-pilot",
    name: "14-Day Rescue Pilot",
    problem: "Knowing the problem isn't the same as fixing it.",
    outcome: "Two weeks of guided daily fixes — we work the highest-loss orders with your team.",
    proof: "Daily action log, savings tracker, and a final report you can show your founder.",
    route: "/pilot"
  },
  {
    id: "daily-control-room",
    name: "Daily Control Room",
    problem: "Your ops team scrolls through endless order tables and misses the ones that matter.",
    outcome: "One screen shows urgent failed deliveries, risky cash orders, and the next action — in priority order.",
    proof: "Work queue, leakage map, NDR rescue, and a savings ledger you can audit.",
    route: "/dashboard"
  },
  {
    id: "founder-intelligence",
    name: "Founder Intelligence",
    problem: "Founders get screenshots and exports, not decisions.",
    outcome: "One weekly report: one driver, one decision, one experiment, and what it saved.",
    proof: "Executive summary, policy simulator, monthly strategy review.",
    route: "/dashboard"
  },
  {
    id: "methodology-help",
    name: "Built-in Help",
    problem: "Teams can't act on numbers they don't understand.",
    outcome: "Every metric has a plain-English explanation, formula, and operating playbook inside the app.",
    proof: "In-product glossary, training tracks, and worked examples.",
    route: "/dashboard"
  }
];

export const recoverySteps: RecoveryStep[] = [
  {
    label: "01",
    title: "Measure the leak",
    description: "Type in three numbers from your store. See your monthly loss in rupees, no upload required."
  },
  {
    label: "02",
    title: "Choose the mission",
    description: "We rank what to fix first — risky cash orders, failed deliveries, bad addresses, or weak couriers."
  },
  {
    label: "03",
    title: "Act with context",
    description: "Your team gets one clear action at a time, with the reason, urgency, and rupees at stake."
  },
  {
    label: "04",
    title: "Prove the value",
    description: "Track every save, separating estimated value from money you've actually kept."
  }
];

export const benefitCards: BenefitCard[] = [
  {
    title: "Fewer RTO returns",
    description: "Catch risky cash-on-delivery orders before dispatch — not after they come back unpaid.",
    metric: "Risk flagged before dispatch",
    accent: "green"
  },
  {
    title: "Better NDR rescue",
    description: "When a delivery fails, we surface it within the rescue window so your team can save the order.",
    metric: "Acted before SLA breach",
    accent: "gold"
  },
  {
    title: "More profit kept",
    description: "Stop bleeding margin to shipping both ways. Every saved order shows up on your ledger.",
    metric: "Verified savings",
    accent: "copper"
  },
  {
    title: "Clear answers",
    description: "See the exact courier, pincode, product, or campaign behind each lost rupee.",
    metric: "Decision clarity",
    accent: "violet"
  }
];

export const featureCards: FeatureCard[] = [
  {
    title: "Daily Briefing",
    description: "Open the app and see today's leakage, urgent rescues, risky orders, and the next action — in one screen.",
    bullets: ["Today's headline number", "Next best action", "Quick KPI scorecard"],
    accent: "green"
  },
  {
    title: "Priority Work Queue",
    description: "Tasks ranked by what they save, not by what came in last. Highest-impact orders are first.",
    bullets: ["Critical and high actions on top", "Smart prioritization", "One-click outcomes"],
    accent: "gold"
  },
  {
    title: "Leakage Map",
    description: "See where money leaks — by courier, pincode, product, campaign, address, or proof gaps.",
    bullets: ["Top loss drivers", "Rupees-at-stake estimate", "Root-cause trend over time"],
    accent: "violet"
  },
  {
    title: "NDR Rescue",
    description: "Catch failed deliveries during the rescue window — before they convert to returns.",
    bullets: ["Live rescue tracker", "SLA breach alerts", "Reason-specific playbooks"],
    accent: "blue"
  },
  {
    title: "Savings Ledger",
    description: "An honest ledger that separates estimates from what you've actually saved. No marketing math.",
    bullets: ["Daily savings tracker", "Per-team performance", "Audit-ready exports"],
    accent: "teal"
  }
];

export const dashboardHighlights = [
  "Daily Profit Briefing — not another generic dashboard",
  "Priority Work Queue — one action at a time",
  "Leakage Map — opens the exact workflow behind each driver",
  "Savings Ledger — verified saves, not vanity numbers",
  "Founder Reports — decisions, not screenshots"
];

export const personaPages: PersonaContent[] = [
  {
    slug: "founder",
    name: "Founder",
    eyebrow: "For owners and ecommerce heads",
    headline: "Find out if cash-on-delivery is growing revenue or quietly burning profit.",
    subhead: "A calm weekly story for founders: where you lost money, why, what to do about it, and what it saved.",
    pains: [
      "RTO looks like a courier issue — until you see the monthly margin leak.",
      "Your team reports activity, not protected profit.",
      "Cash orders, prepaid offers, courier choices, and ad quality live in different reports."
    ],
    useCases: [
      "Run a privacy-safe leakage check before you share any customer data.",
      "Read one weekly report with one clear policy decision.",
      "Test a rule in the simulator before changing cash policy or courier mix."
    ],
    primaryCta: "View pricing",
    primaryHref: "/pricing",
    secondaryCta: "See dashboard",
    secondaryHref: "/dashboard",
    proofMetric: "1 decision",
    proofLabel: "per weekly report"
  },
  {
    slug: "operations",
    name: "Operations Team",
    eyebrow: "For support, logistics, and fulfilment teams",
    headline: "Stop scrolling order tables. Work the order that protects the most profit right now.",
    subhead: "We turn risky orders and urgent failed deliveries into a focused queue — with the action, the reason, and the deadline.",
    pains: [
      "Failed deliveries get noticed after the rescue window has closed.",
      "Operators jump between courier exports, WhatsApp threads, and spreadsheets.",
      "Everyone is busy, but no one can prove which work protected money."
    ],
    useCases: [
      "Start each shift with the Daily Briefing.",
      "Clear the Priority Work Queue from top to bottom.",
      "Log every outcome — answered, rescheduled, delivered, cancelled, or returned."
    ],
    primaryCta: "Open work queue",
    primaryHref: "/dashboard",
    secondaryCta: "Plan a pilot",
    secondaryHref: "/pilot",
    proofMetric: "SLA first",
    proofLabel: "rescue rhythm"
  },
  {
    slug: "growth-lead",
    name: "Growth Lead",
    eyebrow: "For performance marketing and revenue teams",
    headline: "See which campaigns bring orders that actually get delivered.",
    subhead: "Connect ad spend to delivery reality — so you scale what survives and pause what leaks.",
    pains: [
      "Campaign returns look fine — until you subtract failed deliveries.",
      "Prepaid offers go to everyone, not the high-risk cash orders that need them most.",
      "Product-promise mismatches stay hidden inside returns and rescue notes."
    ],
    useCases: [
      "Compare leakage across campaigns when you have UTM data.",
      "Switch high-value cash orders to prepaid with a targeted incentive.",
      "Run a controlled test before you scale or pause a campaign."
    ],
    primaryCta: "See product",
    primaryHref: "/product",
    secondaryCta: "Free leakage check",
    secondaryHref: "/calculator",
    proofMetric: "Campaign quality",
    proofLabel: "after delivery reality"
  }
];

export const trustSignals = [
  "Privacy-safe calculator — no customer data needed",
  "Anonymized CSV before any heavy integration",
  "Transparent formulas — every calculation is visible and explained inside the app",
  "No inventory, cashflow, or ERP clutter — only profit recovery",
  "Estimates and verified savings are kept separate"
];

export const representativeProof = [
  {
    title: "Before",
    copy: "Founder sees a return rate, courier complaints, and a support backlog — but can't tell which one to fix first."
  },
  {
    title: "During",
    copy: "Ops works failed deliveries and risky cash orders from one queue, with the rupees-at-stake on every row."
  },
  {
    title: "After",
    copy: "A weekly report shows what changed, what it saved, and which experiment to run next."
  }
];
