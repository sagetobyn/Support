# Paid Audit Deliverables

The ₹999 paid audit is a copyable service artifact for Indian D2C sellers who want a clearer COD/RTO/NDR leakage diagnosis before deciding on a 14-day pilot.

It is not a checkout flow, not a payment integration, and not a live automation product.

## Data Boundary

Accepted inputs:

- Summary numbers: monthly orders, COD share, RTO rate, AOV, shipping costs, packaging cost, COD fee, support cost, known problem pincodes, problem couriers, and known NDR/RTO reasons.
- Anonymized CSV using the public schema in `docs/ANONYMIZED_CSV_GUIDE.md`.

Not accepted on the public audit flow:

- Customer names
- Phone or WhatsApp numbers
- Email addresses
- Full addresses or address lines
- Customer IDs or profile links

## Deliverables

1. Seller snapshot: monthly orders, COD share, RTO rate, AOV, and the cost assumptions used.
2. Leakage estimate: estimated monthly COD/RTO leakage, savings sensitivity, and formula basis.
3. Driver diagnosis: pincode, courier, SKU/product, payment mode, and NDR reason concentration when anonymized CSV data is available.
4. First action preview: manual confirmation, address correction, reattempt, hold, cancellation, or courier-review actions to test first.
5. Pilot-fit recommendation: stop, free check only, cleaner data needed, or 14-day pilot candidate.
6. Privacy and data-quality notes: missing fields, rejected PII fields, sample-size warnings, and cleanup required before pilot prep.

## Timeline And Process

1. Share the right data: seller shares summary numbers or an anonymized CSV. Public audit mode does not accept customer-level PII.
2. Validate assumptions: cost inputs, sample window, COD share, RTO rate, and known leakage clusters are checked.
3. Prepare the artifact: Wembro produces a written estimate, driver table, first-action preview, and pilot-fit recommendation.
4. Decide next step: seller can stop, share a cleaner anonymized CSV, or prepare a separately agreed 14-day pilot.

Target timeline: 1 business day after usable data is shared.

## Sample Audit Outline

1. Seller snapshot and assumptions
2. Estimated COD/RTO/NDR leakage
3. Top leakage drivers from summary or anonymized CSV
4. First manual actions to test
5. 14-day pilot fit and preparation checklist
6. Appendix: data quality, missing fields, and PII boundary

## Explicitly Not Included

- No checkout or payment integration inside Wembro.
- No real WhatsApp sending from this audit.
- No courier API push from this audit.
- No Shopify or WooCommerce sync from this audit.
- No guaranteed savings claim.

## Copy Block

```text
₹999 COD/RTO/NDR Profit Audit

Data accepted: summary numbers or anonymized order/shipment/NDR CSV only.

You receive:
- Seller snapshot and assumptions
- Estimated monthly COD/RTO/NDR leakage
- Top leakage drivers where anonymized CSV data is available
- First manual actions to test
- 14-day pilot fit and preparation checklist
- Data-quality and privacy notes

Timeline: target 1 business day after usable data is shared.

Not included: payment integration, live WhatsApp sending, courier API push, store sync, or guaranteed savings.
```
