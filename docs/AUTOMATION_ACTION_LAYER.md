# Automation / Action Layer

## Purpose

The automation layer turns AI findings into real work while preserving seller control, auditability, and rollback planning.

It should gradually progress from recommendations to full autopilot only where the seller has configured rules and the action is safe.

## Automation Levels

| Level | Name | Example |
| --- | --- | --- |
| 1 | Recommend only | "Raise a claim for invalid RTO losses." |
| 2 | Draft action | Prepare claim evidence bundle. |
| 3 | One-click approve | Seller approves claim submission. |
| 4 | Auto-execute under seller rules | Auto-create low-risk support tickets. |
| 5 | Full autopilot | Execute strict policy actions with monitoring and rollback plans. |

## Action Types

The system should support:

- Raise claim draft.
- Submit claim where integration allows.
- Create support ticket.
- Send customer support reply.
- Send NDR confirmation workflow.
- Block COD for risky pincode if integration allows.
- Recommend pincode rule.
- Update inventory quantity if allowed.
- Create reorder recommendation.
- Generate supplier defect report.
- Generate CA/GST-ready report.
- Reconcile settlement mismatch.
- Prepare reimbursement evidence.
- Generate pricing change recommendation.
- Update price where allowed and approved.
- Create marketing campaign draft.
- Create ad budget recommendation.
- Pause loss-making ad campaign if allowed.
- Generate listing improvement draft.
- Create competitor response recommendation.
- Schedule daily and weekly reports.
- Generate executive summary.

## Execution State Machine

```text
recommended
  -> drafted
  -> awaiting_approval
  -> approved
  -> scheduled
  -> executing
  -> executed
  -> failed
  -> reverted
```

Some safe low-risk automations may move from `drafted` to `scheduled` or `executing` when seller rules allow it. Risky actions must pass approval checks.

## Required Records

Each action stores:

- `id`
- `workspaceId`
- `sourceFindingId`
- `type`
- `title`
- `impactAmount`
- `riskLevel`
- `confidence`
- `automationLevel`
- `approvalRequired`
- `currentState`
- `assignee`
- `executionTarget`
- `rollbackPlan`
- `auditTrail`
- `createdAt`
- `updatedAt`

## Current AI Engine Handoff

Phase 5 emits `AutomationDraftIntent` records from structured AI findings. These records are automation-ready data, not executable work.

Current rules:

- `executableNow` is always `false`.
- High-risk findings are approval-gated.
- Draft intents may be shown in the automation layer as future queue candidates.
- No external marketplace, customer, bank, support, inventory, pricing, or ad action is executed in Phase 5.

## Phase 6 Mock Foundation

Status: implemented as a deterministic mock service layer.

The automation layer now converts AI draft intents into `AutomationQueueItem` records and adds missing action-layer examples for:

- Claim draft.
- NDR message draft.
- COD block rule approval.
- Settlement reconciliation mock execution.
- SKU reorder recommendation mock execution.
- Listing optimization draft.
- Ad budget recommendation.

Implemented service boundaries:

- `automationService`: route-facing facade for queue, approval, rules, state counts, audit logs, activity, and action detail.
- `automationPolicyService`: seller approval policy, external-write guardrails, confidence checks, and auto-execute eligibility.
- `automationStateMachineService`: valid states, allowed transitions, state counts, and mock execution results.
- `approvalQueueService`: approval queue records derived from policy and action risk.
- `automationAuditService`: append-only mock audit logs and recent activity timeline.

Current safety rules:

- Mock execution writes no external state.
- `MockExecutionResult.externalCallMade` is always `false`.
- External marketplace, customer, listing, ad, support, bank, and inventory writes are blocked from execution.
- Level 4 auto-execute is allowed only for internal mock records such as local reconciliation and reorder recommendations.
- Level 5 full autopilot is represented in the model but disabled for external writes.

## Policy Checks

Before execution, check:

- Seller permissions.
- Workspace settings.
- Marketplace permissions.
- Risk level.
- Confidence threshold.
- Time-of-day rules.
- Margin guardrails.
- Human approval requirements.
- Integration availability.
- Rollback or undo plan.

The current mock policy evaluates:

- Seller automation ceiling.
- External-write guardrail.
- Risk-based approval.
- Auto-execution confidence floor.
- Maximum impact without approval.
- Customer-message quiet hours.

## Dashboard Relationship

The dashboard can approve, pause, retry, or inspect actions. It must not create hidden automation logic. All rules live in settings and automation services.
