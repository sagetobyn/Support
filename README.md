# Wembro — Revenue Leakage Control Center

Wembro is an ecommerce operations decision system for Indian sellers. The current MVP remains focused on the first wedge: **Wembro Revenue Leakage Control Center**, a CSV-first RTO/NDR profit recovery control room for a 14-day rescue workflow:

Profit Recovery -> COD Risk Control -> Daily Action Queue -> NDR Rescue -> Savings Ledger.

It is not a COD confirmation app, chatbot, shipping aggregator, or CRM. It helps sellers import order/shipment/NDR data, diagnose operational leakage, act on risky COD and NDR cases, queue mock messages, record customer responses, and prove estimated savings in ₹.

RTO/NDR is the first wedge because it is painful, measurable, and action-oriented. The long-term product is a profit-maximizing e-commerce operations control room.

The operating system rule is:

Data -> Insight -> Decision -> Action -> Learning.

See `docs/WEMBRO_OPERATING_SYSTEM.md` for the CEO product directive and priority sequence.

## Client-First Service Products

Wembro should be presented from the client problem outward:

1. Core problem: money leaks after checkout through failed COD delivery, weak addresses, courier/pincode issues, and slow NDR action.
2. Solution: identify leakage, prioritize daily actions, rescue NDRs, and show estimated savings.
3. Product: use Revenue Leakage Control tools only when they support that outcome.

Packaged offers:

- Free RTO Leakage Check: calculator, sample report, and summary-only audit for founders who are not ready to share customer data.
- RTO Profit Audit: anonymized CSV audit, leakage report, and pilot recommendation for founders, finance heads, and ecommerce heads.
- 14-Day RTO Rescue Pilot: daily queue, NDR rescue, mock/manual messaging, and savings ledger for founders and ops managers.
- Daily Execution Queue: order risk, action queue, NDR rescue, prepaid opportunities, and messaging outbox for ops, support, and warehouse teams.
- Founder Profit Intelligence: Profit Cockpit, Weekly Founder Report, Monthly Strategy Report, Policy Simulator, and pincode/courier/SKU/campaign intelligence for higher-plan users.

## What Changed In Version 0.2

- Durable localStorage persistence for brand settings, orders, imports, NDR cases, outbox, responses, actions, savings events, and audit logs.
- CSV upload now parses, previews first 10 rows, auto-maps aliases, validates rows, reports missing/invalid fields, imports valid rows, updates duplicates by `order_id + awb`, and stores raw rows.
- Rule-based risk scoring now uses COD, address quality, pincode/courier history in the current dataset, repeated phones, previous RTO/cancel signals, order value, and NDR reasons.
- Address quality checks detect short/missing/vague addresses, invalid pincodes, missing landmarks/city/house details, and repeated addresses.
- NDR reasons normalize into operational categories and drive recommended actions/templates.
- NDR Rescue supports state changes, notes/timelines, mock WhatsApp queueing, reattempt/address/cancel/delivered/RTO actions, and audit logs.
- Daily Action Queue is now the main ops workflow with action groups and mark-done behavior.
- Daily Action Queue can suggest manual COD-to-prepaid offers for risky COD orders, using placeholder payment links only.
- Reports now include Starter audit sections, leakage drivers, low-sample warnings, and a basic daily action plan.
- Messaging now supports order/case selection, rendered previews, template buttons, a mock/provider-agnostic outbox, message statuses, and response capture.
- Customer responses update order/NDR state, recommended actions, and savings events.
- Profit Cockpit and Leakage Report use transparent ROI formulas, low-sample warnings, savings opportunities, and a printable audit layout.
- Privacy page includes local data summary, phone masking explanation, delete-data control, audit log table, and production privacy warning.
- Added `sample-data/rto-pilot-sample-large.csv` with 520 realistic Indian D2C orders.
- Expanded tests for CSV import, risk scoring, address quality, NDR normalization, ROI, and recommended actions.

## Starter Plan

Starter is the ₹2,999/month RTOShield tier for small Indian D2C sellers doing roughly 300-700 orders/month. It is CSV-first and useful without real WhatsApp, Shopify, WooCommerce, courier APIs, ML, backend database, enterprise permissions, or full automation.

