import type {
  AutomationCapability,
  AutomationCapabilityMatrix,
  AutomationCapabilityStatus,
  AutomationEvidence,
  AutomationPriority,
  AutomationWorkstream,
  SellerWorkstreamId
} from "./types";

const statusDefinitions: AutomationCapabilityMatrix["statusDefinitions"] = [
  {
    status: "missing",
    label: "Missing",
    description: "The seller still does this manually. Wembro has no meaningful product behavior for it yet.",
    canClaimAutomated: false
  },
  {
    status: "ui_only",
    label: "UI only",
    description: "A screen or placeholder exists, but it does not remove seller work.",
    canClaimAutomated: false
  },
  {
    status: "mock",
    label: "Mock",
    description: "A deterministic sample or demo exists, but it is not wired to real seller data and execution proof.",
    canClaimAutomated: false
  },
  {
    status: "local_automation",
    label: "Local automation",
    description: "CSV/demo data can trigger deterministic decisions, work items, audit proof, or local state changes.",
    canClaimAutomated: false
  },
  {
    status: "connected_read",
    label: "Connected read",
    description: "The system can read from a real source or adapter, but cannot safely execute the work yet.",
    canClaimAutomated: false
  },
  {
    status: "ai_decision",
    label: "AI decision",
    description: "The system creates structured findings, recommendations, or drafts from normalized evidence.",
    canClaimAutomated: false
  },
  {
    status: "approval_execution",
    label: "Approval execution",
    description: "The system prepares a real action and executes only after seller approval, with audit proof.",
    canClaimAutomated: true
  },
  {
    status: "autonomous_execution",
    label: "Autonomous execution",
    description: "The system executes under seller rules, caps, monitoring, audit, and rollback.",
    canClaimAutomated: true
  }
];

const statusWeight: Record<AutomationCapabilityStatus, number> = {
  missing: 0,
  ui_only: 8,
  mock: 18,
  local_automation: 42,
  connected_read: 52,
  ai_decision: 64,
  approval_execution: 82,
  autonomous_execution: 100
};

const statusRank = Object.fromEntries(
  Object.entries(statusWeight).map(([status], index) => [status, index])
) as Record<AutomationCapabilityStatus, number>;

type WorkstreamSeed = {
  id: SellerWorkstreamId;
  title: string;
  description: string;
  sellerPain: string;
  priority: AutomationPriority;
  tasks: string[];
};

