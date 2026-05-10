# Data Model

## Position

The current repository has an MVP schema for revenue leakage, RTO/NDR rescue, actions, savings, audit logs, and integrations. The AI Operations OS expands this into a unified seller data brain.

Do not migrate the database in this phase. The target model below defines the domain contracts and future schema direction. Real migrations should be created only after repository contracts and product surfaces are stable.

## Current Implemented Core

Prisma currently models:

- `Brand`
- `User`
- `Order`
- `NDRCase`
- `Action`
- `SavingsEvent`
- `AuditLog`
- `Integration`

The browser-local dashboard state additionally uses:

- `brand`
- `orders`
- `imports`
- `ndrCases`
- `messages`
- `responses`
- `actions`
- `savingsEvents`
- `audits`
- `stores`
- `policyRecommendations`
- `weeklyReports`
- `monthlyStrategyReports`
- `policySimulations`
- `exports`

These entities remain valid for the current wedge and should be mapped into the broader OS rather than discarded.

## Target Canonical Entities

### Tenant And Access

- Seller
- Workspace
- User
- TeamMember
- Role
- Permission
- SellerPreference
- AuditLog

### Marketplaces And Sources

- MarketplaceAccount
- IntegrationConnection
- ConnectorDefinition
- SyncJob
- IngestionJob
- IngestionLog
- ReportFile
- RawRecord
- NormalizedRecord
- DataQualityCheck
- SourceFreshness

### Commerce Graph

- Product
- SKU
- Listing
- MarketplaceIdentifier
- Order
- OrderItem
- Customer
- Address
- Pincode
- Courier
- Shipment
- NDR
- RTO
- Return
- Refund
- Settlement
- Deduction
- Claim

### Inventory And Supply

- InventoryItem
- Warehouse
- Supplier
- PurchaseOrder
- SupplierIssue
- WarrantyCase

### Support And Reputation

- SupportCase
- CustomerConversation
- SupportMessage
- Review
- SentimentSignal

### Growth And Competition

- AdCampaign
- AdGroup
- Keyword
- CompetitorListing
- ListingContentRecommendation
- PromotionPlan

### Intelligence And Action

- AgentConfig
- ModelConfig
- AIFinding
- AIAction
- AutomationRule
- AutomationEvent
- Task
- Alert
- Report
- FeedbackSignal
- LearningEvent

## Required Cross-Entity Capabilities

The data brain must support:

- SKU mapping across marketplaces.
- Marketplace order ID mapping.
- Product and listing mapping.
- Customer, address, and pincode mapping.
- Settlement-to-order reconciliation.
- Return-to-order mapping.
- Inventory-to-SKU mapping.
- Ad campaign-to-listing mapping.
- Support case-to-order and SKU mapping.
- Entity confidence score.
- Data lineage.
- Normalized record preview.
- Deduplication.
- Anomaly detection foundation.

## Implemented Mock Foundation

Phase 3/4 now has typed frontend-safe contracts under `src/features/ai-operations-os/domain/types.ts` and mock adapters under `src/features/ai-operations-os/data`.

Implemented mock structures:

- Connector registry with Amazon, Flipkart, Meesho, CSV/XLSX/PDF upload, courier reports, bank statements, support messages, reviews, and ad reports.
- Ingestion jobs with `queued`, `extracting`, `parsing`, `cleaning`, `normalizing`, `validating`, `stored`, `failed`, and `retrying`-ready status coverage.
- Data quality scorecard derived from connector health, ingestion failures, source freshness, and entity confidence.
- Normalized commerce entities for seller, workspace, marketplace account, product, SKU, listing, order, order item, customer, address, pincode, courier, shipment, NDR, RTO, return, refund, settlement, deduction, claim, inventory item, warehouse, supplier, purchase order, support case, warranty case, review, ad campaign, keyword, competitor listing, and report file.
- SKU mappings, marketplace ID mappings, entity confidence scores, and lineage records.

Phase 5/6 adds typed contracts for AI findings and automation handoff:

- `StructuredAiFinding` with input entity refs, lineage refs, confidence signals, explanation summary, recommended action, and automation draft intent.
- `AutomationQueueItem` with policy status, detailed policy checks, execution target, mock execution result, audit refs, and action detail data.
- `ApprovalQueueItem` for seller approval routing.
- `SellerApprovalPolicy` for risk approval rules, confidence floor, automation ceiling, quiet hours, blocked external action types, and allowed internal auto actions.
- `AutomationAuditLog` and `AutomationActivityTimelineItem` for append-only mock evidence.
- `AutomationLevelDefinition` for recommend, draft, one-click approve, auto-execute, and full autopilot.

