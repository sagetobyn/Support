# Pilot Operator SOP

This SOP runs the 14-day Wembro pilot as a manual, proof-led COD/RTO/NDR recovery routine. It does not assume live WhatsApp sending, courier API pushes, Shopify/WooCommerce sync, ML prediction, or automated execution.

Use it only after a seller has provided summary numbers, an anonymized CSV, or a pilot-prep dataset with enough trust to act.

## Operator Rule

Every day must preserve the Wembro sequence:

Data -> Insight -> Decision -> Action -> Learning.

Do not start with messaging. Start with the queue, the reason, the action owner, and the proof that will be logged.

## Morning SOP: Triage Before Dispatch

Window: 9:30-11:00

Goal: choose the highest-loss COD/RTO/NDR work before dispatch and first courier attempts.

Steps:

1. Open Today's Priorities and check data/import warnings.
2. Open Work Queue and filter for high-risk COD, weak address, active NDR, and prepaid opportunity work.
3. Pick one focus cohort for the day: risky COD before dispatch, wrong-address cases, active NDR, or payment/COD-risk cases.
4. For risky COD, queue a mock/manual confirmation or call task. Do not assume WhatsApp was sent.
5. For weak addresses, ask for missing landmark, house/flat detail, corrected pincode, or alternate phone.
6. For payment-risk COD, use only seller-approved prepaid instructions or manual payment links outside Wembro.
7. Mark only completed work. Leave uncertain cases open.

Proof to log:

- Orders checked.
- Risky COD found.
- COD confirmations queued manually or in mock outbox.
- Addresses needing correction.
- NDR cases found.
- Owner for each action.

## Afternoon SOP: Rescue Loop

Window: 2:00-4:00

Goal: move active NDR/address/prepaid/call cases toward a recorded outcome.

Steps:

1. Open Delivery Rescue and sort NDR cases by SLA urgency and order value.
2. For customer unavailable/refused, manually contact or call and record response intent.
3. For wrong address or phone unreachable, request corrected details and record what changed.
4. For payment issue or high-risk COD, offer prepaid conversion only when the incentive is within margin logic.
5. For courier-side failure, prepare an escalation note for the seller/courier owner. Do not push anything through an API.
6. Record reattempt, address update, cancellation, delivered, or RTO outcome only after evidence exists.

Proof to log:

- NDRs contacted.
- NDRs rescued.
- Addresses corrected.
- Prepaid offers accepted or declined.
- Calls completed with response intent.
- Courier escalation notes.

## Evening SOP: Proof Close

Window: 6:00-7:00

Goal: turn the day's work into seller-visible proof without overclaiming savings.

Steps:

1. Open Savings Proof.
2. Log each avoided RTO, rescued shipment, cancellation-before-shipping, or prepaid conversion with the formula used.
3. Keep estimated and verified savings separate.
4. Use rejected or uncertain status when the action happened but the saving is not defensible.
5. Update pilot day metrics and write tomorrow's focus.
6. If data, owner, action, or proof gates fail, narrow or stop the pilot instead of pitching expansion.

Proof to log:

- Estimated savings.
- Verified savings only when the seller outcome confirms it.
- Rejected or uncertain savings.
- Formula and confidence note.
- Before/after status.
- Next-day focus.

## Workflow Details

### NDR Rescue

Trigger: new NDR, failed delivery, customer unavailable, refusal, wrong address, or phone unreachable.

Action: use the NDR playbook, manually contact the customer or courier ops owner, then record reattempt, address update, cancellation, delivered, or RTO outcome.

Proof: NDR reason, contact attempt, response/courier note, final outcome, and estimated or verified saving.

### Address Correction

Trigger: weak address score, missing landmark, vague address, invalid pincode, wrong-address NDR, or alternate-phone request.

Action: ask for corrected address details manually, update the seller/courier workflow outside Wembro, and record the correction note.

Proof: original issue, corrected field received, update timestamp, and delivery/NDR outcome.

### COD-to-Prepaid

Trigger: high-risk COD order where prepaid conversion is safer than shipping blind.

Action: share a seller-approved manual payment link or prepaid instruction outside Wembro. Record accepted or declined. Avoid pressuring low-fit orders.

Proof: offer reason, incentive, accepted/declined status, and avoided RTO exposure if the order is cancelled before shipping or converted.

### Call Workflow

Trigger: high-value order, repeated NDR, angry customer, phone-unreachable case, or unclear response.

Action: call manually, record customer intent, and choose reattempt, address update, prepaid conversion, cancellation, or no action.

Proof: call timestamp, intent, next action, owner, and outcome.

## Stop Conditions

Stop or narrow the pilot when:

- Data is blocked or customer-level PII is being shared for an anonymized audit mode.
- There is no assigned ops owner.
- No action is executed by day 3.
- No proof is logged by day 7.
- Savings are being claimed without order outcome evidence.
- The seller cannot separate estimated savings from verified savings.

## Final Handoff

At day 14, the operator should produce:

- Baseline: monthly orders, COD share, RTO rate, NDR count, assumed RTO loss per order.
- Actions: COD confirmations, address corrections, NDR contacts, prepaid offers, calls.
- Savings: estimated savings, verified savings, rejected/uncertain savings.
- Failures: data gaps, operator misses, unresponsive cohorts, courier/pincode blockers.
- Decision: renew, narrow, or stop.
