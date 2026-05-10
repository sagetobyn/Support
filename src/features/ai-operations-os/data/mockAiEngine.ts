import type {
  AgentDefinition,
  AgentId,
  AgentInputRequirement,
  AgentOutputType,
  AgentRun,
  AutomationLevel,
  ExecutionState,
  RiskLevel
} from "../domain/types";

export interface AiFindingSeed {
  id: string;
  agentId: AgentId;
  title: string;
  summary: string;
  outputType: AgentOutputType;
  riskLevel: RiskLevel;
  impactAmount: number;
  urgencyScore: number;
  frequencyScore: number;
  entityIds: string[];
  ruleClarity: number;
  impactClarity: number;
  explanationSummary: string;
  actionType: string;
  actionLabel: string;
  actionDescription: string;
  actionOwner: string;
  actionNextStep: string;
  automationLevel: AutomationLevel;
  automationState: Extract<ExecutionState, "recommended" | "drafted" | "awaiting_approval">;
  approvalRequired: boolean;
  policyChecks: string[];
  rollbackPlan: string;
  createdAt: string;
}

export const agentRegistry: AgentDefinition[] = [
  {
    id: "chief-operations-agent",
    name: "Chief Operations Agent",
    purpose: "Ranks cross-domain issues and produces the seller's daily operating briefing.",
    inputRequirements: ["structured findings", "data quality", "source freshness", "seller rules"],
    possibleActions: ["Rank priorities", "Create executive briefing", "Prepare policy handoff"],
    modelConfigId: "model-chief-ops",
    status: "active",
    confidence: 94,
    sevenDayImpact: 2102040
  },
  {
    id: "profit-leakage-engine",
    name: "Profit Leakage Engine",
    purpose: "Finds money leaks across RTO, returns, deductions, inventory, ads, and pricing.",
    inputRequirements: ["orders", "returns", "settlements", "deductions", "ads", "inventory"],
    possibleActions: ["Create leakage insight", "Prepare recovery opportunity", "Escalate margin risk"],
    modelConfigId: "model-profit",
    status: "active",
    confidence: 93,
    sevenDayImpact: 1874230
  },
  {
    id: "rto-ndr-engine",
    name: "RTO/NDR Engine",
    purpose: "Detects preventable delivery failures and high-risk COD/pincode patterns.",
    inputRequirements: ["orders", "shipments", "NDR", "RTO", "pincode", "courier"],
    possibleActions: ["Draft NDR workflow", "Recommend COD rule", "Create delivery rescue task"],
    modelConfigId: "model-rto",
    status: "active",
    confidence: 91,
    sevenDayImpact: 721430
  },
  {
    id: "return-intelligence-engine",
    name: "Return Intelligence Engine",
    purpose: "Finds repeat return reasons and product/listing promises causing avoidable loss.",
    inputRequirements: ["returns", "refunds", "reviews", "support cases", "listings", "SKU mappings"],
    possibleActions: ["Cluster return reasons", "Draft listing fix", "Create product quality task"],
    modelConfigId: "model-return",
    status: "watching",
    confidence: 89,
    sevenDayImpact: 618900
  },
  {
    id: "settlement-reconciliation-engine",
    name: "Settlement Reconciliation Engine",
    purpose: "Finds payout mismatches, unexplained deductions, and settlement-to-order gaps.",
    inputRequirements: ["orders", "settlements", "deductions", "refunds", "bank statements"],
    possibleActions: ["Create mismatch task", "Prepare evidence bundle", "Draft reimbursement action"],
    modelConfigId: "model-settlement",
    status: "active",
    confidence: 90,
    sevenDayImpact: 573600
  },
  {
    id: "claims-recovery-agent",
    name: "Claims Recovery Agent",
    purpose: "Turns validated mismatches and courier exceptions into claim-ready evidence packets.",
    inputRequirements: ["claims", "deductions", "settlements", "shipments", "marketplace reports"],
    possibleActions: ["Draft claim", "Prepare reimbursement evidence", "Create finance review task"],
    modelConfigId: "model-claims",
    status: "drafting",
    confidence: 88,
    sevenDayImpact: 312840
  },
  {
    id: "inventory-intelligence-engine",
    name: "Inventory Intelligence Engine",
    purpose: "Flags stockout risk, dead stock, carrying-cost leakage, and supplier timing issues.",
    inputRequirements: ["inventory", "SKU", "orders", "returns", "supplier", "purchase orders"],
    possibleActions: ["Create reorder recommendation", "Flag liquidation candidate", "Prepare supplier escalation"],
    modelConfigId: "model-inventory",
    status: "active",
    confidence: 94,
    sevenDayImpact: 533900
  },
  {
    id: "customer-support-agent",
    name: "Customer Support Agent",
    purpose: "Creates safe support recommendations from customer cases, order state, and seller tone rules.",
    inputRequirements: ["support cases", "customers", "orders", "warranty cases", "support tone"],
    possibleActions: ["Draft support reply", "Create escalation task", "Summarize customer risk"],
    modelConfigId: "model-support",
    status: "watching",
    confidence: 86,
    sevenDayImpact: 179600
  },
  {
    id: "pricing-profitability-agent",
    name: "Pricing & Profitability Agent",
    purpose: "Protects margin before pricing, ads, inventory, or promotion decisions move forward.",
    inputRequirements: ["SKU", "ads", "settlements", "deductions", "inventory", "seller margin rules"],
    possibleActions: ["Create margin guardrail", "Recommend price review", "Block unsafe discount suggestion"],
    modelConfigId: "model-pricing",
    status: "watching",
    confidence: 88,
    sevenDayImpact: 248700
  },
  {
    id: "marketing-growth-agent",
    name: "Marketing/Growth Agent",
    purpose: "Skeleton for profit-aware growth recommendations that respect RTO, return, inventory, and margin risk.",
    inputRequirements: ["listings", "ads", "reviews", "keywords", "inventory", "margin"],
    possibleActions: ["Draft growth insight", "Recommend campaign review", "Enforce profit guardrails"],
    modelConfigId: "model-marketing",
    status: "needs_data",
    confidence: 82,
    sevenDayImpact: 0
  }
];

