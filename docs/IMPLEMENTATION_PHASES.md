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

Deliverables:

- Connector registry.
- Upload/report ingestion skeleton.
- Ingestion job status UI.
- Parsing interfaces for CSV, XLSX, PDF, email, bank, courier, ads, support, and reviews.
- Data quality score logic.

## Phase 4: Unified Data Brain Foundation

Deliverables:

- Normalized entity store interface.
- SKU mapping flow.
- Marketplace ID mapping flow.
- Confidence and lineage UI.
- Commerce graph view.

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

