import type {
  ConnectorDefinition,
  IngestionActivity,
  IngestionJob,
  MockConnectorResult,
  SourceFreshness
} from "../domain/types";

function stages(current: IngestionJob["currentStage"], failed = false): IngestionJob["stages"] {
  const order: IngestionJob["currentStage"][] = ["queued", "extracting", "parsing", "cleaning", "normalizing", "validating", "stored"];
  const currentIndex = order.indexOf(current);
  return order.map((stage, index) => ({
    id: stage,
    label: stage.replaceAll("_", " "),
    status: failed && stage === current ? "failed" : index < currentIndex || current === "stored" ? "complete" : index === currentIndex ? "running" : "pending",
    recordsProcessed: index <= currentIndex || current === "stored" ? Math.max(12, 42000 - index * 4100) : 0
  }));
}

export const connectorDefinitions: ConnectorDefinition[] = [
  {
    id: "amazon-sp-api",
    label: "Amazon India",
    channel: "amazon",
    category: "marketplace",
    status: "connected",
    accessMode: "api_read_only",
    supportedInputs: ["api", "csv", "xlsx"],
    capabilities: [
      { inputKind: "api", label: "SP-API order and settlement sync", supportsIncrementalSync: true, requiresCredentials: true, mockOnly: true },
      { inputKind: "csv", label: "Flat file fallback", supportsIncrementalSync: false, requiresCredentials: false, mockOnly: true }
    ],
    permissions: ["Orders", "Listings", "Returns", "Settlements", "Inventory"],
    dataDomains: ["marketplace_account", "listing", "order", "order_item", "return", "settlement", "deduction", "claim", "inventory_item"],
    freshnessLabel: "6m ago",
    lastSuccessfulSyncAt: "2026-05-10T09:04:00.000Z",
    recordCount: 42781,
    healthScore: 98,
    canRetry: false,
    notes: "Read-only marketplace source for orders, returns, fees, and settlement reconciliation."
  },
  {
    id: "flipkart-seller-api",
    label: "Flipkart",
    channel: "flipkart",
    category: "marketplace",
    status: "syncing",
    accessMode: "api_read_only",
    supportedInputs: ["api", "csv", "xlsx"],
    capabilities: [
      { inputKind: "api", label: "Seller API sync", supportsIncrementalSync: true, requiresCredentials: true, mockOnly: true },
      { inputKind: "xlsx", label: "Seller dashboard workbook", supportsIncrementalSync: false, requiresCredentials: false, mockOnly: true }
    ],
    permissions: ["Orders", "Returns", "Payouts", "Inventory"],
    dataDomains: ["marketplace_account", "listing", "order", "order_item", "return", "settlement", "deduction", "inventory_item"],
    freshnessLabel: "syncing now",
    lastSuccessfulSyncAt: "2026-05-10T09:02:00.000Z",
    recordCount: 18932,
    healthScore: 91,
    canRetry: true,
    notes: "Mock sync is mid-run to exercise in-progress ingestion state."
  },
  {
    id: "meesho-supplier-upload",
    label: "Meesho",
    channel: "meesho",
    category: "marketplace",
    status: "connected",
    accessMode: "file_upload",
    supportedInputs: ["csv", "xlsx"],
    capabilities: [
      { inputKind: "csv", label: "Supplier order export", supportsIncrementalSync: false, requiresCredentials: false, mockOnly: true },
      { inputKind: "xlsx", label: "Payout workbook", supportsIncrementalSync: false, requiresCredentials: false, mockOnly: true }
    ],
    permissions: ["Orders", "Returns", "Payouts"],
    dataDomains: ["marketplace_account", "listing", "order", "return", "settlement", "deduction"],
    freshnessLabel: "18m ago",
    lastSuccessfulSyncAt: "2026-05-10T08:52:00.000Z",
    recordCount: 16120,
    healthScore: 94,
    canRetry: false,
    notes: "Supplier-panel file fallback with stable order and payout IDs."
  },
  {
    id: "report-upload",
    label: "CSV / XLSX / PDF Upload",
    channel: "custom",
    category: "upload",
    status: "connected",
    accessMode: "file_upload",
    supportedInputs: ["csv", "xlsx", "pdf"],
    capabilities: [
      { inputKind: "csv", label: "Order and return report parser", supportsIncrementalSync: false, requiresCredentials: false, mockOnly: true },
      { inputKind: "xlsx", label: "Inventory and settlement workbook parser", supportsIncrementalSync: false, requiresCredentials: false, mockOnly: true },
      { inputKind: "pdf", label: "Payout summary parser skeleton", supportsIncrementalSync: false, requiresCredentials: false, mockOnly: true }
    ],
    permissions: ["Manual reports", "Historical imports", "Normalized preview"],
    dataDomains: ["report_file", "order", "return", "settlement", "inventory_item"],
    freshnessLabel: "12m ago",
    lastSuccessfulSyncAt: "2026-05-10T08:58:00.000Z",
    recordCount: 54230,
    healthScore: 96,
    canRetry: false,
    notes: "Frontend-safe parser skeleton; no real PDF extraction in this increment."
  },
  {
    id: "courier-reports",
    label: "Courier Reports",
    channel: "courier",
    category: "logistics",
    status: "connected",
    accessMode: "file_upload",
    supportedInputs: ["csv", "xlsx", "api", "webhook"],
    capabilities: [
      { inputKind: "csv", label: "NDR/RTO report import", supportsIncrementalSync: false, requiresCredentials: false, mockOnly: true },
      { inputKind: "webhook", label: "Future delivery event hook", supportsIncrementalSync: true, requiresCredentials: true, mockOnly: true }
    ],
    permissions: ["Shipments", "NDR", "RTO", "Courier exceptions"],
    dataDomains: ["courier", "shipment", "ndr", "rto", "pincode", "claim"],
    freshnessLabel: "8m ago",
    lastSuccessfulSyncAt: "2026-05-10T09:01:00.000Z",
    recordCount: 721334,
    healthScore: 97,
    canRetry: false,
    notes: "Combines courier exception reports with marketplace orders for NDR/RTO mapping."
  },
  {
    id: "bank-statements",
    label: "Bank Statements",
    channel: "bank",
    category: "finance",
    status: "connected",
    accessMode: "file_upload",
    supportedInputs: ["csv", "xlsx", "pdf"],
    capabilities: [
      { inputKind: "pdf", label: "Bank statement parser skeleton", supportsIncrementalSync: false, requiresCredentials: false, mockOnly: true },
      { inputKind: "xlsx", label: "Remittance workbook import", supportsIncrementalSync: false, requiresCredentials: false, mockOnly: true }
    ],
    permissions: ["Remittance entries", "Settlement match", "Deduction verification"],
    dataDomains: ["settlement", "deduction", "refund", "claim"],
    freshnessLabel: "23m ago",
    lastSuccessfulSyncAt: "2026-05-10T08:47:00.000Z",
    recordCount: 3114,
    healthScore: 93,
    canRetry: false,
    notes: "Mock remittance feed used for settlement-to-order reconciliation."
  },
  {
    id: "support-messages",
    label: "Support Messages",
    channel: "support",
    category: "support",
    status: "needs_attention",
    accessMode: "future_hook",
    supportedInputs: ["csv", "email", "webhook"],
    capabilities: [
      { inputKind: "email", label: "Support inbox ingestion hook", supportsIncrementalSync: true, requiresCredentials: true, mockOnly: true },
      { inputKind: "csv", label: "Support ticket export import", supportsIncrementalSync: false, requiresCredentials: false, mockOnly: true }
    ],
    permissions: ["Support cases", "Customer conversations", "Escalation reasons"],
    dataDomains: ["support_case", "customer", "order", "sku"],
    freshnessLabel: "failed 5m ago",
    lastSuccessfulSyncAt: "2026-05-10T08:30:00.000Z",
    recordCount: 2284,
    healthScore: 62,
    canRetry: true,
    notes: "Failure state is intentional so retry and sync-health UI have real data."
  },
  {
    id: "review-mining",
    label: "Reviews",
    channel: "support",
    category: "reputation",
    status: "connected",
    accessMode: "file_upload",
    supportedInputs: ["csv", "xlsx"],
    capabilities: [
      { inputKind: "csv", label: "Marketplace review export", supportsIncrementalSync: false, requiresCredentials: false, mockOnly: true }
    ],
    permissions: ["Reviews", "Sentiment", "Return reason hints"],
    dataDomains: ["review", "sku", "listing", "product"],
    freshnessLabel: "35m ago",
    lastSuccessfulSyncAt: "2026-05-10T08:35:00.000Z",
    recordCount: 9821,
    healthScore: 88,
    canRetry: false,
    notes: "Review data is normalized into SKU, listing, and return-intelligence signals."
  },
  {
    id: "ad-reports",
    label: "Ad Reports",
    channel: "ads",
    category: "advertising",
    status: "connected",
    accessMode: "file_upload",
    supportedInputs: ["api", "csv", "xlsx"],
    capabilities: [
      { inputKind: "api", label: "Future ad API pull", supportsIncrementalSync: true, requiresCredentials: true, mockOnly: true },
      { inputKind: "csv", label: "Campaign report import", supportsIncrementalSync: false, requiresCredentials: false, mockOnly: true }
    ],
    permissions: ["Campaigns", "Keywords", "Spend", "Attributed orders"],
    dataDomains: ["ad_campaign", "keyword", "listing", "order", "sku"],
    freshnessLabel: "11m ago",
    lastSuccessfulSyncAt: "2026-05-10T08:59:00.000Z",
    recordCount: 9145,
    healthScore: 90,
    canRetry: false,
    notes: "Growth data stays profit-aware by mapping campaign spend to order, SKU, and return signals."
  }
];

