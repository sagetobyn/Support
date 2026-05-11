# Codex Parallel Merge Strategy

## Purpose

This document defines how Wembro can run hundreds of Codex branches without turning the product into a noisy ecommerce dashboard or a false automation story.

The active product law remains:

```text
Wembro is the post-checkout profit recovery control room for Indian D2C sellers.
Current wedge: CSV-first COD/RTO/NDR leakage recovery.
Operating loop: DATA -> INSIGHT -> DECISION -> ACTION -> LEARNING.
```

Long-term AI Operations OS work is future architecture unless it directly strengthens the current COD/RTO/NDR recovery wedge with evidence. Parallel branches must merge only when they make the current seller promise clearer, safer, or more useful.

## Branch Intake Contract

Every Codex branch must declare these fields before review:

| Field | Required value |
| --- | --- |
| Task ID | Stable ID such as `WMB-SJ-011`. |
| Branch | Full branch name. |
| Priority | P0, P1, P2, or P3. |
| Wave | Merge wave number. |
| Conflict zone | One primary zone from the table below. |
| Target files | Files or directories expected to change. |
| Product-law risk | What could accidentally broaden, overclaim, or fake automation. |
| Validation | Exact commands run or exact blocker. |
| PR note | What got cut/demoted, what became clearer, what trust artifact improved, tests/build status, risks. |

A branch without this contract is not ready to merge, even if the code compiles.

## Conflict Zones

Conflict zones are ownership lanes. They prevent unrelated Codex branches from editing the same product surface in incompatible ways.

| Zone | Primary files | Merge risk |
| --- | --- | --- |
| `product-law` | `README.md`, `docs/*`, product copy rules | False promise, broad scope, vague AI language. |
| `data-model` | `docs/DATA_MODEL.md`, `prisma/*`, shared domain types | Schema drift, premature migrations, weak source lineage. |
| `csv-import` | CSV parsing, import preview, mapping, validation | Broken pilot intake, bad low-sample/data-quality warnings. |
| `risk-scoring` | Rule-based RTO risk, address quality, NDR reason logic | Black-box claims, ML language, untested business logic. |
| `action-queue` | Daily Profit Action Queue, recommendations, ownership/status | Passive dashboard output instead of daily seller action. |
| `ndr-rescue` | NDR lifecycle, reattempt/address/cancel/delivered/RTO flows | Risky courier implications, missing audit trail. |
| `mock-messaging` | WhatsApp templates, mock outbox, manual export, responses | Real-send implication without provider proof. |
| `savings-proof` | Savings ledger, ROI math, reports, founder review | Guaranteed ROI, verified savings without evidence. |
| `trust-ladder` | Calculator, audit, sample report, pilot pages | Asking for sensitive data too early or overstating proof. |
| `auth-storage` | Auth, tenant/storage, privacy, audit governance | Data leakage, local/server state mismatch. |
| `integration-readiness` | Connector registry, provider readiness, handoff exports | Fake live sync, fake API writes, weak provider status labels. |
| `ui-shell` | Navigation, dashboard shell, shared UI components | Hidden active modules, vanity-dashboard sprawl. |
| `tests-fixtures` | `tests/*`, `sample-data/*`, demo generators | Tests proving the wrong promise or fixtures hiding edge cases. |

If a branch touches more than one zone, reviewers must either split it or mark the secondary zones explicitly. A branch that edits three or more zones is presumed too broad unless it is a planned wave checkpoint.

## Waves

Merge waves are ordered by blast radius and product clarity. Later waves cannot override earlier product law.

| Wave | Name | Allowed work | Merge gate |
| --- | --- | --- | --- |
| 0 | Product law and merge discipline | Scope docs, non-goals, fake-automation doctrine, future-module quarantine, reviewer checklists. | No active promise outside CSV-first COD/RTO/NDR recovery. |
| 1 | Data and domain contracts | Types, schemas, fixtures, import contracts, status enums, audit/event shapes. | Data lineage, confidence, low-sample handling, and status labels are explicit. |
| 2 | Business services | CSV parsing, rule scoring, action generation, NDR normalization, savings math, proof services. | Business logic has focused tests and no route-component logic creep. |
| 3 | Workflow surfaces | Action queue, NDR rescue, reports, savings ledger, trust ladder, pilot flow. | Seller can see what is leaking, why, what to do today, and what proof exists. |
| 4 | Shell and route composition | Navigation, thin routes, dashboard composition, copy tightening. | No hidden broad modules or current-product claims beyond the wedge. |
| 5 | Future architecture only | AI Operations OS maps, connector readiness, future module boundaries. | Clearly labeled future architecture; no live integration, automation, or ML implication. |
| 6 | Integration activation | Real providers, connected reads/writes, approvals, webhooks, audit proof. | Separate approval required; provider proof, tests, rollback, and audit events exist. |

Hundreds of branches should be batched by wave first, then by conflict zone. Do not merge a Wave 3 UI branch before the Wave 1/2 contracts it depends on are merged and validated.

## Merge Order

Use this order for every batch:

1. Merge `product-law` guardrails first.
2. Merge shared data/domain contracts before services.
3. Merge business services before route/UI surfaces.
4. Merge workflow UI before shell/navigation reshuffles.
5. Merge tests/fixtures with the feature they prove, not as an afterthought.
6. Merge future-architecture docs only after the active-product language is guarded.
7. Merge real integrations only in a dedicated integration wave with provider proof.

Within the same wave, use this priority:

1. P0 product-law or correctness fixes.
2. Branches with smaller target-file sets.
3. Branches that unblock multiple later branches.
4. Branches with tests already passing.
5. Cosmetic or copy-only work last.

Do not merge two branches from the same conflict zone in the same batch unless the first has landed cleanly and the second was rebased or reviewed against it.

## Reject Rules

Reject the branch, not just the wording, if any of these are true:

- It claims or implies real WhatsApp sending without provider integration, template approval, opt-out handling, webhook/status capture, and audit proof.
- It claims or implies real courier API pushes without provider implementation, idempotency, failure handling, seller approval, and audit proof.
- It claims or implies Shopify/WooCommerce sync without implemented ingestion, mapping, freshness checks, retry/webhook handling, and CSV fallback.
- It describes ML prediction without trained data, baseline comparison, evaluation, confidence reporting, and clear labeling.
- It promises guaranteed ROI, guaranteed savings, or verified savings without seller-specific proof.
- It treats inventory, returns, settlement, marketplace health, cashflow, support inbox, chatbot, or broad AI agents as current active Wembro products.
- It breaks the sequence `DATA -> INSIGHT -> DECISION -> ACTION -> LEARNING`.
- It turns the first screen into a vanity dashboard instead of answering what is leaking, why it matters, and what should be done today.
- It adds business logic into route components when a feature/service module is the practical home.
- It changes shared behavior without focused tests.
- It changes many zones at once without a planned checkpoint.
- It hides unsupported capabilities behind labels like active, live, automated, synced, AI-powered, autopilot, or guaranteed.
- It cannot state what got cut or demoted.

Demote instead of reject only when the work is useful as future architecture and can be clearly moved behind locked, mock, provider-ready, or future-only language.

## Build And Test Cadence

Every branch:

- Run `npm test`.
- Run `npm run build` when the branch changes `src/*`, `prisma/*`, config, package files, route behavior, or shared business logic.
- For docs-only branches, still run `npm test` when feasible. Run `npm run build` if product-law docs are part of a wave checkpoint or if acceptance criteria request it.
- If validation is blocked, record the exact command, error, and whether the blocker appears environment-related or code-related.

Every merge batch:

- Start from a clean base branch.
- Merge no more than five branches before running `npm test`.
- Run `npm run build` after any batch that includes app code, schema/config changes, route changes, or more than one conflict zone.
- Run a product-law sweep after each batch:

```bash
rg -n "automatically sends|pushes courier|syncs Shopify|syncs WooCommerce|guarantee|guaranteed|AI predicts|inventory|returns|settlement|cashflow|chatbot" README.md docs src
```

Every wave:

- Re-run `npm test`.
- Re-run `npm run build`.
- Review the public promise against `README.md`, `docs/WEMBRO_OPERATING_SYSTEM.md`, `docs/MVP_SCOPE.md`, and `docs/ROADMAP.md`.
- Confirm active surfaces still say CSV-first, rule-based, mock/manual/export-only, estimated, or future architecture where appropriate.

## Reviewer Checklist

Before approving a branch, reviewers must answer:

- Does the branch strengthen CSV-first COD/RTO/NDR profit recovery?
- Is broader AI Operations OS language clearly future architecture?
- Does every claim have a matching implementation status: missing, UI-only, mock, local workflow, connected read, approval execution, or autonomous execution?
- Does the seller understand the next action faster than before?
- Are rupee impact, confidence, formula, or low-sample warnings visible where money is discussed?
- Are savings estimated unless seller/operator proof marks them verified?
- Does the branch avoid live WhatsApp, courier, Shopify/WooCommerce, and ML implications unless proof exists?
- Are broad future modules quarantined instead of shown as active products?
- Is business logic kept in feature/lib/service code instead of route components where practical?
- Did business logic changes get tests?
- Did the branch run the required validation commands or document exact blockers?
- Does the PR note say what got cut or demoted, what became clearer, what proof/action/trust artifact improved, and what risk remains?

## Batch Review Note Template

Use this for every merge batch:

```text
Batch:
Wave:
Conflict zones:
Branches:

Merged:
- TASK_ID - branch - files changed - validation status

Cut or demoted:
- ...

Seller clarity improved:
- ...

Proof/action/trust artifact improved:
- ...

Validation:
- npm test:
- npm run build:
- product-law sweep:

Remaining risks:
- ...
```

## Founder Rule

Parallel Codex work is only useful if it compounds into a sharper control room. When in doubt, choose the branch that improves data reliability, daily action, savings proof, or seller trust for the COD/RTO/NDR wedge. Cut or demote everything else.
