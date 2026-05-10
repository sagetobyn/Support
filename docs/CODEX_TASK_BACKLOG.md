# Codex Task Backlog

## Next Best Task

Implement Phase 5.1 policy handoff and approval queue integration:

1. Convert `AutomationDraftIntent` records into approval-queue preview records without executing actions.
2. Add policy handoff checks for risk level, confidence threshold, seller approval rules, and integration availability.
3. Show blocked vs approval-ready intents in the automation/action layer.
4. Add tests proving high-risk intents cannot auto-execute and low-risk intents still remain preview-only until Phase 6 execution.
5. Keep all marketplace/customer/bank side effects disabled.

Suggested prompt:

> Continue Phase 5.1 for the AI Operations OS. Wire structured AI findings and automation draft intents into a policy handoff preview for the Automation / Action Layer. Do not execute actions; only classify approval-ready, blocked, and recommendation-only intents with tests.

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

- Add policy handoff preview from structured findings into the automation layer.
- Add model config per agent in model-control UI.
- Add richer entity drilldowns from each finding to the Data Brain.
- Add historical run comparison once feedback loops exist.
- Done in mock foundation: agent registry, Chief Operations Agent ranking, structured findings, deterministic confidence scoring, explanation summaries, recommended actions, automation draft intents, and service-backed `/ai-operations-engine`.

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
