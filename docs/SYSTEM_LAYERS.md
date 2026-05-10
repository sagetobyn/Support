# System Layers

## Layer Map

| Layer | Job | Owns | Must Not Own |
| --- | --- | --- | --- |
| Website | Acquire and educate sellers | Positioning, use cases, calculator, trust | Source-of-truth business data |
| Onboarding | Move seller to connected data | Business profile, marketplace choice, permissions, uploads | Data parsing internals |
| Ingestion | Collect and normalize raw data | Connectors, parsers, validation, sync logs | Final AI decisions |
| Seller Data Brain | Create unified commerce graph | Canonical entities, mapping, lineage, confidence | UI layout decisions |
| AI Operations Engine | Reason over normalized data | Agents, findings, recommendations, explanations | Direct risky execution |
| Automation Layer | Execute allowed work | Policy checks, queues, approvals, execution logs | Raw extraction from dashboards |
| Dashboard | Control room and visibility | Briefing, alerts, reports, action status | Source-of-truth data creation |
| Settings + Model Control | Configure behavior | Rules, approval policies, model settings, prompt-to-config | Hidden one-off business rules |
| Feedback Loop | Improve from outcomes | Action outcomes, seller overrides, learning signals | Rewriting history |

## Data Flow

1. Source data arrives from connectors or report uploads.
2. Ingestion parses, cleans, validates, and records lineage.
3. Data Brain maps records into canonical commerce entities.
4. AI agents read normalized entities and produce structured findings.
5. Automation policy decides whether each finding becomes a recommendation, draft, approval request, or executable action.
6. Dashboard renders system state, alerts, reports, and queues.
7. Feedback loop records outcomes and seller overrides.

## Current Phase 3/4 Boundary

The current implementation keeps the ingestion layer and data brain behind service-layer view models:

- `connectorRegistryService` owns connector definitions, capabilities, permissions, supported inputs, and mock connector results.
- `ingestionService` owns ingestion jobs, pipeline rollups, retry eligibility, source freshness, and ingestion activity.
- `dataQualityService` derives quality scores from mock source health, job failures, freshness, and normalized entity confidence.
- `normalizedEntityService` owns canonical commerce entities and record previews.
- `mappingService` owns SKU mappings, marketplace ID mappings, and confidence summaries.
- `lineageService` owns source-to-entity lineage records.
- `dataBrainService` composes graph, mapping, confidence, lineage, and preview data for `/data-brain`.

The `/data-ingestion` and `/data-brain` pages render these service view models. They must not reintroduce page-local connector rows, entity rows, mapping rows, or quality numbers.

This is still a mock foundation. No real parser, API connector, credentials, database writes, or AI extraction from dashboards exists in this increment.

## Current Phase 5/6 Boundary

The AI Operations Engine and Automation Layer are also behind service-layer view models:

- `aiInsightsService`, `aiFindingService`, `agentRegistryService`, and `chiefOperationsAgentService` own agent registry, structured findings, confidence, explanations, and automation draft intents.
- `automationService` composes action queue, approval queue, rules, policy, state counts, action detail, audit logs, and recent activity for `/automation`.
- `automationPolicyService` owns seller approval checks and safe auto-execute eligibility.
- `automationStateMachineService` owns allowed states and mock execution results.
- `approvalQueueService` owns approval queue derivation.
- `automationAuditService` owns append-only mock audit and activity records.

Phase 6 mock execution means local simulation only. The system does not send messages, block COD, submit claims, update listings, change ad budgets, place reorders, write marketplace settings, or call any external provider.

## Current Phase 8 Boundary

Settings and model control now expose structured configuration without real provider calls:

- `settingsService` composes seller-facing settings for brand voice, tones, margin rules, COD/RTO rules, approval rules, notifications, and applied prompt-to-config rules.
- `modelControlService` composes provider abstraction, agent-specific model configs, prompt templates, budgets, fallback models, and safe-mode status.
- `promptToConfigService` parses natural-language instructions into structured setting rules with setting paths, operators, parsed values, affected agents, risk, confidence, and mock apply status.

Phase 8 mock apply is not persistence. It previews the exact shape that future server actions, database writes, and real LLM parsing should use.

## Current Phase 9 Boundary

Marketing/Growth Automation is integrated into operations, not a standalone marketing tool:

- `marketingAutomationService` composes listing optimization, SEO keywords, competitor intelligence, review mining, sentiment, ads, coupon profitability, festival planning, and report sections for `/marketing-automation`.
- Marketing data references normalized commerce IDs for listing, SKU, review, return, RTO, inventory, ad campaign, keyword, competitor listing, pincode, settlement, and report file records.
- Marketing decisions must pass profit, inventory, return, RTO, and seller-rule context before they become a draft or recommendation.
- Marketing action IDs join back to `automationService`, so campaign pause drafts, SEO drafts, competitor responses, coupon reviews, sale plans, and report drafts use the same approval policy, audit log, state machine, and mock execution layer.
- Phase 9 does not call ad providers, update marketplace listings, create coupons, scrape competitors, mine live reviews, or generate copy with a real LLM.

## Current Phase 7 Boundary

Dashboard + Alerts + Reports is a command-center read model, not a business-data source:

- `reportingService` composes `/alerts-reports` from AI findings, automation actions, Data Brain quality, ingestion health, report summaries, trend mocks, marketplace comparison mocks, and normalized entity references.
- The page renders `CommandCenterOverview`; it does not own KPI numbers, alert rows, report rows, activity rows, top-loss entities, marketplace comparison data, or trend points.
- Drilldown links route back toward `/automation`, `/ai-operations-engine`, and `/data-brain` so sellers can inspect the source decision or normalized evidence.
- Report downloads are stubs only. No PDF, CSV, or XLSX files are generated in this phase.

The dashboard must never extract data from its own UI. It can only display state that came from ingestion, the data brain, AI findings, automation policy/audit logs, reports, and future feedback records.

## Control Flow

Automation levels:

| Level | Name | Behavior |
| --- | --- | --- |
| 1 | Recommend only | AI explains what to do; no draft or execution. |
| 2 | Draft action | AI prepares a claim, message, ticket, report, or change. |
| 3 | One-click approve | Seller approves a prepared action. |
| 4 | Auto-execute under seller rules | System executes only when policy permits. |
| 5 | Full autopilot | Strictly configured actions execute with monitoring, audit, and rollback plans. |

## Boundary Tests

Before adding any module, answer:

- What source data powers it?
- What normalized entities does it need?
- What structured AI output does it produce?
- What action can the seller take this week?
- What audit record proves the decision?
- What outcome feeds learning?

If these cannot be answered, the module is not ready for implementation.
