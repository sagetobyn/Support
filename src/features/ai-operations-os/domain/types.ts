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
  supportedInputs: Array<"api" | "csv" | "xlsx" | "pdf" | "email" | "webhook">;
}

export interface DataQualityMetric {
  label: string;
  score: number;
  description: string;
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
  agents: AgentDefinition[];
  findings: AIFinding[];
  automationActions: AutomationAction[];
  automationRules: AutomationRule[];
  reports: ReportSummary[];
  settings: SellerSettings;
  marketingRecommendations: MarketingRecommendation[];
  learningSignals: LearningSignal[];
}