const workstreamSeeds: WorkstreamSeed[] = [
  {
    id: "catalog",
    title: "Product Listing And Catalog Work",
    description: "Create, localize, validate, and repair marketplace product listings without repeated copy-paste.",
    sellerPain: "Every marketplace has different rules. One mistake can suppress the listing.",
    priority: "medium",
    tasks: [
      "Creating separate listings on each platform",
      "Writing titles differently for each marketplace",
      "Resizing and compressing images",
      "Uploading product images repeatedly",
      "Writing bullet points and specifications",
      "Adding GST, HSN, and category info",
      "Mapping variants manually",
      "Checking listing approval and rejection status",
      "Updating descriptions during festivals and sales",
      "Translating listings into Hindi or regional language",
      "Creating A+ content separately",
      "Fixing catalog errors",
      "Matching marketplace SEO keywords",
      "Updating dimensions and weight repeatedly",
      "Copy-pasting same product data everywhere"
    ]
  },
  {
    id: "inventory",
    title: "Inventory Management",
    description: "Keep stock, returned inventory, bundles, reorder planning, and dead-stock signals synchronized.",
    sellerPain: "Inventory mismatch creates penalties, stockouts, overselling, and lost ranking.",
    priority: "high",
    tasks: [
      "Updating stock separately on all marketplaces",
      "Preventing overselling",
      "Checking warehouse stock in Excel",
      "Reserving stock for COD orders",
      "Adjusting damaged inventory manually",
      "Managing bundle inventory",
      "Syncing returned stock back",
      "Tracking dead inventory",
      "Forecasting reorder quantity",
      "Counting inventory physically",
      "Updating inventory after cancellations"
    ]
  },
  {
    id: "order_processing",
    title: "Order Processing",
    description: "Turn incoming orders into SLA-aware packing, invoicing, dispatch, and warehouse work.",
    sellerPain: "Missing dispatch SLA hurts ranking and keeps the seller checking multiple tabs all day.",
    priority: "high",
    tasks: [
      "Checking new orders every few minutes",
      "Downloading order sheets",
      "Printing invoices manually",
      "Printing shipping labels",
      "Packing product manually",
      "Checking fragile packaging requirements",
      "Marking orders as packed or dispatched",
      "Tracking SLA deadlines",
      "Handling split orders",
      "Coordinating pickup timing with courier",
      "Calling warehouse staff repeatedly"
    ]
  },
  {
    id: "courier_shipping",
    title: "Courier And Shipping Management",
    description: "Detect shipping leakage, pincode risk, NDR rescue opportunities, and courier exception work.",
    sellerPain: "Huge leakage happens in courier selection, failed delivery, delayed shipments, and RTO.",
    priority: "critical",
    tasks: [
      "Comparing courier rates",
      "Checking delivery serviceability by pincode",
      "Choosing courier manually",
      "Tracking RTO-prone locations",
      "Monitoring delayed shipments",
      "Escalating lost shipments",
      "Calculating shipping loss",
      "Reattempting failed deliveries",
      "Handling weight disputes",
      "Uploading manifests",
      "Managing NDR reports"
    ]
  },
  {
    id: "pricing_competition",
    title: "Pricing And Competition Tracking",
    description: "Protect SKU margin while watching competitor movement, commissions, coupons, and Buy Box risk.",
    sellerPain: "Solar light and similar categories become hyper-competitive, and sellers change prices emotionally.",
    priority: "high",
    tasks: [
      "Monitoring competitor prices",
      "Adjusting prices manually",
      "Running discount calculations",
      "Checking Buy Box loss",
      "Updating sale prices during events",
      "Managing ad spend versus margins",
      "Tracking marketplace commissions",
      "Calculating net profit manually",
      "Managing coupon strategies",
      "Tracking price wars"
    ]
  },
  {
    id: "advertising_promotions",
    title: "Advertising And Promotions",
    description: "Find wasted spend, draft campaign decisions, and protect contribution margin before scaling ads.",
    sellerPain: "Most sellers burn money blindly because ads are judged without return, RTO, inventory, and margin context.",
    priority: "medium",
    tasks: [
      "Creating ad campaigns",
      "Choosing keywords manually",
      "Monitoring ACOS and ROAS",
      "Pausing wasteful keywords",
      "Adding negative keywords",
      "Adjusting bids",
      "Running lightning deals",
      "Tracking conversion rate",
      "Managing festival campaigns",
      "Exporting reports into Excel"
    ]
  },
  {
    id: "returns_refunds",
    title: "Returns And Refunds",
    description: "Detect return abuse, damaged returns, refund leakage, and claim opportunities.",
    sellerPain: "Massive hidden losses happen in fake returns, damaged returns, refund leakage, and disputes.",
    priority: "critical",
    tasks: [
      "Checking return reasons",
      "Approving or rejecting returns",
      "Inspecting returned products",
      "Managing fake returns",
      "Identifying damaged returns",
      "Refunding manually",
      "Raising claims against courier",
      "Tracking return abuse",
      "Updating inventory after return",
      "Fighting claim disputes"
    ]
  },
  {
    id: "customer_support",
    title: "Customer Support",
    description: "Draft and route repetitive customer answers, warranty guidance, installation help, and COD follow-ups.",
    sellerPain: "The same questions repeat daily and support work often decides whether COD/NDR becomes RTO.",
    priority: "high",
    tasks: [
      "Answering repetitive questions",
      "Responding to negative reviews",
      "Handling replacement requests",
      "Giving installation guidance",
      "Sharing warranty info",
      "Explaining charging and runtime issues",
      "Handling angry COD customers",
      "Calling customers for address confirmation"
    ]
  },
  {
    id: "finance_accounting",
    title: "Finance And Accounting",
    description: "Reconcile orders, payouts, deductions, ad spend, GST data, claims, and true SKU profit.",
    sellerPain: "The seller often does not know true profit because settlements, deductions, ads, and refunds are scattered.",
    priority: "critical",
    tasks: [
      "Reconciling payouts",
      "Matching orders versus payments",
      "Checking missing settlements",
      "Calculating GST",
      "Exporting reports from each marketplace",
      "Preparing CA sheets",
      "Tracking ad spend",
      "Calculating actual profit per SKU",
      "Managing reimbursement claims",
      "Tracking deductions and penalties"
    ]
  },
  {
    id: "analytics_decisions",
    title: "Analytics And Decision Making",
    description: "Unify marketplace data into seller decisions, not another passive analytics screen.",
    sellerPain: "Data exists everywhere, but insights and decisions are nowhere.",
    priority: "critical",
    tasks: [
      "Downloading CSV reports",
      "Combining Amazon, Flipkart, and Meesho data",
      "Using Excel formulas",
      "Tracking best-selling SKU",
      "Finding slow-moving stock",
      "Identifying high-RTO pincode",
      "Checking courier performance",
      "Forecasting inventory",
      "Monitoring seasonal demand",
      "Detecting leakage manually"
    ]
  },
  {
    id: "procurement_supplier",
    title: "Procurement And Supplier Coordination",
    description: "Turn demand, returns, supplier lead time, and QC issues into reorder and supplier work.",
    sellerPain: "Stockout during demand spikes destroys ranking, while supplier issues stay hidden until too late.",
    priority: "medium",
    tasks: [
      "Calling suppliers",
      "Negotiating rates",
      "Checking raw material costs",
      "Planning reorder quantity",
      "Tracking incoming inventory",
      "Managing supplier delays",
      "Comparing vendor pricing",
      "Managing QC manually"
    ]
  },
  {
    id: "marketplace_compliance",
    title: "Marketplace Compliance",
    description: "Watch account health, policy risk, certificates, GST mismatches, notices, and listing blocks.",
    sellerPain: "One compliance issue can freeze a seller account or suppress a listing.",
    priority: "high",
    tasks: [
      "Monitoring policy violations",
      "Checking account health",
      "Handling blocked listings",
      "Uploading certificates",
      "Managing trademark issues",
      "Fixing GST discrepancies",
      "Responding to marketplace notices",
      "Preventing suspension"
    ]
  },
  {
    id: "team_coordination",
    title: "Team Coordination",
    description: "Route warehouse, support, finance, courier, and ops work without WhatsApp and Excel chaos.",
    sellerPain: "Work is assigned through calls, messages, and shared sheets, so ownership and proof disappear.",
    priority: "medium",
    tasks: [
      "Assigning packing work",
      "Managing warehouse staff",
      "Tracking picker performance",
      "Checking attendance",
      "Calling courier agents",
      "Following up on pending tasks",
      "Training new employees",
      "Sharing Excel sheets on WhatsApp"
    ]
  },
  {
    id: "hidden_manual_work",
    title: "Hidden Manual Work",
    description: "Remove the invisible operating load caused by WhatsApp, Excel, calculators, browser tabs, and repeated decisions.",
    sellerPain: "The seller repeats the same actions daily and sees anomalies only after losses become large.",
    priority: "critical",
    tasks: [
      "Using WhatsApp for operations",
      "Using Excel for truth",
      "Using calculator for profit",
      "Using multiple tabs all day",
      "Repeating same actions daily",
      "Making decisions emotionally",
      "Missing anomalies until losses become huge"
    ]
  }
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 56);
}

