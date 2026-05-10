import type {
  CanonicalEntityType,
  CommerceGraphNode,
  EntityMappingPreview,
  LineageRecord,
  MarketplaceIdMapping,
  NormalizedCommerceEntity,
  SkuMapping,
  UnifiedEntitySummary
} from "../domain/types";

type EntitySeed = {
  id: string;
  entityType: CanonicalEntityType;
  title: string;
  status: NormalizedCommerceEntity["status"];
  connectorId: string;
  sourceRecordId: string;
  score: number;
  attributes: Record<string, string | number | boolean | string[]>;
};

const seeds: EntitySeed[] = [
  { id: "seller-acme", entityType: "seller", title: "Acme Marketplace", status: "active", connectorId: "report-upload", sourceRecordId: "seller-profile-001", score: 99, attributes: { monthlyOrders: "10,000 - 50,000", category: "Fashion and Beauty" } },
  { id: "workspace-acme", entityType: "workspace", title: "Acme Operations Workspace", status: "active", connectorId: "report-upload", sourceRecordId: "workspace-001", score: 99, attributes: { region: "IN", currency: "INR" } },
  { id: "acct-amazon", entityType: "marketplace_account", title: "Amazon India Seller Central", status: "active", connectorId: "amazon-sp-api", sourceRecordId: "A21TJRUUN4KGV", score: 98, attributes: { marketplace: "amazon", access: "read_only" } },
  { id: "prod-airbuds-pro", entityType: "product", title: "Noise Air Buds Pro 2", status: "active", connectorId: "amazon-sp-api", sourceRecordId: "B0TX91-AIRBUDS", score: 99, attributes: { brand: "Noise", category: "Electronics Accessories" } },
  { id: "sku-airbuds-pro-black", entityType: "sku", title: "Noise Air Buds Pro 2 - Black", status: "active", connectorId: "amazon-sp-api", sourceRecordId: "A_SKU_AIRBUDS_BLACK", score: 98.9, attributes: { color: "Black", size: "One Size", mappedSources: ["amazon", "flipkart", "meesho"] } },
  { id: "list-amazon-airbuds", entityType: "listing", title: "Amazon Listing - Noise Air Buds Pro 2", status: "active", connectorId: "amazon-sp-api", sourceRecordId: "ASIN-B0TX91", score: 98.7, attributes: { asin: "B0TX91", buyBox: true } },
  { id: "ord-91aa3f", entityType: "order", title: "Order #404-8750123", status: "at_risk", connectorId: "amazon-sp-api", sourceRecordId: "404-8750123", score: 99.4, attributes: { orderValue: 2199, paymentMode: "COD", pincode: "560102", marketplace: "amazon" } },
  { id: "item-91aa3f-1", entityType: "order_item", title: "Order item - Noise Air Buds Pro 2", status: "at_risk", connectorId: "amazon-sp-api", sourceRecordId: "404-8750123-1", score: 99.2, attributes: { quantity: 1, skuId: "sku-airbuds-pro-black", orderId: "ord-91aa3f" } },
  { id: "cust-8bd27", entityType: "customer", title: "Rohit Sharma", status: "active", connectorId: "amazon-sp-api", sourceRecordId: "CUST-AZ-4471", score: 97.8, attributes: { totalOrders: 5, repeatBuyer: true, city: "Bengaluru" } },
  { id: "addr-560102", entityType: "address", title: "HSR Layout, Bengaluru 560102", status: "needs_review", connectorId: "amazon-sp-api", sourceRecordId: "ADDR-AZ-560102", score: 94.2, attributes: { pincode: "560102", issue: "landmark missing" } },
  { id: "pin-560102", entityType: "pincode", title: "560102 - Bengaluru", status: "at_risk", connectorId: "courier-reports", sourceRecordId: "PIN-560102", score: 91.1, attributes: { rtoRisk: 78, ndrSpike: true } },
  { id: "courier-shiprocket", entityType: "courier", title: "Shiprocket / Delhivery Lane", status: "active", connectorId: "courier-reports", sourceRecordId: "CR-SR-DL-001", score: 97.6, attributes: { provider: "Shiprocket", lane: "Bangalore Urban" } },
  { id: "ship-awb-2261d", entityType: "shipment", title: "Shipment AWB SR2261D", status: "at_risk", connectorId: "courier-reports", sourceRecordId: "AWB-SR2261D", score: 96.9, attributes: { awb: "SR2261D", status: "NDR", attempts: 2 } },
  { id: "ndr-2261d", entityType: "ndr", title: "NDR - customer unreachable", status: "needs_review", connectorId: "courier-reports", sourceRecordId: "NDR-SR2261D", score: 95.8, attributes: { reason: "customer_unreachable", hoursOpen: 9 } },
  { id: "rto-11ab7c", entityType: "rto", title: "RTO risk cluster - 560102", status: "at_risk", connectorId: "courier-reports", sourceRecordId: "RTO-CLUSTER-560102", score: 92.6, attributes: { impactedOrders: 214, recoverableAmount: 842100 } },
  { id: "ret-11ab7c", entityType: "return", title: "Return RET-404-8750123", status: "resolved", connectorId: "meesho-supplier-upload", sourceRecordId: "RET-404-8750123", score: 98.6, attributes: { reason: "size mismatch", orderId: "ord-91aa3f" } },
  { id: "refund-404", entityType: "refund", title: "Refund RF-404-8750123", status: "resolved", connectorId: "bank-statements", sourceRecordId: "RF-404-8750123", score: 97.3, attributes: { amount: 2199, settlementId: "set-2d410" } },
  { id: "set-2d410", entityType: "settlement", title: "Settlement SET-May-W2", status: "needs_review", connectorId: "bank-statements", sourceRecordId: "SET-MAY-W2", score: 97.8, attributes: { payout: 244118, mismatch: 31284 } },
  { id: "ded-7712", entityType: "deduction", title: "Unusual marketplace deduction", status: "needs_review", connectorId: "amazon-sp-api", sourceRecordId: "DED-AZ-7712", score: 96.1, attributes: { feeType: "weight_discrepancy", amount: 5736 } },
  { id: "claim-38912", entityType: "claim", title: "Claim draft for invalid deduction", status: "needs_review", connectorId: "bank-statements", sourceRecordId: "CLM-38912", score: 94.9, attributes: { evidenceCount: 5, amount: 124500 } },
  { id: "inv-312009", entityType: "inventory_item", title: "Inventory - Noise Air Buds Pro 2", status: "at_risk", connectorId: "flipkart-seller-api", sourceRecordId: "INV-FK-AIRBUDS", score: 98.1, attributes: { onHand: 124, stockoutRisk: 71 } },
  { id: "wh-blr-01", entityType: "warehouse", title: "Bengaluru FC Warehouse", status: "active", connectorId: "report-upload", sourceRecordId: "WH-BLR-01", score: 96.4, attributes: { city: "Bengaluru", inventoryCount: 312009 } },
  { id: "supplier-audio-one", entityType: "supplier", title: "AudioOne Components", status: "active", connectorId: "report-upload", sourceRecordId: "SUP-AUDIO-01", score: 93.7, attributes: { defectRate: 2.8, leadTimeDays: 12 } },
  { id: "po-audio-778", entityType: "purchase_order", title: "PO-AUDIO-778", status: "active", connectorId: "report-upload", sourceRecordId: "PO-AUDIO-778", score: 94.1, attributes: { units: 500, expectedAt: "2026-05-24" } },
  { id: "support-case-778", entityType: "support_case", title: "Support case - battery issue", status: "needs_review", connectorId: "support-messages", sourceRecordId: "ZD-778", score: 89.4, attributes: { orderId: "ord-91aa3f", skuId: "sku-airbuds-pro-black" } },
  { id: "warranty-778", entityType: "warranty_case", title: "Warranty claim - charging case", status: "needs_review", connectorId: "support-messages", sourceRecordId: "WAR-778", score: 87.9, attributes: { skuId: "sku-airbuds-pro-black", daysSinceDelivery: 19 } },
  { id: "review-airbuds-fit", entityType: "review", title: "Review cluster - fit and battery", status: "active", connectorId: "review-mining", sourceRecordId: "REV-AIRBUDS-112", score: 88.8, attributes: { sentiment: "mixed", repeatedTheme: "battery backup" } },
  { id: "adcamp-festival-audio", entityType: "ad_campaign", title: "Festival Audio Push", status: "at_risk", connectorId: "ad-reports", sourceRecordId: "ADS-CAMP-448", score: 90.2, attributes: { spend: 86400, attributedOrders: 318, rtoRate: 18.7 } },
  { id: "kw-wireless-earbuds", entityType: "keyword", title: "wireless earbuds", status: "active", connectorId: "ad-reports", sourceRecordId: "KW-7782", score: 92.5, attributes: { cpc: 14.2, conversionRate: 3.8 } },
  { id: "comp-airbuds-x", entityType: "competitor_listing", title: "Competitor Airbuds X", status: "active", connectorId: "review-mining", sourceRecordId: "COMP-AIR-X", score: 86.6, attributes: { price: 1999, rating: 4.1 } },
  { id: "report-may-payout", entityType: "report_file", title: "Payout_Summary_May.pdf", status: "resolved", connectorId: "report-upload", sourceRecordId: "FILE-PAYOUT-MAY", score: 96.7, attributes: { fileType: "pdf", rowsExtracted: 3114 } }
];

