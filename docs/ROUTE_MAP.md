# Wembro Route Map

Status: product-law route policy for WMB-SJ-008, last inventoried on 2026-05-11.

Wembro's active product promise is narrow: a CSV-first COD/RTO/NDR profit recovery control room for Indian D2C sellers. Public routes must move a seller up the trust ladder before asking for private data. Protected routes must serve the control room, proof layer, or future-locked architecture surfaces. Future AI Operations OS language is architecture, not the current customer promise.

## Route Classes

| Class | Meaning | Auth policy |
| --- | --- | --- |
| Public trust ladder | Awareness, estimated loss, sample proof, privacy-safe audit, pilot planning, or login. | Listed in `PUBLIC_TRUST_ROUTES` or `PUBLIC_TRUST_PREFIXES` in `src/lib/auth/middleware.ts`. |
| Public demo | Fictional local demo data only. It may show the product workflow, but must not imply live integrations. | Public because it stores generated demo data locally and calls no external provider. |
| Protected control room | Seller-specific workspace, actions, NDR rescue, savings proof, settings, or private APIs. | Protected by Supabase auth when Supabase is configured. |
| Protected future architecture | Internal/future OS shell routes that explain sequencing, readiness, proof, and governance. | Protected so they do not become public product promises. |
| Protected provider stub | Webhook or integration endpoints that must stay non-public until provider auth, signature checks, retries, failure states, and audit proof exist. | Protected today; making them public requires a new product-law and security review. |

## Trust Ladder

| Ladder step | Routes | Seller question answered |
| --- | --- | --- |
| Awareness | `/`, `/product`, `/pricing`, `/personas/*` | Is Wembro about my post-checkout COD/RTO/NDR profit leakage, not a generic dashboard? |
| Estimate without customer data | `/calculator` | How much might failed COD/RTO be costing me using only summary numbers? |
| Proof without private data | `/sample-report` | What would a leakage audit look like before I upload seller/customer data? |
| Privacy-safe diagnosis | `/audit` | Can I start with summary or anonymized CSV data and understand the next action? |
| Safe demonstration | `/demo` | Can I see the workflow with fictional local data and no real WhatsApp/courier/store sync? |
| Pilot commitment | `/pilot` | What would a 14-day rescue routine require, track, and prove? |
| Account boundary | `/login` | How do I enter the protected control room for real workspace data? |
| Control room | `/dashboard` and protected APIs | What is leaking, why, what should the team do today, and what savings proof exists? |

## Public And Demo Routes

| Route | Class | Purpose | Customer question answered | Product-law boundary |
| --- | --- | --- | --- | --- |
| `/` | Public trust ladder | Homepage for the Revenue Leakage Control Center. | Is this a focused profit recovery system for COD/RTO/NDR leakage? | Must lead with the active wedge before any broader Wembro ambition. |
| `/product` | Public trust ladder | Product explanation for the CSV-first control-room workflow. | What does Wembro actually do after checkout? | Must not imply live WhatsApp, courier API, Shopify/WooCommerce sync, or ML. |
| `/pricing` | Public trust ladder | Offer packaging and plan fit. | What can I buy now, and what is still placeholder or future scope? | Pricing claims must stay tied to current CSV/mock/manual capabilities. |
| `/personas/founder` | Public trust ladder | Founder-facing leakage and savings story. | What does the founder see and decide? | Must stay focused on rupee leakage, action, and proof. |
| `/personas/operations` | Public trust ladder | Ops-facing daily queue story. | What does my team do every day? | Must not become a support inbox, chatbot, inventory, or returns promise. |
| `/personas/growth-lead` | Public trust ladder | Growth-facing COD/RTO quality story. | Which campaigns or offers create failed-delivery leakage? | Must stay tied to COD/RTO/NDR leakage, not broad marketing automation. |
| `/calculator` | Public trust ladder | Free RTO loss calculator using summary inputs. | How big is the possible leakage before I share customer data? | Estimates only; no guaranteed ROI or verified savings claim. |
| `/sample-report` | Public trust ladder | Fictional sample audit artifact. | What proof and recommendations would an audit produce? | Fictional sample only; not seller-verified evidence. |
| `/audit` | Public trust ladder | Summary-number and anonymized CSV audit flow. | Can I diagnose leakage safely before a full pilot? | No customer names, phones, emails, or full addresses are required for the public audit. |
| `/demo` | Public demo | Generates fictional local workspaces and points to the control room. | Can I test the workflow safely? | Safe because data is generated, stored locally, and uses no real WhatsApp, courier, store, payment, or ML integration. |
| `/pilot` | Public trust ladder | 14-day rescue pilot planner and tracker. | What routine turns audit findings into daily COD/NDR actions and savings proof? | Planning and local tracking only until real seller proof exists. |
| `/login` | Public trust ladder | Auth entry to protected workspace. | How do I enter my workspace? | Auth boundary only; not a product module. |