function statusForTask(workstreamId: SellerWorkstreamId, task: string): AutomationCapabilityStatus {
  const text = task.toLowerCase();

  if (workstreamId === "courier_shipping") {
    if (/rto|ndr|delayed|shipping loss|reattempt|pincode|courier performance|serviceability/.test(text)) return "local_automation";
    if (/weight dispute|lost shipment/.test(text)) return "ai_decision";
    return "mock";
  }

  if (workstreamId === "analytics_decisions") {
    if (/csv|combining|excel|best-selling|slow-moving|high-rto|courier performance|forecasting|seasonal|leakage/.test(text)) return "local_automation";
    return "mock";
  }

  if (workstreamId === "finance_accounting") {
    if (/reconciling|matching orders|missing settlements|actual profit|deductions|penalties|reimbursement/.test(text)) return "local_automation";
    if (/gst|ca sheets|reports/.test(text)) return "mock";
  }

  if (workstreamId === "returns_refunds") {
    if (/return reasons|fake returns|damaged returns|return abuse|claims|disputes/.test(text)) return "ai_decision";
    if (/inventory after return/.test(text)) return "mock";
    return "ui_only";
  }

  if (workstreamId === "inventory") {
    if (/forecasting|dead inventory|returned stock|cancellations|reorder/.test(text)) return "local_automation";
    if (/overselling|bundle|damaged|reserve/.test(text)) return "mock";
    return "ui_only";
  }

  if (workstreamId === "order_processing") {
    if (/sla|split orders|new orders|order sheets/.test(text)) return "local_automation";
    if (/invoice|shipping labels|packed|dispatched|pickup/.test(text)) return "mock";
    return "ui_only";
  }

  if (workstreamId === "customer_support") {
    if (/repetitive|installation|warranty|charging|runtime|address confirmation|cod/.test(text)) return "ai_decision";
    if (/negative reviews|replacement/.test(text)) return "mock";
    return "ui_only";
  }

  if (workstreamId === "pricing_competition") {
    if (/net profit|commissions|discount|coupon|ad spend/.test(text)) return "local_automation";
    if (/competitor|buy box|price wars|sale prices|adjusting prices/.test(text)) return "mock";
  }

  if (workstreamId === "advertising_promotions") {
    if (/acos|roas|wasteful|negative keywords|bids|conversion|festival|excel/.test(text)) return "ai_decision";
    return "mock";
  }

  if (workstreamId === "catalog") {
    if (/seo|title|bullet|description|a\+|translation|catalog errors/.test(text)) return "ai_decision";
    if (/gst|hsn|variant|dimensions|weight|images/.test(text)) return "mock";
    return "ui_only";
  }

  if (workstreamId === "procurement_supplier") {
    if (/reorder|supplier delays|vendor|qc|incoming inventory/.test(text)) return "mock";
    return "missing";
  }

  if (workstreamId === "marketplace_compliance") {
    if (/gst|blocked listings|policy|account health/.test(text)) return "ui_only";
    return "missing";
  }

  if (workstreamId === "team_coordination") {
    if (/assigning|pending tasks|excel|whatsapp/.test(text)) return "mock";
    return "ui_only";
  }

  if (workstreamId === "hidden_manual_work") {
    if (/excel|calculator|tabs|repeating|anomalies/.test(text)) return "local_automation";
    if (/whatsapp|emotionally/.test(text)) return "mock";
  }

  return "missing";
}

