# MVP Scope

## Goal

Build a working MVP for a 14-day RTO/NDR profit recovery pilot with real Indian e-commerce sellers. The broader company vision is Wembro: an ecommerce operations decision system that reduces operational leakage and improves profit per order. The MVP remains the Revenue Leakage Control wedge.

RTO/NDR is the first wedge because it is painful, measurable, and action-oriented. The long-term product is a profit-maximizing e-commerce operations control room.

Core promise:

> Give us your last 30 days order/shipping/NDR data. We will show where profit leakage is coming from, then run a pilot to reduce failed deliveries using COD risk control, prepaid conversion offers, NDR rescue, courier/pincode recommendations, and savings reporting.

## Primary Users

- Founder: wants leakage, savings, and ROI.
- Ops user: wants a daily queue of exact actions.
- Viewer: wants read-only reporting.

## Required Modules

### 0. Pre-Sales / Trust-Building Modules

These modules sit before the CSV-first dashboard. They do not replace the dashboard; they help a seller move toward a privacy-safe audit and 14-day pilot.

- Free RTO loss calculator.
- Fictional sample audit report.
- Summary-number audit without customer data.
- Anonymized CSV audit without customer names, phones, emails, or full addresses.
- 14-day pilot workflow with checklist, action rules, daily metrics, savings ledger, and final review.

Purpose:

- Build trust before asking for seller CSV.
- Show estimated leakage from summary numbers.
- Let the seller understand what a report looks like before sharing data.
- Convert qualified sellers into the existing RTO/NDR profit recovery workflow.

### 1. Authentication And Brand Workspace

- Login.
- Brand setup.
- Basic roles: admin, ops, viewer.
- Multi-brand structure if simple.

### 2. Brand Settings

- Brand name.
- Currency: INR.
- Forward shipping cost.
- Return shipping cost.
- Packaging cost.
- Estimated CAC.
- COD fee.
- Optional gross margin.
- WhatsApp sender placeholder.
- Risk thresholds.
- Default customer language.
- Courier platforms used.

### 3. CSV Upload

- Parse CSV.
- Normalize column names.
- Validate required fields.
- Preview import.
- Report errors.
- Avoid duplicate order imports.
- Re-import/update by order_id or AWB.
- Store raw row for debugging.

### 4. Order Dashboard

Filters:

- Payment mode.
- Risk bucket.
- Courier.
- Pincode.
- City/state.
- Shipment status.
- NDR status.
- Final status.
- Date range.
- Action required.

Each order shows:

- Order id and AWB.
- Customer.
- Masked phone.
- Pincode and city.
- SKU/product.
- Order value.
- Payment mode.
- Courier.
- Risk score and bucket.
- Recommended action.
- Current status and final outcome.

### 5. Rule-Based RTO Risk Scoring

Score: 0 to 100.

Inputs:

- Payment mode.
- Address quality.
- Landmark presence.
- Pincode historical RTO rate.
- Customer previous RTO.
- Order value.
- Product/SKU/category.
- Courier performance.
- Repeated phone/address.
- Late-night order when timestamp exists.
- NDR reason when already in NDR.

Outputs:

- Score.
- Bucket.
- Reasons.
- Recommended action.

### 6. Address Quality Engine

Detect:

- Too short address.
- Missing house/flat number.
- Missing landmark.
- Missing city.
- Invalid pincode format.
- Pincode-city mismatch placeholder.
- Vague address terms.
- Missing/unavailable phone placeholder.
- Suspicious repeated address.

Output:

- Address quality score.
- Issues.
- Suggested customer question.

### 7. NDR Reason Normalization

Normalize raw courier reasons into:

- customer_unavailable
- customer_refused
- wrong_address
- phone_unreachable
- payment_issue
- delayed_delivery
- out_of_delivery_area
- courier_fake_attempt
- customer_requested_future_delivery
- customer_shifted
- door_locked
- other

Output:

- Normalized reason.
- Confidence.
- Recommended message.
- Recommended action.

### 8. NDR Rescue Dashboard

Show:

- Order id and AWB.
- Customer.
- Masked phone.
- Pincode.
- Courier.
- Raw and normalized NDR reason.
- Attempt count.
- Order value.
- Time since NDR.
- Customer response.
- Recommended action.
- Action status.
- Final outcome.

Actions:

- Send WhatsApp template.
- Mark called.
- Mark reattempt requested.
- Update address.
- Mark cancelled.
- Mark RTO.
- Mark delivered.
- Add note.

### 9. WhatsApp Template Manager

Provider-agnostic module with mock outbox in MVP.

Templates:

- COD confirmation.
- Address correction.
- Out-for-delivery reminder.
- NDR rescue.
- Reattempt scheduling.
- Alternate phone request.
- COD-to-prepaid payment link.
- Cancellation confirmation.
- Final delivery attempt warning.
- Thank you/delivered confirmation.

### 10. Customer Response Capture

MVP:

- Manual response entry.
- Webhook placeholder.
- Button response simulation.

Intents:

