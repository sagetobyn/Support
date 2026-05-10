export type MarketplaceChannel =
  | "amazon"
  | "flipkart"
  | "meesho"
  | "shopify"
  | "d2c"
  | "courier"
  | "bank"
  | "email"
  | "support"
  | "ads"
  | "accounting"
  | "custom";

export type ConnectionStatus = "connected" | "syncing" | "needs_attention" | "not_connected";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ConfidenceLabel = "low" | "medium" | "high";
export type AutomationLevel = 1 | 2 | 3 | 4 | 5;
export type IngestionInputKind = "api" | "csv" | "xlsx" | "pdf" | "email" | "webhook";
export type ConnectorCategory = "marketplace" | "upload" | "logistics" | "finance" | "support" | "reputation" | "advertising";
export type IngestionJobStatus =
  | "queued"
  | "extracting"
  | "parsing"
  | "cleaning"
  | "normalizing"
  | "validating"
  | "stored"
  | "failed"
  | "retrying";
export type CanonicalEntityType =
  | "seller"
  | "workspace"
  | "marketplace_account"
  | "product"
  | "sku"
  | "listing"
  | "order"
  | "order_item"
  | "customer"
  | "address"
  | "pincode"
  | "courier"
  | "shipment"
  | "ndr"
  | "rto"
  | "return"
  | "refund"
  | "settlement"
  | "deduction"
  | "claim"
  | "inventory_item"
  | "warehouse"
  | "supplier"
  | "purchase_order"
  | "support_case"
  | "warranty_case"
  | "review"
  | "ad_campaign"
  | "keyword"
  | "competitor_listing"
  | "report_file"
  | "automation_rule"
  | "ai_action"
  | "alert"
  | "task"
  | "model_config"
  | "agent_config"
  | "seller_preference"
  | "audit_log";

export type ExecutionState =
  | "recommended"
  | "drafted"
  | "awaiting_approval"
  | "approved"
  | "scheduled"
  | "executing"
  | "executed"
  | "failed"
  | "reverted";

export type AgentOutputType =
  | "insight"
  | "recommendation"
  | "draft_action"
  | "executable_action"
  | "alert"
  | "report"
  | "task"
  | "automation_event";

export interface MoneyMetric {
  id: string;
  label: string;
  value: number;
  deltaLabel?: string;
  tone: "neutral" | "success" | "warning" | "danger";
}

export interface SellerProfile {
  id: string;
  workspaceId: string;
  companyName: string;
  categories: string[];
  monthlyOrderVolume: string;
  marketplaces: MarketplaceChannel[];
  corePromise: string;
  operatingPrinciple: string;
}

export interface MarketplaceConnection {
  id: string;
  channel: MarketplaceChannel;
  label: string;
  status: ConnectionStatus;
  accessMode: "api_read_only" | "api_read_write" | "file_upload" | "future_hook";
  recordsSynced: number;
  lastUpdated: string;
  permissions: string[];
  healthScore: number;
}

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  status: "completed" | "active" | "pending";
}

export interface IngestionStage {
  id: string;
  label: string;
  description: string;
  status: "healthy" | "syncing" | "warning" | "failed";
  records: number;
}

export interface IngestionSource {
  id: string;
  label: string;
  channel: MarketplaceChannel;
  status: ConnectionStatus;
  freshnessLabel: string;
  recordCount: number;
  supportedInputs: IngestionInputKind[];
}

export interface ConnectorCapability {
  inputKind: IngestionInputKind;
  label: string;
  supportsIncrementalSync: boolean;
  requiresCredentials: boolean;
  mockOnly: boolean;
}

export interface ConnectorDefinition {
  id: string;
  label: string;
  channel: MarketplaceChannel;
  category: ConnectorCategory;
  status: ConnectionStatus;
  accessMode: MarketplaceConnection["accessMode"];
  supportedInputs: IngestionInputKind[];
  capabilities: ConnectorCapability[];
  permissions: string[];
  dataDomains: CanonicalEntityType[];
  freshnessLabel: string;
  lastSuccessfulSyncAt: string;
  recordCount: number;
  healthScore: number;
  canRetry: boolean;
  notes: string;
}

