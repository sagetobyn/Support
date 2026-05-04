# Model Roadmap

The current MVP is deterministic and rule-based. Do not add ML until enough clean seller data and pilot outcomes exist.

## 1. Calibrated RTO Prediction Model

Predict order-level RTO probability from payment mode, order value, pincode, courier, SKU, address quality, customer history, campaign/source, and delivery attempt signals.

Success metric:

- Better calibrated high-risk ranking than rules at the same action capacity.

## 2. Uplift Model For Prepaid Incentives

Estimate which COD orders are likely to convert or reduce RTO risk when offered a prepaid incentive.

Success metric:

- Higher incremental delivered orders or avoided RTO per incentive rupee.

## 3. Expected Profit Optimization

Optimize action choice using:

```text
Expected_Profit =
P_success * contribution_margin
- P_RTO * RTO_loss_per_order
- intervention_cost
- discount_or_incentive
```

The current MVP uses heuristic risk buckets:

- Low: 5% RTO probability.
- Medium: 15%.
- High: 30%.
- Critical: 50%.

## 4. Hazard Model For Reattempt Timing

Estimate the best time window and channel for NDR rescue based on reason, attempt count, courier, pincode, and previous response timing.

Success metric:

- Higher delivered-after-NDR rate before courier RTO cutoff.

## 5. Contextual Bandit For NDR Action Selection

Choose between WhatsApp, call, reattempt request, address correction, cancellation, or no action based on live feedback.

Success metric:

- More saved orders without excessive customer irritation or ops workload.

## 6. Courier Assignment Optimizer

Recommend courier by pincode, payment mode, order value, SKU/category, and historical seller outcomes.

Success metric:

- Lower RTO/NDR rate at similar or lower logistics cost.

## 7. Pincode Cluster Model

Cluster pincodes by delivery behavior, COD risk, courier quality, address patterns, and category fit.

Success metric:

- Better policy recommendations than raw pincode-level rates, especially for sparse data.

## Measurement Requirements

Before training:

- Store action taken.
- Store customer response.
- Store final outcome.
- Store estimated and actual cost assumptions.
- Track action timing and courier cutoff.
- Separate correlation from action uplift using holdouts or switchback tests.

Models should remain explainable enough for seller trust and ops auditability.
