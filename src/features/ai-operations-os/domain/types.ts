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
export type AutomationActionType =
  | "claim_draft"
  | "ndr_message_draft"
  | "cod_block_rule"
  | "settlement_reconciliation"
  | "reorder_sku_recommendation"
  | "listing_optimization_draft"
  | "ad_budget_recommendation"
  | "support_reply_draft"
  | "profit_leakage_review"
  | "return_reason_review"
  | "margin_guardrail_recommendation"
  | "profit_aware_growth_review"
  | "settlement_mismatch_packet"
  | "ndr_rescue_draft"
  | "reorder_recommendation"
  | "customer_message_draft"
  | "cod_rule_change"
  | "seo_keyword_update_draft"
  | "competitor_response_recommendation"
  | "loss_making_campaign_pause_draft"
  | "coupon_profitability_review"
  | "festival_sale_plan_draft"
  | "marketing_report_draft";
export type AutomationPolicyStatus = "recommendation_only" | "draft_only" | "approval_ready" | "auto_allowed" | "blocked";
export type AutomationPolicyCheckStatus = "passed" | "warning" | "blocked";
export type AutomationActivityKind = "created" | "policy_checked" | "drafted" | "approval_requested" | "approved" | "mock_executed" | "blocked" | "failed";
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

export type AgentId =
  | "chief-operations-agent"
  | "profit-leakage-engine"
  | "rto-ndr-engine"
  | "return-intelligence-engine"
  | "settlement-reconciliation-engine"
  | "claims-recovery-agent"
  | "inventory-intelligence-engine"
  | "customer-support-agent"
  | "pricing-profitability-agent"
  | "marketing-growth-agent";

export type AgentRunStatus = "ready" | "running" | "completed" | "needs_data" | "failed";

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

export interface AgentInputRequirement {
  entityType: CanonicalEntityType;
  label: string;
  required: boolean;
  minimumConfidence: number;
  sourceNotes: string;
}

export interface AgentRun {
  id: string;
  agentId: AgentId;
  status: AgentRunStatus;
  startedAt: string;
  completedAt?: string;
  inputEntityCount: number;
  findingCount: number;
  message: string;
}

export interface AgentFindingEntityRef {
  entityId: string;
  entityType: CanonicalEntityType;
  title: string;
}

export interface AgentConfidenceBreakdown {
  id: string;
  agentId: AgentId;
  findingId?: string;
  dataQuality: number;
  entityConfidence: number;
  lineageCoverage: number;
  sourceFreshness: number;
  ruleClarity: number;
  impactClarity: number;
  finalScore: number;
  signals: string[];
}

export interface AiRecommendedAction {
  id: string;
  actionType: string;
  label: string;
  description: string;
  owner: string;
  expectedImpactAmount: number;
  automationLevel: AutomationLevel;
  approvalRequired: boolean;
  riskLevel: RiskLevel;
  nextStep: string;
}

export interface AutomationDraftIntent {
  id: string;
  findingId: string;
  actionType: string;
  title: string;
  description: string;
  targetEntityRefs: AgentFindingEntityRef[];
  automationLevel: AutomationLevel;
  state: Extract<ExecutionState, "recommended" | "drafted" | "awaiting_approval">;
  approvalRequired: boolean;
  policyChecks: string[];
  rollbackPlan: string;
  executableNow: false;
}

export interface StructuredAiFinding {
  id: string;
  workspaceId: string;
  agentId: AgentId;
  title: string;
  summary: string;
  outputType: AgentOutputType;
  riskLevel: RiskLevel;
  confidence: number;
  confidenceSignals: string[];
  confidenceBreakdown: AgentConfidenceBreakdown;
  impactAmount: number;
  urgencyScore: number;
  frequencyScore: number;
  priorityScore: number;
  approvalRequired: boolean;
  automationLevel: AutomationLevel;
  inputEntityRefs: AgentFindingEntityRef[];
  lineageRefs: string[];
  explanationSummary: string;
  recommendedAction: AiRecommendedAction;
  automationIntent: AutomationDraftIntent;
  createdAt: string;
}

