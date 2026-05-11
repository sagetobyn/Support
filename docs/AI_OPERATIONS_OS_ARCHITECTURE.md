# AI Operations OS Architecture

## Product Timing Law

Wembro's current customer promise is not a broad AI Operations OS.

The active product wedge is:

> A CSV-first COD/RTO/NDR profit recovery control room for Indian D2C sellers.

The current product helps a seller import recent order, shipment, and NDR data, diagnose post-checkout leakage, decide what to fix today, run a manual or mock-assisted rescue workflow, and track estimated or verified savings. This is the seller-facing promise until the wedge has stronger pilot proof.

AI Operations OS is the future architecture direction. It should guide sequencing, data contracts, and internal boundaries, but it must not be presented as the live product promise before proof exists.

## Active Wedge First

The active wedge remains the Revenue Leakage Control Center:

- CSV upload for seller order, shipment, and NDR exports.
- Data quality checks, normalization, and low-sample warnings.
- Rule-based COD/RTO/NDR risk explanation.
- NDR rescue queue and daily profit action queue.
- Mock/provider-agnostic WhatsApp outbox and manual response capture.
- Placeholder payment links for COD-to-prepaid recommendations.
- Savings ledger with estimated and verified states.
- Audit trail and privacy controls.

This wedge is narrow on purpose. It is painful, measurable, and action-oriented. It creates the proof needed before Wembro earns the right to expand.

## Not Current Scope

Do not describe these as active product capabilities:

- Real WhatsApp sending without provider integration, template approval, webhook handling, opt-out rules, and audit proof.
- Real courier API pushes without provider integration, action receipts, failure handling, and audit proof.
- Real Shopify or WooCommerce sync without implemented ingestion, webhooks, reconciliation, and tests.
- ML prediction without trained data, evaluation, calibration, and clear labeling.
- Guaranteed ROI or verified savings without seller outcome evidence.
- Broad modules such as inventory, returns, settlement, marketplace health, cashflow, or chatbot workflows.

These may exist as future architecture candidates only after the Revenue Leakage Control Center proves repeatable value.

## Current Repository Reality

The current repo is a Next.js App Router application with:

- Public website routes: `/`, `/product`, `/pricing`, `/calculator`, `/audit`, `/sample-report`, `/demo`, `/pilot`, `/personas/*`.
- A large dashboard route at `/dashboard` with local-first revenue leakage workflows.
- Prisma schema for Brand, User, Order, NDRCase, Action, SavingsEvent, AuditLog, and Integration.
- Supabase SSR auth middleware with public marketing routes and protected app/API surfaces.
- Feature modules under `src/features/*` for imports, integrations, actions, reports, savings, risk, rules, onboarding, pilot workflows, and the current operations OS boundary.
- Local/mock adapter patterns that are useful and should be preserved.

This foundation should be extended in sequence, not replaced by broad AI language.

## Proof Gates Before AI Or Automation

AI, live integrations, and automation can graduate from architecture into product scope only when these gates are satisfied:

1. Seller proof: real pilot users have worked the CSV-first daily queue and NDR rescue flow.
2. Data proof: imported data has lineage, validation, data quality warnings, and repeatable mappings.
3. Action proof: recommendations lead to clear human actions with owner, status, reason, and confidence.
4. Savings proof: outcomes are recorded as estimated or verified with formulas and before/after evidence.
5. Trust proof: audit logs, privacy controls, export governance, and seller-visible disclaimers are in place.
6. Integration proof: every live provider has implemented auth, webhook or polling behavior, retries, failure states, and tests.
7. Model proof: any ML system has labeled training data, evaluation, calibration checks, and rule-based fallback.
8. Automation proof: execution starts with approval-based drafts, logs every decision, supports rollback or correction, and never bypasses seller policy.

If a capability fails these gates, it stays future architecture.

## Future Architecture Sequence

The long-term system sequence is:

1. Proven Revenue Leakage Control Center
2. Production trust layer
3. Provider-backed ingestion and reply capture
4. Unified seller data brain
5. AI operations engine
6. Approval-based automation and action layer
7. Dashboard, alerts, and reports
8. Settings, customization, and model control
9. Feedback loop and learning system

The internal product rhythm stays:

`DATA -> INSIGHT -> DECISION -> ACTION -> LEARNING`

No module should bypass this order. AI can assist insight and draft action only after trusted data and seller-visible decision logic exist.

## Future System Boundaries

### Website / Seller Acquisition

Current website language must lead with the COD/RTO/NDR profit recovery wedge. Future AI OS language can explain the long-term direction only after the current wedge is stated first.

### Onboarding + Marketplace Connection

Future onboarding may capture business profile, marketplace mix, permissions, upload fallback, categories, pain points, tools, and first diagnosis trigger. In the active wedge, CSV upload and privacy-safe audit flow remain enough.

### Data Ingestion

Future ingestion owns connector registry, report parsing interfaces, ingestion jobs, validation, freshness, source health, retries, and logs. Current ingestion remains CSV-first unless a specific provider integration is implemented and tested.

### Unified Seller Data Brain

Future data brain normalizes fragmented seller records into one commerce graph with lineage, confidence, mapping, deduplication, and anomaly foundations. It should begin with order, shipment, NDR, action, savings, and audit records before expanding to other domains.

### AI Operations Engine

Future AI agents may produce structured insights, recommendations, draft actions, alerts, reports, tasks, or automation events. Every output must include source data, confidence, reason, approval requirement, and seller-visible risk.

### Automation / Action Layer

Future automation converts approved findings into work under policy checks, approval queues, execution state machines, audit logs, retry logic, and human override. The first live version should be approval-based, not autonomous.

### Dashboard + Alerts + Reports

The dashboard reads from system state. It should show what was found, what should be done, what needs approval, what happened, and what money was saved or protected.

### Settings + Model Control

Future settings may store seller rules, risk appetite, notification preferences, approval rules, prompt templates, brand voice, and model choices per agent. These settings are not a substitute for proof gates.

### Feedback Loop

Future learning tracks outcomes, seller overrides, action acceptance, rejected recommendations, claim success, RTO outcomes, and delivery results. Learning must come from recorded outcomes, not claims.

## Future Code Shape

The repo may evolve toward these boundaries after proof gates are satisfied:

```text
src/features/
  ai-operations-os/
    components/
    data/
    domain/
    services/
  ingestion/
  data-brain/
  ai-agents/
  automation/
  model-control/
  seller-settings/
```

For early increments, experimental AI OS foundations should remain behind clear service/module boundaries so they do not disrupt the production-like RTO/NDR dashboard flows or leak into seller-facing promises.

## First Increment Guardrails

- Preserve the existing dashboard and RTO/NDR workflows.
- State the active CSV-first wedge before any future OS ambition.
- Do not add risky live automation.
- Keep mock data in adapter/service files only.
- Keep business logic out of route components.
- Keep routes thin and mostly composed from reusable components.
- Add docs before expanding code.
- Treat database migrations as a later, explicit phase.
