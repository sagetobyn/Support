# Wedge Scorecard

## Product Law

Wembro's current product is the Revenue Leakage Control Center: a CSV-first COD/RTO/NDR profit recovery control room for Indian D2C sellers.

The long-term AI Operations OS is future architecture. It should inform sequencing, data shape, and audit discipline, but it is not the current customer promise.

Current customer promise:

```text
Upload order, shipment, and NDR data.
Find preventable COD/RTO/NDR leakage.
Prioritize today's recovery actions.
Record outcomes and savings proof.
```

## Scoring Model

Each wedge is scored from 1 to 5.

| Criterion | Meaning |
| --- | --- |
| Impact | Direct rupee loss or margin protection for the seller. |
| Urgency | Whether action is time-sensitive and gets worse if delayed. |
| Frequency | How often the problem appears in normal seller operations. |
| Confidence | How confidently Wembro can diagnose the issue from currently available CSV-first data. |
| Proofability | How clearly Wembro can show before/after evidence, action taken, and estimated or verified savings. |

Scores are intentionally conservative. A future module can be important and still rank below the first wedge if Wembro cannot yet prove it with reliable data and daily action.

## Ranked Scorecard

| Rank | Wedge | Impact | Urgency | Frequency | Confidence | Proofability | Total | Decision |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | COD/RTO/NDR leakage recovery | 5 | 5 | 5 | 5 | 5 | 25 | Build first. This is the active wedge. |
| 2 | Settlement recovery | 4 | 3 | 4 | 3 | 4 | 18 | Sequence after server storage and accounting-grade evidence. |
| 3 | Returns | 4 | 3 | 4 | 3 | 3 | 17 | Sequence after RTO/NDR proof; do not mix post-delivery returns into failed-delivery rescue. |
| 4 | Inventory | 4 | 3 | 3 | 2 | 3 | 15 | Sequence after SKU demand, stock, lead-time, margin, and RTO-by-SKU data are reliable. |
| 5 | Marketplace health | 4 | 3 | 3 | 2 | 2 | 14 | Sequence after marketplace data ingestion and policy evidence exist. |
| 6 | Cashflow | 4 | 3 | 3 | 2 | 2 | 14 | Sequence after settlement, bank, cost, and verified savings data exist. |
| 7 | Support inbox | 3 | 3 | 4 | 2 | 2 | 14 | Do not build as a generic product; only narrow COD/NDR response capture belongs in the current wedge. |

## Why COD/RTO/NDR Wins

COD/RTO/NDR has the strongest combined wedge score because it sits where money, urgency, and proof meet.

### 1. The Loss Is Visible

Failed COD deliveries create a direct loss stack: forward shipping, return shipping, packaging, COD fee, support effort, blocked inventory, and wasted acquisition cost.

Wembro can express this in seller language:

```text
RTO loss per order =
forward shipping + return shipping + packaging + estimated CAC + COD fee + support ops cost
```

This is not a guaranteed ROI claim. It is a transparent estimate until the seller verifies outcomes.

### 2. The Clock Matters

NDR is the warning stage. RTO is the loss stage.

That makes the workflow naturally action-first:

```text
NDR detected -> reason normalized -> action chosen -> customer/courier follow-up -> outcome recorded
```

Settlement, inventory, marketplace health, and cashflow are important, but most of those loops do not create the same daily rescue window inside the current CSV-first app.

### 3. The Data Is Available Earlier

Early sellers can export order, shipment, and NDR CSVs from existing ecommerce, courier, or shipping tools.

That data is enough for the current product to:

- Normalize orders and shipments.
- Detect COD risk.
- Group weak addresses, bad pincodes, courier failures, and NDR reasons.
- Create a daily action queue.
- Track expected and verified savings events.

The adjacent modules require stronger evidence:

| Future module | Missing proof before it can become active product |
| --- | --- |
| Settlement | Payout reports, deduction codes, bank references, reconciliation rules, audit governance. |
| Returns | Return reasons, reverse pickup status, refund amounts, SKU promises, customer proof. |
| Inventory | Stock levels, lead times, SKU velocity, procurement constraints, margin rules. |
| Marketplace health | Platform-specific policy data, claims, listing suppression evidence, appeal outcomes. |
| Cashflow | Settlement, bank, payables, working-capital cycles, real cost data. |
| Support inbox | Conversation permissions, provider integration, opt-in, response audit logs, scope control. |

### 4. The Proof Artifact Is Simple

The first wedge can produce a seller-trust artifact without fake automation:

- Baseline COD, RTO, COD-RTO, NDR, and estimated loss.
- Top leakage drivers by pincode, courier, address quality, SKU, or NDR reason.
- Daily action queue with reason, confidence, and expected impact.
- Savings ledger showing estimated versus verified outcomes.
- Final 14-day pilot review.

This is stronger than a broad dashboard because the seller can inspect what Wembro saw, what the team did, and what changed.

## Demotions

These modules are not deleted. They are demoted until the first wedge has repeatable proof.

| Module | Demoted reason | Re-entry condition |
| --- | --- | --- |
| Settlement recovery | Needs accounting-grade evidence and audit governance. | Server storage, reliable settlement imports, bank/payout matching, and seller-specific reconciliation proof. |
| Returns | Post-delivery returns are a different operating loop from NDR/RTO rescue. | Repeatable COD/RTO/NDR proof plus return-reason and refund evidence tied to financial outcomes. |
| Inventory | Inventory decisions need stock and procurement context that the current product does not own. | Reliable SKU, stock, lead-time, margin, and RTO-by-SKU data. |
| Marketplace health | Platform policy work depends on marketplace-specific evidence and appeal workflows. | Marketplace ingestion, policy taxonomy, case evidence, and action outcome tracking. |
| Cashflow | Cashflow software without verified finance data becomes vague. | Settlement, bank, cost, and verified recovery data with audit trail. |
| Generic support inbox | A support inbox changes Wembro into conversation software. | Only reconsider as a narrow COD/NDR response helper after provider integration, opt-in, and audit logs exist. |

## Product Sequence

### Now: Revenue Leakage Control Center

Build and sell only the CSV-first COD/RTO/NDR profit recovery wedge:

1. Trusted order, shipment, and NDR data.
2. Leakage insight with transparent formulas.
3. Daily recovery decisions.
4. Human-approved actions and mock/manual outbox only.
5. Savings ledger and pilot proof.

### Next: Trust Layer

Harden the proof loop before broadening:

1. Auth, tenant isolation, and server storage.
2. Import audit logs and export governance.
3. Verified savings workflow.
4. Seller-specific pilot benchmarks.
5. Provider readiness without pretending live sends or API pushes exist.

### Later: Adjacent Profit Modules

Expand only after the COD/RTO/NDR wedge is repeatable:

1. Settlement recovery.
2. Returns.
3. Inventory.
4. Marketplace health.
5. Cashflow.
6. Narrow support response helper only if it stays tied to revenue leakage actions.

## Final Decision

COD/RTO/NDR remains the first wedge because it is the highest-scoring problem by impact, urgency, frequency, confidence, and proofability.

Wembro should not broaden the active product promise into settlement, inventory, returns, cashflow, marketplace health, or generic support yet. Those modules stay in the roadmap as sequenced future work, not current product claims.
