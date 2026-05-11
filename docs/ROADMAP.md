# Roadmap

## Current Product Promise

Wembro's active product promise is the Revenue Leakage Control Center: a CSV-first COD/RTO/NDR profit recovery control room for Indian D2C sellers.

The current seller promise is narrow:

- Import recent order, shipment, and NDR data.
- Find where post-checkout profit is leaking.
- Prioritize what the team should fix today.
- Rescue NDRs before they become RTO.
- Track estimated or verified savings with transparent formulas.

Wembro may become a broader profit-maximizing ecommerce operations decision system later. AI Operations OS language is future architecture, not the current customer promise.

## Roadmap Timing Rule

RTO/NDR is the first wedge because it is painful, measurable, and action-oriented.

The roadmap follows `docs/WEMBRO_OPERATING_SYSTEM.md`: Data -> Insight -> Decision -> Action -> Learning. Do not expand into broad modules until the Revenue Leakage Control Center has pilot proof.

Every new roadmap item must pass `docs/SCOPE_GATE_CHECKLIST.md` before it becomes active product scope. The checklist blocks generic dashboards, fake integrations, fake automation, and future modules that do not have seller proof, data proof, action proof, savings proof, and trust proof.

## Proof Gates Before AI Or Automation

Future AI, integrations, and automation can move into product scope only after:

- Seller proof: real sellers use the CSV-first workflow and daily queue.
- Data proof: imported data has validation, lineage, freshness, and low-sample warnings.
- Action proof: recommendations lead to specific human-owned actions.
- Savings proof: outcomes are recorded as estimated or verified, never guaranteed.
- Trust proof: privacy controls, audit logs, and export governance are visible.
- Integration proof: each live provider has auth, retries, failure states, webhooks or polling, and tests.
- Model proof: ML has labeled data, evaluation, calibration, and rule fallback.
- Automation proof: execution begins as approval-based draft action with audit trail and human override.

Until these gates are met, AI OS remains a future architecture section, not active product scope.

## Phase 0A: Trust-Building Tools

Goal:

- Build trust before asking a seller for sensitive customer/order CSV data.
- Move sellers from a free calculator to sample report, summary-number audit, anonymized CSV audit, and 14-day pilot.

Scope:

- Free RTO loss calculator.
- Fictional sample profit leakage audit report.
- Summary-number audit.
- Anonymized CSV audit.
- Pilot workflow with action queue, checklist, savings ledger, and final review.

Success:

- Sellers understand estimated COD/RTO/NDR leakage before uploading data.
- At least 5 sellers submit summary numbers.
- Qualified sellers agree to an anonymized CSV audit or 14-day pilot discussion.

## Phase 0: Manual Validation

Goal:

- Get last 30 days CSVs from sellers.
- Run RTO audits manually.
- Close 14-day rescue pilots.

Tools:

- Google Sheets.
- Manual WhatsApp.
- Simple audit report.
- Seller CSV exports from Shopify, WooCommerce, Shiprocket, NimbusPost, Delhivery, or courier dashboards.

Success:

- 5 sellers agree to an audit.
- 2 sellers agree to a pilot.
- Baseline RTO, COD-RTO, NDR rate, and estimated RTO loss are known for at least 2 sellers.

## Phase 1: MVP Software

Goal:

- Build a CSV-first RTO profit recovery control room.

Scope:

- Brand workspace and settings.
- CSV upload and import summary.
- Orders table.
- Rule-based risk scoring.
- Address quality checks.
- NDR reason normalization.
- NDR rescue dashboard.
- Daily Profit Action Queue.
- COD-to-prepaid opportunities with placeholder payment links.
- WhatsApp template outbox with mock sending.
- Manual customer response capture.
- Profit Recovery Cockpit.
- Profit Leakage Report with pincode/courier recommendations.
- Privacy and audit controls.

Success:

- 3 to 5 pilot clients use the app.
- Ops users can act from the dashboard daily.
- Founder can see estimated savings, RTO leakage, recoverable leakage, and net benefit in INR.

Version 0.2 implementation note:

- Phase 1 is now represented by a localStorage-backed CSV MVP.
- Remaining Phase 1 hardening before live production is auth, tenant isolation, server storage, and export governance.