function evidenceForStatus(status: AutomationCapabilityStatus): AutomationEvidence {
  if (status === "missing") {
    return {
      dataInput: false,
      normalizedEntities: false,
      decisionLogic: false,
      actionOutput: false,
      auditEvent: false,
      tests: false,
      externalExecution: false,
      learningLoop: false,
      notes: ["No source data, decision service, action output, or proof exists yet."]
    };
  }

  if (status === "ui_only") {
    return {
      dataInput: false,
      normalizedEntities: false,
      decisionLogic: false,
      actionOutput: false,
      auditEvent: false,
      tests: false,
      externalExecution: false,
      learningLoop: false,
      notes: ["The product may mention this area, but it does not remove work."]
    };
  }

  if (status === "mock") {
    return {
      dataInput: false,
      normalizedEntities: false,
      decisionLogic: true,
      actionOutput: true,
      auditEvent: false,
      tests: true,
      externalExecution: false,
      learningLoop: false,
      notes: ["Demo or static service behavior exists. It is not real automation."]
    };
  }

  if (status === "local_automation") {
    return {
      dataInput: true,
      normalizedEntities: true,
      decisionLogic: true,
      actionOutput: true,
      auditEvent: true,
      tests: true,
      externalExecution: false,
      learningLoop: true,
      notes: ["CSV/demo data can produce deterministic work, proof, and local learning signals."]
    };
  }

  if (status === "connected_read") {
    return {
      dataInput: true,
      normalizedEntities: true,
      decisionLogic: true,
      actionOutput: false,
      auditEvent: true,
      tests: true,
      externalExecution: false,
      learningLoop: false,
      notes: ["The system reads connected data but has no execution path for this work yet."]
    };
  }

  if (status === "ai_decision") {
    return {
      dataInput: true,
      normalizedEntities: true,
      decisionLogic: true,
      actionOutput: true,
      auditEvent: true,
      tests: true,
      externalExecution: false,
      learningLoop: false,
      notes: ["The system creates structured findings or drafts, but execution is not complete."]
    };
  }

  return {
    dataInput: true,
    normalizedEntities: true,
    decisionLogic: true,
    actionOutput: true,
    auditEvent: true,
    tests: true,
    externalExecution: status === "approval_execution" || status === "autonomous_execution",
    learningLoop: true,
    notes: ["This is allowed to claim automation only when real execution proof exists."]
  };
}

