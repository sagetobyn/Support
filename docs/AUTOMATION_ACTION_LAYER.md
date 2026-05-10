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

## Dashboard Relationship

The dashboard can approve, pause, retry, or inspect actions. It must not create hidden automation logic. All rules live in settings and automation services.

