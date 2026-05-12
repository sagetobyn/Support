# Anonymized CSV Guide

This guide defines what a seller can upload for Wembro's pre-sales RTO profit audit.

The audit ladder stays privacy-safe:

1. Summary-only audit: no CSV, no customer-level rows.
2. Anonymized CSV audit: order-level operational fields only, with customer identity removed.
3. Full pilot preparation: readiness planning only on the public audit page. Customer contact data should be shared only under a separate pilot agreement for real rescue work.

## Required Columns

| Column | What It Means | Example |
| --- | --- | --- |
| `order_id` | Internal order reference or hashed order reference | `ORD-1041` |
| `pincode` | Six-digit delivery pincode | `560095` |
| `payment_mode` | COD, prepaid, or equivalent payment label | `COD` |
| `order_value` | Order value in INR | `1499` |
| `courier` | Courier or shipping partner name | `Delhivery` |
| `shipment_status` | Current shipment status from the export | `NDR` |
| `ndr_reason` | Courier NDR or failed-delivery reason | `customer_unavailable` |
| `final_status` | Final delivery outcome where known | `RTO` |

## Optional Operational Columns

These improve diagnosis but are not required:

- `order_date`
- `sku`
- `product_name`
- `city`
- `state`
- `source_platform`
- `campaign_name`
- `attempt_count`

## Do Not Upload

Remove these before sharing an anonymized audit CSV:

- Customer name.
- Customer phone, mobile, alternate phone, or WhatsApp number.
- Customer email.
- Full address, address lines, or landmark.
- Customer ID, buyer ID, profile link, or any field that can identify the buyer.
- AWB or shipment identifiers if they expose customer details in courier portals.

## Example CSV

```csv
order_id,pincode,payment_mode,order_value,courier,shipment_status,ndr_reason,final_status,sku
ORD-1041,560095,COD,1499,Delhivery,NDR,customer_unavailable,RTO,DRESS-RED-S
ORD-1042,400053,Prepaid,999,Xpressbees,Delivered,none,Delivered,TEE-BLK-M
```

## Boundary

The pre-sales audit is for COD/RTO/NDR leakage discovery only. It does not send WhatsApp messages, push courier actions, sync stores, run ML prediction, or prove guaranteed savings. Savings remain estimates until pilot outcomes are recorded.