To use Starter, upload a seller CSV from CSV Upload, review auto-mapping and data-quality warnings, import valid rows, then work through Order Risk, NDR Rescue, Daily Action Queue, Messaging Outbox, Leakage Report, Privacy & Audit, and Plan & Billing. Starter supports up to 1,000 rows per import and warns when the workspace crosses 500 orders/month.

Starter includes one brand workspace, basic rule-based risk scoring, basic address quality checks, basic NDR detection, a limited manual action queue, mock WhatsApp templates/outbox, manual response capture, local persistence, basic ROI, and a basic printable RTO audit report. Growth/Pro upgrade buttons are placeholders only.

## Version 0.2.1 Seller-Demo Polish

- Last import summary is separated from current workspace totals.
- Daily Action Queue now shows only actionable work and excludes delivered/no-action orders.
- Generic action labels were replaced with operational labels such as Queue WhatsApp, Call customer, Address needed, Mark delivered, and Mark RTO.
- Delivered/no-action orders disable operational WhatsApp and response actions.
- NDR lifecycle states use seller-friendly labels.
- Leakage Report includes recommended actions and low-sample warnings for small groups.
- Profit Cockpit tells the business story with COD %, RTO %, COD RTO %, estimated loss, recoverable leakage, estimated savings, and net benefit.
- Savings Ledger rows are labeled as estimates and show the formula note.

## Version 0.3 Control-Room UX

- Reorganized the app into grouped navigation: Home, Pre-Sales, Operations, Intelligence, Reports, Setup, and Admin.
- Added a reusable local UI system for metric cards, insight cards, action cards, badges, page headers, empty states, timelines, drawer details, print/export buttons, and demo banners.
- Added Demo / Client Test Mode inside the app for testing as a D2C client without real integrations.
- Added deterministic generated demo workspaces for Fashion, Footwear, Beauty, Accessories, Wellness, and Gadget profiles.
- Added generated sample CSVs:
  - `sample-data/demo-fashion-pro.csv` with 1,400 fictional Pro-demo orders.
  - `sample-data/demo-footwear-growth.csv` with 900 fictional Growth-demo orders.
  - `sample-data/demo-beauty-starter.csv` with 650 fictional Starter-demo orders.
- Redesigned Profit Cockpit around one business question: where is money leaking, what should be done today, and why?
- Polished CSV Upload with drag/drop, privacy-safe copy, data quality scoring, mapping review, preview, warnings, and next-step buttons.
- Polished Order Risk with quick filters and drawer-style order details.
- Rebuilt Daily Profit Action Queue as the central operating workflow with focus mode, action cards, expected impact, and action completion.
- Reworked NDR Rescue as a war-room view with urgency tabs, SLA indicators, case drawer, lifecycle actions, and timeline.
- Added clearer COD-to-prepaid opportunities, Savings Ledger controls, report copy/export/print actions, and an interactive Policy Simulator.
- Upgraded pincode, courier, SKU, and campaign intelligence to show recommendations before tables.

## Navigation Guide

- Start Here: Profit Cockpit and Demo / Client Test Mode.
- Service Products: Free RTO Leakage Check, Sample Audit Report, RTO Profit Audit, 14-Day RTO Rescue Pilot, Daily Execution Queue, and Founder Profit Intelligence.
- Core Workflow: CSV Upload, Order Risk, NDR Rescue, Prepaid Opportunities, Messaging Outbox, Savings Ledger, and Leakage Report.
- Advanced / Pro: pincode, courier, SKU, campaign, policy simulator, and monthly strategy intelligence.
- Setup & Admin: Brand Settings, Stores, Custom Rules, NDR Playbooks, Integration Readiness, SOPs, Onboarding, Privacy & Audit, and Plan & Billing.

## Demo / Client Test Mode

Use `/demo` or the in-app **Demo / Client Test Mode** when you want to test locally as if you are a D2C client.

The guided flow lets you:

1. Choose a business profile.
2. Generate fictional local data.
3. Review Profit Cockpit.
4. Upload optional CSV.
5. Review leakage insights.
6. Open Daily Action Queue.
7. Rescue one NDR.
8. Queue one mock WhatsApp message.
9. Record one customer response.
10. Mark one action complete.
11. Check Savings Ledger.
12. Open Weekly Founder Report.
13. Run Policy Simulator.
14. Export the local workspace or orders CSV.

