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

export const currentWedgeId = "revenue-leakage-control";

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
    domain: "Future locked: true profit, hidden fees, ad waste, low-margin orders",
    jobToBeDone: "Stop teams from scaling orders that look like revenue but destroy contribution margin.",
    firstSignals: ["gross margin", "discount", "ad source", "shipping fee", "COD fee", "return cost"],
    decisionOutput: "Locked future candidate: profit-per-order guardrails and margin-safe growth actions",
    unlockAfter: "LOCKED: unlock only after Revenue Leakage Control proves savings and sellers trust the margin data.",
    status: "future_locked"
  },
  {
    id: "settlement-recovery",
    name: "Settlement Recovery",
    domain: "Future locked: COD remittance, fee deductions, payout delays, courier invoice mismatch",
    jobToBeDone: "Recover money that was earned operationally but leaked in remittance and reconciliation.",
    firstSignals: ["COD remittance", "courier invoice", "order payout", "weight charge", "return charge"],
    decisionOutput: "Locked future candidate: dispute queue, payout variance report, recovery proof",
    unlockAfter: "LOCKED: unlock only after finance can verify evidence from exports, invoices, payouts, and audit logs.",
    status: "future_locked"
  },
  {
    id: "inventory-intelligence",
    name: "Inventory Intelligence",
    domain: "Future locked: stockouts, dead stock, inventory capital, reorder timing",
    jobToBeDone: "Turn demand quality and delivery reality into inventory decisions, not just reorder alerts.",
    firstSignals: ["SKU velocity", "RTO by SKU", "stock on hand", "lead time", "margin", "dead stock age"],
    decisionOutput: "Locked future candidate: reorder, pause, bundle, liquidate, or fix product promise",
    unlockAfter: "LOCKED: unlock only after SKU leakage, stock data, lead times, and margin proof are reliable.",
    status: "future_locked"
  },
  {
    id: "returns-engine",
    name: "Returns Engine",
    domain: "Future locked: return reasons, reverse pickup, refund abuse, product mismatch",
    jobToBeDone: "Separate genuine returns from avoidable promise, sizing, fraud, and logistics failures.",
    firstSignals: ["return reason", "reverse pickup status", "refund amount", "SKU", "support reason"],
    decisionOutput: "Locked future candidate: return prevention queue, abuse flags, product-page fixes",
    unlockAfter: "LOCKED: unlock only after return data proves a distinct workflow beyond COD/RTO/NDR recovery.",
    status: "future_locked"
  },
  {
    id: "marketplace-shield",
    name: "Marketplace Shield",
    domain: "Future locked: account health, suppressed listings, claims, marketplace penalties",
    jobToBeDone: "Protect seller accounts from operational issues that become platform penalties.",
    firstSignals: ["claim type", "listing status", "late shipment", "cancellation", "buyer complaint"],
    decisionOutput: "Locked future candidate: account-risk watchlist and corrective SOPs",
    unlockAfter: "LOCKED: unlock only after marketplace data and corrective SOP outcomes are verified.",
    status: "future_locked"
  },
  {
    id: "ai-operations-agent",
    name: "AI Operations Agent",
    domain: "Future locked: daily business analyst, task creation, approvals, SOP automation",
    jobToBeDone: "Coordinate the operating system only after rules, proofs, permissions, and rollback paths exist.",
    firstSignals: ["audited decisions", "verified savings", "approved SOPs", "role permissions", "integration events"],
    decisionOutput: "Locked future candidate: draft tasks, explain decisions, request approval, learn from outcomes",
    unlockAfter: "LOCKED: unlock only after human-approved execution, permissions, audit logs, and rollback paths are reliable.",
    status: "future_locked"
  }
];

export function buildFutureOsBoundary(modules = futureOsModules) {
  const active = modules.filter((module) => module.id === currentWedgeId && module.status === "current_wedge");
  const locked = modules.filter((module) => module.id !== currentWedgeId);
  return {
    activeCount: active.length,
    lockedCount: locked.length,
    headline: "Only Revenue Leakage Control is active. Every broader Wembro OS module is future-locked.",
    boundaryRule: "Do not present inventory, returns, settlement, marketplace health, profit tower, or AI agent modules as live until the current wedge proves data reliability, daily action, savings proof, and founder trust.",
    proofGates: [
      "Revenue Leakage Control has repeatable pilot proof from real seller CSVs.",
      "Trusted data, lineage, validation, and low-sample warnings exist for the module.",
      "The module produces one daily decision and one human-approved action.",
      "Audit evidence separates estimated value from seller-verified value.",
      "Manual fallback exists before any live integration, automation, or ML."
    ],
    active,
    locked
  };
}