export const mockConnectorResults: MockConnectorResult[] = connectorDefinitions.map((connector) => ({
  connectorId: connector.id,
  sourceRecordCount: connector.recordCount,
  sampleRecordIds: [`${connector.id}-raw-001`, `${connector.id}-raw-002`, `${connector.id}-raw-003`],
  emittedEntityTypes: connector.dataDomains,
  latestRunStatus: connector.status === "needs_attention" ? "failed" : connector.status === "syncing" ? "normalizing" : "stored",
  message: connector.status === "needs_attention" ? "Last run failed validation and is retry-ready." : "Mock connector emitted normalized records."
}));

export const ingestionJobs: IngestionJob[] = [
  {
    id: "job-amazon-001",
    connectorId: "amazon-sp-api",
    sourceLabel: "Amazon India",
    status: "stored",
    currentStage: "stored",
    startedAt: "2026-05-10T08:58:00.000Z",
    completedAt: "2026-05-10T09:04:00.000Z",
    recordCount: 42781,
    successCount: 42716,
    failedCount: 65,
    retryCount: 0,
    message: "Orders, returns, settlements, listings, and inventory normalized.",
    stages: stages("stored")
  },
  {
    id: "job-flipkart-001",
    connectorId: "flipkart-seller-api",
    sourceLabel: "Flipkart",
    status: "normalizing",
    currentStage: "normalizing",
    startedAt: "2026-05-10T09:02:00.000Z",
    recordCount: 18932,
    successCount: 16542,
    failedCount: 18,
    retryCount: 1,
    nextRetryAt: "2026-05-10T09:18:00.000Z",
    message: "Payout workbook IDs are being mapped to unified settlement records.",
    stages: stages("normalizing")
  },
  {
    id: "job-support-001",
    connectorId: "support-messages",
    sourceLabel: "Support Messages",
    status: "failed",
    currentStage: "validating",
    startedAt: "2026-05-10T08:29:00.000Z",
    completedAt: "2026-05-10T08:31:00.000Z",
    recordCount: 2284,
    successCount: 2219,
    failedCount: 65,
    retryCount: 2,
    nextRetryAt: "2026-05-10T09:20:00.000Z",
    message: "Missing order ID in 65 support rows; retry will preserve valid rows.",
    stages: stages("validating", true)
  },
  {
    id: "job-upload-001",
    connectorId: "report-upload",
    sourceLabel: "CSV / XLSX / PDF Upload",
    status: "stored",
    currentStage: "stored",
    startedAt: "2026-05-10T08:48:00.000Z",
    completedAt: "2026-05-10T08:58:00.000Z",
    recordCount: 54230,
    successCount: 53914,
    failedCount: 316,
    retryCount: 0,
    message: "Historical orders, returns, inventory, and payout files normalized.",
    stages: stages("stored")
  }
];

