export interface LearningFormulaCard {
  id: string;
  title: string;
  formula: string;
  whyItMatters: string;
  usedIn: string[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  operatorNote: string;
}

export interface MethodologyStep {
  step: string;
  title: string;
  description: string;
  output: string;
}

export interface DataReadinessItem {
  field: string;
  purpose: string;
  requiredFor: string;
}

export interface LearningTrack {
  module: string;
  cadence: string;
  value: string;
  targetView?: string;
}

export const operatingMethodology: MethodologyStep[] = [
  {
    step: "01",
    title: "Diagnose leakage",
    description: "Start with the Daily Briefing and Leakage Analysis to identify where profit is currently leaking after checkout.",
    output: "One top leakage driver and a clear reason to act."
  },
  {
    step: "02",
    title: "Prioritize work",
    description: "Sort orders by urgency, risk, and estimated leakage so the team works the highest-value COD, NDR, address, courier, SKU, or campaign issue first.",
    output: "A short priority queue instead of a large table."
  },
  {
    step: "03",
    title: "Act within SLA",
    description: "Use recommended actions such as call customer, request reattempt, correct address, convert to prepaid, or hold risky COD before shipping.",
    output: "A logged intervention tied to an order or NDR case."
  },
  {
    step: "04",
    title: "Record outcome",
    description: "Mark whether the order was delivered, cancelled before shipping, converted to prepaid, rescued after NDR, or returned to origin.",
    output: "Savings proof that separates estimated impact from verified impact."
  },
  {
    step: "05",
    title: "Review policy",
    description: "Use weekly and monthly reports to decide whether a courier lane, pincode, COD rule, SKU promise, or campaign needs a controlled policy test.",
    output: "One decision, one test, and a measured result."
  }
];

export const formulaCards: LearningFormulaCard[] = [
  {
    id: "estimated-rto-loss-per-order",
    title: "Estimated RTO loss per order",
    formula: "Forward shipping + return shipping + packaging + estimated CAC + COD fee + support ops cost",
    whyItMatters: "This is the baseline cost of a failed shipment. Most recovery calculations use this as the amount at risk.",
    usedIn: ["Loss Analysis Report", "Leakage Analysis", "Savings Ledger"]
  },
  {
    id: "cod-rto-rate",
    title: "COD RTO rate",
    formula: "COD orders marked RTO / total COD orders",
    whyItMatters: "COD orders usually carry the highest preventable delivery risk, so this rate shows whether COD policy needs attention.",
    usedIn: ["Profit Overview", "Weekly Executive Report", "Policy Simulator"]
  },
  {
    id: "recoverable-leakage",
    title: "Recoverable leakage",
    formula: "Sum of estimated leakage on open actionable orders",
    whyItMatters: "This narrows the dashboard from all historic loss to the money the team can still influence today.",
    usedIn: ["Daily Briefing", "Priority Work Queue", "Leakage Analysis"]
  },
  {
    id: "ndr-sla-risk",
    title: "NDR SLA risk",
    formula: "Hours since NDR / configured NDR SLA hours",
    whyItMatters: "NDR cases become harder to recover as the courier SLA window closes, so urgency increases with time.",
    usedIn: ["NDR Management", "Priority Work Queue"]
  },
  {
    id: "prepaid-conversion-saving",
    title: "Prepaid conversion saving",
    formula: "Estimated RTO loss per order x assumed risk reduction",
    whyItMatters: "This estimates the benefit of converting selected high-risk COD orders to prepaid with a controlled incentive.",
    usedIn: ["Prepaid Conversion", "Policy Simulator", "Savings Ledger"]
  },
  {
    id: "net-estimated-benefit",
    title: "Net estimated benefit",
    formula: "Estimated savings - software cost - messaging cost - intervention cost",
    whyItMatters: "A seller should not only see rescued value; they should see whether the workflow is worth running after costs.",
    usedIn: ["Savings Ledger", "Plans & Billing", "Weekly Executive Report"]
  },
  {
    id: "policy-simulator-benefit",
    title: "Policy simulator net benefit",
    formula: "Assumed saved leakage - intervention cost - lost contribution",
    whyItMatters: "This keeps policy experiments honest by showing both saved leakage and possible lost profitable orders.",
    usedIn: ["Policy Simulator", "Monthly Strategy"]
  }
];

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: "COD",
    definition: "Cash on Delivery. The customer pays at delivery instead of before shipment.",
    operatorNote: "COD needs stronger confirmation because refusal, phone unreachable, and fake intent can create preventable RTO."
  },
  {
    term: "RTO",
    definition: "Return to Origin. The shipment failed delivery and is returned to the seller.",
    operatorNote: "RTO typically burns forward shipping, return shipping, packaging, acquisition cost, COD fees, and support effort."
  },
  {
    term: "NDR",
    definition: "Non-Delivery Report. A courier event showing that delivery could not be completed.",
    operatorNote: "Treat NDR as the rescue window before an order becomes RTO."
  },
  {
    term: "SLA",
    definition: "Service Level Agreement. The time window in which the team should act before risk escalates.",
    operatorNote: "NDRs near SLA breach should be handled before lower-risk confirmations."
  },
  {
    term: "Recoverable leakage",
    definition: "Estimated money at risk on orders where an action can still change the outcome.",
    operatorNote: "Use this to decide what must be done today, not to claim guaranteed savings."
  },
  {
    term: "Estimated savings",
    definition: "Directional value protected by an intervention such as NDR rescue, prepaid conversion, or cancellation before shipping.",
    operatorNote: "Keep estimated savings separate from verified savings until the final shipment outcome is known."
  },
  {
    term: "Verified savings",
    definition: "Savings confirmed after the order outcome supports the intervention.",
    operatorNote: "Use verified savings in founder reviews and renewal conversations."
  },
  {
    term: "Risk bucket",
    definition: "A readable group such as Low, Medium, High, or Critical based on risk score and reasons.",
    operatorNote: "Risk bucket should guide action speed, not replace human judgment on high-value orders."
  },
  {
    term: "Address quality",
    definition: "A score based on completeness and clarity of delivery address fields.",
    operatorNote: "Low address quality should trigger correction before dispatch or reattempt."
  },
  {
    term: "Pincode-courier lane",
    definition: "The combination of delivery pincode and courier partner.",
    operatorNote: "Repeated leakage in a lane can justify a courier switch test, not an immediate permanent block."
  },
  {
    term: "Policy test",
    definition: "A limited experiment that changes one rule, such as COD hold, courier switch, or prepaid incentive.",
    operatorNote: "Run policy tests with a defined time period, affected order count, expected benefit, and review date."
  },
  {
    term: "Savings proof",
    definition: "The ledger of actions, outcomes, and estimated or verified value protected.",
    operatorNote: "This is the evidence layer that makes premium pricing defensible."
  }
];

