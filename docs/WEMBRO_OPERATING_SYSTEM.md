# Wembro Operating System

## CEO Directive

Wembro is not another ecommerce dashboard. It is the operating intelligence layer for ecommerce sellers:

`DATA -> INSIGHT -> DECISION -> ACTION -> LEARNING`

Every project must answer four questions:

- Where is the seller losing money?
- Why is it happening?
- What should be fixed today?
- How much money was saved or protected?

If a project does not improve data reliability, operational clarity, actionability, seller trust, or measurable savings, it is not a priority.

## First Product Wedge

The first wedge is the **Wembro Revenue Leakage Control Center** for Indian D2C/COD sellers.

It focuses on the seller pains with the strongest combination of urgency, financial impact, frequency, and ease of proof:

- COD RTO and failed delivery loss.
- NDR rescue before loss becomes final.
- Courier and pincode failure concentration.
- Weak address and customer-confirmation gaps.
- Basic profit leakage and savings proof.

The product should not attempt to solve all seller pains at once. Returns, settlement recovery, inventory, marketplace health, and AI agents come later, after the RTO/NDR wedge has pilot proof.

## Priority Order

1. **Trusted Data Foundation**
   - Normalize order, shipment, NDR, pincode, courier, SKU, action, recommendation, and savings data.
   - Keep CSV-first workflows reliable before integrations.
   - Show data quality and low-sample warnings clearly.

2. **CEO Cockpit**
   - First screen must answer: what is broken, what is it costing, and what should be done today?
   - Lead with Money at Risk, Recoverable Money, Critical Actions, Top Leakage Driver, and Top 5 Actions.
   - Avoid giant dashboards with infinite widgets.

3. **Daily Execution System**
   - Convert insight into a prioritized action queue.
   - Work high-risk COD, weak address, NDR rescue, prepaid conversion, and courier/pincode issues first.
   - Keep human approval before risky execution.

4. **Savings Proof**
   - Every action should record problem found, action taken, expected or verified saving, confidence, and before/after result.
   - Seller trust and pricing depend on proof, not claims.

5. **Production Trust Layer**
   - Add auth, tenant isolation, server storage, audit logs, and export governance after the core workflow is proven.

6. **Integrations And Automation**
   - Add WhatsApp response capture, Shopify/WooCommerce, and courier/NDR integrations only after the CSV workflow has pilot proof.
   - Automation should progress from insight to recommendation, draft action, approval-based execution, then trusted-rule automation.

7. **Broader Operations OS**
   - Expand into profit control, settlement recovery, inventory, returns, marketplace health, and AI operations agents only after the wedge is repeatable.

## Decision Rules

- Prioritize with `Financial Impact x Urgency x Frequency x Confidence`.
- Seller-facing language must use rupee impact and concrete operational pain.
- Recommendations must explain the formula or reason. No black-box AI claims.
- CSV-first and privacy-safe workflows remain acceptable until trust is earned.
- Advanced AI is last. Rules, calculations, workflow state, and audit trails are the source of truth.

## Module Map

- **Revenue Leakage Control**: RTO, failed delivery, COD risk, NDR, pincode/courier leakage.
- **Profit Control Tower**: true profit, hidden fees, ad waste, low-margin orders.
- **Inventory Intelligence**: stockouts, dead stock, reorder recommendations, inventory capital.
- **Returns Engine**: return reasons, abuse, refund leakage, reverse pickup.
- **Marketplace Shield**: account health, suppressed listings, claims, policy risk.
- **Settlement Recovery**: payout ETA, fee deductions, COD remittance, courier invoice mismatch.
- **Courier Optimization**: SLA, lane performance, allocation recommendations, weight disputes.
- **AI Operations Agent**: daily business analyst, task creation, approvals, SOP automation.

## Current Build Instruction

Build in sequence. Do not jump to broad modules until the Revenue Leakage Control Center has real pilot proof.

The immediate product should feel like:

> Wembro finds preventable ecommerce leakage, tells the team what to fix today, and proves the money saved.
