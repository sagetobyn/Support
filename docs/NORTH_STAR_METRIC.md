# North Star Metric

## Metric

Wembro's North Star is:

`verified or confidence-labeled rupees recovered/protected per seller per week`

This is not visits, signups, dashboard activity, imports, messages queued, or generic engagement. The seller should understand one thing: how much COD/RTO/NDR leakage Wembro helped recover or protect this week, and how strong the proof is.

## Formula

For each seller and calendar week:

```text
weekly_north_star =
  sum(verified actualSaving from positive savings events)
  + sum(confidence-labeled estimatedSaving from positive savings events)
```

Only COD/RTO/NDR profit-recovery savings events count. `rto_loss_recorded`, rejected events, negative amounts, broad simulations, visits, signups, dashboard usage, and fake automation outcomes do not count.

The current code anchor is `src/features/savings-ledger/service.ts`:

- `calculateWeeklyNorthStarMetric(events, window)` computes the weekly North Star.
- `calculateSavingsLedger(...)` exposes `northStarThisWeek`.
- `SavingsEvent.estimatedSaving`, `actualSaving`, `status`, `confidence`, `formulaNote`, `calculation`, and `createdAt` are the source fields.

## Proof Status

`pending`: action or recommendation is logged, but the outcome is not known. It is pipeline value only and does not count in the North Star.

`estimated`: formula-backed recovered/protected value. It can count only while visibly labeled with confidence and the formula/source.

`verified`: outcome evidence exists, such as delivered after NDR, cancelled before shipping, confirmed address correction, or finance/courier reconciliation. Count `actualSaving` when present; otherwise use the transparent estimate.

`rejected`: outcome was disproved, duplicate, unverifiable, or not caused by the Wembro workflow. Keep it in the ledger audit trail, but exclude it from proof.

Legacy `adjusted` events are treated as estimated until verified or rejected.

## Confidence Levels

`verified`: confirmed outcome evidence exists. This is the strongest seller-facing proof.

`high`: order outcome is known and cost assumptions are seller-confirmed, but finance reconciliation is not complete.

`medium`: an operator completed the action and the recovery/protection is plausible, but final delivery or finance evidence is still pending.

`low`: formula or sample quality is weak. Show it as directional only; it should not drive a renewal decision by itself.

## Seller Trust Rule

Do not claim guaranteed ROI. Say "estimated", "pending", "verified", or "rejected" every time savings are shown. The metric earns trust by preserving the chain:

`DATA -> INSIGHT -> DECISION -> ACTION -> LEARNING`

The savings ledger is the trust artifact: every counted rupee should connect to a problem found, action taken, formula, confidence label, and before/after outcome where available.