## Protected Page Routes

| Route | Class | Purpose | Customer question answered | Product-law boundary |
| --- | --- | --- | --- | --- |
| `/dashboard` | Protected control room | Main local-first COD/RTO/NDR profit recovery workspace. | What is leaking, why, what should be fixed today, and what savings proof exists? | Current product core; must preserve `DATA -> INSIGHT -> DECISION -> ACTION -> LEARNING`. |
| `/onboarding` | Protected future architecture | Setup path for business profile, data inputs, and operating rules. | What must be configured before the control room can make reliable recommendations? | Must remain CSV/fallback-oriented until live connectors are implemented and tested. |
| `/data-ingestion` | Protected future architecture | Ingestion layer shell for source freshness, adapters, and validation. | Is the data reliable enough to trust recommendations? | Future architecture; does not make live Shopify/courier sync a current promise. |
| `/data-brain` | Protected future architecture | Unified seller data brain shell with lineage and confidence. | How would fragmented seller records become trusted evidence? | Future architecture; no broad commerce graph promise until proof gates pass. |
| `/ai-operations-engine` | Protected future architecture | AI engine shell for structured findings and draft actions. | How could AI assist once data and decision proof exist? | Future-locked; no active ML prediction or autonomous execution claim. |
| `/automation` | Protected future architecture | Approval/action layer for queue, policy checks, execution states, and audit logs. | Which actions are safe to approve, and what proof exists? | Must stay human-approved and audit-first; no fake live automation. |
| `/automation-coverage` | Protected future architecture | Truth layer for manual, mock, local, AI draft, approval, and trusted-rule status. | What is truly automated versus still manual or mock? | Exists to prevent false automation claims. |
| `/alerts-reports` | Protected future architecture | Exception command center and report shell. | What needs attention, proof, or escalation? | Must read from trusted state; not a generic analytics dashboard. |
| `/settings` | Protected control room | Seller rules, costs, COD/RTO policies, tone, notifications, and approval boundaries. | Which rules should govern recommendations and approval? | Settings guide manual/local workflows until live integrations are proven. |
| `/model-control` | Protected future architecture | Model/provider settings shell. | What controls would be needed before model-assisted decisions run? | Future-locked; no current model provider calls or ML claim. |
| `/marketing-automation` | Protected future architecture | Profit-aware growth operations shell. | Which growth actions might affect COD/RTO quality later? | Demoted from active product; not a public marketing automation module. |

## Protected App APIs

