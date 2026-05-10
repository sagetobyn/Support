import type { AiOperationsWorkspace, SellerRuleDraft } from "../domain/types";
import { connectorDefinitions, ingestionActivity, ingestionJobs, sourceFreshness } from "./mockConnectors";
import {
  lineageRecords,
  marketplaceIdMappings,
  normalizedCommerceEntities,
  skuMappings
} from "./mockCommerceData";

const ruleDrafts: SellerRuleDraft[] = [
  {
    id: "rule-draft-ndr-hours",
    sourceInstruction: "Do not auto-send customer messages after 9 PM.",
    domain: "customer_support",
    condition: "current_time is after 21:00 in seller timezone",
    action: "hold outbound customer messages until next allowed window",
    riskLevel: "medium",
    approvalRequired: false,
    confidence: 0.92
  },
  {
    id: "rule-draft-margin-floor",
    sourceInstruction: "Never reduce price below 18% margin.",
    domain: "pricing_profitability",
    condition: "projected_margin_percent is below 18",
    action: "block price reduction and create approval task",
    riskLevel: "high",
    approvalRequired: true,
    confidence: 0.96
  }
];

export const aiOperationsWorkspace: AiOperationsWorkspace = {
  seller: {
    id: "seller-acme",
    workspaceId: "workspace-acme",
    companyName: "Acme Marketplace",
    categories: ["Fashion", "Beauty", "Accessories"],
    monthlyOrderVolume: "10,000 - 50,000",
    marketplaces: ["amazon", "flipkart", "meesho", "shopify", "courier", "ads"],
    corePromise: "Automatically detect, prevent, and recover operational losses across ecommerce marketplaces.",
    operatingPrinciple: "DATA -> INSIGHT -> DECISION -> ACTION -> LEARNING"
  },
  onboardingSteps: [
    { id: "business-profile", label: "Business Profile", description: "Company, categories, order volume, and seller goals.", status: "completed" },
    { id: "marketplace-connection", label: "Marketplace Connection", description: "Amazon, Flipkart, Meesho, Shopify, D2C, and custom channels.", status: "active" },
    { id: "data-access", label: "Data Access", description: "Read-only permissions and report upload fallback.", status: "pending" },
    { id: "historical-reports", label: "Import Reports", description: "Orders, returns, settlements, courier, inventory, and ad files.", status: "pending" },
    { id: "ai-diagnosis", label: "AI Diagnosis", description: "First structured analysis from normalized seller data.", status: "pending" }
  ],
  metrics: [
    { id: "money-found", label: "Money Found", value: 2102040, deltaLabel: "+24.6% vs last 7d", tone: "success" },
    { id: "money-recovered", label: "Money Recovered", value: 842100, deltaLabel: "claims and NDR wins", tone: "success" },
    { id: "money-saved", label: "Money Saved", value: 618900, deltaLabel: "future loss prevented", tone: "neutral" },
    { id: "money-at-risk", label: "Money At Risk", value: 721430, deltaLabel: "needs approval", tone: "warning" },
    { id: "pending-approval", label: "Actions Pending Approval", value: 7, deltaLabel: "3 high impact", tone: "danger" },
    { id: "automation-confidence", label: "Automation Confidence", value: 916, deltaLabel: "91.6% weighted confidence", tone: "success" }
  ],
  connections: [
    {
      id: "conn-amazon",
      channel: "amazon",
      label: "Amazon India",
      status: "connected",
      accessMode: "api_read_only",
      recordsSynced: 2354998,
      lastUpdated: "6m ago",
      permissions: ["Orders", "Returns", "Inventory", "Settlements"],
      healthScore: 98
    },
    {
      id: "conn-flipkart",
      channel: "flipkart",
      label: "Flipkart",
      status: "syncing",
      accessMode: "api_read_only",
      recordsSynced: 1822114,
      lastUpdated: "syncing now",
      permissions: ["Orders", "Returns", "Payouts", "Inventory"],
      healthScore: 91
    },
    {
      id: "conn-meesho",
      channel: "meesho",
      label: "Meesho",
      status: "not_connected",
      accessMode: "file_upload",
      recordsSynced: 0,
      lastUpdated: "not connected",
      permissions: ["Orders", "Returns", "Payouts"],
      healthScore: 0
    }
  ],
  ingestionSources: [
    { id: "src-amazon", label: "Amazon", channel: "amazon", status: "connected", freshnessLabel: "10:40 AM", recordCount: 42781, supportedInputs: ["api", "csv", "xlsx"] },
    { id: "src-flipkart", label: "Flipkart", channel: "flipkart", status: "syncing", freshnessLabel: "10:41 AM", recordCount: 18932, supportedInputs: ["api", "csv", "xlsx"] },
    { id: "src-meesho", label: "Meesho", channel: "meesho", status: "connected", freshnessLabel: "10:40 AM", recordCount: 16120, supportedInputs: ["csv", "xlsx"] },
    { id: "src-courier", label: "Courier Systems", channel: "courier", status: "connected", freshnessLabel: "10:39 AM", recordCount: 721334, supportedInputs: ["api", "csv", "webhook"] },
    { id: "src-email", label: "Email Reports", channel: "email", status: "syncing", freshnessLabel: "10:41 AM", recordCount: 1204, supportedInputs: ["email", "pdf", "csv"] },
    { id: "src-bank", label: "Bank Statements", channel: "bank", status: "connected", freshnessLabel: "10:37 AM", recordCount: 3114, supportedInputs: ["pdf", "xlsx", "csv"] },
    { id: "src-support", label: "Support Channels", channel: "support", status: "needs_attention", freshnessLabel: "failed 5m ago", recordCount: 0, supportedInputs: ["api", "csv", "webhook"] },
    { id: "src-ads", label: "Ad Reports", channel: "ads", status: "connected", freshnessLabel: "11:02 AM", recordCount: 9145, supportedInputs: ["api", "csv", "xlsx"] }
  ],
  ingestionPipeline: [
    { id: "extract", label: "Extract", description: "Pull data from connected sources and report uploads.", status: "syncing", records: 18 },
    { id: "parse", label: "Parse", description: "Structure raw data into usable report rows.", status: "healthy", records: 1200000 },
    { id: "clean", label: "Clean", description: "Remove noise, fix errors, standardize values.", status: "healthy", records: 1100000 },
    { id: "normalize", label: "Normalize", description: "Map source data into canonical commerce entities.", status: "healthy", records: 1100000 },
    { id: "validate", label: "Validate", description: "Check data quality and business integrity.", status: "healthy", records: 1100000 }
  ],
  dataQuality: [
    { label: "Completeness", score: 99.1, description: "Required fields available across sources." },
    { label: "Accuracy", score: 98.8, description: "Records match source and reconciliation checks." },
    { label: "Consistency", score: 99.3, description: "Common identifiers and dates are aligned." },
    { label: "Freshness", score: 99.4, description: "Sources are synced within configured windows." },
    { label: "Validity", score: 99.2, description: "Values pass business and schema validation." }
  ],
  entitySummaries: [
    { entityType: "Orders", count: 2418772, confidence: 99.4, sourceCount: 5 },
    { entityType: "Products", count: 578221, confidence: 99.1, sourceCount: 6 },
    { entityType: "SKUs", count: 421884, confidence: 98.9, sourceCount: 6 },
    { entityType: "Returns", count: 128991, confidence: 98.6, sourceCount: 3 },
    { entityType: "Settlements", count: 244118, confidence: 97.8, sourceCount: 4 },
    { entityType: "Claims", count: 38912, confidence: 96.4, sourceCount: 3 },
    { entityType: "Support Cases", count: 203118, confidence: 95.9, sourceCount: 4 },
    { entityType: "Inventory", count: 312009, confidence: 98.1, sourceCount: 5 }
  ],
  graphNodes: [
    { id: "orders", label: "Orders", entityType: "order", count: 2418772, confidence: 99.4 },
    { id: "customers", label: "Customers", entityType: "customer", count: 1142933, confidence: 98.2 },
    { id: "skus", label: "SKUs", entityType: "sku", count: 421884, confidence: 98.9 },
    { id: "returns", label: "Returns", entityType: "return", count: 128991, confidence: 98.6 },
    { id: "couriers", label: "Couriers", entityType: "courier", count: 110233, confidence: 97.6 },
    { id: "support", label: "Support Cases", entityType: "support_case", count: 203118, confidence: 95.9 },
    { id: "products", label: "Products", entityType: "product", count: 578221, confidence: 99.1 },
    { id: "inventory", label: "Inventory", entityType: "inventory_item", count: 312009, confidence: 98.1 },
    { id: "settlements", label: "Settlements", entityType: "settlement", count: 244118, confidence: 97.8 },
    { id: "claims", label: "Claims", entityType: "claim", count: 38912, confidence: 96.4 }
  ],
  mappings: [
    { id: "map-prod-1", entityType: "Product", canonicalId: "PROD_7f9a2c", sourceIds: { amazon: "B0TX91", flipkart: "FKP_98", meesho: "MEE_44" }, confidence: 99.1, lastUpdated: "6m ago" },
    { id: "map-sku-1", entityType: "SKU", canonicalId: "SKU_3c1d9e", sourceIds: { amazon: "A_SKU_11", flipkart: "FK_SKU_88", meesho: "MS_SKU_22" }, confidence: 98.9, lastUpdated: "6m ago" },
    { id: "map-order-1", entityType: "Order", canonicalId: "ORD_91aa3f", sourceIds: { amazon: "404-875", flipkart: "OD3321", meesho: "MS9876" }, confidence: 99.4, lastUpdated: "6m ago" }
  ],
  connectors: connectorDefinitions,
  ingestionJobs,
  ingestionActivity,
  sourceFreshness,
  normalizedEntities: normalizedCommerceEntities,
  skuMappings,
  marketplaceIdMappings,
  lineageRecords,
  agents: [
    {
      id: "profit-leakage-engine",
      name: "Profit Leakage Engine",
      purpose: "Detects hidden leaks across RTO, deductions, pricing, ads, and more.",
      inputRequirements: ["orders", "returns", "settlements", "costs", "ads"],
      possibleActions: ["Create recovery opportunity", "Flag margin leak", "Draft executive summary"],
      modelConfigId: "model-profit",
      status: "active",
      confidence: 93,
      sevenDayImpact: 1874230
    },
    {
      id: "rto-ndr-engine",
      name: "RTO/NDR Engine",
      purpose: "Reduces avoidable returns and improves first-time delivery.",
      inputRequirements: ["orders", "shipments", "ndr", "pincode", "courier"],
      possibleActions: ["Draft NDR message", "Recommend COD block", "Create rescue task"],
      modelConfigId: "model-rto",
      status: "active",
      confidence: 91,
      sevenDayImpact: 721430
    },
    {
      id: "settlement-reconciliation-engine",
      name: "Settlement Reconciliation Engine",
      purpose: "Auto-reconciles payouts and flags mismatches.",
      inputRequirements: ["orders", "settlements", "deductions", "bank files"],
      possibleActions: ["Create mismatch task", "Prepare evidence", "Draft claim"],
      modelConfigId: "model-settlement",
      status: "watching",
      confidence: 89,
      sevenDayImpact: 312840
    },
    {
      id: "inventory-intelligence",
      name: "Inventory Intelligence",
      purpose: "Prevents stockouts, dead stock, and inventory cash blockage.",
      inputRequirements: ["inventory", "orders", "returns", "suppliers"],
      possibleActions: ["Create reorder task", "Flag dead stock", "Generate supplier report"],
      modelConfigId: "model-inventory",
      status: "active",
      confidence: 94,
      sevenDayImpact: 533900
    },
    {
      id: "marketing-growth-agent",
      name: "Marketing/Growth Agent",
      purpose: "Improves profitable growth without ignoring return, RTO, and inventory risk.",
      inputRequirements: ["listings", "ads", "reviews", "orders", "margin"],
      possibleActions: ["Draft listing improvement", "Recommend ad budget", "Flag loss-making campaign"],
      modelConfigId: "model-marketing",
      status: "drafting",
      confidence: 87,
      sevenDayImpact: 248700
    },
    {
      id: "seller-decision-agent",
      name: "Seller Decision Agent",
      purpose: "Turns multi-agent findings into seller decisions and approval prompts.",
      inputRequirements: ["findings", "settings", "risk policy", "approval queue"],
      possibleActions: ["Summarize decision", "Request approval", "Escalate risky action"],
      modelConfigId: "model-decision",
      status: "active",
      confidence: 92,
      sevenDayImpact: 248700
    }
  ],
  findings: [
    {
      id: "finding-rto-loss",
      agentId: "rto-ndr-engine",
      title: "Recover invalid RTO losses",
      summary: "21,842 orders show preventable RTO patterns across non-serviceable pincodes and delayed NDR follow-up.",
      outputType: "recommendation",
      riskLevel: "high",
      confidence: 92,
      impactAmount: 842100,
      approvalRequired: true,
      explanation: "RTO rate increased 42% WoW in 3,421 pincodes while courier exception codes remain inside recoverable windows.",
      recommendedAction: "Prepare claim and pincode control draft for seller approval."
    },
    {
      id: "finding-deductions",
      agentId: "settlement-reconciliation-engine",
      title: "Stop revenue leakage from deductions",
      summary: "11,209 deductions exceed configured tolerance across marketplace reports.",
      outputType: "draft_action",
      riskLevel: "high",
      confidence: 89,
      impactAmount: 573600,
      approvalRequired: true,
      explanation: "Settlement reports contain fee types outside tolerance for matched order IDs.",
      recommendedAction: "Draft reimbursement evidence bundle."
    },
    {
      id: "finding-inventory",
      agentId: "inventory-intelligence",
      title: "Optimize slow-moving inventory",
      summary: "4,156 SKUs show aging inventory and low conversion probability.",
      outputType: "task",
      riskLevel: "medium",
      confidence: 86,
      impactAmount: 227300,
      approvalRequired: false,
      explanation: "Carrying cost is increasing while demand probability fell below configured threshold.",
      recommendedAction: "Create reorder and liquidation recommendation split by SKU."
    }
  ],
  automationActions: [
    {
      id: "action-claims",
      title: "Raise 7 Claims",
      sourceFindingId: "finding-deductions",
      actionType: "claim_draft",
      impactAmount: 124500,
      riskLevel: "high",
      confidence: 92,
      automationLevel: 2,
      state: "recommended",
      approvalRequired: true,
      assignee: "Finance",
      rollbackPlan: "Do not submit until evidence bundle is reviewed.",
      createdAt: "May 12, 10:24 AM"
    },
    {
      id: "action-ndr",
      title: "Send NDR WhatsApp to 342 customers",
      sourceFindingId: "finding-rto-loss",
      actionType: "customer_message_draft",
      impactAmount: 45300,
      riskLevel: "medium",
      confidence: 88,
      automationLevel: 2,
      state: "drafted",
      approvalRequired: true,
      assignee: "CX",
      rollbackPlan: "Queued messages can be cancelled before provider dispatch.",
      createdAt: "May 12, 09:11 AM"
    },
    {
      id: "action-cod-block",
      title: "Block COD in High-Risk Pincodes",
      sourceFindingId: "finding-rto-loss",
      actionType: "cod_rule_change",
      impactAmount: 218700,
      riskLevel: "high",
      confidence: 95,
      automationLevel: 3,
      state: "awaiting_approval",
      approvalRequired: true,
      assignee: "Risk Team",
      rollbackPlan: "Revert pincode rule to previous state and notify ops.",
      createdAt: "May 12, 08:45 AM"
    },
    {
      id: "action-stock",
      title: "Reorder Low Stock SKU",
      sourceFindingId: "finding-inventory",
      actionType: "reorder_recommendation",
      impactAmount: 63200,
      riskLevel: "low",
      confidence: 86,
      automationLevel: 4,
      state: "executed",
      approvalRequired: false,
      assignee: "System",
      rollbackPlan: "Create supplier cancellation task if purchase order not confirmed.",
      createdAt: "May 12, 06:21 AM"
    }
  ],
  automationRules: [
    {
      id: "rule-risky-pincode-cod",
      name: "High Risk Pincode COD Blocker",
      active: true,
      trigger: "Pincode risk score is greater than 70 and payment method is COD",
      condition: "seller allows COD blocks and expected margin loss is above threshold",
      action: "Create COD block recommendation and notify risk team",
      automationLevel: 3,
      approvalRequired: true
    },
    {
      id: "rule-support-hours",
      name: "Customer Message Quiet Hours",
      active: true,
      trigger: "Outbound customer message after 9 PM",
      condition: "channel is WhatsApp or SMS",
      action: "Hold message until next permitted window",
      automationLevel: 4,
      approvalRequired: false
    }
  ],
  reports: [
    { id: "report-daily-leakage", title: "Daily Leakage Report", cadence: "daily", status: "ready", owner: "Reporting Agent", lastGenerated: "May 18, 2024", downloadType: "pdf" },
    { id: "report-rto-return", title: "RTO & Returns Report", cadence: "daily", status: "ready", owner: "RTO/NDR Engine", lastGenerated: "May 18, 2024", downloadType: "pdf" },
    { id: "report-settlement", title: "Settlement Reconciliation Report", cadence: "weekly", status: "scheduled", owner: "Settlement Reconciliation Engine", lastGenerated: "May 17, 2024", downloadType: "xlsx" },
    { id: "report-inventory", title: "Inventory Health Report", cadence: "weekly", status: "drafting", owner: "Inventory Intelligence", lastGenerated: "May 16, 2024", downloadType: "pdf" }
  ],
  settings: {
    workspaceId: "workspace-acme",
    riskAppetite: "balanced",
    minMarginPercent: 18,
    codBlockRiskThreshold: 75,
    supportTone: "hinglish",
    notificationPreference: "critical_only",
    automationCeiling: 3,
    modelConfigs: [
      { id: "model-profit", agentId: "profit-leakage-engine", provider: "openai", modelName: "strong-reasoning", temperature: 0.2, reasoningDepth: "high", maxMonthlyBudgetInr: 18000, fallbackModelName: "balanced-reasoning", safeMode: true, approvalRequiredAbove: "medium" },
      { id: "model-rto", agentId: "rto-ndr-engine", provider: "openai", modelName: "balanced-reasoning", temperature: 0.1, reasoningDepth: "medium", maxMonthlyBudgetInr: 12000, fallbackModelName: "fast-ops", safeMode: true, approvalRequiredAbove: "medium" },
      { id: "model-settlement", agentId: "settlement-reconciliation-engine", provider: "openai", modelName: "strong-reasoning", temperature: 0, reasoningDepth: "high", maxMonthlyBudgetInr: 15000, fallbackModelName: "balanced-reasoning", safeMode: true, approvalRequiredAbove: "low" },
      { id: "model-inventory", agentId: "inventory-intelligence", provider: "openai", modelName: "balanced-reasoning", temperature: 0.15, reasoningDepth: "medium", maxMonthlyBudgetInr: 9000, fallbackModelName: "fast-ops", safeMode: true, approvalRequiredAbove: "high" },
      { id: "model-marketing", agentId: "marketing-growth-agent", provider: "openai", modelName: "creative-commerce", temperature: 0.45, reasoningDepth: "medium", maxMonthlyBudgetInr: 9000, fallbackModelName: "balanced-reasoning", safeMode: true, approvalRequiredAbove: "medium" },
      { id: "model-decision", agentId: "seller-decision-agent", provider: "openai", modelName: "strong-reasoning", temperature: 0.1, reasoningDepth: "high", maxMonthlyBudgetInr: 12000, fallbackModelName: "balanced-reasoning", safeMode: true, approvalRequiredAbove: "low" }
    ],
    promptRuleDrafts: ruleDrafts
  },
  marketingRecommendations: [
    {
      id: "mkt-listing-size",
      title: "Fix size/fit promise on top return SKUs",
      area: "listing",
      summary: "Repeat returns are concentrated in 32 SKUs where reviews mention size mismatch.",
      profitGuardrail: "Do not increase discounting; fix promise clarity first.",
      impactAmount: 146200,
      riskLevel: "medium",
      approvalRequired: false
    },
    {
      id: "mkt-ad-pause",
      title: "Pause loss-making ad cluster",
      area: "ads",
      summary: "Campaign creates high COD orders with low delivered margin after RTO.",
      profitGuardrail: "Pause only if net contribution remains negative after 7-day attribution window.",
      impactAmount: 87300,
      riskLevel: "high",
      approvalRequired: true
    },
    {
      id: "mkt-competitor-price",
      title: "Respond to competitor price pressure",
      area: "competitor",
      summary: "Two competitor listings undercut price, but your stockout risk is high.",
      profitGuardrail: "Do not reduce below 18% margin floor; preserve inventory for profitable channels.",
      impactAmount: 64200,
      riskLevel: "medium",
      approvalRequired: true
    }
  ],
  learningSignals: [
    {
      id: "learning-claim",
      sourceActionId: "action-claims",
      question: "Was the claim approved?",
      observedOutcome: "5 of 7 draft claims approved after evidence review.",
      agentLearning: "Settlement agent should prioritize deduction types with uploaded invoice evidence."
    },
    {
      id: "learning-ndr",
      sourceActionId: "action-ndr",
      question: "Did the NDR order get delivered?",
      observedOutcome: "37% of contacted high-value NDR cases converted to delivery.",
      agentLearning: "Customer support agent should prefer Hinglish confirmation for this segment."
    }
  ]
};