function dataSourcesFor(workstreamId: SellerWorkstreamId): string[] {
  const sources: Record<SellerWorkstreamId, string[]> = {
    catalog: ["Marketplace catalog exports", "Product master", "Image folders", "Review and return reasons"],
    inventory: ["Inventory CSV", "Warehouse stock sheet", "Marketplace stock report", "Return report"],
    order_processing: ["Order CSV", "Marketplace order API", "Warehouse pick list", "Courier labels"],
    courier_shipping: ["Order CSV", "Courier/NDR report", "Pincode history", "Shipment webhook"],
    pricing_competition: ["Marketplace fee report", "SKU margin sheet", "Competitor price snapshot", "Ad spend report"],
    advertising_promotions: ["Ad campaign export", "Keyword report", "Order return/RTO data", "Inventory status"],
    returns_refunds: ["Return report", "Refund report", "Courier report", "Inspection notes"],
    customer_support: ["Order data", "NDR cases", "Support inbox", "Reviews", "Warranty policy"],
    finance_accounting: ["Settlement report", "Bank statement", "Order report", "Ad spend export", "GST data"],
    analytics_decisions: ["Amazon CSV", "Flipkart CSV", "Meesho CSV", "Courier CSV", "Settlement CSV"],
    procurement_supplier: ["Sales forecast", "Inventory status", "Supplier lead time", "QC notes"],
    marketplace_compliance: ["Account health export", "Policy notice", "Certificate folder", "GST records"],
    team_coordination: ["Action queue", "SOP library", "Staff assignments", "Courier follow-up log"],
    hidden_manual_work: ["Browser-local workspace", "CSV imports", "Action queue", "Savings ledger", "Audit log"]
  };
  return sources[workstreamId];
}

