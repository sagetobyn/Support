# Sample CSV Field Coverage

This document explains which anonymized CSV fields unlock which Wembro profit-audit insights.

Use this for the pre-sales leakage check and profit audit only. The active promise is CSV-first COD/RTO/NDR leakage recovery for Indian D2C sellers. It does not imply live WhatsApp sending, courier API pushes, store sync, ML prediction, guaranteed ROI, or verified savings.

## Privacy Boundary

Use fictional sample rows when testing. Do not share real customer-level data in the public audit flow.

Remove these fields before upload:

- Customer name.
- Phone, mobile, alternate phone, or WhatsApp number.
- Customer email.
- Full address, address lines, landmark, or delivery instructions.
- Customer ID, buyer ID, profile link, or any buyer-identifying reference.
- AWB or shipment identifiers if they expose customer details in a courier portal.

Keep only operational fields that explain COD/RTO/NDR leakage.

## Required Fields

| Field | Unlocks this insight | Why it matters | If missing |
| --- | --- | --- | --- |
| `order_id` | Row tracing and duplicate checks | Lets the audit reference rows without customer identity | Audit cannot safely explain row-level evidence |
| `pincode` | Pincode leakage ranking | Shows where RTO/NDR concentration is coming from | Geography ranking is weak or blocked |
| `payment_mode` | COD vs prepaid comparison | Separates COD leakage from prepaid outcomes | COD recovery opportunity is unclear |
| `order_value` | Estimated leakage value | Sizes the financial impact and priority of leakage clusters | Audit can count rows but cannot estimate INR impact well |
| `courier` | Courier and lane leakage ranking | Shows whether one courier is driving avoidable NDR/RTO | Courier diagnosis is weak or blocked |
| `shipment_status` | Current shipment/NDR/RTO state | Separates live NDR risk from closed RTO and delivered rows | Outcome classification becomes unreliable |
| `ndr_reason` | NDR reason ranking | Shows whether failures are address, customer unavailable, refusal, or courier issue | First action is less precise |
| `final_status` | Delivered vs RTO outcome baseline | Confirms whether leakage actually became RTO, delivered, cancelled, or unresolved | Baseline and savings estimate become weak |

## Optional Fields

| Field | Unlocks this insight | Why it matters |
| --- | --- | --- |
| `order_date` | Date window and recency checks | Helps confirm whether the sample is a recent 30-day operating view |
| `sku` | SKU leakage concentration | Shows whether a product family is creating avoidable RTO/NDR |
| `product_name` | Product-level explanation | Makes SKU findings easier for a founder or ops owner to understand |
| `city` | City-level grouping | Adds geography context without sharing full address |
| `state` | State-level grouping | Helps spot state-level operational concentration |
| `source_platform` | Channel/source comparison | Separates website, marketplace, or campaign source labels without live sync |
| `campaign_name` | Campaign leakage grouping | Helps identify campaign promise or targeting quality issues |
| `attempt_count` | NDR urgency | Shows whether failed delivery attempts are early, repeated, or exhausted |

## Coverage Ladder

| Data coverage | What Wembro can say | What remains limited |
| --- | --- | --- |
| Summary numbers only | Estimated monthly COD/RTO leakage, rough break-even logic, and whether a deeper audit is worth time | No pincode, courier, SKU, or NDR reason ranking |
| Required CSV fields | Pincode, courier, payment-mode, NDR reason, and outcome ranking with estimated leakage | Weak product/campaign timing diagnosis if optional fields are absent |
| Required plus optional fields | Better prioritization by SKU, product, time window, city/state, source, campaign, and attempt count | Still not verified savings until a pilot records action outcomes |

## Fictional Sample Header

Use the sample fixture at `sample-data/anonymized-audit-field-coverage-sample.csv`.

```csv
order_id,pincode,payment_mode,order_value,courier,shipment_status,ndr_reason,final_status,order_date,sku,product_name,city,state,source_platform,campaign_name,attempt_count
FIELD-001,560095,COD,1499,Delhivery,NDR,customer_unavailable,RTO,2026-04-02,TOP-RED-S,Cotton top,Bengaluru,Karnataka,Website,summer_cod_check,2
FIELD-002,400053,Prepaid,999,Xpressbees,Delivered,none,Delivered,2026-04-03,TEE-BLK-M,Black tee,Mumbai,Maharashtra,Website,summer_cod_check,1
```

## Seller Explanation

The more complete the anonymized operational fields are, the more decisive the audit can be about the first action:

- `pincode` and `courier` tell the seller where the leak is concentrated.
- `ndr_reason` and `attempt_count` tell the seller what kind of rescue action is realistic.
- `order_value` tells the seller which leaks matter financially.
- `sku`, `product_name`, `source_platform`, and `campaign_name` explain whether the leak is tied to product or acquisition quality.

The audit remains an estimate until action proof is logged during a rescue pilot.