export interface MockConnectorResult {
  connectorId: string;
  sourceRecordCount: number;
  sampleRecordIds: string[];
  emittedEntityTypes: CanonicalEntityType[];
  latestRunStatus: IngestionJobStatus;
  message: string;
}

export interface IngestionJobStage {
  id: IngestionJobStatus;
  label: string;
  status: "pending" | "running" | "complete" | "failed";
  recordsProcessed: number;
}

export interface IngestionJob {
  id: string;
  connectorId: string;
  sourceLabel: string;
  status: IngestionJobStatus;
  currentStage: IngestionJobStatus;
  startedAt: string;
  completedAt?: string;
  recordCount: number;
  successCount: number;
  failedCount: number;
  retryCount: number;
  nextRetryAt?: string;
  message: string;
  stages: IngestionJobStage[];
}

export interface IngestionActivity {
  id: string;
  connectorId: string;
  label: string;
  status: "success" | "warning" | "failed" | "retrying";
  recordCount: number;
  occurredAt: string;
  detail: string;
}

export interface SourceFreshness {
  connectorId: string;
  sourceLabel: string;
  freshnessMinutes: number;
  freshnessLabel: string;
  status: "fresh" | "stale" | "failed";
}

export interface DataQualityMetric {
  label: string;
  score: number;
  description: string;
}

export interface DataQualityScorecard {
  overallScore: number;
  duplicateRate: number;
  missingFieldRate: number;
  parseAccuracy: number;
  metrics: DataQualityMetric[];
  missingFields: string[];
  warningCount: number;
  failedSourceCount: number;
}

export interface UnifiedEntitySummary {
  entityType: string;
  count: number;
  confidence: number;
  sourceCount: number;
}

export interface CommerceGraphNode {
  id: string;
  label: string;
  entityType: string;
  count: number;
  confidence: number;
}

export interface EntityMappingPreview {
  id: string;
  entityType: string;
  canonicalId: string;
  sourceIds: Record<string, string>;
  confidence: number;
  lastUpdated: string;
}

export interface SourceRecordReference {
  connectorId: string;
  sourceRecordId: string;
  marketplace?: MarketplaceChannel;
  reportFileId?: string;
}

export interface EntityConfidenceScore {
  entityId: string;
  entityType: CanonicalEntityType;
  score: number;
  label: ConfidenceLabel;
  signals: string[];
}

export interface LineageRecord {
  id: string;
  entityId: string;
  entityType: CanonicalEntityType;
  source: SourceRecordReference;
  fieldMappings: Record<string, string>;
  transformations: string[];
  receivedAt: string;
  normalizedAt: string;
  confidenceImpact: number;
}

export interface NormalizedCommerceEntity {
  id: string;
  workspaceId: string;
  entityType: CanonicalEntityType;
  title: string;
  status: "active" | "resolved" | "at_risk" | "needs_review";
  sourceRefs: SourceRecordReference[];
  confidence: EntityConfidenceScore;
  lineageIds: string[];
  attributes: Record<string, string | number | boolean | string[]>;
  updatedAt: string;
}

export interface SkuMapping {
  id: string;
  canonicalSkuId: string;
  canonicalTitle: string;
  sourceSkuIds: Partial<Record<MarketplaceChannel, string>>;
  listingIds: Partial<Record<MarketplaceChannel, string>>;
  confidenceScore: number;
  conflictCount: number;
  lineageIds: string[];
  lastResolvedAt: string;
}

export interface MarketplaceIdMapping {
  id: string;
  entityType: CanonicalEntityType;
  canonicalId: string;
  marketplaceIds: Partial<Record<MarketplaceChannel, string>>;
  sourceRecordIds: string[];
  confidenceScore: number;
  lineageIds: string[];
  lastUpdated: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  purpose: string;
  inputRequirements: string[];
  possibleActions: string[];
  modelConfigId: string;
  status: "active" | "watching" | "drafting" | "needs_data";
  confidence: number;
  sevenDayImpact: number;
}

