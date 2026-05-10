# Codex Task Backlog

## Next Best Task

Implement Phase 3 data ingestion foundation:

1. Expand `src/features/ai-operations-os/services/ingestionService.ts` into a connector registry.
2. Add parser interfaces for CSV, XLSX, PDF, bank statement, courier report, settlement report, ad report, support message, review file, and email ingestion.
3. Add an ingestion job state machine with `queued`, `extracting`, `parsing`, `cleaning`, `normalizing`, `validating`, `stored`, `failed`, and `retrying`.
4. Add tests for source freshness, quality scoring, and retry eligibility.
5. Keep all real connector credentials out of UI and logs.

Suggested prompt:

> Continue Phase 3 for the AI Operations OS. Build the ingestion connector registry and ingestion job state machine under `src/features/ai-operations-os`, add focused tests, and keep all parsing mocked behind typed interfaces.

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
- Add source freshness indicators.
- Add ingestion logs table.
- Add normalized record preview.
- Add failed job retry UI.

## Phase 4 Follow-Ups

- Build SKU mapping UI.
- Build marketplace identifier mapping UI.
- Add entity confidence cards.
- Add lineage drilldown.
- Add graph-like commerce relationship view.

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

