# Agent Roles

These roles guide product development. For the MVP, they should be implemented as simple services, checklists, prompts, and operating disciplines, not autonomous agents.

## Expert Roles

### CEO Agent

Focus:

- Business model.
- Positioning.
- Strategy.
- Pricing.
- Customer selection.

Outputs:

- ICP.
- Offer.
- Pricing model.
- Pilot success definition.

### Product Manager Agent

Focus:

- MVP scope.
- User stories.
- Feature prioritization.
- Roadmap.

Outputs:

- Scope decisions.
- Acceptance criteria.
- Release plan.

### Business Analyst Agent

Focus:

- RTO cost calculation.
- Seller workflows.
- Operational bottlenecks.
- KPI mapping.

Outputs:

- Workflow maps.
- Requirements traceability.
- Cost formulas.

### Data Analyst Agent

Focus:

- RTO by pincode.
- RTO by courier.
- RTO by SKU.
- RTO by payment mode.
- Cohort analysis.

Outputs:

- Report definitions.
- Dashboard metrics.
- Driver analysis.

### Data Scientist Agent

Focus:

- Future ML risk model.
- Feature engineering.
- Model evaluation.
- Precision/recall for high-risk orders.

Outputs:

- Feature list.
- Label definitions.
- Evaluation plan.

MVP note: use rule-based scoring first.

### UI/UX Designer Agent

Focus:

- Dashboard clarity.
- Action queue usability.
- Founder and ops views.
- Low-friction workflows.

Outputs:

- Page flows.
- Empty states.
- Component states.

### Web Designer Agent

Focus:

- Landing page.
- Sales pages.
- Audit report design.

Outputs:

- Sales copy.
- Report layout.
- Visual direction.

### Supply Chain Analyst Agent

Focus:

- Courier performance.
- NDR lifecycle.
- Reattempt timing.
- Logistics actions.

Outputs:

- NDR taxonomy.
- Courier action rules.
- Reattempt policy notes.

### Finance Manager Agent

Focus:

- Savings calculation.
- Pricing.
- ROI proof.
- Unit economics.

Outputs:

- ROI formulas.
- Pricing scenarios.
- Savings ledger rules.

### Sales and Marketing Agent

Focus:

- Lead generation.
- Outreach scripts.
- Demo flow.
- Pilot conversion.

Outputs:

- Outreach copy.
- Call script.
- Objection handling.

### Customer Success Manager Agent

Focus:

- Onboarding.
- Daily reports.
- Pilot success.
- Retention.

Outputs:

- Onboarding checklist.
- Pilot review cadence.
- Weekly seller report.

### Security/Compliance Agent

Focus:

- Data privacy.
- DPDP-aware design.
- Phone/address masking.
- Data deletion.
- Audit logs.

Outputs:

- Privacy checklist.
- Data retention rules.
- Audit requirements.

## Product Runtime Agents

These should be services in the MVP:

- Order Risk Agent: rule-based order risk scoring.
- Address Quality Agent: address issues and suggested customer question.
- NDR Reason Agent: normalize courier reasons.
- Customer Messaging Agent: render WhatsApp templates.
- Intent Detection Agent: map manual/webhook responses to intents.
- Courier Action Agent: recommend reattempt, address update, cancellation, or escalation.
- Analytics Agent: summarize pincode, courier, SKU, payment-mode, and NDR drivers.
- Finance ROI Agent: calculate estimated RTO loss and savings.
- Ops Manager Agent: generate Today’s Actions.

## MVP Principle

Do not build a complex multi-agent runtime. Build deterministic services that are explainable, testable, and easy for an ops team to trust.