- confirm_delivery
- update_address
- reschedule_today
- reschedule_tomorrow
- reschedule_specific_date
- share_alternate_phone
- convert_prepaid
- cancel_order
- angry_customer
- unknown

### 11. Recommended Action Engine

Outputs:

- ship_normally
- send_cod_confirmation
- request_address_update
- hold_order
- call_customer
- convert_to_prepaid
- request_reattempt
- update_address_with_courier
- mark_cancelled
- mark_rto
- escalate_to_ops
- block_or_flag_pincode

Every recommendation must include why.

### 12. Profit Recovery Cockpit

Metrics:

- Total orders.
- COD/prepaid orders.
- Total RTO and RTO rate.
- COD RTO rate.
- NDR cases.
- NDRs contacted/responded/rescued.
- Delivered after NDR.
- Cancelled before shipping.
- Address corrected.
- Converted to prepaid.
- Estimated RTO loss.
- Estimated recoverable leakage.
- Estimated savings.
- Software cost placeholder.
- Net benefit.

### 13. Profit Leakage Report

HTML/printable report sections:

- Executive summary.
- COD leakage.
- RTO leakage.
- Pincode leakage.
- Courier leakage.
- SKU/product leakage.
- NDR reason leakage.
- Address quality issues.
- Push prepaid offer actions.
- Estimated monthly loss.
- Estimated savings at 10%, 20%, and 30% RTO reduction.
- Recommended 14-day action plan.
- Daily action queue.

### 14. Daily Profit Action Queue

Groups:

- Confirm risky COD.
- Fix weak address.
- Push prepaid offer.
- Hold high-risk order.
- Rescue NDR.
- Request reattempt.
- Call customer.
- Mark RTO / cancel.
- Review courier issue.

Each action card should show order id, masked phone, pincode, courier, order value, expected leakage, recommended action, reason, and confidence/risk bucket.

### 15. Push Prepaid Offers

Simple rule-based MVP logic:

- COD order.
- Order value above ₹999 or ₹1,499.
- Medium/high/critical risk.
- Not delivered/RTO.
- Not already prepaid.

Recommended action: Offer prepaid incentive. Use placeholder payment links only.

### 16. Audit Logs And Privacy

Must include:

- CSV upload audit log.
- Export audit log.
- Unmasked phone view audit log if implemented.
- Brand data deletion.
- Role-based masking.
- Privacy notes in README.

## Acceptance Criteria

- Brand can be created.
- Cost assumptions can be edited.
- CSV can be uploaded.
- Orders are parsed and stored.
- Risk score is calculated for every order.
- Risk score is explainable.
- Orders are filterable.
- NDR cases are detected.
- NDR reasons are normalized.
- Actions are recommended.
- Daily Action Queue exists.
- Daily Action Queue feels like the core Starter product.
- Manual COD-to-prepaid action suggestions can be queued through the mock workflow.
- Leakage Report includes pincode/courier action recommendations, not only metrics.
- WhatsApp templates exist.
- Mock outbox messages can be created.
- Customer responses can be recorded manually.
- Recommendations update after response.
- RTO loss and savings are calculated.
- Profit leakage report is generated.
- Phones are masked.
- Indian D2C seed data exists.
- README explains setup and usage.
- Basic tests exist for scoring, NDR normalization, ROI, and CSV parsing.

## Version 0.2 Status

Implemented as a CSV-first pilot MVP with local browser persistence. The app now stores brand settings, imported orders, import summaries, derived/persisted NDR case state, mock WhatsApp outbox messages, customer responses, completed actions, savings events, and audit logs in `localStorage`.

The MVP remains intentionally non-integrated:

- WhatsApp is a mock/provider-agnostic outbox.
- Courier and Shopify/WooCommerce updates are manual.
- Risk scoring is rule-based and explainable.
- Reports are printable HTML, not PDF export.
- No returns, inventory, support inbox, cashflow, real courier API, real WhatsApp API, Shopify integration, or ML is included.

The pilot demo dataset is `sample-data/rto-pilot-sample-large.csv`.

## Starter Plan Scope

Starter is now the first paid self-serve plan at INR 2,999/month for sellers around 300-700 orders/month.

Starter includes one brand workspace, CSV upload, order ledger, basic rule-based risk scoring, address quality checks, NDR detection/dashboard, limited daily action queue, mock WhatsApp outbox, manual response capture, basic ROI, basic RTO audit report, privacy controls, local persistence, Starter limits, and a billing placeholder.

Starter intentionally excludes real WhatsApp API, Shopify/WooCommerce integrations, courier API integrations, ML, returns, inventory, cashflow, full support inbox, enterprise permissions, multi-brand, full automation, and managed ops.

## Pro Scope Clarification

Pro is still CSV-first. It adds advanced rules, policy recommendations, reports, simulation, provider readiness, export packages, and ops workflows, but it does not include full automation. Real courier API pushes, live Shopify/WooCommerce/courier integrations, real payment integration, ML, managed ops, multi-brand, returns, inventory, cashflow, autonomous agents, and advanced RBAC remain outside Pro.
