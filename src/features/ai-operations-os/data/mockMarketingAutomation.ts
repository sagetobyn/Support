import type {
  AdCampaignRecommendation,
  CompetitorListingIntelligence,
  CouponProfitabilityScenario,
  CustomerSentimentInsight,
  FestivalSalePlan,
  ListingOptimizationDraft,
  MarketingRecommendation,
  MarketingReportSection,
  ReviewMiningInsight,
  SeoKeywordInsight
} from "../domain/types";

export const marketingRecommendations: MarketingRecommendation[] = [
  {
    id: "mkt-listing-size-fit-promise",
    title: "Rewrite listing promise for repeat-return SKU",
    area: "listing",
    summary: "Noise Air Buds Pro 2 has repeat returns tied to fit, battery expectation, and COD pincode risk. Draft copy should reduce mismatch, not push more volume.",
    profitGuardrail: "Only ship the draft if return-risk copy is explicit and inventory remains above 14 days of cover.",
    impactAmount: 146200,
    riskLevel: "medium",
    approvalRequired: true
  },
  {
    id: "mkt-loss-campaign-pause",
    title: "Pause loss-making COD ad cluster",
    area: "ads",
    summary: "Festival Audio Push creates attributed revenue, but RTO and return costs make the COD-heavy keyword cluster negative contribution.",
    profitGuardrail: "Pause or reduce budget only after seller approval; do not move budget to any SKU below the configured margin floor.",
    impactAmount: 87300,
    riskLevel: "high",
    approvalRequired: true
  },
  {
    id: "mkt-competitor-response",
    title: "Respond to competitor price pressure without unsafe discounting",
    area: "competitor",
    summary: "Competitor Airbuds X is priced lower, but margin rules block matching the price. Recommended response is value-proof copy and coupon guardrail review.",
    profitGuardrail: "Never reduce effective margin below 18%; prefer proof, warranty, and bundle messaging over raw discounting.",
    impactAmount: 64200,
    riskLevel: "medium",
    approvalRequired: true
  },
  {
    id: "mkt-festival-plan",
    title: "Prepare festival sale plan with inventory and RTO controls",
    area: "festival",
    summary: "Sale planning can lift profitable demand only for SKUs with stock cover, COD risk controls, and safe coupon contribution.",
    profitGuardrail: "Block promotions where coupon contribution margin falls below 18% or RTO risk exceeds 75% without explicit approval.",
    impactAmount: 118400,
    riskLevel: "medium",
    approvalRequired: true
  }
];

export const listingOptimizationDrafts: ListingOptimizationDraft[] = [
  {
    id: "listing-draft-airbuds-promise",
    listingId: "list-amazon-airbuds",
    skuId: "sku-airbuds-pro-black",
    marketplace: "amazon",
    status: "needs_review",
    currentTitle: "Noise Air Buds Pro 2, 40H Playtime, Low Latency, Black",
    titleDraft: "Noise Air Buds Pro 2 Black - Clear Calls, Comfortable Fit, 40H Case Battery",
    bulletDrafts: [
      "Comfort-first fit guidance: best for medium ear tips; includes alternate tips for secure seal.",
      "Battery promise clarified: up to 40H with charging case; single-charge playtime depends on volume and calling.",
      "COD risk guardrail: surface prepaid benefit in high-RTO pincodes instead of offering deeper discounts."
    ],
    descriptionDraft:
      "Built for daily calls, music, and commute use. The draft explains fit, charging-case battery, and support coverage clearly so buyers understand the product before ordering.",
    reason: "Returns, reviews, and support cases point to expectation mismatch rather than pure demand weakness.",
    linkedReturnIds: ["ret-11ab7c"],
    linkedReviewIds: ["review-airbuds-fit"],
    linkedRtoIds: ["rto-11ab7c"],
    inventorySignal: "Inventory at risk: 124 units on hand, sale push must wait for reorder confirmation.",
    profitGuardrail: "Keep price stable; copy changes are allowed as drafts only until return-risk proof is reviewed.",
    automationActionId: "action-listing-optimization-draft",
    confidence: 86,
    approvalRequired: true
  }
];