function entitiesFor(workstreamId: SellerWorkstreamId): string[] {
  const entities: Record<SellerWorkstreamId, string[]> = {
    catalog: ["product", "sku", "listing", "keyword", "review"],
    inventory: ["sku", "inventory_item", "warehouse", "return", "purchase_order"],
    order_processing: ["order", "shipment", "task", "warehouse", "courier"],
    courier_shipping: ["order", "shipment", "ndr", "rto", "pincode", "courier"],
    pricing_competition: ["sku", "settlement", "deduction", "ad_campaign", "competitor_listing"],
    advertising_promotions: ["ad_campaign", "keyword", "sku", "order", "return"],
    returns_refunds: ["return", "refund", "claim", "order", "inventory_item"],
    customer_support: ["customer", "order", "support_case", "warranty_case", "ndr"],
    finance_accounting: ["settlement", "deduction", "claim", "order", "report_file"],
    analytics_decisions: ["sku", "order", "pincode", "courier", "settlement", "inventory_item"],
    procurement_supplier: ["supplier", "purchase_order", "inventory_item", "sku", "task"],
    marketplace_compliance: ["marketplace_account", "listing", "seller_preference", "audit_log", "report_file"],
    team_coordination: ["task", "automation_rule", "audit_log", "seller_preference"],
    hidden_manual_work: ["task", "audit_log", "ai_action", "report_file", "seller_preference"]
  };
  return entities[workstreamId];
}

function decisionServiceFor(workstreamId: SellerWorkstreamId): string {
  const service: Record<SellerWorkstreamId, string> = {
    catalog: "marketingAutomationService + future catalog repair agent",
    inventory: "inventory intelligence signals + reorder recommendation service",
    order_processing: "riskScoring + action queue + SLA prioritizer",
    courier_shipping: "riskScoring + NDR playbooks + courier/pincode policy services",
    pricing_competition: "profit recovery + marketing guardrails + future pricing agent",
    advertising_promotions: "marketingAutomationService + profit-aware growth review",
    returns_refunds: "return intelligence findings + claims recovery drafts",
    customer_support: "response templates + customer support agent draft logic",
    finance_accounting: "savings ledger + settlement reconciliation findings",
    analytics_decisions: "data brain + leakage atlas + weekly/monthly report services",
    procurement_supplier: "inventory intelligence + future supplier coordination agent",
    marketplace_compliance: "future marketplace shield agent",
    team_coordination: "automation queue + SOP routing + role rules",
    hidden_manual_work: "automation runtime + audit proof + exception inbox"
  };
  return service[workstreamId];
}

function actionOutputFor(workstreamId: SellerWorkstreamId): string {
  const output: Record<SellerWorkstreamId, string> = {
    catalog: "Listing repair draft, SEO draft, image/spec checklist, approval task",
    inventory: "Stock mismatch task, reorder recommendation, dead stock alert",
    order_processing: "SLA queue item, pick/pack priority, invoice/label readiness task",
    courier_shipping: "NDR rescue task, pincode rule draft, courier escalation packet",
    pricing_competition: "Margin-safe pricing task, coupon scenario, competitor response",
    advertising_promotions: "Campaign pause draft, negative keyword task, festival plan",
    returns_refunds: "Return abuse flag, refund review, claim evidence packet",
    customer_support: "Support reply draft, warranty/install guidance, address confirmation task",
    finance_accounting: "Settlement mismatch packet, deduction recovery task, CA/GST export plan",
    analytics_decisions: "Founder decision brief, leakage driver, priority queue, proof report",
    procurement_supplier: "Reorder task, supplier delay follow-up, QC defect report",
    marketplace_compliance: "Compliance alert, blocked listing task, certificate upload checklist",
    team_coordination: "Owner-assigned task, SOP checklist, escalation and audit event",
    hidden_manual_work: "Exception inbox, proof trail, repeated-work removal score"
  };
  return output[workstreamId];
}

