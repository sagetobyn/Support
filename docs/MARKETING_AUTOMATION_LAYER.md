# Marketing Automation Layer

## Position

Marketing automation belongs inside the AI Operations OS. It must not become a separate generic marketing tool.

Marketing decisions must respect profit, return risk, RTO risk, inventory position, and seller rules.

## Supported Workflows

- Marketplace listing title improvement.
- Bullet improvement.
- Description improvement.
- Product FAQ generation.
- Image instruction briefs.
- Keyword research.
- Competitor listing tracking.
- Competitor pricing intelligence.
- Review mining.
- Customer sentiment analysis.
- Ad campaign suggestions.
- Ad budget recommendations.
- Loss-making campaign detection.
- High-ROI campaign detection.
- Festival sale planning.
- Promotion recommendation.
- Coupon profitability calculation.
- Marketplace SEO monitoring.
- Listing compliance checking.
- Content localization.
- Brand voice enforcement.
- Marketing report generation.

## Profit Guardrails

Before recommending growth actions, check:

- Gross margin.
- Return rate.
- RTO rate.
- Inventory availability.
- Seller minimum margin.
- Marketplace fees.
- Ad spend efficiency.
- Coupon cost.
- COD exposure.
- Existing customer support issues.

## Agent Outputs

Marketing agents should emit:

- Listing improvement draft.
- Keyword opportunity.
- Competitor response.
- Ad budget recommendation.
- Campaign pause recommendation.
- Promotion profitability warning.
- Review/sentiment cluster.
- Product promise mismatch.
- Report-ready growth summary.

## Integration With The OS

Marketing outputs must enter the same action queue and approval policy as operations outputs. A campaign pause or price change may be high-risk and require approval. A listing FAQ draft may be low-risk and remain a draft until approved.

## Implemented Mock Foundation

Phase 9 now has a service-backed mock foundation:

- `mockMarketingAutomation.ts` owns listing drafts, SEO keyword insights, competitor/pricing intelligence, review mining, sentiment insights, ad recommendations, coupon scenarios, festival sale plans, and report sections.
- `marketingAutomationService` composes the `/marketing-automation` view model and joins marketing workflow IDs to the shared automation queue.
- `AutomationActionType` now includes SEO keyword drafts, competitor response recommendations, loss-making campaign pause drafts, coupon profitability reviews, festival sale plan drafts, and marketing report drafts.
- Marketing actions are visible in the same `AutomationQueueItem` model as claims, NDR, settlement, COD, inventory, listing, and ad budget actions.
- Seller policy continues to block real external writes. Listing, SEO, campaign, coupon, and festival changes are drafts or recommendations only.

Current non-goals:

- No real listing edits.
- No real ad budget updates.
- No real campaign pauses.
- No real coupon creation.
- No real review mining, keyword provider, competitor scraper, or LLM copy generation.
- No database persistence yet.