Demo data is fictional and for local testing. It includes COD/prepaid mix, delivered/RTO/NDR outcomes, Indian pincodes/cities, couriers, SKUs, campaign/source fields, NDR reasons, customer type, address quality issues, and deliberately interesting leakage clusters.

## 5-Minute Demo Flow

1. CSV Upload: upload `sample-data/rto-pilot-sample-large.csv`, review the preview, then import valid rows.
2. Profit Cockpit: show total orders, COD %, RTO %, COD RTO %, NDR cases, estimated RTO loss, recoverable leakage, savings, and net benefit.
3. Leakage Report: show COD, RTO, pincode, courier, SKU/product, NDR, address, and savings opportunity sections with recommended actions.
4. Daily Action Queue: show the ops team’s daily queue without delivered/no-action clutter.
5. NDR Rescue: open failed deliveries, show normalized reason, lifecycle state, and action buttons.
6. Messaging: select an actionable order/case, preview the rendered message, and queue it to the mock outbox.
7. Privacy/Audit: show local storage disclosure, phone masking, audit log, and delete-data control.

## Public Trust-Building Tools

RTOShield now includes the first commercial trust-and-validation layer before asking sellers for private CSV data:

- `/calculator`: a free RTO loss calculator for Indian D2C brands. It estimates COD orders, RTO orders, RTO loss per order, monthly/daily leakage, savings at 10/20/30% RTO reduction, net benefit, and ROI multiple using only summary numbers.
- `/sample-report`: a fictional fashion D2C sample profit leakage audit showing the kind of insight a seller can expect without exposing customer data.
- `/audit`: a privacy-safe audit flow with summary-only audit, anonymized CSV audit, and full pilot preparation modes.
- `/pilot`: a simple 14-day pilot workflow for baseline setup, daily action execution, mid-pilot review, savings ledger, and final review.

The calculator lead form asks only for brand/category/contact and summary operating numbers. For the MVP, leads are stored in browser localStorage and can be downloaded as JSON or CSV. No external API is called.

This flow intentionally asks for summary numbers before CSV because random D2C sellers should not need to trust RTOShield with customer-level data on the first touch. A privacy-safe audit can start with monthly orders, COD %, RTO %, shipping cost, and AOV; an anonymized CSV audit can come later with order id, pincode, payment mode, order value, courier, status, NDR reason, and final outcome, without customer name, phone, email, or full address.

### How To Use The First Order Set

1. Open `/calculator`, adjust monthly orders, COD %, RTO %, cost assumptions, category, and platform. The results update live.
2. Use the lead capture form only for summary numbers and consent. Export local leads from the debug panel if needed.
3. Open `/sample-report` to show fictional demo output before requesting seller data.
4. Open `/audit` and choose summary-only first. If useful, upload an anonymized CSV with no customer identity fields.
5. Open `/pilot` to create a 14-day plan from an audit session or a demo baseline.

### Privacy-Safe By Design

- `/calculator`: no customer data, only summary inputs and consent.
- `/audit` summary mode: no customer data.
- `/audit` anonymized CSV: no customer name, phone, email, or full address.
- `/pilot`: phone/address may be needed only if the seller chooses real WhatsApp/address-correction workflows later.
- Customer-level communication should only be used for delivery/RTO operations, not unrelated marketing.

### Still Mocked In This Stage

- localStorage, not server database.
- No authentication on public trust-building routes.
- No external lead API.
- No real WhatsApp API.
- No Shopify/WooCommerce integration.
- No courier API.
- No ML model.

### Next Steps After This Stage

Use the calculator and sample report in outreach, collect summary-number audits, request anonymized CSV only after trust is built, then convert strong leakage cases into the 14-day pilot workflow.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Run tests:

```bash
npm test
```

In this workspace, `node_modules` may be damaged if it is synced through Google Drive. If `npm test` cannot find `vitest`, reinstall dependencies in a clean local copy or remove/recreate `node_modules`.

## Sample CSVs

Small sample:

```text
sample-data/rto-pilot-sample.csv
```

Large pilot demo sample:

```text
sample-data/rto-pilot-sample-large.csv
```

Generated profile samples:

```text
sample-data/demo-fashion-pro.csv
sample-data/demo-footwear-growth.csv
sample-data/demo-beauty-starter.csv
```

Use CSV Upload, select the file, review mapping/preview/errors, then click Import valid rows. Duplicate detection uses `order_id + awb`.

## What Is Functional Locally

- LocalStorage-backed brand workspace, orders, imports, NDR cases, messages, responses, actions, savings events, and audit logs.
- CSV upload/import with auto-mapping, preview, validation, duplicate update, and data quality hints.
- Rule-based risk scoring, address quality checks, NDR detection, action queue, messaging outbox, response capture, savings ledger, reports, policy simulator, privacy delete, and local export.
- Generated demo workspaces and generated CSV fixtures for client-style testing.

## What Is Mocked

- WhatsApp sending is mock/manual export only.
- Shopify, WooCommerce, courier, payment, helpdesk, and accounting integrations are readiness placeholders.
- Storage is browser localStorage, not server storage.
- Risk scoring is deterministic rules, not ML.
- Savings are estimates unless the user marks them verified.

## Reset And Export

- Use **Reset demo data** in the sidebar to return to the seeded local workspace.
- Use **Demo / Client Test Mode** to load a new generated workspace.
- Use **Privacy & Audit** to delete local operational data.
- Use **Demo / Client Test Mode** to export the current demo workspace JSON or orders CSV.

## Risk Scoring

The MVP uses explainable rules, not ML. Score range is 0 to 100:

- 0-30: Low
- 31-60: Medium
- 61-80: High
- 81-100: Critical

Signals include COD, address length, missing landmark, invalid pincode, high-RTO pincode/courier clusters from the current dataset, previous phone RTO/cancel signals, high-value COD, repeated active phone orders, and normalized NDR reason.

Every order detail shows “Profit risk explanation” with exact rule reasons, recommended action, estimated loss if RTO, and possible saving if the action succeeds.

## NDR Rescue

Orders become NDR cases when shipment status contains NDR/undelivered/failed/exception, an NDR reason exists, or final status indicates `in_ndr`.

NDR cases support:

- Queue WhatsApp
- Mark called
- Request reattempt
- Update address needed
- Mark cancelled
- Mark delivered
- Mark RTO
- Add note/response

Each action updates local state and creates an audit log.

## Daily Profit Action Queue

The actions page groups work into:

- Confirm risky COD
- Fix weak address
- Push prepaid offer
- Hold high-risk order
- Rescue NDR
- Request reattempt
- Call customer
- Mark RTO / cancel
- Review courier issue

NDR cases are kept in NDR-specific groups instead of pre-dispatch groups.

Prepaid Conversion Opportunities are rule-based in the MVP: COD order, order value above ₹999, medium/high/critical risk, not delivered/RTO, and not already prepaid. The recommended action is “Offer prepaid incentive” with a placeholder payment link.

## Mock WhatsApp Outbox

WhatsApp is mocked and provider-agnostic in v0.2. Supported provider values are `mock` and `manual_export`, with future placeholders for `meta_cloud`, `gupshup`, `wati`, `interakt`, and `aisensy`.

Templates include COD confirmation, address correction, OFD reminder, NDR rescue, reattempt scheduling, alternate phone request, COD-to-prepaid, cancellation confirmation, final delivery attempt, and delivered thank-you.

## Customer Responses

Manual response capture supports intents such as:

- `confirm_delivery`
- `update_address`
- `reschedule_today`
- `reschedule_tomorrow`
- `reschedule_specific_date`
- `share_alternate_phone`
- `convert_prepaid`
- `cancel_order`
- `angry_customer`
- `unknown`

Responses update confirmation/NDR state, recompute the next recommended action, and create savings events where meaningful.

## Savings Calculations

Brand cost assumptions live in Brand Setup:

- forward shipping cost
- return shipping cost
- packaging cost
- estimated CAC
- COD fee
- software cost

Formulas:

- RTO loss per order = forward shipping + return shipping + packaging + estimated CAC + COD fee
- Cancelled before shipping saving = forward shipping + packaging + estimated CAC
- NDR rescued and delivered saving = RTO loss per order
- Address corrected and delivered saving = RTO loss per order
- COD converted prepaid = 35% of estimated RTO loss as risk reduction