export interface ChiefOperationsBriefing {
  id: string;
  headline: string;
  rankingMethod: string;
  topOpportunity: StructuredAiFinding;
  biggestRisk: StructuredAiFinding;
  approvalRequiredCount: number;
  totalPotentialImpact: number;
  rankedFindings: StructuredAiFinding[];
  explanationSummary: string;
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

export interface AutomationLevelDefinition {
  level: AutomationLevel;
  key: "recommend" | "draft" | "one_click_approve" | "auto_execute" | "full_autopilot";
  label: string;
  description: string;
  requiresApproval: boolean;
  externalExecutionAllowed: boolean;
}

export interface AutomationPolicyCheck {
  id: string;
  label: string;
  status: AutomationPolicyCheckStatus;
  detail: string;
}

export interface SellerApprovalPolicy {
  id: string;
  workspaceId: string;
  name: string;
  automationCeiling: AutomationLevel;
  minConfidenceForAutoExecute: number;
  maxImpactWithoutApproval: number;
  requiresApprovalForRisk: RiskLevel[];
  allowedAutoActionTypes: AutomationActionType[];
  blockedExternalActionTypes: AutomationActionType[];
  quietHours: {
    startHour: number;
    endHour: number;
    timezone: string;
  };
  notes: string[];
}

export interface AutomationExecutionTarget {
  kind: "marketplace" | "customer_message" | "internal_record" | "finance_packet" | "inventory_planning" | "listing_content" | "ad_budget";
  label: string;
  externalSystem: string;
  externalWriteRequired: boolean;
}

export interface AutomationStateTransition {
  from: ExecutionState;
  to: ExecutionState;
  label: string;
  requiresApproval: boolean;
}

export interface MockExecutionResult {
  id: string;
  actionId: string;
  status: "not_started" | "simulated_success" | "simulated_blocked" | "simulated_failed";
  summary: string;
  externalCallMade: false;
  evidenceRefs: string[];
  completedAt?: string;
}

export interface AutomationQueueItem extends AutomationAction {
  workspaceId: string;
  actionType: AutomationActionType;
  sourceIntentId?: string;
  description: string;
  targetEntityRefs: AgentFindingEntityRef[];
  lineageRefs: string[];
  priorityScore: number;
  policyStatus: AutomationPolicyStatus;
  policyChecks: AutomationPolicyCheck[];
  executionTarget: AutomationExecutionTarget;
  mockExecutionResult: MockExecutionResult;
  auditLogIds: string[];
  updatedAt: string;
}

export interface ApprovalQueueItem {
  id: string;
  actionId: string;
  title: string;
  requestedBy: string;
  approverRole: string;
  reason: string;
  impactAmount: number;
  riskLevel: RiskLevel;
  confidence: number;
  status: "pending" | "approved" | "rejected" | "blocked";
  createdAt: string;
  policyChecks: AutomationPolicyCheck[];
}

export interface AutomationAuditLog {
  id: string;
  actionId: string;
  eventType: AutomationActivityKind;
  actor: "system" | "seller" | "ops" | "finance" | "cx" | "growth";
  message: string;
  fromState?: ExecutionState;
  toState?: ExecutionState;
  occurredAt: string;
}

export interface AutomationActivityTimelineItem {
  id: string;
  actionId: string;
  kind: AutomationActivityKind;
  title: string;
  detail: string;
  occurredAt: string;
  tone: "neutral" | "success" | "warning" | "danger";
}

export interface AutomationRuleBuilderNode {
  id: string;
  nodeType: "trigger" | "condition" | "guardrail" | "action";
  label: string;
  detail: string;
}

export interface AutomationRuleBuilderView {
  ruleId: string;
  name: string;
  active: boolean;
  automationLevel: AutomationLevel;
  approvalRequired: boolean;
  nodes: AutomationRuleBuilderNode[];
}

export interface AutomationActionDetailView {
  action: AutomationQueueItem;
  approval?: ApprovalQueueItem;
  allowedNextStates: ExecutionState[];
  stateTrail: AutomationStateTransition[];
  auditLogs: AutomationAuditLog[];
  recentActivity: AutomationActivityTimelineItem[];
}

export interface AutomationStateCount {
  state: ExecutionState;
  label: string;
  count: number;
}

export interface AutomationLayerOverview {
  actions: AutomationQueueItem[];
  approvalQueue: ApprovalQueueItem[];
  rules: AutomationRule[];
  ruleBuilder: AutomationRuleBuilderView[];
  sellerPolicy: SellerApprovalPolicy;
  levelDefinitions: AutomationLevelDefinition[];
  stateCounts: AutomationStateCount[];
  auditLogs: AutomationAuditLog[];
  recentActivity: AutomationActivityTimelineItem[];
  selectedAction: AutomationActionDetailView;
  potentialImpact: number;
  pendingApproval: number;
  executed: number;
  blocked: number;
  autoExecutableCount: number;
  avgConfidence: number;
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

export type DashboardMetricValueType = "money" | "count" | "percent";
export type DashboardAlertStatus = "open" | "in_review" | "approval_needed" | "resolved";

export interface DashboardMetric {
  id:
    | "recoverable_money"
    | "money_saved"
    | "money_at_risk"
    | "rto_risk"
    | "return_loss"
    | "settlement_leakage"
    | "stockout_risk"
    | "action_items";
  label: string;
  value: number;
  valueType: DashboardMetricValueType;
  deltaLabel: string;
  tone: MoneyMetric["tone"];
  sourceRefs: string[];
  drilldownHref: string;
}

export interface AiDailyBriefing {
  id: string;
  generatedAt: string;
  headline: string;
  summary: string;
  recoverableMoney: number;
  moneySaved: number;
  moneyAtRisk: number;
  topOpportunity: {
    label: string;
    amount: number;
    href: string;
  };
  biggestRisk: {
    label: string;
    amount: number;
    href: string;
  };
  focusArea: {
    label: string;
    count: number;
    href: string;
  };
  sourceRefs: string[];
}

export interface DashboardAlert {
  id: string;
  title: string;
  summary: string;
  riskLevel: RiskLevel;
  status: DashboardAlertStatus;
  createdAt: string;
  sourceFindingId?: string;
  actionId?: string;
  recommendedAction: string;
  drilldownHref: string;
}

export interface MarketplaceComparisonRow {
  id: string;
  marketplace: MarketplaceChannel | "all";
  label: string;
  recoverableMoney: number;
  moneySaved: number;
  moneyAtRisk: number;
  rtoRisk: number;
  returnLoss: number;
  settlementLeakage: number;
  stockoutRisk: number;
  actionItems: number;
  drilldownHref: string;
}

export interface LeakageTrendPoint {
  date: string;
  rtoLoss: number;
  returnLoss: number;
  settlementLeakage: number;
  stockoutRisk: number;
  recovered: number;
  saved: number;
}

export interface TopLossEntity {
  id: string;
  rank: number;
  type: "sku" | "pincode";
  label: string;
  subtitle: string;
  marketplaces: MarketplaceChannel[];
  lossAmount: number;
  lossPercent: number;
  rtoRisk: number;
  returnRisk: number;
  stockoutRisk?: number;
  sourceEntityRefs: AgentFindingEntityRef[];
  actionId?: string;
  drilldownHref: string;
}

export interface ReportDownloadStub {
  id: string;
  reportId: string;
  title: string;
  cadence: ReportSummary["cadence"];
  status: ReportSummary["status"];
  downloadType: ReportSummary["downloadType"];
  generatedAt: string;
  owner: string;
  drilldownHref: string;
  downloadHref: string;
  stubbed: true;
}

export interface AgentHealthRow {
  agentId: AgentId;
  agentName: string;
  status: AgentRunStatus;
  confidence: number;
  openFindings: number;
  linkedActionCount: number;
  lastRunAt: string;
  health: "healthy" | "watching" | "needs_data";
}

export interface AutomationStatusSummary {
  totalActions: number;
  pendingApproval: number;
  autoExecuted: number;
  blocked: number;
  avgConfidence: number;
  potentialImpact: number;
  recentActivityCount: number;
}

export interface DashboardRecentActivity {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
  tone: "neutral" | "success" | "warning" | "danger";
  href: string;
}

export interface CommandCenterOverview {
  briefing: AiDailyBriefing;
  metrics: DashboardMetric[];
  alerts: DashboardAlert[];
  reports: ReportSummary[];
  reportDownloadStubs: ReportDownloadStub[];
  actionItems: AutomationQueueItem[];
  marketplaceComparison: MarketplaceComparisonRow[];
  leakageTrend: LeakageTrendPoint[];
  topLossEntities: TopLossEntity[];
  automationStatus: AutomationStatusSummary;
  agentHealth: AgentHealthRow[];
  recentActivity: DashboardRecentActivity[];
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

export interface ModelProviderDefinition {
  id: AgentModelConfig["provider"];
  label: string;
  status: "available" | "not_configured" | "disabled";
  apiKeyRequired: boolean;
  supportsTools: boolean;
  supportsJsonMode: boolean;
  supportsVision: boolean;
  supportsReasoningControl: boolean;
  defaultModel: string;
  fallbackModel: string;
  notes: string;
}

export interface PromptTemplateSetting {
  id: string;
  agentId: AgentId;
  name: string;
  systemInstruction: string;
  outputContract: string;
  safetyBoundary: string;
  version: string;
  lastEditedAt: string;
}

export interface BrandVoiceSettings {
  id: string;
  brandVoice: "premium" | "friendly" | "expert" | "value_first";
  supportTone: "formal" | "friendly" | "hinglish" | "premium";
  marketingTone: "premium" | "educational" | "conversion_focused" | "less_discount_heavy";
  financeStrictness: "balanced" | "strict" | "very_strict";
  languagePreference: "english" | "hinglish" | "hindi_english";
  examples: string[];
}

export interface ProfitMarginRule {
  id: string;
  label: string;
  minMarginPercent: number;
  appliesTo: string;
  actionBelowFloor: "block" | "require_approval" | "warn";
  approvalRequired: boolean;
}

export interface CodRtoRule {
  id: string;
  label: string;
  rtoRiskThreshold: number;
  paymentMethod: "COD" | "prepaid" | "all";
  action: "draft_cod_block" | "auto_block_cod" | "recommend_review";
  approvalRequired: boolean;
}

export interface AutomationApprovalRule {
  id: string;
  label: string;
  riskLevel: RiskLevel;
  maxAutomationLevel: AutomationLevel;
  approvalRequired: boolean;
  notes: string;
}

export interface NotificationPreference {
  id: string;
  channel: "in_app" | "email" | "whatsapp" | "slack";
  severity: "critical" | "high" | "medium" | "low" | "digest";
  cadence: "instant" | "daily" | "weekly" | "muted";
  enabled: boolean;
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

export interface StructuredSellerRule extends SellerRuleDraft {
  ruleType: "profit_margin" | "cod_rto" | "automation_approval" | "notification" | "tone" | "model_control" | "general";
  settingPath: string;
  operator: "set" | "minimum" | "maximum" | "greater_than" | "less_than" | "contains";
  parsedValue: string | number | boolean;
  affectedAgents: AgentId[];
  status: "preview" | "applied";
}

export interface PromptToConfigPreview {
  id: string;
  instruction: string;
  parser: "mock_keyword_parser" | "llm_parser_ready";
  confidence: number;
  rules: StructuredSellerRule[];
  settingsPatch: Record<string, string | number | boolean>;
  requiresReview: boolean;
  applied: boolean;
  auditSummary: string;
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
  brandVoice?: BrandVoiceSettings;
  profitMarginRules?: ProfitMarginRule[];
  codRtoRules?: CodRtoRule[];
  automationApprovalRules?: AutomationApprovalRule[];
  notificationPreferences?: NotificationPreference[];
  promptTemplates?: PromptTemplateSetting[];
  appliedStructuredRules?: StructuredSellerRule[];
}

export interface SettingsControlOverview {
  settings: SellerSettings;
  brandVoice: BrandVoiceSettings;
  profitMarginRules: ProfitMarginRule[];
  codRtoRules: CodRtoRule[];
  automationApprovalRules: AutomationApprovalRule[];
  notificationPreferences: NotificationPreference[];
  promptToConfigPreview: PromptToConfigPreview;
  appliedRules: StructuredSellerRule[];
}

export interface AgentModelControlRow {
  config: AgentModelConfig;
  agentName: string;
  agentPurpose: string;
  provider: ModelProviderDefinition;
  promptTemplate: PromptTemplateSetting;
  monthlyBudgetUsedInr: number;
  estimatedMonthlyCostInr: number;
}

export interface ModelControlOverview {
  providers: ModelProviderDefinition[];
  agentRows: AgentModelControlRow[];
  promptTemplates: PromptTemplateSetting[];
  safeModeCount: number;
  totalMonthlyBudgetInr: number;
  configuredProviderCount: number;
  llmCallsEnabled: false;
}

export interface MarketingRecommendation {
  id: string;
  title: string;
  area: "listing" | "ads" | "competitor" | "reviews" | "promotion" | "seo" | "sentiment" | "budget" | "festival";
  summary: string;
  profitGuardrail: string;
  impactAmount: number;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
}

export type MarketingWorkflowStatus = "ready" | "drafting" | "needs_review" | "blocked_by_guardrail";
export type SentimentLabel = "positive" | "mixed" | "negative";

export interface ListingOptimizationDraft {
  id: string;
  listingId: string;
  skuId: string;
  marketplace: MarketplaceChannel;
  status: MarketingWorkflowStatus;
  currentTitle: string;
  titleDraft: string;
  bulletDrafts: string[];
  descriptionDraft: string;
  reason: string;
  linkedReturnIds: string[];
  linkedReviewIds: string[];
  linkedRtoIds: string[];
  inventorySignal: string;
  profitGuardrail: string;
  automationActionId: string;
  confidence: number;
  approvalRequired: boolean;
}

export interface SeoKeywordInsight {
  id: string;
  keyword: string;
  marketplace: MarketplaceChannel;
  searchIntent: string;
  currentRank: number;
  opportunityScore: number;
  rtoRisk: number;
  returnRisk: number;
  inventoryFit: number;
  recommendedUse: string;
  automationActionId?: string;
}

export interface CompetitorListingIntelligence {
  id: string;
  competitorListingId: string;
  competitorName: string;
  marketplace: MarketplaceChannel;
  listingTitle: string;
  price: number;
  rating: number;
  reviewCount: number;
  pricingDeltaPercent: number;
  positioningGap: string;
  responseRecommendation: string;
  marginSafe: boolean;
  inventoryWarning: string;
  automationActionId?: string;
}

export interface ReviewMiningInsight {
  id: string;
  theme: string;
  sentiment: SentimentLabel;
  reviewCount: number;
  linkedSkuId: string;
  linkedReturnIds: string[];
  returnRiskSignal: string;
  listingFix: string;
  supportToneSignal: string;
  confidence: number;
}

export interface CustomerSentimentInsight {
  id: string;
  segment: string;
  sentimentScore: number;
  topComplaint: string;
  topPraise: string;
  recommendedAction: string;
  linkedWorkflowId: string;
}

export interface AdCampaignRecommendation {
  id: string;
  campaignId: string;
  title: string;
  currentSpend: number;
  attributedRevenue: number;
  deliveredProfit: number;
  acos: number;
  rtoLoss: number;
  returnLoss: number;
  inventoryRisk: number;
  recommendation: string;
  budgetChangePercent: number;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
  automationActionId: string;
}

export interface CouponProfitabilityScenario {
  id: string;
  title: string;
  skuId: string;
  discountPercent: number;
  expectedOrders: number;
  grossRevenue: number;
  marketplaceFees: number;
  adSpend: number;
  rtoCost: number;
  returnCost: number;
  contributionProfit: number;
  marginPercent: number;
  verdict: "safe_to_test" | "needs_approval" | "blocked_by_margin";
  guardrail: string;
  automationActionId: string;
}

export interface FestivalSalePlan {
  id: string;
  eventName: string;
  dateRange: string;
  skuFocus: string[];
  readinessScore: number;
  inventoryConstraint: string;
  rtoConstraint: string;
  marginFloor: number;
  plannedActions: string[];
  approvalRequired: boolean;
  automationActionIds: string[];
}

export interface MarketingReportMetric {
  label: string;
  value: string;
  note: string;
}

export interface MarketingReportSection {
  id: string;
  title: string;
  summary: string;
  metrics: MarketingReportMetric[];
  actionIds: string[];
}

export interface MarketingAutomationOverview {
  recommendations: MarketingRecommendation[];
  listingDrafts: ListingOptimizationDraft[];
  keywordInsights: SeoKeywordInsight[];
  competitorIntelligence: CompetitorListingIntelligence[];
  reviewInsights: ReviewMiningInsight[];
  sentimentInsights: CustomerSentimentInsight[];
  adRecommendations: AdCampaignRecommendation[];
  couponScenarios: CouponProfitabilityScenario[];
  festivalPlans: FestivalSalePlan[];
  reportSections: MarketingReportSection[];
  automationActions: AutomationQueueItem[];
  automationActionIds: string[];
  totalProfitProtected: number;
  approvalRequired: number;
  activeWorkflows: number;
  lossMakingCampaignCount: number;
  averageProfitScore: number;
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
  agentRuns?: AgentRun[];
  structuredFindings?: StructuredAiFinding[];
  chiefOperationsBriefing?: ChiefOperationsBriefing;
  agents: AgentDefinition[];
  findings: AIFinding[];
  automationActions: AutomationAction[];
  automationRules: AutomationRule[];
  reports: ReportSummary[];
  settings: SellerSettings;
  marketingRecommendations: MarketingRecommendation[];
  learningSignals: LearningSignal[];
}