export const ingestionActivity: IngestionActivity[] = [
  { id: "act-amazon", connectorId: "amazon-sp-api", label: "Amazon orders and settlement data synced successfully", status: "success", recordCount: 42781, occurredAt: "10:41 AM", detail: "Matched marketplace order IDs to canonical order records." },
  { id: "act-flipkart", connectorId: "flipkart-seller-api", label: "Flipkart inventory and payout data is normalizing", status: "retrying", recordCount: 18932, occurredAt: "10:41 AM", detail: "One retry scheduled for late payout rows." },
  { id: "act-upload", connectorId: "report-upload", label: "Historical CSV/XLSX/PDF reports ingested", status: "success", recordCount: 54230, occurredAt: "10:38 AM", detail: "Parser skeleton produced normalized preview records." },
  { id: "act-support", connectorId: "support-messages", label: "Support channel ingestion needs attention", status: "failed", recordCount: 2219, occurredAt: "10:35 AM", detail: "65 rows missing order IDs; valid rows are retained." },
  { id: "act-bank", connectorId: "bank-statements", label: "Bank remittance statements synced", status: "success", recordCount: 3114, occurredAt: "10:37 AM", detail: "Settlement references mapped to marketplace payout IDs." }
];

export const sourceFreshness: SourceFreshness[] = connectorDefinitions.map((connector) => {
  const failed = connector.status === "needs_attention";
  const minutes = failed ? 65 : connector.status === "syncing" ? 8 : connector.id === "review-mining" ? 35 : 12;
  return {
    connectorId: connector.id,
    sourceLabel: connector.label,
    freshnessMinutes: minutes,
    freshnessLabel: connector.freshnessLabel,
    status: failed ? "failed" : minutes > 30 ? "stale" : "fresh"
  };
});

