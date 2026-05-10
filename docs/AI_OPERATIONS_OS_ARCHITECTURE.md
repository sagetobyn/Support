# AI Operations OS Architecture

## Company Pivot

Wembro is moving from a website plus dashboard into an AI Operations OS for ecommerce sellers. The system must automatically detect, prevent, and recover operational losses across marketplaces while explaining every decision clearly.

The company promise:

> We automatically detect, prevent, and recover operational losses across ecommerce marketplaces.

The product is not an AI dashboard. The dashboard is only the control room. The operating system works from real seller data sources, normalized entities, agent outputs, automation policies, and audit logs.

## Current Repository Reality

The current repo is a Next.js App Router application with:

- Public website routes: `/`, `/product`, `/pricing`, `/calculator`, `/audit`, `/sample-report`, `/demo`, `/pilot`, `/personas/*`.
- A large dashboard route at `/dashboard` with many local-first revenue leakage workflows.
- Prisma schema for Brand, User, Order, NDRCase, Action, SavingsEvent, AuditLog, and Integration.
- Supabase SSR auth middleware with public marketing routes and protected app/API surfaces.
- Existing feature modules under `src/features/*` for imports, integrations, actions, reports, savings, risk, rules, onboarding, pilot workflows, and the current operations OS boundary.
- Local/mock adapter patterns that are useful and should be preserved.

This foundation should be extended, not replaced.

## Target System Flow

The long-term system sequence is:

1. Website
2. Onboarding + Marketplace Connection
3. Data Ingestion Layer
4. Unified Seller Data Brain
5. AI Operations Engine
6. Automation / Action Layer
7. Dashboard + Alerts + Reports
8. Settings + Customization + Model Control
9. Feedback Loop / Learning System

The internal product rhythm stays:

`DATA -> INSIGHT -> DECISION -> ACTION -> LEARNING`

No module should bypass this order.

## Core Principle

AI must never extract truth from the dashboard. The dashboard reads from system state. AI and automation read from:

- Marketplace APIs.
- CSV, XLSX, and PDF uploads.
- Settlement reports.
- Return reports.
- Order reports.
- Inventory reports.
- Courier and NDR reports.
- Bank statements.
- Email reports.
- Support messages.
- Customer conversations.
- Reviews.
- Ad reports.
- Supplier files.
- Accounting and GST files.

## System Boundaries

### Website / Seller Acquisition

Explains operational leakage, converts sellers, and positions Wembro as an AI Operations OS. It should support the current calculator and trust ladder while expanding the product story beyond RTO/NDR.

### Onboarding + Marketplace Connection

Captures business profile, marketplace mix, permissions, upload fallback, categories, pain points, tools, and first diagnosis trigger.

### Data Ingestion

Owns connector registry, report parsing interfaces, ingestion jobs, validation, freshness, source health, retries, and logs.

### Unified Seller Data Brain

Normalizes fragmented marketplace records into one commerce graph with lineage, confidence, mapping, deduplication, and anomaly foundations.

### AI Operations Engine

Runs orchestrated agents. Every output becomes structured data: insight, recommendation, draft action, executable action, alert, report, task, or automation event.

### Automation / Action Layer

Converts findings into work under policy checks, approval queues, execution state machines, audit logs, retry logic, and human override.

### Dashboard + Alerts + Reports

Shows what the system found, what it did, what is risky, what needs approval, and what money was saved or recovered.

### Settings + Model Control

Stores seller rules, risk appetite, notification preferences, approval rules, prompt templates, brand voice, and model choices per agent.

### Feedback Loop

Tracks outcomes, seller overrides, action acceptance, rejected recommendations, claim success, RTO outcomes, listing changes, and marketing profitability.

## Recommended Code Shape

The repo should evolve toward these boundaries:

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
  marketing-automation/
```

For this first increment, the new foundation lives under `src/features/ai-operations-os/*` so it does not disrupt existing production-like dashboard flows. Later phases can split that vertical into separate modules once contracts are proven.

## First Increment Guardrails

- Preserve the existing dashboard and RTO/NDR workflows.
- Do not add risky live automation.
- Keep mock data in adapter/service files only.
- Keep business logic out of route components.
- Keep routes thin and mostly composed from reusable OS shell components.
- Add docs before expanding code.
- Treat database migrations as a later, explicit phase.

