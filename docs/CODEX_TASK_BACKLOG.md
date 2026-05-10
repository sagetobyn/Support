# Codex Task Backlog

## Next Best Task

Implement Phase 7.1 dashboard drilldowns and report generation adapter stubs:

1. Add query-param aware detail panels for `/alerts-reports?report=...`, `/alerts-reports?chart=...`, and `/alerts-reports?download=...`.
2. Add reusable drilldown components that link dashboard rows to `/automation`, `/ai-operations-engine`, and `/data-brain` evidence sections.
3. Add report-generation adapter interfaces for PDF, CSV, and XLSX without creating real files yet.
4. Add dashboard filter state for marketplace and date range using service inputs, not page-local mock values.
5. Keep dashboard read-only and do not generate source-of-truth business records from UI.

Suggested prompt:

> Continue Phase 7.1 for the AI Operations OS. Add dashboard drilldown panels, report generation adapter stubs, and marketplace/date filter state for `/alerts-reports`. Keep everything service-backed and read-only; do not generate real files or create source-of-truth records from the dashboard UI.

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

## Phase 7 Follow-Ups

- Add query-param aware report, alert, trend, action, and top-loss drilldown panels.
- Add report generation adapter interfaces for PDF, CSV, and XLSX.
- Add marketplace and date range filter inputs that call service-layer selectors.
- Add dashboard feedback hooks so accepted/rejected recommendations can feed the learning system later.
- Done in mock foundation: AI Daily Briefing, recoverable money, money saved, money at risk, RTO risk, return loss, settlement leakage, stockout risk, action items, alerts panel, reports hub, marketplace comparison, leakage trend chart, top loss-making SKUs/pincodes, automation status, agent health, recent activity, download stubs, and drilldown links.

## Phase 8 Follow-Ups

- Add persistence adapter interface for settings, model configs, prompt templates, and applied structured rules.
- Add validation schemas for prompt-to-config outputs.
- Add editable model config controls once persistence exists.
- Add audit/version history per applied setting change.
- Done in mock foundation: provider abstraction, agent-specific model settings, prompt templates, brand voice, support tone, marketing tone, risk appetite, profit margin rules, COD/RTO rules, approval rules, notifications, prompt-to-config preview/apply UI, and tests.

## Phase 9 Follow-Ups

- Add marketing action detail routing into the shared automation action detail view.
- Add Data Brain drilldowns for listing, SKU, review, return, RTO, inventory, ad campaign, keyword, competitor, coupon, and report references.
- Add marketing feedback loop placeholders for accepted, rejected, or modified listing, campaign, coupon, and sale-plan recommendations.
- Add real adapter interfaces for ad reports, keyword reports, review exports, competitor snapshots, and listing content history without calling live providers yet.
- Done in mock foundation: listing optimization workflow, title/bullet/description drafts, marketplace SEO keyword insights, competitor listing and pricing intelligence, review mining, customer sentiment, ad campaign recommendations, budget risk control, loss-making campaign detection, coupon profitability calculator, festival sale planning, marketing report sections, and shared automation handoff.

## Hard Non-Goals For Now

- No direct marketplace write actions.
- No live customer messages.
- No real bank or GST parsing.
- No model provider dependency.
- No database migration until domain contracts are reviewed.
- No dashboard-as-source-of-truth shortcut.
