# Wembro UX System

Wembro should feel like a premium, calm, operational B2B SaaS control room for Indian D2C sellers. Wembro Revenue Leakage Control Center is the first service-product: RTO/NDR Profit Recovery.

## Product Principles

- Start every client journey with the core business problem, then the solution, then the product surface.
- Package the product as service-products for different client personas instead of presenting every module equally.
- Every screen should answer: what should the seller do now, and why?
- Show data only when it supports an action, decision, or confidence check.
- Label money as estimated unless it has been verified.
- Prefer operational language over generic analytics language.
- Keep real integrations, automation, ML, and external sending out of the local MVP.
- Make demo testing easy with generated fictional data and CSV upload.

## Navigation Structure

- Start Here: Profit Cockpit, Demo / Client Test Mode.
- Service Products: Free RTO Leakage Check, Sample Audit Report, RTO Profit Audit, 14-Day RTO Rescue Pilot, Daily Execution Queue, Founder Profit Intelligence.
- Core Workflow: CSV Upload, Order Risk, NDR Rescue, Prepaid Opportunities, Messaging Outbox, Savings Ledger, Leakage Report.
- Advanced / Pro: Pincode Intelligence, Courier Intelligence, SKU Intelligence, Campaign Intelligence, Policy Simulator, Monthly Strategy Report.
- Setup & Admin: Brand Settings, Stores, Custom Rules, NDR Playbooks, Integration Readiness, SOPs, Onboarding, Privacy & Audit, Plan & Billing.

## Core Components

The local UI layer lives in `src/components/ui/controlRoom.tsx`.

- `MetricCard`: concise KPI with tone, delta, description, optional click.
- `InsightCard`: recommendation-led explanation with confidence and impact.
- `ActionCard`: priority action with order/policy context and primary/secondary actions.
- `RiskBadge`, `PriorityBadge`, `StatusBadge`, `ConfidenceBadge`: consistent status language.
- `EmptyState`: explains what to do next.
- `PageHeader`, `SectionHeader`: consistent page/section hierarchy.
- `DataQualityBadge`: communicates import confidence.
- `MoneyValue`, `PercentValue`, `PhoneMasked`: consistent formatting and privacy.
- `RecommendationPanel`: separates recommendation from dense tables.
- `Timeline`: message/action/NDR lifecycle.
- `FilterBar`, `SearchInput`, `DateRangeSelector`: reusable controls.
- `ExportButton`, `PrintButton`: report utility.
- `DemoModeBanner`: clearly labels fictional data.
- `UpgradeGate`: polished placeholder for gated/future scope.
- `DrawerDetailLayout`: order/NDR detail pattern.
- `LoadingSkeleton`: loading placeholder.

## UX Rules

- Put the recommendation before the table.
- Keep long explanations out of tables.
- Use tables for structured fields only.
- Keep Daily Action Queue free of delivered/no-action orders.
- Use quick filters for common operational cuts: high-risk COD, weak address, NDR, prepaid opportunity, delivered, RTO, needs action.
- Use drawer detail for order/NDR context instead of navigating away.
- Every report should include recommendations, not just metrics.
- Empty states should tell the seller which field or action unlocks the view.
- Privacy copy must remind users that names, phones, emails, and full addresses are optional for early audits.

## Microcopy Rules

Use:

- estimated
- potential
- recommended
- pilot
- test this policy
- review this lane
- high confidence / medium confidence / low confidence
- low sample size

Avoid:

- guaranteed savings
- generic AI hype
- childish copy
- vague button labels like primary
- claims that imply real integrations are active

## Report Design Rules

- Reports should be printable.
- Founder reports should start with a short narrative.
- Savings events must show formula notes and status.
- Low-sample warnings must be visible.
- Export/copy/print actions should be available where useful.
- Monthly strategy should include decisions, experiments, risks, and a next-month plan.

## Visual System

- Use clean white panels, restrained borders, compact cards, and high-contrast operational badges.
- Use consistent tones: success, warning, danger, neutral, info.
- Charts should be simple and readable; CSS bars/donut are enough for this local MVP.
- Avoid decorative backgrounds, one-note palettes, oversized hero marketing layouts, and cluttered tables.
