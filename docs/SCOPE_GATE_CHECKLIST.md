# Scope Gate Checklist

This checklist is mandatory for every Wembro feature, route, module, automation, report, and roadmap item.

Wembro's current customer promise is narrow:

> CSV-first COD/RTO/NDR profit recovery for Indian D2C sellers.

Long-term AI Operations OS language is future architecture. It is not the current sales promise until the Revenue Leakage Control Center has proof from real pilots.

## Gate 0: Current Wedge Fit

A feature can enter the active product only if it directly improves at least one of these outcomes:

- Import or trust seller order, shipment, NDR, courier, pincode, action, or savings data.
- Reveal where COD/RTO/NDR profit leakage is happening.
- Turn leakage into a specific daily seller action.
- Help rescue an NDR before it becomes RTO.
- Record estimated or verified savings with a clear reason, formula, or audit trail.

If the feature does not touch one of those outcomes, it is not current product scope. Move it to future architecture, research, or the feature graveyard.

## Mandatory Scorecard

Score each proposed feature from 0 to 3.

| Dimension | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| Impact | No visible link to COD/RTO/NDR leakage | Indirect operational help | Reduces one leakage driver | Directly protects or recovers money |
| Urgency | Nice-to-have someday | Monthly/occasional use | Weekly founder or ops pain | Daily action or live NDR urgency |
| Frequency | Rare edge case | Used after setup only | Used during weekly review | Used in every import, queue, rescue, or savings review |
| Confidence | Based on opinion | Based on competitor pattern | Based on seller conversation or sample data | Based on pilot behavior, repeated user need, or measured leakage |
| Proofability | Cannot prove outcome | Only qualitative explanation | Can show estimate or before/after metric | Can create an audit log, savings event, export, or pilot artifact |

Decision rule:

- 12-15: Active product candidate if it stays inside COD/RTO/NDR recovery.
- 8-11: Needs sharper proof, smaller scope, or a pilot-only experiment.
- 0-7: Reject or demote.
- Any feature scoring 0 on Proofability is blocked, even if it looks useful.
- Any feature outside COD/RTO/NDR recovery is blocked from the active product, even if it scores well.

## Hard Blockers

Reject or demote the feature if it requires or implies any of the following without real implementation, approval, and audit proof:

- Real WhatsApp sending.
- Real courier API pushes.
- Real Shopify or WooCommerce sync.
- ML prediction.
- Guaranteed ROI, verified savings, or automatic recovery claims.
- Returns, inventory, settlement, marketplace health, cashflow, full support inbox, chatbot, or other broad operations modules as active product.
- Generic dashboards that show metrics without telling the seller what to fix today.

## Generic Dashboard Test

A dashboard, report, or cockpit is blocked unless every primary card answers at least one of these questions:

- What money is leaking?
- Why is it leaking?
- What should the seller do today?
- What evidence proves the action or savings?

Metric-only widgets are not enough. A table is not enough. A chart is not enough. The surface must preserve:

`DATA -> INSIGHT -> DECISION -> ACTION -> LEARNING`

## Future Module Proof Gates

Future modules can be discussed in architecture docs, but cannot become active product until these gates pass:

- Seller proof: at least 3 real sellers report the pain as urgent and costly.
- Data proof: the required data source is available through CSV, export, or approved integration.
- Action proof: Wembro can recommend a specific seller action, not just display a metric.
- Savings proof: the outcome can be estimated or verified with a transparent formula or audit artifact.
- Trust proof: the workflow can run without fake integrations, fake automation, or black-box claims.
- Wedge proof: the COD/RTO/NDR recovery workflow is already repeatable enough that this module will not distract from it.

Until then, future modules belong in future architecture, not the current customer promise.

## Reject Examples

Reject as active product:

- "Inventory dashboard" with stock metrics but no RTO/NDR leakage link.
- "Cashflow cockpit" that estimates runway or payouts without a recoverable post-checkout action.
- "Returns engine" before RTO/NDR rescue has pilot proof.
- "Marketplace health" module based on broad account metrics instead of COD/RTO/NDR recovery.
- "AI predicts risky orders" without trained data, evaluation, and explainable fallback rules.
- "Send WhatsApp automatically" without provider approval, template status, opt-out, logs, and response handling.
- "Push reattempt to courier" without provider integration and audit trail.
- "Shopify auto-sync" without implemented OAuth, webhook handling, error states, and data lineage.
- "Savings guaranteed" without verified seller-side outcome proof.

Demote, do not delete, if the idea may matter later:

- Label it future architecture.
- Name the missing proof gate.
- Keep it out of the active seller promise.

## PR Requirement

Every PR that adds or expands product scope must include:

- Scorecard total and per-dimension scores.
- What was cut, rejected, or demoted.
- What became clearer for the seller.
- What proof, action, or trust artifact improved.
- Tests/build status.
- Remaining risk.