| Route | Class | Purpose | Customer question answered | Product-law boundary |
| --- | --- | --- | --- | --- |
| `/api/v1/users/me` | Protected control room API | Current user and workspace bootstrap. | Who is operating this workspace? | Must not bypass tenant/auth checks in production. |
| `/api/v1/brand` | Protected control room API | Brand settings, costs, and risk assumptions. | What cost model drives leakage and savings formulas? | Savings remain estimate/verified based on evidence, never guaranteed. |
| `/api/v1/orders` | Protected control room API | Order list and local/server order records. | What imported orders are being scored? | Data lineage and masking remain part of trust. |
| `/api/v1/orders/[id]` | Protected control room API | Single order read/update. | What is the decision passport for this order? | Actions must stay tied to reason, status, and evidence. |
| `/api/v1/orders/import` | Protected control room API | CSV import pipeline. | Can the seller's order/shipment/NDR data be normalized safely? | CSV-first foundation; no implied store sync. |
| `/api/v1/ndr` | Protected control room API | NDR case list/create. | Which failed deliveries need rescue before RTO loss? | Manual/mock rescue workflow only unless provider integration exists. |
| `/api/v1/ndr/[id]` | Protected control room API | Single NDR case read/update. | What should happen to this failed-delivery case? | Must preserve auditability of reattempt, call, cancel, delivered, or RTO decisions. |
| `/api/v1/actions` | Protected control room API | Daily action queue records. | What should the team fix today? | Human-owned actions before automation. |
| `/api/v1/actions/[id]` | Protected control room API | Single action read/update. | What is the state and proof for this action? | Must keep status/reason/proof visible. |
| `/api/v1/savings` | Protected control room API | Savings ledger records. | What money was estimated or verified as saved/protected? | Separate estimated and verified savings; no guaranteed ROI. |
| `/api/v1/audit` | Protected control room API | Audit log read/write. | What changed, who did it, and what proof exists? | Trust artifact for data, exports, actions, and savings. |
| `/api/v1/integrations` | Protected future architecture API | Integration records and readiness state. | Which providers are configured or still blocked? | Readiness is not live sync; provider proof is required. |
| `/api/v1/integrations/[id]` | Protected future architecture API | Single integration settings. | What is the status of this provider connection? | Must not imply production Shopify/courier/WhatsApp sync without proof. |
| `/api/v1/integrations/[id]/sync` | Protected provider stub | Manual sync trigger behind auth. | Can an approved integration be tested internally? | Not a public live integration promise; requires audit and provider proof before productizing. |
| `/api/v1/automation/capabilities` | Protected future architecture API | Automation capability truth matrix. | Which seller tasks are missing, mock, local, or proof-ready? | Prevents fake automation claims. |
| `/api/v1/automation/events` | Protected future architecture API | Automation event intake. | What event entered the queue and why? | Events do not equal autonomous execution. |
| `/api/v1/automation/inbox` | Protected future architecture API | Approval/exception inbox. | What needs human review? | Human approval remains the control point. |
| `/api/v1/automation/tasks/[id]/approve` | Protected future architecture API | Approve a task. | Who approved what action? | Approval is not provider execution unless external proof exists. |

## Protected Provider Webhook Stubs

| Route | Class | Purpose | Customer question answered | Product-law boundary |
| --- | --- | --- | --- | --- |
| `/api/webhooks/shopify` | Protected provider stub | Shopify webhook receiver placeholder. | What would a future store webhook need? | Stays non-public until implemented ingestion, signature verification, reconciliation, retries, and tests prove real sync. |
| `/api/webhooks/woocommerce` | Protected provider stub | WooCommerce webhook receiver placeholder. | What would a future WooCommerce webhook need? | Stays non-public until implemented ingestion, signature verification, reconciliation, retries, and tests prove real sync. |
| `/api/webhooks/shiprocket` | Protected provider stub | Shiprocket NDR webhook receiver placeholder. | What would a future NDR provider webhook need? | Stays non-public until provider auth, action receipts, retries, failure states, and audit proof exist. |

## Middleware Policy

`src/lib/auth/middleware.ts` is the enforcement point:

- `PUBLIC_TRUST_ROUTES` is intentionally limited to `/`, `/product`, `/pricing`, `/calculator`, `/audit`, `/sample-report`, `/demo`, `/pilot`, and `/login`.
- `PUBLIC_TRUST_PREFIXES` permits `/personas/*`, `/auth/*`, and `/api/public*`.
- Any route not matched by those lists is protected when Supabase auth is configured.
- Local development can bypass auth only when Supabase credentials are missing or the explicit testing bypass is enabled. That is a development convenience, not a production product promise.

## Public Demo Safety

`/demo` is public because it is a trust artifact, not a data-ingestion promise:

- It generates fictional D2C order data.
- It stores demo state in local browser storage.
- It does not send WhatsApp messages.
- It does not push courier actions.
- It does not sync Shopify, WooCommerce, or courier data.
- It does not run ML prediction.

If `/demo` ever accepts real seller/customer data or calls an external provider, it must become protected or receive a new privacy/security review.

## No-Orphan Checklist

Before adding a new route:

1. Add it to this map with class, purpose, customer question, and product-law boundary.
2. If public, add it to `PUBLIC_TRUST_ROUTES` or `PUBLIC_TRUST_PREFIXES` and explain why it belongs on the trust ladder.
3. If protected, leave it out of the public lists and state whether it serves the current control room or future-locked architecture.
4. If it touches a provider, state whether the route is mock, manual export, readiness-only, or live. Live provider routes require auth/signature proof, retries, failure states, audit logs, and tests.
5. Re-run the route policy test so the public/protected boundary stays intentional.
