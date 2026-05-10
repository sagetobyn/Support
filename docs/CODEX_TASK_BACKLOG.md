# Codex Task Backlog

## Next Best Task

Implement Phase 8.1 persisted settings adapter and server-side validation:

1. Add a frontend-safe settings adapter interface that can later swap from mock data to API/database persistence.
2. Add server-side validation schemas for prompt-to-config previews before persistence.
3. Add versioning/audit fields for applied setting changes.
4. Add tests proving prompt-to-config persistence is isolated from AI execution and automation execution.
5. Keep real LLM parsing and provider calls disabled until credentials, budgets, and audit boundaries are configured.

Suggested prompt:

> Continue Phase 8.1 for the AI Operations OS. Add a settings persistence adapter interface and validation layer for prompt-to-config rules. Do not call real LLM providers or execute automation; only prepare the storage boundary and tests.

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

- Add client-side approval/rejection simulation.
- Add action detail routing or selection state.
- Add retry and rollback simulation for failed or reverted actions.
- Add policy preview controls before Phase 8 settings persistence.
- Done in mock foundation: action queue, approval queue, safe automation levels, seller approval policy, execution state machine, rule builder UI, action detail view, audit logs, recent activity, and mock internal execution.

## Phase 8 Follow-Ups

- Add persistence adapter interface for settings, model configs, prompt templates, and applied structured rules.
- Add validation schemas for prompt-to-config outputs.
- Add editable model config controls once persistence exists.
- Add audit/version history per applied setting change.
- Done in mock foundation: provider abstraction, agent-specific model settings, prompt templates, brand voice, support tone, marketing tone, risk appetite, profit margin rules, COD/RTO rules, approval rules, notifications, prompt-to-config preview/apply UI, and tests.

## Hard Non-Goals For Now

- No direct marketplace write actions.
- No live customer messages.
- No real bank or GST parsing.
- No model provider dependency.
- No database migration until domain contracts are reviewed.
- No dashboard-as-source-of-truth shortcut.