function currentImplementationFor(status: AutomationCapabilityStatus) {
  const copy: Record<AutomationCapabilityStatus, string> = {
    missing: "Not implemented yet.",
    ui_only: "Mentioned or represented in UI only.",
    mock: "Mock or static service layer exists.",
    local_automation: "Local deterministic automation exists against CSV/demo/browser workspace data.",
    connected_read: "Read connector exists without execution.",
    ai_decision: "Structured decision or draft exists without real execution.",
    approval_execution: "Approval-gated execution with proof exists.",
    autonomous_execution: "Autonomous execution with seller rules, audit, monitoring, and rollback exists."
  };
  return copy[status];
}

function nextImplementationFor(status: AutomationCapabilityStatus) {
  const copy: Record<AutomationCapabilityStatus, string> = {
    missing: "Add source data contract, normalized entity mapping, decision rule, and first queue action.",
    ui_only: "Replace UI claim with a service-backed capability and explicit proof state.",
    mock: "Wire the mock to seller data, audit event, and deterministic work item generation.",
    local_automation: "Add connected reads or approval-gated execution where provider permissions allow.",
    connected_read: "Add action drafting, seller approval, audit proof, and failure handling.",
    ai_decision: "Convert the decision into approval-ready execution with rollback and provider guardrails.",
    approval_execution: "Harden caps, quiet hours, retries, kill switch, and learning outcomes.",
    autonomous_execution: "Keep monitoring, caps, rollback, and exception review active."
  };
  return copy[status];
}

function targetStatusFor(status: AutomationCapabilityStatus): AutomationCapabilityStatus {
  if (status === "approval_execution" || status === "autonomous_execution") return status;
  if (status === "missing" || status === "ui_only" || status === "mock") return "local_automation";
  return "approval_execution";
}

function buildCapability(seed: WorkstreamSeed, task: string, index: number): AutomationCapability {
  const status = statusForTask(seed.id, task);
  const id = `${seed.id}-${String(index + 1).padStart(2, "0")}-${slugify(task)}`;

  return {
    id,
    workstreamId: seed.id,
    workstreamTitle: seed.title,
    manualTask: task,
    sellerPain: seed.sellerPain,
    status,
    targetStatus: targetStatusFor(status),
    priority: seed.priority,
    sellerWorkRemoved:
      status === "missing" || status === "ui_only"
        ? "None yet. This task remains manual."
        : status === "mock"
          ? "Demo-only reduction. Seller still needs a real workflow."
          : status === "local_automation"
            ? "Manual analysis and prioritization are reduced for CSV/demo data."
            : status === "ai_decision"
              ? "Manual diagnosis is reduced; seller still approves or executes."
              : "Manual execution is reduced with proof.",
    dataSources: dataSourcesFor(seed.id),
    normalizedEntities: entitiesFor(seed.id),
    decisionService: decisionServiceFor(seed.id),
    actionOutput: actionOutputFor(seed.id),
    currentImplementation: currentImplementationFor(status),
    nextImplementation: nextImplementationFor(status),
    evidence: evidenceForStatus(status)
  };
}

function buildWorkstreams(): AutomationWorkstream[] {
  return workstreamSeeds.map((seed) => ({
    id: seed.id,
    title: seed.title,
    description: seed.description,
    sellerPain: seed.sellerPain,
    priority: seed.priority,
    capabilities: seed.tasks.map((task, index) => buildCapability(seed, task, index))
  }));
}

export function evidenceIsComplete(evidence: AutomationEvidence) {
  return (
    evidence.dataInput &&
    evidence.normalizedEntities &&
    evidence.decisionLogic &&
    evidence.actionOutput &&
    evidence.auditEvent &&
    evidence.tests &&
    evidence.learningLoop
  );
}

export function canClaimAutomated(capability: AutomationCapability) {
  const definition = statusDefinitions.find((item) => item.status === capability.status);
  return Boolean(definition?.canClaimAutomated && evidenceIsComplete(capability.evidence));
}