export const agentInputRequirements: Record<AgentId, AgentInputRequirement[]> = {
  "chief-operations-agent": [
    { entityType: "order", label: "Operational findings", required: true, minimumConfidence: 90, sourceNotes: "Structured findings from specialist engines." }
  ],
  "profit-leakage-engine": [
    { entityType: "order", label: "Orders", required: true, minimumConfidence: 95, sourceNotes: "Canonical orders with payment and marketplace IDs." },
    { entityType: "settlement", label: "Settlements", required: true, minimumConfidence: 95, sourceNotes: "Payout and deduction records." },
    { entityType: "ad_campaign", label: "Ad campaigns", required: false, minimumConfidence: 85, sourceNotes: "Profit-aware growth leakage inputs." }
  ],
  "rto-ndr-engine": [
    { entityType: "shipment", label: "Shipments", required: true, minimumConfidence: 90, sourceNotes: "Courier and marketplace delivery events." },
    { entityType: "ndr", label: "NDR records", required: true, minimumConfidence: 90, sourceNotes: "Open delivery exception records." },
    { entityType: "pincode", label: "Pincode risk", required: true, minimumConfidence: 85, sourceNotes: "RTO and NDR risk clusters." }
  ],
  "return-intelligence-engine": [
    { entityType: "return", label: "Returns", required: true, minimumConfidence: 90, sourceNotes: "Return records mapped to order and SKU." },
    { entityType: "review", label: "Reviews", required: false, minimumConfidence: 80, sourceNotes: "Review themes used as supporting evidence." }
  ],
  "settlement-reconciliation-engine": [
    { entityType: "settlement", label: "Settlements", required: true, minimumConfidence: 95, sourceNotes: "Canonical settlement records with bank references." },
    { entityType: "deduction", label: "Deductions", required: true, minimumConfidence: 90, sourceNotes: "Fee and penalty rows mapped to orders." }
  ],
  "claims-recovery-agent": [
    { entityType: "claim", label: "Claim candidates", required: true, minimumConfidence: 90, sourceNotes: "Evidence-ready claim records." },
    { entityType: "deduction", label: "Deductions", required: true, minimumConfidence: 90, sourceNotes: "Deduction source rows for reimbursement packet." }
  ],
  "inventory-intelligence-engine": [
    { entityType: "inventory_item", label: "Inventory items", required: true, minimumConfidence: 90, sourceNotes: "Stock levels mapped to canonical SKUs." },
    { entityType: "purchase_order", label: "Purchase orders", required: false, minimumConfidence: 85, sourceNotes: "Supplier timing and reorder context." }
  ],
  "customer-support-agent": [
    { entityType: "support_case", label: "Support cases", required: true, minimumConfidence: 80, sourceNotes: "Cases mapped to order and SKU where possible." },
    { entityType: "warranty_case", label: "Warranty cases", required: false, minimumConfidence: 80, sourceNotes: "Warranty context for safe response drafts." }
  ],
  "pricing-profitability-agent": [
    { entityType: "sku", label: "SKU", required: true, minimumConfidence: 90, sourceNotes: "SKU mapped across marketplaces." },
    { entityType: "ad_campaign", label: "Ad campaigns", required: false, minimumConfidence: 85, sourceNotes: "Spend and attributed order inputs." }
  ],
  "marketing-growth-agent": [
    { entityType: "listing", label: "Listings", required: true, minimumConfidence: 85, sourceNotes: "Content surface for future growth recommendations." },
    { entityType: "review", label: "Reviews", required: false, minimumConfidence: 80, sourceNotes: "Customer language and sentiment inputs." },
    { entityType: "ad_campaign", label: "Ad campaigns", required: false, minimumConfidence: 80, sourceNotes: "Growth inputs remain bounded by profitability." }
  ]
};

