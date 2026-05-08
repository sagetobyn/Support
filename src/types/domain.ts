export type Role = "admin" | "ops" | "analyst" | "viewer";

export type RiskBucket = "Low" | "Medium" | "High" | "Critical";

export type RecommendedAction =
  | "ship_normally"
  | "send_cod_confirmation"
  | "request_address_update"
  | "hold_order"
  | "call_customer"
  | "convert_to_prepaid"
  | "request_reattempt"
  | "update_address_with_courier"
  | "mark_cancelled"
  | "mark_rto"
  | "escalate_to_ops"
  | "block_or_flag_pincode"
  | "no_action"
  | "rto_loss_recorded";

export type StorePlatform = "Shopify" | "WooCommerce" | "Instagram / WhatsApp" | "Marketplace" | "Manual CSV" | "Other";

export interface Store {
  id: string;
  brandId: string;
  storeName: string;
  platform: StorePlatform;
  url?: string;
  defaultCurrency: "INR";
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ActionPriority = "critical" | "high" | "medium" | "low";

export type NdrCaseState =
  | "new"
  | "message_queued"
  | "called"
  | "contacted"
  | "customer_responded"
  | "reattempt_requested"
  | "address_update_needed"
  | "call_needed"
  | "cancel_requested"
  | "delivered_after_ndr"
  | "rto"
  | "unresolved";

export type NormalizedNdrReason =
  | "customer_unavailable"
  | "customer_refused"
  | "wrong_address"
  | "phone_unreachable"
  | "payment_issue"
  | "delayed_delivery"
  | "out_of_delivery_area"
  | "courier_fake_attempt"
  | "customer_requested_future_delivery"
  | "customer_shifted"
  | "door_locked"
  | "other";

export type CustomerIntent =
  | "confirm_delivery"
  | "update_address"
  | "reschedule_today"
  | "reschedule_tomorrow"
  | "reschedule_specific_date"
  | "share_alternate_phone"
  | "convert_prepaid"
  | "cancel_order"
  | "angry_customer"
  | "unknown";

export interface BrandSettings {
  id: string;
  name: string;
  category?: string;
  currency: "INR";
  monthlyOrderLimit?: number;
  prepaidOpportunityMinOrderValue?: number;
  prepaidOpportunityHighValueThreshold?: number;
  prepaidIncentiveFlatAmount?: number;
  prepaidIncentivePercent?: number;
  prepaidMaxIncentive?: number;
  prepaidMarginGuardrailPercent?: number;
  ndrSlaHours?: number;
  ndrCriticalHours?: number;
  highValueNdrThreshold?: number;
  maxContactAttemptsPerNdr?: number;
  whatsappProviderMode?: "mock" | "wa_me" | "manual_export" | "add_on";
  messageCostMarketing?: number;
  messageCostUtility?: number;
  messageCostService?: number;
  contactCapPerOrder?: number;
  contactCapPerDayPerCustomer?: number;
  allowCodHoldRecommendations?: boolean;
  allowPrepaidOnlyRecommendations?: boolean;
  allowCourierSwitchRecommendations?: boolean;
  requireHumanApprovalForCriticalActions?: boolean;
  defaultLanguage: "english" | "hindi" | "hinglish";
  forwardShippingCost: number;
  returnShippingCost: number;
  packagingCost: number;
  estimatedCac: number;
  codFee: number;
  supportOpsCost?: number;
  grossMarginPercent?: number;
  softwareCost: number;
  riskThresholdMedium: number;
  riskThresholdHigh: number;
  riskThresholdCritical: number;
  courierPlatforms: string[];
  whatsappSender?: string;
}

export interface Order {
  id: string;
  brandId: string;
  importId?: string;
  orderId: string;
  awb?: string;
  orderDate?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  fullAddress?: string;
  landmark?: string;
  pincode?: string;
  city?: string;
  state?: string;
  sku?: string;
  productName?: string;
  quantity: number;
  orderValue: number;
  paymentMode: "COD" | "Prepaid" | "Unknown";
  courier?: string;
  shipmentStatus?: string;
  ndrReason?: string;
  attemptCount: number;
  finalStatus?: string;
  sourcePlatform?: string;
  campaignName?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  adId?: string;
  storeId?: string;
  sourceStoreName?: string;
  grossMargin?: number;
  discountAmount?: number;
  shippingCharge?: number;
  codFeeActual?: number;
  courierChargeActual?: number;
  customerType?: "first_time" | "repeat" | string;
  firstTimeCustomer?: boolean;
  returnReason?: string;
  supportReason?: string;
  confirmationStatus?: "unconfirmed" | "confirmed" | "cancelled" | "address_update_requested" | "prepaid_converted";
  customerResponseStatus?: string;
  actionStatus?: "open" | "done" | "snoozed";
  riskScore: number;
  riskBucket: RiskBucket;
  riskReasons: string[];
  addressQualityScore: number;
  addressIssues: string[];
  recommendedAction: RecommendedAction;
  recommendedActionReason: string;
  customRuleMatches?: string[];
  dataQualityWarnings?: string[];
  expectedLeakageEstimate?: number;
  confidenceLabel?: "High" | "Medium" | "Low";
  rawData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NdrCase {
  id: string;
  brandId: string;
  orderId: string;
  awb?: string;
  courier?: string;
  ndrReasonRaw: string;
  ndrReasonNormalized: NormalizedNdrReason;
  confidence: number;
  attemptCount: number;
  ndrCreatedAt: string;
  hoursSinceNdr?: number;
  slaDeadline?: string;
  urgency?: "Critical" | "High" | "Medium" | "Low";
  customerResponseStatus: string;
  recommendedAction: RecommendedAction;
  actionStatus: "urgent" | "uncontacted" | "waiting_customer" | "customer_responded" | "reattempt_needed" | "address_update_needed" | "cancel_rto" | "delivered_after_ndr" | "rto";
  finalOutcome?: string;
  state: NdrCaseState;
  timeline: TimelineEvent[];
  notes?: string[];
  updatedAt: string;
}

export interface Message {
  id: string;
  brandId: string;
  orderId?: string;
  ndrCaseId?: string;
  channel: "whatsapp";
  provider: "mock" | "wa_me" | "manual_export" | "provider_ready" | "meta_cloud" | "gupshup" | "wati" | "interakt" | "aisensy";
  templateType: string;
  category?: "utility" | "marketing" | "service" | "authentication";
  estimatedCost?: number;
  buttons?: string[];
  recipientPhoneMasked: string;
  messageBody: string;
  status: "queued" | "manually_sent" | "sent" | "responded" | "failed" | "cancelled";
  createdAt: string;
  sentAt?: string;
  respondedAt?: string;
}

export interface CustomerResponse {
  id: string;
  brandId: string;
  orderId?: string;
  ndrCaseId?: string;
  channel: "manual" | "whatsapp";
  rawResponse: string;
  intent: CustomerIntent;
  confidence: number;
  extractedData?: Record<string, unknown>;
  messageId?: string;
  createdAt: string;
}

export interface SavingsEvent {
  id: string;
  brandId: string;
  orderId: string;
  sourceFeature?: string;
  eventType:
    | "cancelled_before_shipping"
    | "address_corrected"
    | "address_corrected_delivered"
    | "ndr_rescued_delivered"
    | "cod_converted_prepaid"
    | "rto_loss_recorded"
    | "courier_policy_recommendation"
    | "pincode_policy_recommendation"
    | "sku_policy_recommendation"
    | "campaign_policy_recommendation";
  estimatedSaving: number;
  actualSaving?: number;
  formulaNote?: string;
  confidence?: number | "high" | "medium" | "low";
  status?: "estimated" | "verified" | "rejected" | "adjusted";
  note?: string;
  calculation: Record<string, unknown>;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  brandId: string;
  orderId?: string;
  ndrCaseId?: string;
  policyId?: string;
  actionType: RecommendedAction;
  title?: string;
  reason?: string;
  priority?: ActionPriority;
  confidence?: string;
  sourceFeature?: string;
  estimatedLeakage?: number;
  expectedSavingEstimate?: number;
  status: "open" | "completed" | "cancelled";
  owner?: "unassigned" | "ops" | "founder" | "analyst";
  notes?: string;
  createdBy?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PrepaidOpportunity {
  opportunityId: string;
  orderId: string;
  score: number;
  reason: string;
  recommendedIncentive: string;
  messageTemplate: string;
  estimatedRiskReductionNote: string;
  status: "open" | "message_queued" | "accepted" | "declined" | "expired" | "dismissed";
  createdAt: string;
  updatedAt: string;
}

export interface PolicyRecommendation {
  id: string;
  policyType: string;
  title: string;
  affectedOrdersCount: number;
  estimatedLeakage: number;
  expectedSaving: number;
  risk: "critical" | "high" | "medium" | "low";
  recommendation: string;
  status: "suggested" | "accepted" | "dismissed" | "testing" | "completed";
  createdAt: string;
}

export interface WeeklyReport {
  id: string;
  brandId: string;
  startDate: string;
  endDate: string;
  sections: Record<string, unknown>;
  metrics: Record<string, number>;
  createdAt: string;
}

export interface MonthlyStrategyReport {
  id: string;
  brandId: string;
  startDate: string;
  endDate: string;
  sections: Record<string, unknown>;
  experiments: Array<Record<string, string | number>>;
  createdAt: string;
  sharedAt?: string;
}

export interface PolicySimulation {
  id: string;
  brandId: string;
  policyType: string;
  affectedOrders: number;
  baselineEstimatedLeakage: number;
  assumedSavedLeakage: number;
  interventionCost: number;
  lostContributionEstimate: number;
  netEstimatedBenefit: number;
  riskNotes: string[];
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  type:
    | "ndr_created"
    | "message_queued"
    | "message_status_updated"
    | "customer_response_recorded"
    | "action_completed"
    | "note_added"
    | "final_outcome";
  label: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  brandId: string;
  userId?: string;
  action:
    | "csv_uploaded"
    | "csv_imported"
    | "brand.updated"
    | "order.updated"
    | "ndr.detected"
    | "message.queued"
    | "customer.response.recorded"
    | "savings.event.created"
    | "message_created"
    | "customer_response_recorded"
    | "action_completed"
    | "data_deleted"
    | "export_created"
    | "phone_unmasked"
    | "policy_recommendation_created";
  entityType: "brand" | "import" | "order" | "ndr_case" | "message" | "customer_response" | "action" | "data" | "export";
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ImportRecord {
  id: string;
  brandId: string;
  filename: string;
  sourceType: "csv";
  rowCount: number;
  successCount: number;
  errorCount: number;
  created: number;
  updated: number;
  missingFields: string[];
  dataQualityScore?: number;
  analysisReadiness?: AnalysisReadinessItem[];
  createdAt: string;
}

export interface AnalysisReadinessItem {
  area: string;
  status: "ready" | "limited" | "blocked";
  reason: string;
}

export interface ImportSummary {
  rowCount: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
  created: number;
  updated: number;
  orders: Order[];
  missingFields: string[];
  dataQualityWarnings?: string[];
  dataQualityScore?: number;
  fieldsPresent?: string[];
  analysisUnlockedByAddingMissingFields?: string[];
  analysisReadiness?: AnalysisReadinessItem[];
  planLimitWarnings?: string[];
  columnMapping: Record<string, string>;
  previewRows: Array<Record<string, string>>;
  invalidRows: Array<{ row: number; issues: string[]; raw: Record<string, string> }>;
}