function workstreamCoverage(workstream: AutomationWorkstream) {
  if (!workstream.capabilities.length) return 0;
  const score = workstream.capabilities.reduce((sum, capability) => sum + statusWeight[capability.status], 0);
  return Math.round(score / workstream.capabilities.length);
}

function buildSummary(workstreams: AutomationWorkstream[], capabilities: AutomationCapability[]) {
  const statusCounts = statusDefinitions.reduce(
    (counts, definition) => ({ ...counts, [definition.status]: 0 }),
    {} as Record<AutomationCapabilityStatus, number>
  );

  capabilities.forEach((capability) => {
    statusCounts[capability.status] += 1;
  });

  const workstreamScores = workstreams.map((workstream) => ({
    id: workstream.id,
    title: workstream.title,
    coveragePercent: workstreamCoverage(workstream),
    executionReadyCount: workstream.capabilities.filter(canClaimAutomated).length,
    missingOrUiOnlyCount: workstream.capabilities.filter((capability) => capability.status === "missing" || capability.status === "ui_only").length
  }));

  const score = capabilities.reduce((sum, capability) => sum + statusWeight[capability.status], 0);
  const highestStatus = capabilities.reduce<AutomationCapabilityStatus>((highest, capability) => {
    return statusRank[capability.status] > statusRank[highest] ? capability.status : highest;
  }, "missing");

  return {
    totalWorkstreams: workstreams.length,
    totalCapabilities: capabilities.length,
    statusCounts,
    automatedClaimCount: capabilities.filter(canClaimAutomated).length,
    falseAutomationClaimCount: capabilities.filter((capability) => {
      const definition = statusDefinitions.find((item) => item.status === capability.status);
      return Boolean(definition?.canClaimAutomated && !evidenceIsComplete(capability.evidence));
    }).length,
    executionReadyCount: capabilities.filter((capability) => capability.status === "approval_execution" || capability.status === "autonomous_execution").length,
    missingOrUiOnlyCount: capabilities.filter((capability) => capability.status === "missing" || capability.status === "ui_only").length,
    coveragePercent: Math.round(score / capabilities.length),
    highestStatus,
    strongestWorkstreams: [...workstreamScores].sort((a, b) => b.coveragePercent - a.coveragePercent).slice(0, 4),
    weakestWorkstreams: [...workstreamScores].sort((a, b) => b.missingOrUiOnlyCount - a.missingOrUiOnlyCount || a.coveragePercent - b.coveragePercent).slice(0, 4)
  };
}

export function getAutomationCapabilityMatrix(): AutomationCapabilityMatrix {
  const workstreams = buildWorkstreams();
  const capabilities = workstreams.flatMap((workstream) => workstream.capabilities);
  const falseAutomationClaims = capabilities.filter((capability) => {
    const definition = statusDefinitions.find((item) => item.status === capability.status);
    return Boolean(definition?.canClaimAutomated && !evidenceIsComplete(capability.evidence));
  });

  return {
    objective:
      "Seller connects the business once, then Wembro removes non-physical ecommerce work through detection, decision, action, proof, and learning.",
    operatingLoop: ["DATA", "INSIGHT", "DECISION", "ACTION", "LEARNING"],
    honestyRule:
      "No capability may claim automation unless it has source data, normalized entities, decision logic, action output, audit proof, tests, and a learning signal.",
    statusDefinitions,
    workstreams,
    capabilities,
    summary: buildSummary(workstreams, capabilities),
    falseAutomationClaims
  };
}

export function getCapabilityById(id: string) {
  return getAutomationCapabilityMatrix().capabilities.find((capability) => capability.id === id);
}

export function getWorkstreamById(id: SellerWorkstreamId) {
  return getAutomationCapabilityMatrix().workstreams.find((workstream) => workstream.id === id);
}