Growth milestone:

- From basic RTO dashboard to daily profit recovery workflow.
- Adds full action queue, NDR SLA urgency, prepaid opportunities, pincode/courier/SKU leakage reports, message-cost estimates, and weekly savings reporting while staying CSV-first.

Pro milestone:

- From daily action workflow to profit recovery operating system.
- Adds multi-store organization, custom rules, advanced risk decisions, hold/prepaid/pincode/courier/SKU/campaign recommendations, NDR playbooks, advanced action ownership, provider readiness, founder reports, monthly strategy, simulator, onboarding, SOPs, and Pro gates while remaining CSV-first and recommendation-led.

## Phase 2: Future WhatsApp Integration

Goal:

- Move from mock outbox to real WhatsApp messaging and reply capture.

Scope:

- Provider abstraction for Meta Cloud API, Gupshup, WATI, Interakt, or AiSensy.
- Template status handling.
- Webhook receiver for replies and delivery status.
- Button response capture.
- Opt-out and audit logging.

Success:

- Customer responses are captured automatically.
- Ops team no longer manually records most responses.

Proof gate:

- Do not start this phase until the CSV-first action queue has pilot proof, provider approval path is clear, opt-out handling exists, and message/reply events can be audited.

The MVP must not add a real WhatsApp API yet.

## Phase 3: Future Shopify/WooCommerce Integration

Goal:

- Reduce CSV dependency for new orders.

Scope:

- Pull new orders.
- Subscribe to order and fulfillment webhooks where available.
- Keep CSV import for historical audit and fallback.

Success:

- New orders appear without manual upload.
- Seller can still upload courier/NDR CSVs if shipping integration is not ready.

Proof gate:

- Do not start this phase until CSV import is reliable, duplicate reconciliation is tested, seller permissions are understood, and webhook failure handling is designed.

Do not build Shopify or WooCommerce integration in the current MVP.

## Phase 4: Future Shipping Platform Integrations

Goal:

- Semi-automate shipment status and NDR rescue.

Scope:

- Shiprocket, NimbusPost, and Delhivery first.
- Import shipment and NDR status.
- Export or push reattempt/address/cancel actions where supported.
- Track NDR-to-action latency.

Success:

- NDR cases enter the rescue queue automatically.
- Reattempt instructions are exportable or pushable with minimal ops work.

Proof gate:

- Do not start real courier API pushes until provider auth, action receipts, retries, failure states, and audit proof exist.

Do not build real courier APIs in the current MVP.

## Phase 5: Future AI/ML Improvement

Goal:

- Improve prediction quality with historical seller data.

Scope:

- Train tabular risk model only after enough clean labels exist.
- Keep rule overrides for obvious cases.
- Evaluate precision at high-risk cutoffs, calibration, and saved-order economics.

Success:

- Better precision on high-risk order identification than rules alone.
- Measured improvement in pilot outcomes.

Proof gate:

- Do not start ML until there is enough labeled seller data, evaluation against rule baselines, calibration checks, and saved-order economics.

Do not add ML in the current MVP; keep the rules explainable and auditable.

## Phase 6: RTO/NDR Moat

Goal:

- Build durable intelligence from repeated RTO/NDR operational data.

Scope:

- Cross-brand pincode intelligence.
- Courier performance index.
- Buyer trust signals.
- Category benchmarks.
- Agency and fulfillment partner distribution.

Success:

- Product improves as more sellers use it.
- Wembro can credibly recommend pincode, courier, SKU, and payment-mode policy changes.

Proof gate:

- Do not present benchmarks or trust signals as verified until enough comparable seller data exists and confidence limits are visible.

## Phase 7: Future AI Operations OS Architecture

Goal:

- Expand beyond the RTO/NDR wedge into adjacent operations leakage only after the wedge has proof and the AI/automation proof gates are satisfied.

Future architecture candidates:

- Returns leakage.
- Inventory leakage.
- Settlement recovery.
- Marketplace health.
- Cashflow visibility.
- Broader profit-per-order recommendations.
- AI operations agents for draft insights, tasks, reports, and approval-based actions.

These are explicitly out of scope for the current app. Each future module must pass the scope gate before it can move from architecture language into the seller-facing product promise.
