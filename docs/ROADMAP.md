# Roadmap

CommerceOps AI is the long-term company direction: a profit-maximizing e-commerce operations control room for Indian sellers. RTOShield by CommerceOps AI remains the first wedge.

RTO/NDR is the first wedge because it is painful, measurable, and action-oriented. The long-term product is a profit-maximizing e-commerce operations control room.

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

## Phase 2: WhatsApp Integration

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

Do not start this phase until the CSV-first action queue has pilot proof. The MVP must not add a real WhatsApp API yet.

## Phase 3: Shopify/WooCommerce Integration

Goal:

- Reduce CSV dependency for new orders.

Scope:

- Pull new orders.
- Subscribe to order and fulfillment webhooks where available.
- Keep CSV import for historical audit and fallback.

Success:

- New orders appear without manual upload.
- Seller can still upload courier/NDR CSVs if shipping integration is not ready.

Do not build Shopify integration in the current MVP.

## Phase 4: Shipping Platform Integrations

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

Do not build real courier APIs in the current MVP.

## Phase 5: AI/ML Improvement

Goal:

- Improve prediction quality with historical seller data.

Scope:

- Train tabular risk model only after enough clean labels exist.
- Keep rule overrides for obvious cases.
- Evaluate precision at high-risk cutoffs, calibration, and saved-order economics.

Success:

- Better precision on high-risk order identification than rules alone.
- Measured improvement in pilot outcomes.

Do not add ML in the current MVP; keep the rules explainable and auditable.

## Phase 7: Broader CommerceOps AI

Goal:

- Expand beyond the RTO/NDR wedge into adjacent operations leakage only after the wedge has proof.

Potential future areas:

- Returns.
- Inventory.
- Support inbox.
- Cashflow.
- Broader profit-per-order recommendations.

These are explicitly out of scope for the current app.

## Phase 6: Moat

Goal:

- Build durable intelligence from repeated operational data.

Scope:

- Cross-brand pincode intelligence.
- Courier performance index.
- Buyer trust signals.
- Category benchmarks.
- Agency and fulfillment partner distribution.

Success:

- Product improves as more sellers use it.
- RTOShield can credibly recommend pincode, courier, SKU, and payment-mode policy changes.