export const agentFindingSeeds: AiFindingSeed[] = [
  {
    id: "finding-profit-leakage-001",
    agentId: "profit-leakage-engine",
    title: "₹18.74L leakage concentrated in RTO, deductions, and ad-funded COD orders",
    summary: "The largest recoverable leak combines invalid RTO losses, unusual deductions, and paid traffic that converts into risky COD orders.",
    outputType: "recommendation",
    riskLevel: "high",
    impactAmount: 1874230,
    urgencyScore: 92,
    frequencyScore: 88,
    entityIds: ["rto-11ab7c", "ded-7712", "adcamp-festival-audio", "ord-91aa3f"],
    ruleClarity: 91,
    impactClarity: 96,
    explanationSummary: "Multiple high-confidence entities point to the same loss path: risky COD delivery, deduction mismatch, and paid demand quality.",
    actionType: "profit_leakage_review",
    actionLabel: "Open leakage recovery workstream",
    actionDescription: "Create a finance and ops review packet before any marketplace action is attempted.",
    actionOwner: "Operations",
    actionNextStep: "Review the top three leakage sources and approve specialist actions one by one.",
    automationLevel: 1,
    automationState: "recommended",
    approvalRequired: true,
    policyChecks: ["Seller approval required", "No marketplace write permission used", "Automation layer must split claim and COD actions"],
    rollbackPlan: "No external state changes are made; dismissing the recommendation only closes the draft intent.",
    createdAt: "2026-05-10T09:12:00.000Z"
  },
  {
    id: "finding-rto-ndr-001",
    agentId: "rto-ndr-engine",
    title: "High-risk 560102 NDR cluster can still be rescued",
    summary: "COD order #404-8750123, open NDR, and the 560102 RTO cluster show a preventable delivery failure pattern.",
    outputType: "draft_action",
    riskLevel: "high",
    impactAmount: 842100,
    urgencyScore: 94,
    frequencyScore: 81,
    entityIds: ["ord-91aa3f", "ship-awb-2261d", "ndr-2261d", "pin-560102", "rto-11ab7c"],
    ruleClarity: 88,
    impactClarity: 93,
    explanationSummary: "Courier exception, pincode risk, and COD order data agree that intervention is time-sensitive but needs approval.",
    actionType: "ndr_rescue_draft",
    actionLabel: "Draft NDR rescue workflow",
    actionDescription: "Prepare customer confirmation and pincode review workflow without sending messages.",
    actionOwner: "CX",
    actionNextStep: "Review draft NDR workflow and decide whether to approve customer contact.",
    automationLevel: 2,
    automationState: "drafted",
    approvalRequired: true,
    policyChecks: ["Customer message requires approval", "Quiet-hour rule must be checked", "COD block must stay recommendation-only"],
    rollbackPlan: "Discard drafted workflow; no messages or pincode rules have been sent.",
    createdAt: "2026-05-10T09:13:00.000Z"
  },
  {
    id: "finding-return-intel-001",
    agentId: "return-intelligence-engine",
    title: "Repeat return reason points to product promise mismatch",
    summary: "Return, review, listing, and support data point to fit/battery promise confusion on a high-volume SKU.",
    outputType: "task",
    riskLevel: "medium",
    impactAmount: 618900,
    urgencyScore: 76,
    frequencyScore: 79,
    entityIds: ["ret-11ab7c", "review-airbuds-fit", "list-amazon-airbuds", "support-case-778", "sku-airbuds-pro-black"],
    ruleClarity: 84,
    impactClarity: 89,
    explanationSummary: "Return reason and review language align with the same canonical SKU, so the safest next step is a product/listing review task.",
    actionType: "return_reason_review",
    actionLabel: "Create return reason review task",
    actionDescription: "Prepare a task for listing promise and product QA review.",
    actionOwner: "Catalog",
    actionNextStep: "Inspect the SKU promise, support case, and review cluster before drafting listing changes.",
    automationLevel: 1,
    automationState: "recommended",
    approvalRequired: false,
    policyChecks: ["No listing edit is executed", "Use review data only as supporting evidence", "Keep seller approval before content change"],
    rollbackPlan: "Close the task draft; no marketplace listing is changed.",
    createdAt: "2026-05-10T09:14:00.000Z"
  },
  {
    id: "finding-settlement-001",
    agentId: "settlement-reconciliation-engine",
    title: "Settlement mismatch above configured tolerance",
    summary: "Settlement SET-May-W2 and related deduction rows show a mismatch that should be prepared for finance review.",
    outputType: "draft_action",
    riskLevel: "high",
    impactAmount: 573600,
    urgencyScore: 88,
    frequencyScore: 72,
    entityIds: ["set-2d410", "ded-7712", "refund-404", "ord-91aa3f"],
    ruleClarity: 92,
    impactClarity: 90,
    explanationSummary: "Bank statement, settlement, deduction, and order mapping create a high-confidence reconciliation issue.",
    actionType: "settlement_mismatch_packet",
    actionLabel: "Draft settlement mismatch packet",
    actionDescription: "Prepare finance evidence for review; do not submit or contact marketplace.",
    actionOwner: "Finance",
    actionNextStep: "Review mismatch packet and confirm whether claims recovery should draft reimbursement evidence.",
    automationLevel: 2,
    automationState: "drafted",
    approvalRequired: true,
    policyChecks: ["Finance approval required", "No claim submission", "Evidence must reference source lineage"],
    rollbackPlan: "Delete the draft packet; no external claim is submitted.",
    createdAt: "2026-05-10T09:15:00.000Z"
  },
  {
    id: "finding-claims-001",
    agentId: "claims-recovery-agent",
    title: "Claim draft has enough evidence but must not be submitted automatically",
    summary: "Claim CLM-38912 has source evidence from claim, deduction, and settlement entities but remains review-only.",
    outputType: "draft_action",
    riskLevel: "high",
    impactAmount: 124500,
    urgencyScore: 83,
    frequencyScore: 55,
    entityIds: ["claim-38912", "ded-7712", "set-2d410"],
    ruleClarity: 89,
    impactClarity: 86,
    explanationSummary: "Evidence count and lineage are sufficient for a draft, but claim submission is a risky marketplace action.",
    actionType: "claim_draft",
    actionLabel: "Prepare reimbursement claim draft",
    actionDescription: "Generate a claim draft and evidence checklist for seller review only.",
    actionOwner: "Finance",
    actionNextStep: "Approve evidence bundle before any marketplace claim submission is considered.",
    automationLevel: 2,
    automationState: "drafted",
    approvalRequired: true,
    policyChecks: ["Claim submission blocked", "Seller approval required", "Evidence lineage required"],
    rollbackPlan: "Discard draft claim packet; no marketplace ticket is created.",
    createdAt: "2026-05-10T09:16:00.000Z"
  },
  {
    id: "finding-inventory-001",
    agentId: "inventory-intelligence-engine",
    title: "Stockout risk on mapped high-confidence SKU",
    summary: "Inventory for Noise Air Buds Pro 2 is at risk while supplier lead time and purchase order timing are visible.",
    outputType: "task",
    riskLevel: "medium",
    impactAmount: 533900,
    urgencyScore: 79,
    frequencyScore: 63,
    entityIds: ["inv-312009", "sku-airbuds-pro-black", "supplier-audio-one", "po-audio-778"],
    ruleClarity: 86,
    impactClarity: 88,
    explanationSummary: "Inventory, SKU mapping, supplier, and PO entities align well enough to create a reorder review task.",
    actionType: "reorder_recommendation",
    actionLabel: "Create reorder recommendation",
    actionDescription: "Prepare reorder and supplier timing recommendation without changing stock quantities.",
    actionOwner: "Supply Chain",
    actionNextStep: "Confirm supplier timing and decide whether to create a purchase order task.",
    automationLevel: 1,
    automationState: "recommended",
    approvalRequired: false,
    policyChecks: ["No inventory write action", "Supplier order not created", "Seller reorder rule must be checked later"],
    rollbackPlan: "Close recommendation; no inventory or supplier system is changed.",
    createdAt: "2026-05-10T09:17:00.000Z"
  },
  {
    id: "finding-support-001",
    agentId: "customer-support-agent",
    title: "Support reply can be drafted, not sent",
    summary: "Support and warranty cases map to the same SKU and order, making a safe response draft possible.",
    outputType: "draft_action",
    riskLevel: "medium",
    impactAmount: 179600,
    urgencyScore: 68,
    frequencyScore: 51,
    entityIds: ["support-case-778", "warranty-778", "cust-8bd27", "ord-91aa3f", "sku-airbuds-pro-black"],
    ruleClarity: 80,
    impactClarity: 78,
    explanationSummary: "Case context is usable but support ingestion has lower confidence, so the engine only drafts a response.",
    actionType: "support_reply_draft",
    actionLabel: "Draft support reply",
    actionDescription: "Prepare a response in the seller's configured tone and keep it in draft state.",
    actionOwner: "CX",
    actionNextStep: "Review order status and warranty context before sending.",
    automationLevel: 2,
    automationState: "drafted",
    approvalRequired: true,
    policyChecks: ["Customer message is not sent", "Quiet-hour rule required", "Support source needs review"],
    rollbackPlan: "Delete response draft; no customer message is sent.",
    createdAt: "2026-05-10T09:18:00.000Z"
  },
  {
    id: "finding-pricing-001",
    agentId: "pricing-profitability-agent",
    title: "Price and ad decisions need margin guardrail before approval",
    summary: "Ad spend, SKU mapping, and settlement deductions show pricing decisions should be blocked below margin rules.",
    outputType: "recommendation",
    riskLevel: "medium",
    impactAmount: 248700,
    urgencyScore: 70,
    frequencyScore: 58,
    entityIds: ["sku-airbuds-pro-black", "adcamp-festival-audio", "kw-wireless-earbuds", "ded-7712", "set-2d410"],
    ruleClarity: 93,
    impactClarity: 82,
    explanationSummary: "Profitability context exists, but the safe output is a guardrail recommendation rather than a price update.",
    actionType: "margin_guardrail_recommendation",
    actionLabel: "Recommend margin guardrail",
    actionDescription: "Prepare a pricing guardrail recommendation based on seller margin rules.",
    actionOwner: "Finance",
    actionNextStep: "Review margin floor before any price or ad-budget recommendation is applied.",
    automationLevel: 1,
    automationState: "recommended",
    approvalRequired: true,
    policyChecks: ["No price update", "Margin floor required", "Seller approval before marketplace change"],
    rollbackPlan: "Dismiss guardrail recommendation; no price or ad setting is changed.",
    createdAt: "2026-05-10T09:19:00.000Z"
  },
  {
    id: "finding-marketing-skeleton-001",
    agentId: "marketing-growth-agent",
    title: "Growth recommendations stay locked behind profit guardrails",
    summary: "The marketing skeleton can observe listing, review, keyword, and ad campaign inputs, but it only emits a profit-aware insight.",
    outputType: "insight",
    riskLevel: "low",
    impactAmount: 0,
    urgencyScore: 35,
    frequencyScore: 40,
    entityIds: ["list-amazon-airbuds", "review-airbuds-fit", "adcamp-festival-audio", "kw-wireless-earbuds", "sku-airbuds-pro-black"],
    ruleClarity: 76,
    impactClarity: 70,
    explanationSummary: "Marketing inputs exist, but the agent remains a skeleton and must optimize for profit, return risk, RTO risk, and inventory position before action.",
    actionType: "profit_aware_growth_review",
    actionLabel: "Keep growth in review mode",
    actionDescription: "Surface profit-aware growth context without drafting campaign or listing changes.",
    actionOwner: "Growth",
    actionNextStep: "Wait for Phase 9 marketing workflows before creating content or ad actions.",
    automationLevel: 1,
    automationState: "recommended",
    approvalRequired: false,
    policyChecks: ["No campaign draft", "No listing edit", "Profit guardrails required before marketing action"],
    rollbackPlan: "Archive the insight; no campaign, listing, or budget setting is changed.",
    createdAt: "2026-05-10T09:20:00.000Z"
  }
];

export const agentRuns: AgentRun[] = agentRegistry.map((agent) => ({
  id: `run-${agent.id}-20260510`,
  agentId: agent.id as AgentId,
  status: agent.id === "marketing-growth-agent" ? "needs_data" : "completed",
  startedAt: "2026-05-10T09:10:00.000Z",
  completedAt: agent.id === "marketing-growth-agent" ? undefined : "2026-05-10T09:21:00.000Z",
  inputEntityCount: agentFindingSeeds
    .filter((finding) => finding.agentId === agent.id)
    .reduce((sum, finding) => sum + finding.entityIds.length, 0),
  findingCount: agentFindingSeeds.filter((finding) => finding.agentId === agent.id).length,
  message:
    agent.id === "marketing-growth-agent"
      ? "Skeleton is observing growth data but will not draft marketing actions until Phase 9."
      : "Deterministic mock run completed from normalized data brain inputs."
}));
