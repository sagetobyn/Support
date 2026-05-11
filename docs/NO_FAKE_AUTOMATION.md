# No Fake Automation Doctrine

## Product Law

Wembro is currently the post-checkout profit recovery control room for Indian D2C sellers. The active product promise is narrow:

```text
CSV-first COD/RTO/NDR leakage recovery.
```

The long-term AI Operations OS, marketplace connectors, WhatsApp providers, courier APIs, ML models, and broader ecommerce modules are future architecture. They may be mapped, designed, or simulated, but they must not be sold as live customer outcomes until implementation and proof exist.

Current customer-facing claims must stay inside:

- CSV upload and local workspace workflows.
- Rule-based COD/RTO/NDR risk and NDR rescue recommendations.
- Mock/manual/export-only WhatsApp and courier handoff.
- Estimated savings unless a seller marks savings verified with proof.
- Human-approved daily action execution.

## Automation Status Doctrine

Use these labels in product copy, docs, demos, and API surfaces:

| Status | Honest label | What can be claimed | What cannot be claimed |
| --- | --- | --- | --- |
| `missing` | Missing | Manual work remains. | Any product behavior or automation. |
| `ui_only` | UI only | A screen or placeholder exists. | The task is handled by Wembro. |
| `mock` | Mock/demo only | Demo behavior, sample output, or static service logic. | Real seller execution or live integration. |
| `local_automation` | Local workflow proof | CSV/demo/browser data can create deterministic recommendations, local work items, local audit records, or local state changes. | Automated execution, external sending, API pushes, synced orders, or verified savings. |
| `connected_read` | Connected read | Wembro can read from a real source. | Wembro can write, execute, or update that source. |
| `ai_decision` | AI decision draft | Wembro can create a structured finding, recommendation, or draft action from normalized evidence. | Wembro can execute the action or guarantee the outcome. |
| `approval_execution` | Approval-based execution | Wembro can execute a real action after seller approval only when proof exists. | Hidden automation, unapproved sends, or unsupported providers. |
| `autonomous_execution` | Trusted-rule execution | Wembro can execute under seller rules, caps, monitoring, audit logs, and rollback only when proof exists. | Unbounded autopilot or guaranteed ROI. |

Internal enum names do not decide what is safe to sell. Evidence decides.

## Evidence Required Before Claiming Automation

A capability may be called approval-based or automated only when all evidence below exists:

- Real source data or an approved provider connection.
- Normalized entities tied to seller records.
- Deterministic decision logic or evaluated model logic.
- Action output that maps to a real executable provider action.
- Seller approval record when execution is approval-based.
- Execution payload, provider response, and failure handling.
- Audit event with actor, timestamp, source refs, and result.
- Tests for the decision and execution guardrails.
- Learning or outcome record after the action.
- Kill switch, retry limits, and rollback or manual recovery path where relevant.

If any item is missing, use words such as mock, local, draft, manual, provider-ready, export-only, or estimated.

## Forbidden Claims

Do not write or say:

- "Wembro automatically sends WhatsApp messages."
- "Wembro pushes courier reattempts automatically."
- "Wembro syncs Shopify or WooCommerce orders automatically."
- "Wembro predicts RTO with ML."
- "Wembro guarantees ROI or verified savings."
- "Wembro automates returns, inventory, settlement, marketplace health, cashflow, support inbox, or chatbot operations."
- "Connect once and Wembro runs your ecommerce operations."
- "The dashboard recovered INR X" unless the saving is marked verified with proof.

Allowed replacements:

- "Wembro queues a mock/manual WhatsApp message for seller review."
- "Wembro prepares an export-only courier handoff."
- "Wembro imports seller CSVs and uses local rules to prioritize COD/RTO/NDR work."
- "Wembro estimates potential savings using transparent formulas."
- "Wembro maps future integration readiness but does not execute live writes yet."

## Customer-Facing Copy Rules

- Say "local workflow", "mock outbox", "manual export", "draft action", or "approval required" when execution is not live.
- Say "estimated savings" unless a seller-supplied result verifies the amount.
- Say "future architecture" for AI Operations OS modules outside the current COD/RTO/NDR wedge.
- Say "provider-ready" only when the product has a clear adapter boundary but no approved provider execution.
- Say "connected read" only when the product truly reads from a live source.
- Say "approval-based execution" only when seller approval and provider execution proof are both present.
- Never use broad-module language as the active product promise before pilot proof expands the wedge.

## Review Checklist

Before merging product copy or automation code, check:

- Does this claim stay inside CSV-first COD/RTO/NDR profit recovery?
- Does this status use mock/local/manual/export-only language when execution is not live?
- Is every automation claim backed by source data, approval, execution proof, audit, tests, and outcome learning?
- Are broad AI Operations OS modules clearly marked as future architecture?
- Are savings described as estimated unless verified by seller proof?
