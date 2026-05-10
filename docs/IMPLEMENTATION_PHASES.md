# Implementation Phases

## Phase 0: Repository Audit And Architecture Docs

Status: started in this increment.

Deliverables:

- Inspect current routes, stack, auth, API, database, and feature boundaries.
- Add architecture docs.
- Define source-of-truth layers and module boundaries.
- Preserve existing website and dashboard.

## Phase 1: Product Shell And Navigation Restructuring

Status: started in this increment.

Deliverables:

- Add OS shell routes for onboarding, ingestion, data brain, AI engine, automation, settings, model control, and marketing automation.
- Use reusable layout/components.
- Centralize mock data.
- Align visual direction with the uploaded dark command-center references.

## Phase 2: Domain Models And Mock Data Layer

Status: started in this increment.

Deliverables:

- Add typed OS domain interfaces.
- Add centralized mock workspace data.
- Add service boundaries:
  - `sellerDataService`
  - `ingestionService`
  - `dataBrainService`
  - `aiInsightsService`
  - `automationService`
  - `reportingService`
  - `settingsService`
  - `marketingAutomationService`

## Phase 3: Data Ingestion Foundation

Status: mock foundation completed in this increment.

Deliverables:

- Connector registry. Implemented with mock connectors for Amazon, Flipkart, Meesho, CSV/XLSX/PDF upload, courier reports, bank statements, support messages, reviews, and ad reports.
- Upload/report ingestion skeleton. Implemented as typed mock connector capabilities and jobs; no real parsing yet.
- Ingestion job status UI. Implemented through `/data-ingestion` service-backed job and pipeline sections.
- Parsing interfaces for CSV, XLSX, PDF, email, bank, courier, ads, support, and reviews. Represented as connector capabilities; real parser implementations remain future work.
- Data quality score logic. Implemented in `dataQualityService` from mock source health, failures, freshness, and entity confidence.

## Phase 4: Unified Data Brain Foundation

Status: started with service-backed normalized data, mapping, confidence, and lineage foundation.

Deliverables:

- Normalized entity store interface. Implemented as typed mock normalized commerce entities.
- SKU mapping flow. Implemented as service-backed mock SKU mappings with confidence and lineage IDs.
- Marketplace ID mapping flow. Implemented as service-backed mock order, SKU, and settlement mappings.
- Confidence and lineage UI. Implemented through `/data-brain` preview, mapping, and lineage sections.
- Commerce graph view. Existing graph now reads from the data brain service.

Remaining Phase 4 work:

- Add drilldowns per canonical entity.
- Add conflict-resolution UI for low-confidence mappings.
- Add richer relationship graph once real data volume and graph constraints are known.

## Phase 5: AI Operations Engine Foundation

Deliverables:

- Agent registry.
- Agent configuration.
- Structured AI finding schema.
- Mock engine outputs.
- Chief Operations Agent orchestration skeleton.
- Explainability cards.

## Phase 6: Automation / Action Layer

Deliverables:

- Action queue.
- Approval queue.
- Automation rules builder.
- Execution state machine.
- Audit logs.

## Phase 7: Dashboard, Alerts, Reports

Deliverables:

- AI Daily Briefing.
- KPI cards.
- Alerts.
- Reports hub.
- Marketplace filters.
- Drilldowns.
- Centralized data reads.

## Phase 8: Settings + Prompt-to-Config + Model Control

Deliverables:

- Settings page.
- Agent model config UI.
- Natural language instruction input.
- Mock conversion into structured rule.
- Preview before applying.

## Phase 9: Marketing Automation Integration

Deliverables:

- Listing optimization workflow.
- Ad recommendation workflow.
- Competitor intelligence mock data.
- Review and sentiment insights.
- Profit-aware marketing recommendations.

## Phase 10: Real Integrations And Production Hardening

Deliverables:

- Marketplace, courier, WhatsApp, email, bank, accounting, and GST integration interfaces.
- Error handling.
- Security boundaries.
- Permission checks.
- Audit logs.
- Tests.
- Deployment notes.