## Still Mocked

- Authentication is represented by a role selector.
- Storage is browser localStorage, not a server database.
- WhatsApp sending is a mock outbox.
- Courier API updates are manual.
- Shopify/WooCommerce imports are not integrated.
- No ML model or advanced AI is included.

## Starter Plan

Starter is the first paid self-serve plan at INR 2,999/month for small Indian D2C sellers around 300-700 orders/month.

Included:

- 500 orders/month.
- CSV upload with preview, alias mapping, validation, duplicate update, raw row storage, and import summaries.
- Order ledger with filters and masked phones.
- Basic rule-based RTO risk scoring and explainable reasons.
- Basic address quality check.
- Basic NDR detection, reason normalization, and rescue dashboard.
- Limited daily action queue.
- Mock WhatsApp outbox only.
- Manual customer response capture.
- Basic ROI and savings report.
- Basic printable RTO audit report.
- Privacy controls, audit logs, local delete, and local persistence.
- Plan & Billing placeholder.

Not included:

- Real WhatsApp API.
- Shopify/WooCommerce integration.
- Courier API integration.
- ML model.
- Returns, inventory, cashflow, or full support inbox.
- Managed ops, multi-brand, enterprise permissions, or full automation.

Risk scoring is rule-based and explainable. NDR detection is based on shipment status, final status, and courier NDR reason. ROI uses estimated formulas only: RTO loss per order includes forward shipping, return shipping, packaging, estimated CAC, COD fee, and support ops cost. Savings events are estimates, not guaranteed savings.

Starter modules live under `src/features/*`; shared events and connectors live under `src/shared/*`. Feature code should import public feature APIs such as `@/features/risk`, not deep internal files.

## Pro Plan

Pro is now implemented as the INR 14,999/month operating tier for Indian D2C sellers doing roughly 2,000-5,000 orders/month. It raises limits to 5,000 orders/month and 10,000 rows/import, changes local storage to `pro_v1`, and adds multi-store support up to 3 stores under one brand.

Pro includes custom rules, advanced risk scoring, high-risk COD hold recommendations, pincode/courier/SKU/campaign leakage intelligence, margin-safe COD-to-prepaid opportunities, NDR playbooks, an advanced action queue, provider-ready WhatsApp/manual export, an advanced savings ledger, weekly founder reports, monthly strategy reports, a policy simulator, integration readiness, onboarding, SOPs, UI-level roles, report package export, and Scale/Enterprise gates.

Pro remains CSV-first and recommendation-led. It does not include real courier API pushes, production Shopify/WooCommerce/courier/payment integrations, real WhatsApp automation by default, ML, multi-brand, managed ops, returns, inventory, cashflow, autonomous agents, or advanced RBAC.

### Using Pro Workflows

Use CSV Upload with seller order/shipment/NDR exports. Extra fields such as `store_id`, `source_store_name`, `campaign_name`, `utm_source`, `utm_medium`, `utm_campaign`, `ad_id`, `sku`, `gross_margin`, `discount_amount`, `customer_type`, and NDR/return/support reasons unlock deeper Pro analysis.

Use Stores to organize up to 3 stores under one brand. Use Custom Rules to review default Pro rules and test them on sample orders. Use Pincode/Courier/SKU/Campaign sections for policy recommendations. Use Prepaid Opportunities for margin-safe incentives. Use NDR Playbooks for ops-guided rescue. Use Weekly Founder Report and Monthly Strategy for founder-ready summaries. Use Privacy & Audit or report exports for local backup/report package workflows.

## Integrate Next

1. Supabase Auth/Postgres or SQLite-backed repository.
2. Real WhatsApp provider and webhook response capture.
3. Shopify/WooCommerce order ingestion.
4. Shiprocket/NimbusPost/Delhivery shipment and NDR imports.
5. Export/API handoff for courier reattempts, address updates, and cancellation.

Do not add returns, inventory, support inbox, cashflow, real courier APIs, real WhatsApp APIs, Shopify integration, or ML until the RTO/NDR profit recovery wedge has stronger pilot proof.