export const seoKeywordInsights: SeoKeywordInsight[] = [
  {
    id: "seo-keyword-wireless-earbuds",
    keyword: "wireless earbuds",
    marketplace: "amazon",
    searchIntent: "High-volume replacement and gifting intent",
    currentRank: 18,
    opportunityScore: 81,
    rtoRisk: 72,
    returnRisk: 64,
    inventoryFit: 58,
    recommendedUse: "Use in title and first bullet only after inventory cover improves; avoid discount-heavy ad expansion.",
    automationActionId: "action-seo-keyword-update"
  },
  {
    id: "seo-keyword-calling-earbuds",
    keyword: "earbuds for calling",
    marketplace: "flipkart",
    searchIntent: "Quality-led buyer intent with lower return mismatch",
    currentRank: 31,
    opportunityScore: 74,
    rtoRisk: 42,
    returnRisk: 38,
    inventoryFit: 68,
    recommendedUse: "Add to bullet draft and marketplace SEO fields; keep prepaid-first campaign rule for risky pincodes.",
    automationActionId: "action-seo-keyword-update"
  }
];

export const competitorIntelligence: CompetitorListingIntelligence[] = [
  {
    id: "competitor-airbuds-x-price",
    competitorListingId: "comp-airbuds-x",
    competitorName: "Competitor Airbuds X",
    marketplace: "amazon",
    listingTitle: "Airbuds X True Wireless Earbuds",
    price: 1999,
    rating: 4.1,
    reviewCount: 18240,
    pricingDeltaPercent: -9.1,
    positioningGap: "Competitor leads on visible comfort proof but has weaker battery explanation.",
    responseRecommendation: "Do not price-match. Draft proof-led bullets, prepaid coupon only for low-RTO lanes, and warranty reassurance.",
    marginSafe: false,
    inventoryWarning: "Matching price would push contribution below the 18% margin floor while inventory is constrained.",
    automationActionId: "action-competitor-response"
  }
];

export const reviewMiningInsights: ReviewMiningInsight[] = [
  {
    id: "review-theme-fit-battery",
    theme: "Fit and battery expectation mismatch",
    sentiment: "mixed",
    reviewCount: 312,
    linkedSkuId: "sku-airbuds-pro-black",
    linkedReturnIds: ["ret-11ab7c"],
    returnRiskSignal: "Repeat phrase cluster overlaps with size/fit return reasons and battery support tickets.",
    listingFix: "Clarify ear-tip fit, single-charge versus case battery, and support replacement path.",
    supportToneSignal: "Use calm, helpful, Hindi-English friendly phrasing for battery troubleshooting.",
    confidence: 88.8
  },
  {
    id: "review-theme-prepaid-delivery",
    theme: "Delivery contactability in high-RTO pincodes",
    sentiment: "negative",
    reviewCount: 94,
    linkedSkuId: "sku-airbuds-pro-black",
    linkedReturnIds: ["rto-11ab7c"],
    returnRiskSignal: "COD orders from 560102 show higher NDR and repeat return exposure.",
    listingFix: "Add prepaid delivery reassurance instead of promising faster COD delivery.",
    supportToneSignal: "Proactively confirm address and delivery availability before dispatch.",
    confidence: 82.4
  }
];

export const sentimentInsights: CustomerSentimentInsight[] = [
  {
    id: "sentiment-repeat-buyers-airbuds",
    segment: "Repeat buyers comparing battery promise",
    sentimentScore: 64,
    topComplaint: "Battery expectation differs between calls, music, and charging-case claims.",
    topPraise: "Comfort and value are strong when expectations are clear.",
    recommendedAction: "Use practical battery language and avoid premium-sounding claims that increase returns.",
    linkedWorkflowId: "listing-draft-airbuds-promise"
  },
  {
    id: "sentiment-cod-risk-buyers",
    segment: "COD buyers in high-RTO lanes",
    sentimentScore: 41,
    topComplaint: "Delivery confirmation gaps and address contactability create failed attempts.",
    topPraise: "Buyers respond well to proactive delivery confirmation messages.",
    recommendedAction: "Keep COD growth controlled and pair campaigns with NDR confirmation drafts.",
    linkedWorkflowId: "listing-draft-airbuds-promise"
  }
];

