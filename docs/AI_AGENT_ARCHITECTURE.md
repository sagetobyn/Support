# AI Agent Architecture

## Principle

The AI Operations Engine is not a chatbot. It is an orchestrated agent system that reads normalized seller data, produces structured findings, and hands work to policy-checked automation.

No agent may directly execute risky changes without automation policy checks and audit logging.

## Agent Contract

Each agent must define:

- Purpose.
- Input data requirements.
- Output schema.
- Confidence score.
- Reasoning summary.
- Possible actions.
- Risk level.
- Whether seller approval is needed.
- Audit log record.
- Model configuration support.

## Required Agents

| Agent | Purpose | Primary Inputs | Outputs |
| --- | --- | --- | --- |
| Chief Operations Agent | Coordinates cross-domain priorities | All findings, rules, data health, seller preferences | Daily briefing, top decisions, escalation map |
| Profit Leakage Engine | Finds total money leakage | Orders, returns, settlements, ads, pricing, costs | Leakage insights, recovery opportunities |
| RTO/NDR Engine | Reduces failed delivery loss | Orders, shipments, NDR, courier, pincode, messages | Rescue tasks, risky pincode alerts |
| Return Intelligence Engine | Prevents avoidable returns | Returns, refunds, reviews, support cases, SKU data | Return reason clusters, listing/product fixes |
| Settlement Reconciliation Engine | Finds payout mismatches | Orders, settlements, deductions, bank files | Mismatch alerts, evidence bundles |
| Claims Recovery Agent | Prepares and tracks claims | Settlement mismatches, courier failures, marketplace reports | Claim drafts, reimbursement evidence |
| Inventory Intelligence Engine | Prevents stockouts and dead stock | Inventory, orders, returns, lead times, supplier data | Reorder tasks, liquidation recommendations |
| Customer Support Agent | Drafts safe support replies | Support cases, policies, order status, customer tone | Reply drafts, escalation tasks |
| Warranty Agent | Tracks warranty cases | Warranty policy, cases, SKU history | Resolution tasks, defect signals |
| Supplier Quality Agent | Detects supplier defects | Returns, reviews, support, purchase orders | Supplier defect reports, escalation tasks |
| Pricing & Profitability Agent | Protects margin | Costs, fees, ads, returns, inventory | Price recommendations, margin guardrails |
| Marketing/Growth Agent | Improves profitable growth | Listings, ads, reviews, keywords, inventory, margin | Campaign recommendations, content drafts |
| Listing Optimization Agent | Improves marketplace content | Listings, reviews, returns, competitor content | Title, bullet, FAQ, compliance drafts |
| Ads Optimization Agent | Controls paid leakage | Ad spend, orders, returns, SKU margin | Budget recommendations, pause candidates |
| Competitor Intelligence Agent | Watches competitor pressure | Competitor listings, pricing, reviews | Response recommendations |
| Reporting Agent | Creates seller reports | Findings, actions, outcomes, financials | Daily, weekly, monthly, CA/GST-ready reports |
| Seller Decision Agent | Converts insight into decisions | Seller preferences, risk appetite, pending approvals | Decision summary, approval prompts |

## Chief Operations Loop

1. Check data health and freshness.
2. Rank opportunities by `Financial Impact x Urgency x Frequency x Confidence`.
3. Request agent analyses for eligible domains.
4. Convert outputs into structured findings.
5. Send findings to automation policy.
6. Produce daily briefing and approval queue.
7. Record outcomes in the learning system.

## Model Configuration

Agents must support:

- Provider.
- Model name.
- Reasoning depth.
- Temperature.
- Max cost or budget.
- Fallback model.
- Safe mode.
- Prompt template.
- Agent-specific system instructions.
- Approval threshold by risk level.

## Risk Policy

Risky actions require seller approval unless a seller-specific automation rule explicitly allows auto-execution. Examples:

- Submit marketplace claim.
- Send customer message.
- Change price.
- Pause ad campaign.
- Block COD for pincode.
- Update inventory quantity.
- Apply refund or return policy.

## Output Discipline

Every agent output must be represented as data. Free-form prose can explain the result, but the system must store the structured result first.

