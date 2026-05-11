# Future Module Quarantine

## Product-Law Status

Wembro's current product is Revenue Leakage Control only: CSV-first COD/RTO/NDR
profit recovery for Indian D2C sellers.

Every broader module is future-locked. It may appear in planning docs or the
Broader Wembro Operations OS map only as a quarantined candidate, not as a live
product promise.

## Current Wedge

Only this module is active:

| Module | Status | Current scope |
| --- | --- | --- |
| Revenue Leakage Control | current_wedge | COD RTO risk, NDR rescue, weak address checks, courier/pincode leakage, Daily Profit Action Queue, mock/manual messaging, savings ledger, and proof artifacts. |

The active wedge must stay ordered as:

```text
DATA -> INSIGHT -> DECISION -> ACTION -> LEARNING
```

## Locked Future Modules

These modules are locked until their proof gates pass:

| Module | Quarantine reason |
| --- | --- |
| Profit Control Tower | Needs reliable margin, discount, fee, ad, shipping, COD, and return-cost data plus seller trust in rupee math. |
| Settlement Recovery | Needs payout, remittance, courier invoice, fee deduction, and dispute evidence that finance teams can verify. |
| Inventory Intelligence | Needs stock, lead-time, SKU velocity, margin, and RTO-by-SKU data that proves inventory actions belong inside Wembro. |
| Returns Engine | Needs stable return-reason taxonomy, reverse pickup data, refund outcomes, and proof that the problem is distinct from COD/RTO/NDR leakage. |
| Marketplace Shield | Needs marketplace account-health data, listing/claim events, and proof that Wembro can produce corrective SOPs without becoming a marketplace ops suite. |
| AI Operations Agent | Needs trusted rules, audited decisions, role permissions, rollback paths, and enough verified outcomes to avoid fake automation. |

Locked means:

- Do not sell the module as available.
- Do not label it Active, Live, Automated, Synced, or AI-powered in the UI.
- Do not route sellers into it as if it performs work today.
- Do not imply inventory, returns, settlement, marketplace health, cashflow,
  chatbot, or broad AI operations features are current Wembro products.
- Do not use broad OS language above the active wedge.

## Unlock Gates

A locked module can move toward activation only after all gates pass:

1. Revenue Leakage Control has repeatable pilot proof from real seller CSVs.
2. The new module has trustworthy input data, lineage, validation, and
   low-sample warnings.
3. The module produces one concrete daily decision and one human-approved action,
   not only a chart.
4. The workflow records a trust artifact: audit log, export, report,
   before/after result, or seller-verified outcome.
5. Estimated value, protected value, and verified value are visibly separated.
6. Manual fallback exists before any live integration, automation, or ML.
7. Seller-facing copy makes the module's status obvious: future-locked,
   pilot-only, or active.

## Integration And Automation Gates

Future modules must not smuggle in live automation:

- WhatsApp sending requires a selected provider, approved templates, opt-out
  handling, webhook capture, status storage, and audit logs.
- Courier API pushes require provider credentials, tested reattempt/address/cancel
  flows, idempotency, failure recovery, and manual export fallback.
- Shopify/WooCommerce sync requires implemented ingestion, duplicate protection,
  source lineage, retry/webhook handling, and CSV fallback.
- ML prediction requires labeled data, a measured rules baseline, evaluation,
  confidence reporting, explainability, and drift monitoring.

Until those gates pass, the product may show mock/manual/export/readiness
workflows only.

## UI Copy Rule

Any visible future-module surface must use locked language:

```text
Future locked until Revenue Leakage Control proves data reliability,
daily action, savings proof, and founder trust.
```

If a future module would make a seller think Wembro currently handles inventory,
returns, settlement, marketplace health, cashflow, chatbot, live integrations, or
autonomous AI work, cut the copy or move it behind the quarantine.