Phase 8 adds typed settings and model-control contracts:

- `ModelProviderDefinition` for provider routing readiness without module-scope SDK initialization.
- `AgentModelConfig` rows per agent with provider, model name, reasoning depth, fallback, budget, safe mode, and approval threshold.
- `PromptTemplateSetting` for per-agent system instructions and output contracts.
- `BrandVoiceSettings`, `ProfitMarginRule`, `CodRtoRule`, `AutomationApprovalRule`, and `NotificationPreference`.
- `StructuredSellerRule` and `PromptToConfigPreview` for natural-language instructions converted into structured settings patches.

Phase 9 adds typed marketing/growth automation contracts:

- `ListingOptimizationDraft` for title, bullet, and description drafts tied to listings, SKUs, returns, reviews, RTO clusters, inventory signals, confidence, and automation actions.
- `SeoKeywordInsight` for marketplace SEO opportunities with rank, search intent, opportunity score, RTO risk, return risk, inventory fit, and recommended use.
- `CompetitorListingIntelligence` for competitor price, rating, review count, positioning gap, margin safety, inventory warning, and response recommendation.
- `ReviewMiningInsight` and `CustomerSentimentInsight` for review themes, sentiment, linked SKUs/returns, listing fixes, and support tone signals.
- `AdCampaignRecommendation` for current spend, attributed revenue, ACOS, delivered profit, RTO loss, return loss, inventory risk, budget-change recommendation, approval requirement, and automation action ID.
- `CouponProfitabilityScenario` for promotion math: gross revenue, fees, ad spend, RTO cost, return cost, contribution profit, margin percent, verdict, and guardrail.
- `FestivalSalePlan` and `MarketingReportSection` for sale planning and report-ready growth summaries.
- New marketing action types: `seo_keyword_update_draft`, `competitor_response_recommendation`, `loss_making_campaign_pause_draft`, `coupon_profitability_review`, `festival_sale_plan_draft`, and `marketing_report_draft`.

Phase 7 adds typed dashboard and reporting contracts:

- `CommandCenterOverview` as the route-facing view model for `/alerts-reports`.
- `AiDailyBriefing` for the daily seller brief sourced from Chief Operations Agent output, automation queue state, ingestion health, and Data Brain quality.
- `DashboardMetric` for recoverable money, money saved, money at risk, RTO risk, return loss, settlement leakage, stockout risk, and action items, each carrying source refs and a drilldown link.
- `DashboardAlert` for high-risk findings and approval/policy-gated actions.
- `MarketplaceComparisonRow`, `LeakageTrendPoint`, and `TopLossEntity` for comparison, trend, SKU, and pincode sections.
- `ReportDownloadStub` for report hub rows. These are explicit stubs and do not create real files yet.
- `AutomationStatusSummary`, `AgentHealthRow`, and `DashboardRecentActivity` for automation, agent, and activity panels.

Current non-goals:

- No real marketplace API calls.
- No real CSV, XLSX, PDF, bank statement, email, or review parsing.
- No database migration.
- No real LLM calls, marketplace writes, customer messages, claim submissions, listing changes, ad budget changes, bank actions, inventory writes, or database persistence.
- Mock execution means deterministic local state-machine output only.
- Mock prompt-to-config means deterministic local parsing only.

## Canonical Record Fields

Every normalized entity should carry:

- `id`
- `workspaceId`
- `canonicalType`
- `sourceRefs`
- `confidence`
- `lineage`
- `createdAt`
- `updatedAt`
- `rawSnapshot`
- `normalizationVersion`

## AI Output Schema

All agent outputs should map into one of these structured records:

- `insight`
- `recommendation`
- `draft_action`
- `executable_action`
- `alert`
- `report`
- `task`
- `automation_event`

Minimum fields:

- `id`
- `workspaceId`
- `agentId`
- `title`
- `summary`
- `inputRefs`
- `impactAmount`
- `riskLevel`
- `confidence`
- `explanation`
- `recommendedActions`
- `approvalRequired`
- `createdAt`
- `auditRef`

## Automation State Machine

Actions should move through:

- `recommended`
- `drafted`
- `awaiting_approval`
- `approved`
- `scheduled`
- `executing`
- `executed`
- `failed`
- `reverted`

Every state transition must produce an audit log entry.

## Future Database Direction

When moving beyond mock adapters, prefer:

- Tenant-isolated Postgres tables.
- JSONB only for source payloads, raw snapshots, and flexible agent metadata.
- Relational tables for canonical entities, mappings, actions, and audits.
- Append-only audit and feedback tables.
- Explicit indexes on `workspace_id`, external IDs, source type, entity type, status, and timestamps.