export interface AIFinding {
  id: string;
  agentId: string;
  title: string;
  summary: string;
  outputType: AgentOutputType;
  riskLevel: RiskLevel;
  confidence: number;
  impactAmount: number;
  approvalRequired: boolean;
  explanation: string;
  recommendedAction: string;
}

export interface AutomationAction {
  id: string;
  title: string;
  sourceFindingId: string;
  actionType: string;
  impactAmount: number;
  riskLevel: RiskLevel;
  confidence: number;
  automationLevel: AutomationLevel;
  state: ExecutionState;
  approvalRequired: boolean;
  assignee: string;
  rollbackPlan: string;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  active: boolean;
  trigger: string;
  condition: string;
  action: string;
  automationLevel: AutomationLevel;
  approvalRequired: boolean;
}

export interface ReportSummary {
  id: string;
  title: string;
  cadence: "daily" | "weekly" | "monthly" | "custom";
  status: "ready" | "scheduled" | "drafting";
  owner: string;
  lastGenerated: string;
  downloadType: "pdf" | "csv" | "xlsx";
}

export interface AgentModelConfig {
  id: string;
  agentId: string;
  provider: "openai" | "anthropic" | "google" | "local" | "not_configured";
  modelName: string;
  temperature: number;
  reasoningDepth: "low" | "medium" | "high";
  maxMonthlyBudgetInr: number;
  fallbackModelName: string;
  safeMode: boolean;
  approvalRequiredAbove: RiskLevel;
}

export interface SellerRuleDraft {
  id: string;
  sourceInstruction: string;
  domain: string;
  condition: string;
  action: string;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
  confidence: number;
}

export interface SellerSettings {
  workspaceId: string;
  riskAppetite: "conservative" | "balanced" | "aggressive";
  minMarginPercent: number;
  codBlockRiskThreshold: number;
  supportTone: "formal" | "friendly" | "hinglish" | "premium";
  notificationPreference: "critical_only" | "daily_digest" | "all_alerts";
  automationCeiling: AutomationLevel;
  modelConfigs: AgentModelConfig[];
  promptRuleDrafts: SellerRuleDraft[];
}

export interface MarketingRecommendation {
  id: string;
  title: string;
  area: "listing" | "ads" | "competitor" | "reviews" | "promotion" | "seo";
  summary: string;
  profitGuardrail: string;
  impactAmount: number;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
}

export interface LearningSignal {
  id: string;
  sourceActionId: string;
  question: string;
  observedOutcome: string;
  agentLearning: string;
}

export interface AiOperationsWorkspace {
  seller: SellerProfile;
  onboardingSteps: OnboardingStep[];
  metrics: MoneyMetric[];
  connections: MarketplaceConnection[];
  ingestionSources: IngestionSource[];
  ingestionPipeline: IngestionStage[];
  dataQuality: DataQualityMetric[];
  entitySummaries: UnifiedEntitySummary[];
  graphNodes: CommerceGraphNode[];
  mappings: EntityMappingPreview[];
  connectors?: ConnectorDefinition[];
  ingestionJobs?: IngestionJob[];
  ingestionActivity?: IngestionActivity[];
  sourceFreshness?: SourceFreshness[];
  dataQualityScorecard?: DataQualityScorecard;
  normalizedEntities?: NormalizedCommerceEntity[];
  skuMappings?: SkuMapping[];
  marketplaceIdMappings?: MarketplaceIdMapping[];
  lineageRecords?: LineageRecord[];
  agents: AgentDefinition[];
  findings: AIFinding[];
  automationActions: AutomationAction[];
  automationRules: AutomationRule[];
  reports: ReportSummary[];
  settings: SellerSettings;
  marketingRecommendations: MarketingRecommendation[];
  learningSignals: LearningSignal[];
}
