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

Status: mock foundation completed in this increment.

Deliverables:

- Agent registry. Implemented for the requested Phase 5 agents only.
- Agent configuration. Model config IDs are attached to registry entries; full model-control UI remains Phase 8.
- Structured AI finding schema. Implemented with input refs, lineage refs, confidence, explanation, recommended action, and automation draft intent.
- Mock engine outputs. Implemented as deterministic service output from existing Data Brain entities and lineage.
- Chief Operations Agent orchestration skeleton. Implemented with ranked briefing and priority formula.
- Explainability cards. Implemented on `/ai-operations-engine` through confidence breakdown, explanation summary, and recommended action sections.

Current limits:

- No real LLM calls.
- No live marketplace/customer/bank actions.
- No automation execution or approval queue mutation.
- Marketing/Growth Agent is a profit-aware skeleton only.

## Phase 6: Automation / Action Layer

Status: mock foundation completed in this increment.

Deliverables:

- Action queue. Implemented from Phase 5 `AutomationDraftIntent` records plus action-layer mock examples.
- Approval queue. Implemented as policy-derived approval records with approver role, reason, risk, confidence, and status.
- Automation rules builder. Implemented as service-backed mock rule graph with trigger, condition, guardrail, and action nodes.
- Execution state machine. Implemented with supported states, transitions, state counts, and mock execution results.
- Seller approval policies. Implemented with automation ceiling, confidence floor, risk approval rules, quiet hours, external-write guardrails, and max impact without approval.
- Audit logs and recent activity. Implemented as deterministic mock records from action state and policy decisions.
- Action detail view. Implemented on `/automation` from the service-layer view model.

Current limits:

- No real external API calls.
- No marketplace, customer, support, listing, ad, bank, supplier, or inventory writes.
- Mock execution means local state-machine simulation only.
- No database persistence or mutation.

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

Status: mock foundation completed in this increment.

Deliverables:

- Settings page. Implemented with brand voice, support tone, marketing tone, risk appetite, profit margin rules, COD/RTO rules, approval rules, notifications, and applied structured rules.
- Agent model config UI. Implemented with provider abstraction, per-agent model settings, safe mode, fallback model, budget, reasoning depth, and approval threshold.
- Natural language instruction input. Implemented as a client-side mock prompt-to-config panel.
- Mock conversion into structured rule. Implemented through deterministic parser outputting setting paths, operators, parsed values, affected agents, risk, confidence, and approval requirement.
- Preview before applying. Implemented with local mock apply state and audit summary.

Current limits:

- No real LLM calls.
- No provider API key use.
- No database persistence.
- No hidden automation or model execution changes.

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
