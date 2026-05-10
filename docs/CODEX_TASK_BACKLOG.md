# Codex Task Backlog

## Next Best Task

Implement Phase 3.1 real parser and ingestion-adapter interfaces:

1. Add parser interface files for CSV, XLSX, PDF, bank statement, courier report, settlement report, ad report, support message, review file, and email ingestion.
2. Keep parsers mocked but make their input/output contracts executable through services.
3. Add upload validation for file type, size, source type, and required mapping columns.
4. Add a parser result object that can emit raw rows, normalized preview rows, validation errors, and lineage references.
5. Keep all real connector credentials out of UI and logs.

Suggested prompt:

> Continue Phase 3.1 for the AI Operations OS. Add typed parser interfaces for report uploads and source adapters under `src/features/ai-operations-os`, keep execution mocked, and wire parser results into the existing ingestion jobs, quality scoring, normalized previews, and lineage tests.

## Phase 1 Follow-Ups

- Add links from the existing dashboard to the new OS shell routes.
- Add authenticated app navigation once the dashboard monolith is decomposed further.
- Add a compact design QA pass against the uploaded command-center references.
- Decide whether the public brand remains Wembro or moves toward a new Operonix-style brand.

## Phase 2 Follow-Ups

- Split `ai-operations-os/domain` into separate modules when contracts stabilize:
  - `ingestion`
  - `data-brain`
  - `agents`
  - `automation`
  - `settings`
  - `marketing-automation`
- Map existing `src/types/domain.ts` order/NDR/action entities to the new canonical OS entities.
- Draft Prisma migration proposals without applying them.

## Phase 3 Follow-Ups

- Add upload UI for report types.
- Add ingestion logs table.
- Add failed job retry action UI.
- Add parser result preview for each report type.
- Add source-specific permission and credential setup screens.
- Done in mock foundation: connector registry, source freshness, ingestion job statuses, retry eligibility, quality scoring, and service-backed `/data-ingestion`.

## Phase 4 Follow-Ups

- Add low-confidence mapping review workflow.
- Add lineage drilldown per normalized record.
- Add entity detail pages for order, SKU, settlement, return, claim, support case, and ad campaign.
- Add richer graph-like commerce relationship view.
- Done in mock foundation: normalized entities, SKU mappings, marketplace ID mappings, entity confidence, lineage records, and service-backed `/data-brain`.

## Phase 5 Follow-Ups

- Implement agent registry and Chief Operations Agent orchestrator.
- Add model config per agent.
- Add structured finding schema tests.
- Add explainability panels.

## Phase 6 Follow-Ups

- Implement approval queue.
- Implement automation rules builder.
- Implement execution state machine tests.
- Add rollback plan fields.
- Add audit timeline per action.

## Phase 8 Follow-Ups

- Implement prompt-to-config parser mock.
- Add preview/apply rule flow.
- Add model control form per agent.
- Persist settings in a frontend-safe adapter until backend schema is ready.

## Hard Non-Goals For Now

- No direct marketplace write actions.
- No live customer messages.
- No real bank or GST parsing.
- No model provider dependency.
- No database migration until domain contracts are reviewed.
- No dashboard-as-source-of-truth shortcut.