export const adCampaignRecommendations: AdCampaignRecommendation[] = [
  {
    id: "ad-rec-festival-audio-budget",
    campaignId: "adcamp-festival-audio",
    title: "Reduce Festival Audio Push budget until RTO-heavy keywords are isolated",
    currentSpend: 86400,
    attributedRevenue: 241900,
    deliveredProfit: -17300,
    acos: 35.7,
    rtoLoss: 84200,
    returnLoss: 88600,
    inventoryRisk: 71,
    recommendation: "Cut budget by 35%, move spend to calling-intent keywords, and require approval before any marketplace budget write.",
    budgetChangePercent: -35,
    riskLevel: "high",
    approvalRequired: true,
    automationActionId: "action-loss-making-campaign-pause"
  },
  {
    id: "ad-rec-calling-intent",
    campaignId: "adcamp-festival-audio",
    title: "Test calling-intent keyword cluster with prepaid-first guardrail",
    currentSpend: 28600,
    attributedRevenue: 133400,
    deliveredProfit: 38200,
    acos: 21.4,
    rtoLoss: 21400,
    returnLoss: 15400,
    inventoryRisk: 58,
    recommendation: "Shift a small budget test only after stock cover and margin floor checks pass.",
    budgetChangePercent: 12,
    riskLevel: "medium",
    approvalRequired: true,
    automationActionId: "action-ad-budget-recommendation"
  }
];

export const couponProfitabilityScenarios: CouponProfitabilityScenario[] = [
  {
    id: "coupon-prepaid-8-airbuds",
    title: "8% prepaid coupon for low-RTO lanes",
    skuId: "sku-airbuds-pro-black",
    discountPercent: 8,
    expectedOrders: 420,
    grossRevenue: 849000,
    marketplaceFees: 152820,
    adSpend: 76000,
    rtoCost: 31800,
    returnCost: 49200,
    contributionProfit: 539180,
    marginPercent: 63.5,
    verdict: "safe_to_test",
    guardrail: "Safe only for prepaid and low-RTO pincodes; exclude COD-heavy 560102 cluster.",
    automationActionId: "action-coupon-profitability-review"
  },
  {
    id: "coupon-cod-22-airbuds",
    title: "22% COD coupon for festival spike",
    skuId: "sku-airbuds-pro-black",
    discountPercent: 22,
    expectedOrders: 520,
    grossRevenue: 680000,
    marketplaceFees: 122400,
    adSpend: 145000,
    rtoCost: 160000,
    returnCost: 138000,
    contributionProfit: 114600,
    marginPercent: 16.9,
    verdict: "blocked_by_margin",
    guardrail: "Blocked because contribution margin falls below the 18% seller rule and RTO risk is above threshold.",
    automationActionId: "action-coupon-profitability-review"
  }
];

export const festivalSalePlans: FestivalSalePlan[] = [
  {
    id: "festival-plan-independence-week",
    eventName: "Independence Week Audio Sale",
    dateRange: "Aug 10 - Aug 18, 2026",
    skuFocus: ["sku-airbuds-pro-black"],
    readinessScore: 68,
    inventoryConstraint: "Reorder must land before sale; current cover is not enough for broad ad expansion.",
    rtoConstraint: "Block COD campaign expansion where RTO risk is above 75%.",
    marginFloor: 18,
    plannedActions: [
      "Publish listing copy draft after catalog approval.",
      "Run prepaid coupon scenario only for low-RTO lanes.",
      "Reduce loss-making campaign cluster before scaling calling-intent keywords.",
      "Generate weekly profit-aware growth report for seller review."
    ],
    approvalRequired: true,
    automationActionIds: [
      "action-listing-optimization-draft",
      "action-loss-making-campaign-pause",
      "action-coupon-profitability-review",
      "action-festival-sale-plan"
    ]
  }
];

export const marketingReportSections: MarketingReportSection[] = [
  {
    id: "report-section-profit-aware-growth",
    title: "Profit-aware growth summary",
    summary: "Growth actions are constrained by inventory cover, RTO risk, return reasons, and seller margin floor.",
    metrics: [
      { label: "Money protected", value: "INR 4.16L", note: "Listing, ad, coupon, and competitor actions" },
      { label: "Unsafe campaigns", value: "1", note: "COD-heavy cluster with negative delivered profit" },
      { label: "Blocked promotion", value: "1", note: "Coupon scenario below 18% margin floor" }
    ],
    actionIds: ["action-marketing-report-draft", "action-loss-making-campaign-pause"]
  },
  {
    id: "report-section-review-to-listing",
    title: "Review-to-listing learning",
    summary: "Review and return clusters are converted into listing drafts and support-tone recommendations.",
    metrics: [
      { label: "Review clusters mined", value: "2", note: "Fit, battery, and delivery contactability" },
      { label: "Linked returns/RTO", value: "2", note: "ret-11ab7c and rto-11ab7c" },
      { label: "Drafts ready", value: "1", note: "Catalog approval required before publish" }
    ],
    actionIds: ["action-listing-optimization-draft", "action-seo-keyword-update"]
  }
];
