# Pro Plan

Pro is the INR 14,999/month RTOShield plan for Indian D2C sellers doing roughly 2,000-5,000 orders/month.

## Promise

Reduce preventable COD/RTO/NDR leakage with advanced order-risk decisions, courier/pincode policy recommendations, prepaid conversion opportunities, SKU/campaign leakage analysis, exportable reports, and priority founder-ready insights.

## Included

- Up to 5,000 orders/month.
- CSV uploads up to 10,000 rows/import.
- Limited multi-store support under one brand, up to 3 stores.
- Advanced configurable rule engine with default Pro rules.
- Advanced risk scoring with custom rules, campaign/margin signals, expected leakage, and confidence.
- High-risk COD hold policy recommendations.
- Pincode, courier, SKU, campaign/source, and NDR leakage intelligence.
- Margin-safe COD-to-prepaid opportunities.
- NDR playbooks by normalized NDR reason.
- Advanced daily action queue with owner, priority, source, leakage, and savings fields.
- Provider-ready WhatsApp architecture with mock/manual export by default.
- Advanced savings ledger and ROI view.
- Weekly Founder Report and Monthly Strategy Report.
- Deterministic policy simulator.
- Integration readiness placeholders for Shopify/WooCommerce, couriers, WhatsApp, payment links, helpdesk, and accounting.
- Priority onboarding checklist and static SOP templates.
- UI-level roles: admin, ops, analyst, viewer.
- Exportable workspace/report package.
- Demo / Client Test Mode for local client-style testing with fictional generated data.

## Architecture

Pro keeps feature boundaries under `src/features/*`. Feature modules expose public APIs through `index.ts`; cross-feature workflows use `src/shared/events` and `src/shared/connectors`.

Core connector flow:

Import -> Order Ledger -> Risk Scoring -> Custom Rules -> Address Check -> NDR Detection -> Prepaid Opportunity Detection -> Policy Recommendations -> Daily Action Queue -> Messaging -> Response Capture -> Savings Events -> Reports -> Weekly / Monthly Strategy Reports.

Storage remains localStorage for demo/pilot use with `storage_version: pro_v1`. Production should move the same model to tenant-isolated Postgres/Supabase.

## Limits

- Pro is CSV-first.
- Pro supports one brand, up to 3 stores.
- Pro warns above 5,000 orders/month.
- Pro warns above 10,000 rows/import.
- Pro recommendations do not automatically block, cancel, switch courier, or push courier actions.

## Disabled / Gated

Scale/Enterprise placeholders cover real courier API pushes, full API integrations, ML risk model, multi-brand portfolio, managed ops team, returns intelligence, inventory optimization, cashflow reconciliation, advanced RBAC, autonomous agents, data warehouse export, and API access.

## Acceptance Criteria

The implementation includes plan config, storage versioning, stores, CSV Pro fields, data quality scoring, custom rules, advanced risk, policy recommendations, prepaid strategy, pincode/courier/SKU/campaign analysis, NDR playbooks, advanced action queue, provider-ready messaging, savings ledger, weekly/monthly reports, simulator, integration readiness, onboarding, SOPs, role guards, Pro gates, tests, and build verification.

## Local Demo Data

Pro demos can be tested without a real client CSV by using Demo / Client Test Mode or the generated CSV fixture:

```text
sample-data/demo-fashion-pro.csv
```

The fixture includes 1,400 fictional orders with COD/prepaid mix, delivered/RTO/NDR outcomes, Indian pincode/city data, courier, SKU/product, campaign/source, NDR reasons, customer type, and address quality issues. It is intended for local testing and sales-demo rehearsal only.
