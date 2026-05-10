import type {
  AgentFindingEntityRef,
  LeakageTrendPoint,
  MarketplaceComparisonRow,
  TopLossEntity
} from "../domain/types";

const airbudsRefs: AgentFindingEntityRef[] = [
  { entityId: "sku-airbuds-pro-black", entityType: "sku", title: "Noise Air Buds Pro 2 - Black" },
  { entityId: "list-amazon-airbuds", entityType: "listing", title: "Amazon listing - Noise Air Buds Pro 2" },
  { entityId: "ret-11ab7c", entityType: "return", title: "Return RET-404-8750123" }
];

const pincodeRefs: AgentFindingEntityRef[] = [
  { entityId: "pin-560102", entityType: "pincode", title: "Bangalore 560102" },
  { entityId: "rto-11ab7c", entityType: "rto", title: "RTO risk cluster - 560102" },
  { entityId: "ndr-2261d", entityType: "ndr", title: "NDR exception AWB-2261D" }
];

export const marketplaceComparisonRows: MarketplaceComparisonRow[] = [
  {
    id: "marketplace-amazon",
    marketplace: "amazon",
    label: "Amazon",
    recoverableMoney: 942110,
    moneySaved: 246300,
    moneyAtRisk: 412900,
    rtoRisk: 315400,
    returnLoss: 218700,
    settlementLeakage: 194200,
    stockoutRisk: 101600,
    actionItems: 16,
    drilldownHref: "/data-brain?marketplace=amazon"
  },
  {
    id: "marketplace-flipkart",
    marketplace: "flipkart",
    label: "Flipkart",
    recoverableMoney: 618900,
    moneySaved: 152800,
    moneyAtRisk: 284100,
    rtoRisk: 221300,
    returnLoss: 164400,
    settlementLeakage: 236600,
    stockoutRisk: 94700,
    actionItems: 11,
    drilldownHref: "/data-brain?marketplace=flipkart"
  },
  {
    id: "marketplace-meesho",
    marketplace: "meesho",
    label: "Meesho",
    recoverableMoney: 313220,
    moneySaved: 82400,
    moneyAtRisk: 156700,
    rtoRisk: 184730,
    returnLoss: 146200,
    settlementLeakage: 72100,
    stockoutRisk: 35260,
    actionItems: 7,
    drilldownHref: "/data-brain?marketplace=meesho"
  }
];

export const leakageTrendPoints: LeakageTrendPoint[] = [
  { date: "May 05", rtoLoss: 118000, returnLoss: 76000, settlementLeakage: 55000, stockoutRisk: 36000, recovered: 22000, saved: 18000 },
  { date: "May 06", rtoLoss: 151000, returnLoss: 112000, settlementLeakage: 66000, stockoutRisk: 42000, recovered: 36000, saved: 26000 },
  { date: "May 07", rtoLoss: 188000, returnLoss: 124000, settlementLeakage: 81000, stockoutRisk: 59000, recovered: 52000, saved: 33000 },
  { date: "May 08", rtoLoss: 163000, returnLoss: 131000, settlementLeakage: 86000, stockoutRisk: 62000, recovered: 64000, saved: 42000 },
  { date: "May 09", rtoLoss: 178000, returnLoss: 143000, settlementLeakage: 102000, stockoutRisk: 71000, recovered: 78000, saved: 50000 },
  { date: "May 10", rtoLoss: 206000, returnLoss: 152000, settlementLeakage: 116000, stockoutRisk: 78000, recovered: 91000, saved: 61000 },
  { date: "May 11", rtoLoss: 194000, returnLoss: 134000, settlementLeakage: 98000, stockoutRisk: 84000, recovered: 106000, saved: 76000 },
  { date: "May 12", rtoLoss: 268000, returnLoss: 181000, settlementLeakage: 124000, stockoutRisk: 101000, recovered: 128000, saved: 93000 },
  { date: "May 13", rtoLoss: 342000, returnLoss: 238000, settlementLeakage: 176000, stockoutRisk: 126000, recovered: 154000, saved: 116000 },
  { date: "May 14", rtoLoss: 318000, returnLoss: 209000, settlementLeakage: 141000, stockoutRisk: 119000, recovered: 166000, saved: 123000 },
  { date: "May 15", rtoLoss: 412000, returnLoss: 298000, settlementLeakage: 232000, stockoutRisk: 148000, recovered: 194000, saved: 151000 },
  { date: "May 16", rtoLoss: 361000, returnLoss: 241000, settlementLeakage: 178000, stockoutRisk: 139000, recovered: 218000, saved: 168000 },
  { date: "May 17", rtoLoss: 395000, returnLoss: 279000, settlementLeakage: 197000, stockoutRisk: 156000, recovered: 231000, saved: 185000 },
  { date: "May 18", rtoLoss: 312000, returnLoss: 218000, settlementLeakage: 133000, stockoutRisk: 114000, recovered: 252000, saved: 204000 }
];