function labelForScore(score: number): "high" | "medium" | "low" {
  if (score >= 97) return "high";
  if (score >= 90) return "medium";
  return "low";
}

export const normalizedCommerceEntities: NormalizedCommerceEntity[] = seeds.map((seed) => ({
  id: seed.id,
  workspaceId: "workspace-acme",
  entityType: seed.entityType,
  title: seed.title,
  status: seed.status,
  sourceRefs: [{ connectorId: seed.connectorId, sourceRecordId: seed.sourceRecordId }],
  confidence: {
    entityId: seed.id,
    entityType: seed.entityType,
    score: seed.score,
    label: labelForScore(seed.score),
    signals: ["source ID present", "required fields mapped", "lineage attached"]
  },
  lineageIds: [`lin-${seed.id}`],
  attributes: seed.attributes,
  updatedAt: "2026-05-10T09:06:00.000Z"
}));

export const lineageRecords: LineageRecord[] = normalizedCommerceEntities.map((entity) => ({
  id: entity.lineageIds[0],
  entityId: entity.id,
  entityType: entity.entityType,
  source: entity.sourceRefs[0],
  fieldMappings: {
    id: "external_id",
    title: "source_name",
    updatedAt: "source_updated_at"
  },
  transformations: ["trim strings", "standardize marketplace identifiers", "attach workspace scope", "calculate confidence score"],
  receivedAt: "2026-05-10T08:58:00.000Z",
  normalizedAt: entity.updatedAt,
  confidenceImpact: entity.confidence.score >= 95 ? 1.2 : -0.6
}));