export const dataReadinessChecklist: DataReadinessItem[] = [
  {
    field: "Order ID and AWB",
    purpose: "Tie every recommendation, message, NDR case, and outcome to the correct shipment.",
    requiredFor: "Priority Work Queue, NDR Management, Savings Ledger"
  },
  {
    field: "Payment mode",
    purpose: "Separate COD exposure from prepaid orders so risk policy is not applied blindly.",
    requiredFor: "COD RTO rate, Prepaid Conversion, Policy Simulator"
  },
  {
    field: "Final shipment status",
    purpose: "Identify delivered, cancelled, and RTO outcomes for loss and savings calculations.",
    requiredFor: "Loss Analysis Report, Weekly Executive Report"
  },
  {
    field: "NDR reason and NDR time",
    purpose: "Prioritize failed deliveries by reason, urgency, and SLA risk.",
    requiredFor: "NDR Management, Priority Work Queue"
  },
  {
    field: "Pincode and courier",
    purpose: "Find courier lanes where delivery performance is creating repeated leakage.",
    requiredFor: "Pincode Analysis, Courier Analysis, Leakage Analysis"
  },
  {
    field: "SKU or product name",
    purpose: "Identify products where size, promise, price, or expectation mismatch may be driving returns.",
    requiredFor: "SKU Analysis, Monthly Strategy"
  },
  {
    field: "Campaign or UTM",
    purpose: "Connect low-intent demand sources to COD risk and RTO leakage.",
    requiredFor: "Campaign Analysis, Founder reporting"
  },
  {
    field: "Cost assumptions",
    purpose: "Make RTO loss and savings estimates credible for the brand's actual economics.",
    requiredFor: "All formulas and savings proof"
  }
];

export const dashboardLearningTracks: LearningTrack[] = [
  {
    module: "Daily Briefing",
    cadence: "Every morning",
    value: "Check urgent NDRs, critical COD risk, top leakage driver, recoverable value, and the next best action.",
    targetView: "briefing"
  },
  {
    module: "Priority Work Queue",
    cadence: "During ops shifts",
    value: "Work one action at a time so the team does not lose money by scanning a large table.",
    targetView: "missions"
  },
  {
    module: "Leakage Analysis",
    cadence: "After imports and weekly review",
    value: "See whether leakage is concentrated in COD risk, NDR SLA, address quality, courier lanes, SKUs, campaigns, or proof gaps.",
    targetView: "atlas"
  },
  {
    module: "NDR Management",
    cadence: "Multiple times per day",
    value: "Rescue failed delivery attempts before the courier marks them RTO.",
    targetView: "ndr"
  },
  {
    module: "Savings Ledger",
    cadence: "End of day and weekly",
    value: "Separate estimated savings from verified savings and show what the workflow protected.",
    targetView: "savings"
  },
  {
    module: "Policy Simulator",
    cadence: "Before changing rules",
    value: "Estimate the upside and downside of COD holds, prepaid incentives, or courier changes before rollout.",
    targetView: "simulator"
  }
];

export const systemPrinciples = [
  "Recommendations come before tables because sellers need decisions before raw data.",
  "Every action should connect to an order, reason, estimated leakage, and final outcome.",
  "Use policy tests before permanent changes to COD, courier, pincode, SKU, or campaign rules.",
  "Treat all savings numbers as directional until the shipment outcome verifies them.",
  "Keep customer data limited to delivery, RTO, and NDR operations with role-based access."
];