export const topLossEntities: TopLossEntity[] = [
  {
    id: "top-loss-sku-airbuds",
    rank: 1,
    type: "sku",
    label: "Noise Air Buds Pro 2",
    subtitle: "ASIN B0XY12345 | repeat return and COD risk",
    marketplaces: ["amazon", "flipkart", "meesho"],
    lossAmount: 124580,
    lossPercent: 12.8,
    rtoRisk: 76,
    returnRisk: 82,
    stockoutRisk: 63,
    sourceEntityRefs: airbudsRefs,
    actionId: "action-listing-optimization-draft",
    drilldownHref: "/data-brain?entity=sku-airbuds-pro-black"
  },
  {
    id: "top-loss-pincode-560102",
    rank: 2,
    type: "pincode",
    label: "Bangalore 560102",
    subtitle: "COD-heavy pincode with active NDR cluster",
    marketplaces: ["amazon", "flipkart"],
    lossAmount: 98640,
    lossPercent: 9.7,
    rtoRisk: 88,
    returnRisk: 41,
    sourceEntityRefs: pincodeRefs,
    actionId: "action-cod-block-rule",
    drilldownHref: "/data-brain?entity=pin-560102"
  },
  {
    id: "top-loss-sku-rockerz",
    rank: 3,
    type: "sku",
    label: "boAt Rockerz 255 Pro",
    subtitle: "refund lag and deduction pattern",
    marketplaces: ["amazon", "meesho"],
    lossAmount: 86410,
    lossPercent: 8.1,
    rtoRisk: 58,
    returnRisk: 64,
    stockoutRisk: 39,
    sourceEntityRefs: [
      { entityId: "set-2d410", entityType: "settlement", title: "Settlement SET-May-W2" },
      { entityId: "ded-7712", entityType: "deduction", title: "Unusual marketplace deduction" }
    ],
    actionId: "action-settlement-reconcile-local",
    drilldownHref: "/data-brain?entity=set-2d410"
  },
  {
    id: "top-loss-pincode-110037",
    rank: 4,
    type: "pincode",
    label: "Delhi 110037",
    subtitle: "courier exceptions and delayed buyer confirmation",
    marketplaces: ["amazon", "flipkart", "meesho"],
    lossAmount: 64320,
    lossPercent: 6.3,
    rtoRisk: 74,
    returnRisk: 36,
    sourceEntityRefs: pincodeRefs,
    actionId: "action-rto-ndr-001",
    drilldownHref: "/data-brain?entity=rto-11ab7c"
  },
  {
    id: "top-loss-sku-bassbuds",
    rank: 5,
    type: "sku",
    label: "pTron Bassbuds Vista",
    subtitle: "ad-funded COD orders below margin floor",
    marketplaces: ["flipkart"],
    lossAmount: 52110,
    lossPercent: 4.9,
    rtoRisk: 69,
    returnRisk: 44,
    stockoutRisk: 51,
    sourceEntityRefs: [
      { entityId: "adcamp-festival-audio", entityType: "ad_campaign", title: "Festival Audio Push" },
      { entityId: "kw-wireless-earbuds", entityType: "keyword", title: "wireless earbuds keyword cluster" }
    ],
    actionId: "action-loss-making-campaign-pause",
    drilldownHref: "/data-brain?entity=adcamp-festival-audio"
  }
];
