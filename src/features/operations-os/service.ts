export type FutureModuleStatus = "current_wedge" | "future_locked";

export interface FutureOsModule {
  id: string;
  name: string;
  domain: string;
  jobToBeDone: string;
  firstSignals: string[];
  decisionOutput: string;
  unlockAfter: string;
  status: FutureModuleStatus;
}

export const futureOsModules: FutureOsModule[] = [
  {
    id: "revenue-leakage-control",
    name: "Revenue Leakage Control",
    domain: "RTO, NDR, COD risk, courier/pincode leakage",
    jobToBeDone: "Find preventable post-checkout leakage, tell the team what to fix today, and prove savings.",
    firstSignals: ["shipment status", "NDR reason", "payment mode", "pincode", "courier", "order value"],
    decisionOutput: "Daily priority queue, leakage atlas, savings ledger, founder decision brief",
    unlockAfter: "Active now as the first wedge.",
    status: "current_wedge"
  },
  {
    id: "profit-control-tower",
    name: "Profit Control Tower",
    domain: "True profit, hidden fees, ad waste, low-margin orders",
    jobToBeDone: "Stop teams from scaling orders that look like revenue but destroy contribution margin.",
    firstSignals: ["gross margin", "discount", "ad source", "shipping fee", "COD fee", "return cost"],
    decisionOutput: "Profit-per-order guardrails and margin-safe growth actions",
    unlockAfter: "Savings proof shows sellers trust Wembro's rupee math.",
    status: "future_locked"
  },
  {
    id: "settlement-recovery",
    name: "Settlement Recovery",
    domain: "COD remittance, fee deductions, payout delays, courier invoice mismatch",
    jobToBeDone: "Recover money that was earned operationally but leaked in remittance and reconciliation.",
    firstSignals: ["COD remittance", "courier invoice", "order payout", "weight charge", "return charge"],
    decisionOutput: "Dispute queue, payout variance report, recovery proof",
    unlockAfter: "Finance can verify savings events and export evidence cleanly.",
    status: "future_locked"
  },
  {
    id: "inventory-intelligence",
    name: "Inventory Intelligence",
    domain: "Stockouts, dead stock, inventory capital, reorder timing",
    jobToBeDone: "Turn demand quality and delivery reality into inventory decisions, not just reorder alerts.",
    firstSignals: ["SKU velocity", "RTO by SKU", "stock on hand", "lead time", "margin", "dead stock age"],
    decisionOutput: "Reorder, pause, bundle, liquidate, or fix product promise",
    unlockAfter: "SKU leakage and margin-aware proof are reliable.",
    status: "future_locked"
  },
  {
    id: "returns-engine",
    name: "Returns Engine",
    domain: "Return reasons, reverse pickup, refund abuse, product mismatch",
    jobToBeDone: "Separate genuine returns from avoidable promise, sizing, fraud, and logistics failures.",
    firstSignals: ["return reason", "reverse pickup status", "refund amount", "SKU", "support reason"],
    decisionOutput: "Return prevention queue, abuse flags, product-page fixes",
    unlockAfter: "NDR/RTO reason taxonomy is stable and trusted.",
    status: "future_locked"
  },
  {
    id: "marketplace-shield",
    name: "Marketplace Shield",
    domain: "Account health, suppressed listings, claims, marketplace penalties",
    jobToBeDone: "Protect seller accounts from operational issues that become platform penalties.",
    firstSignals: ["claim type", "listing status", "late shipment", "cancellation", "buyer complaint"],
    decisionOutput: "Account-risk watchlist and corrective SOPs",
    unlockAfter: "Daily execution system reliably creates and closes corrective tasks.",
    status: "future_locked"
  },
  {
    id: "ai-operations-agent",
    name: "AI Operations Agent",
    domain: "Daily business analyst, task creation, approvals, SOP automation",
    jobToBeDone: "Coordinate the operating system only after rules, proofs, permissions, and rollback paths exist.",
    firstSignals: ["audited decisions", "verified savings", "approved SOPs", "role permissions", "integration events"],
    decisionOutput: "Draft tasks, explain decisions, request approval, learn from outcomes",
    unlockAfter: "Human-approved execution is boringly reliable.",
    status: "future_locked"
  }
];

export function buildFutureOsBoundary(modules = futureOsModules) {
  const active = modules.filter((module) => module.status === "current_wedge");
  const locked = modules.filter((module) => module.status === "future_locked");
  return {
    activeCount: active.length,
    lockedCount: locked.length,
    headline: "Wembro can become an ecommerce operations OS, but only one wedge earns that right first.",
    boundaryRule: "Do not activate a future module until the current wedge proves data reliability, daily action, savings proof, and founder trust.",
    proofGates: [
      "Trusted data fields exist for the module.",
      "The module can produce one clear decision, not another dashboard.",
      "A human can act on the recommendation this week.",
      "Savings, protected value, or avoided loss can be verified.",
      "The workflow fits Data -> Insight -> Decision -> Action -> Learning."
    ],
    active,
    locked
  };
}