export const skuMappings: SkuMapping[] = [
  {
    id: "sku-map-airbuds-black",
    canonicalSkuId: "sku-airbuds-pro-black",
    canonicalTitle: "Noise Air Buds Pro 2 - Black",
    sourceSkuIds: { amazon: "A_SKU_AIRBUDS_BLACK", flipkart: "FK_SKU_AIRBUDS_BLK", meesho: "MS_SKU_AIRBUDS_BLACK" },
    listingIds: { amazon: "ASIN-B0TX91", flipkart: "LST-FK-AIRBUDS-982", meesho: "MEE-LST-441" },
    confidenceScore: 98.9,
    conflictCount: 0,
    lineageIds: ["lin-sku-airbuds-pro-black", "lin-list-amazon-airbuds"],
    lastResolvedAt: "2026-05-10T09:06:00.000Z"
  },
  {
    id: "sku-map-colorfit-pulse",
    canonicalSkuId: "sku-colorfit-pulse-3",
    canonicalTitle: "Noise ColorFit Pulse 3",
    sourceSkuIds: { amazon: "A_SKU_CFP3", flipkart: "FK_SKU_CFP3", meesho: "MS_SKU_CFP3" },
    listingIds: { amazon: "ASIN-B0CFP3", flipkart: "LST-FK-CFP3", meesho: "MEE-LST-833" },
    confidenceScore: 97.6,
    conflictCount: 1,
    lineageIds: ["lin-prod-airbuds-pro", "lin-report-may-payout"],
    lastResolvedAt: "2026-05-10T08:55:00.000Z"
  }
];

