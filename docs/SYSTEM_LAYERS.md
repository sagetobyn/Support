# System Layers

## Layer Map

| Layer | Job | Owns | Must Not Own |
| --- | --- | --- | --- |
| Website | Acquire and educate sellers | Positioning, use cases, calculator, trust | Source-of-truth business data |
| Onboarding | Move seller to connected data | Business profile, marketplace choice, permissions, uploads | Data parsing internals |
| Ingestion | Collect and normalize raw data | Connectors, parsers, validation, sync logs | Final AI decisions |
| Seller Data Brain | Create unified commerce graph | Canonical entities, mapping, lineage, confidence | UI layout decisions |
| AI Operations Engine | Reason over normalized data | Agents, findings, recommendations, explanations | Direct risky execution |
| Automation Layer | Execute allowed work | Policy checks, queues, approvals, execution logs | Raw extraction from dashboards |
| Dashboard | Control room and visibility | Briefing, alerts, reports, action status | Source-of-truth data creation |
| Settings + Model Control | Configure behavior | Rules, approval policies, model settings, prompt-to-config | Hidden one-off business rules |
| Feedback Loop | Improve from outcomes | Action outcomes, seller overrides, learning signals | Rewriting history |

## Data Flow

1. Source data arrives from connectors or report uploads.
2. Ingestion parses, cleans, validates, and records lineage.
3. Data Brain maps records into canonical commerce entities.
4. AI agents read normalized entities and produce structured findings.
5. Automation policy decides whether each finding becomes a recommendation, draft, approval request, or executable action.
6. Dashboard renders system state, alerts, reports, and queues.
7. Feedback loop records outcomes and seller overrides.

## Control Flow

Automation levels:

| Level | Name | Behavior |
| --- | --- | --- |
| 1 | Recommend only | AI explains what to do; no draft or execution. |
| 2 | Draft action | AI prepares a claim, message, ticket, report, or change. |
| 3 | One-click approve | Seller approves a prepared action. |
| 4 | Auto-execute under seller rules | System executes only when policy permits. |
| 5 | Full autopilot | Strictly configured actions execute with monitoring, audit, and rollback plans. |

## Boundary Tests

Before adding any module, answer:

- What source data powers it?
- What normalized entities does it need?
- What structured AI output does it produce?
- What action can the seller take this week?
- What audit record proves the decision?
- What outcome feeds learning?

If these cannot be answered, the module is not ready for implementation.

