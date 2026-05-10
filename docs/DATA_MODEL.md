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

Current non-goals:

- No real marketplace API calls.
- No real CSV, XLSX, PDF, bank statement, email, or review parsing.
- No database migration.
- No AI engine, automation execution, or marketing UI behavior added in this increment.

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