export const marketplaceIdMappings: MarketplaceIdMapping[] = [
  {
    id: "idmap-order-91aa3f",
    entityType: "order",
    canonicalId: "ord-91aa3f",
    marketplaceIds: { amazon: "404-8750123", flipkart: "OD33219821", meesho: "MS987623" },
    sourceRecordIds: ["404-8750123", "OD33219821", "MS987623"],
    confidenceScore: 99.4,
    lineageIds: ["lin-ord-91aa3f"],
    lastUpdated: "2026-05-10T09:06:00.000Z"
  },
  {
    id: "idmap-sku-airbuds",
    entityType: "sku",
    canonicalId: "sku-airbuds-pro-black",
    marketplaceIds: { amazon: "A_SKU_AIRBUDS_BLACK", flipkart: "FK_SKU_AIRBUDS_BLK", meesho: "MS_SKU_AIRBUDS_BLACK" },
    sourceRecordIds: ["A_SKU_AIRBUDS_BLACK", "FK_SKU_AIRBUDS_BLK", "MS_SKU_AIRBUDS_BLACK"],
    confidenceScore: 98.9,
    lineageIds: ["lin-sku-airbuds-pro-black"],
    lastUpdated: "2026-05-10T09:06:00.000Z"
  },
  {
    id: "idmap-settlement-2d410",
    entityType: "settlement",
    canonicalId: "set-2d410",
    marketplaceIds: { amazon: "SET-AZ-MAY-W2", flipkart: "FK-PAY-MAY-W2", meesho: "MEE-PAY-MAY-W2" },
    sourceRecordIds: ["SET-MAY-W2", "SET-AZ-MAY-W2", "FK-PAY-MAY-W2"],
    confidenceScore: 97.8,
    lineageIds: ["lin-set-2d410", "lin-refund-404"],
    lastUpdated: "2026-05-10T09:02:00.000Z"
  }
];

export const entitySummaries: UnifiedEntitySummary[] = [
  { entityType: "Orders", count: 2418772, confidence: 99.4, sourceCount: 5 },
  { entityType: "Products", count: 578221, confidence: 99.1, sourceCount: 6 },
  { entityType: "SKUs", count: 421884, confidence: 98.9, sourceCount: 6 },
  { entityType: "Returns", count: 128991, confidence: 98.6, sourceCount: 3 },
  { entityType: "Settlements", count: 244118, confidence: 97.8, sourceCount: 4 },
  { entityType: "Claims", count: 38912, confidence: 96.4, sourceCount: 3 },
  { entityType: "Support Cases", count: 203118, confidence: 95.9, sourceCount: 4 },
  { entityType: "Inventory", count: 312009, confidence: 98.1, sourceCount: 5 }
];

export const graphNodes: CommerceGraphNode[] = entitySummaries.map((summary) => ({
  id: summary.entityType.toLowerCase().replace(/\s+/g, "-"),
  label: summary.entityType,
  entityType: summary.entityType.toLowerCase().replace(/\s+/g, "_"),
  count: summary.count,
  confidence: summary.confidence
}));

export const mappingPreviews: EntityMappingPreview[] = marketplaceIdMappings.map((mapping) => ({
  id: mapping.id,
  entityType: mapping.entityType,
  canonicalId: mapping.canonicalId,
  sourceIds: {
    amazon: mapping.marketplaceIds.amazon || "-",
    flipkart: mapping.marketplaceIds.flipkart || "-",
    meesho: mapping.marketplaceIds.meesho || "-"
  },
  confidence: mapping.confidenceScore,
  lastUpdated: mapping.lastUpdated
}));
