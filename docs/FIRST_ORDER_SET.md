# First Order Set: Trust-Building RTO/NDR Profit Recovery Layer

## Goal

Move Indian D2C sellers through this funnel:

Visitor sees calculator -> understands estimated RTO leakage -> views sample report -> submits summary numbers -> receives audit estimate -> optionally uploads anonymized CSV -> sees action queue and pilot plan -> agrees to a 14-day pilot.

This layer is pre-sales and privacy-safe. It does not replace the dashboard and does not add WhatsApp, Shopify, courier integrations, returns, inventory, support inbox, cashflow, warehouse optimization, or ML.

## Modules

### Free Calculator

Route: `/calculator`

Uses summary inputs only:

- Monthly orders.
- COD percentage.
- Overall RTO percentage.
- Optional COD RTO percentage.
- AOV and margin.
- Shipping, return, packaging, CAC, COD fee, support/ops cost.
- Pilot/software cost and target reduction.
- Category and shipping platform.

Outputs:

- COD/prepaid orders.
- Total RTO orders.
- COD RTO orders and inferred prepaid RTO when possible.
- RTO loss per order.
- Monthly/daily leakage.
- Loss per 100 orders.
- Savings at 10/20/30%.
- Target saving, net benefit, ROI multiple, and payback status.

### Sample Report

Route: `/sample-report`

Uses fictional demo data for Nazrana Streetwear. It shows executive summary, leakage breakdown, pincode/courier/SKU/NDR issues, daily action queue, order decision passport, NDR rescue timeline, savings opportunity, pilot plan, and privacy-safe audit options.

### Audit Flow

Route: `/audit`

Modes:

- Summary-only audit: no customer data.
- Anonymized CSV audit: order id, pincode, payment mode, order value, courier, shipment status, NDR reason, final outcome, and optional operational fields.
- Full pilot preparation: checklist of what the seller can provide.

All audit sessions are stored in browser localStorage for the MVP and can be exported as JSON or CSV.

### Pilot Workflow

Route: `/pilot`

Stages:

- Baseline setup.
- Daily action execution.
- Mid-pilot review.
- Final savings review.

The workflow tracks checklist completion, selected action rules, daily metrics, savings, net benefit, ROI, and final outcome status.

## Formulas

RTO loss per order:

```text
forward_shipping_cost
+ return_shipping_cost
+ packaging_cost
+ estimated_CAC
+ COD_fee
+ support_ops_cost
```

Monthly RTO leakage:

```text
monthly_orders * RTO_percentage / 100 * RTO_loss_per_order
```

Savings:

```text
monthly_RTO_leakage * reduction_percentage / 100
```

Net benefit:

```text
target_saving - pilot_or_software_cost
```

ROI multiple:

```text
target_saving / pilot_or_software_cost
```

## Privacy-Safe Data Options

Option A: Summary-only review.

- Monthly orders.
- COD %.
- RTO %.
- Shipping cost.
- Average order value.
- No customer data.

Option B: Anonymized CSV audit.

- order_id.
- pincode.
- payment_mode.
- order_value.
- courier.
- shipment_status.
- ndr_reason.
- final_status.
- No customer name, phone, email, or full address.

Option C: Full 14-day pilot.

- Phone/address may be needed only if the seller wants actual WhatsApp and address-correction workflows.

Customer-level communication should only be used for delivery/RTO operations, not unrelated marketing.

## Acceptance Criteria

- `/calculator`, `/sample-report`, `/audit`, and `/pilot` exist.
- Calculator works without login and updates outputs live.
- Leads are saved locally and exportable.
- Sample report uses fictional data and is printable.
- Audit supports summary-only and anonymized CSV modes.
- Audit output shows leakage, drivers, savings, recommendations, action preview, and pilot plan.
- Pilot workflow supports baseline setup, daily execution, mid-pilot review, final review, and outcome scoring.
- Tests and build pass.
