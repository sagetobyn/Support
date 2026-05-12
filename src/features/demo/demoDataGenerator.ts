import { buildNdrCases } from "@/lib/ndrCases";
import { cancelledBeforeShippingSaving, codConvertedPrepaidSaving, estimatedRtoLossPerOrder } from "@/lib/roi";
import { scoreOrder } from "@/lib/riskScoring";
import { defaultBrand } from "@/data/seed";
import type { BrandSettings, ImportRecord, Order, SavingsEvent } from "@/types/domain";

export type DemoProfileId = "fashion" | "footwear" | "beauty" | "accessories" | "wellness" | "gadget";

export interface DemoBusinessProfile {
  id: DemoProfileId;
  label: string;
  category: string;
  monthlyOrders: number;
  codPercent: number;
  rtoPercent: number;
  ndrPercent: number;
  averageOrderValue: number;
  topRiskyPincodes: string[];
  courierMix: Record<string, number>;
  ndrReasonMix: Record<string, number>;
  skuMix: Array<{ sku: string; productName: string; price: number; leakageBias: number }>;
  campaignMix: Array<{ name: string; source: string; leakageBias: number }>;
}

export interface DemoGeneratorOptions {
  profileId?: DemoProfileId;
  orderCount?: number;
  codPercent?: number;
  rtoPercent?: number;
  ndrPercent?: number;
  riskyPincodeClusterCount?: number;
  courierIssueSeverity?: number;
  seed?: number;
}

const pincodeDirectory = [
  { pincode: "201001", city: "Ghaziabad", state: "Uttar Pradesh" },
  { pincode: "110024", city: "Delhi", state: "Delhi" },
  { pincode: "560095", city: "Bengaluru", state: "Karnataka" },
  { pincode: "380015", city: "Ahmedabad", state: "Gujarat" },
  { pincode: "302001", city: "Jaipur", state: "Rajasthan" },
  { pincode: "411045", city: "Pune", state: "Maharashtra" },
  { pincode: "700016", city: "Kolkata", state: "West Bengal" },
  { pincode: "226010", city: "Lucknow", state: "Uttar Pradesh" },
  { pincode: "452010", city: "Indore", state: "Madhya Pradesh" },
  { pincode: "395007", city: "Surat", state: "Gujarat" },
  { pincode: "500081", city: "Hyderabad", state: "Telangana" },
  { pincode: "400053", city: "Mumbai", state: "Maharashtra" },
  { pincode: "600042", city: "Chennai", state: "Tamil Nadu" },
  { pincode: "751024", city: "Bhubaneswar", state: "Odisha" },
  { pincode: "800001", city: "Patna", state: "Bihar" }
];

const names = ["Aarav Sharma", "Diya Verma", "Kabir Khan", "Ananya Iyer", "Riya Patel", "Vivaan Rao", "Meera Singh", "Ishaan Gupta", "Sara Ali", "Nisha Nair"];
const ndrReasons = ["Customer not available", "Incorrect address", "No response on phone", "Door locked", "Customer refused delivery", "Cash not ready", "Customer requested future delivery"];

export const demoProfiles: Record<DemoProfileId, DemoBusinessProfile> = {
  fashion: {
    id: "fashion",
    label: "Fashion brand",
    category: "Fashion",
    monthlyOrders: 1400,
    codPercent: 68,
    rtoPercent: 22,
    ndrPercent: 14,
    averageOrderValue: 1299,
    topRiskyPincodes: ["395007", "201001", "226010", "800001"],
    courierMix: { Delhivery: 28, Xpressbees: 22, Bluedart: 16, Shiprocket: 14, Ekart: 10, DTDC: 6, Shadowfax: 4 },
    ndrReasonMix: { "Customer not available": 28, "Incorrect address": 19, "Customer refused delivery": 18, "Cash not ready": 13, "No response on phone": 12, "Door locked": 10 },
    skuMix: [
      { sku: "DENIM-WIDE-30", productName: "Wide Fit Denim", price: 1899, leakageBias: 0.18 },
      { sku: "KURTI-BLU-M", productName: "Blue Printed Kurti", price: 1299, leakageBias: 0.1 },
      { sku: "DRESS-RED-S", productName: "Red Summer Dress", price: 2499, leakageBias: 0.22 },
      { sku: "TSH-BLK-L", productName: "Oversized Black Tee", price: 799, leakageBias: 0.04 },
      { sku: "COORD-GRN-M", productName: "Green Co-ord Set", price: 2299, leakageBias: 0.16 }
    ],
    campaignMix: [
      { name: "Meta COD Scale", source: "Meta", leakageBias: 0.17 },
      { name: "Influencer Drop", source: "Instagram", leakageBias: 0.12 },
      { name: "Google Brand Search", source: "Google", leakageBias: -0.05 },
      { name: "WhatsApp Repeat Buyers", source: "WhatsApp", leakageBias: -0.08 }
    ]
  },
  footwear: {
    id: "footwear",
    label: "Footwear brand",
    category: "Footwear",
    monthlyOrders: 900,
    codPercent: 64,
    rtoPercent: 19,
    ndrPercent: 12,
    averageOrderValue: 1799,
    topRiskyPincodes: ["201001", "302001", "751024"],
    courierMix: { Xpressbees: 30, Delhivery: 25, Ekart: 15, Bluedart: 12, Shiprocket: 10, DTDC: 5, Shadowfax: 3 },
    ndrReasonMix: { "Customer refused delivery": 24, "Customer not available": 22, "Incorrect address": 18, "Cash not ready": 16, "No response on phone": 12, "Door locked": 8 },
    skuMix: [
      { sku: "SNEAK-WHT-8", productName: "White Sneakers", price: 1999, leakageBias: 0.16 },
      { sku: "SANDAL-TAN-7", productName: "Tan Platform Sandals", price: 1499, leakageBias: 0.1 },
      { sku: "RUN-BLK-9", productName: "Black Running Shoes", price: 2299, leakageBias: 0.12 },
      { sku: "HEEL-GLD-6", productName: "Gold Block Heels", price: 1899, leakageBias: 0.22 }
    ],
    campaignMix: [
      { name: "Meta Size Sale", source: "Meta", leakageBias: 0.16 },
      { name: "Google Shopping", source: "Google", leakageBias: -0.04 },
      { name: "Creator Try-on", source: "Instagram", leakageBias: 0.12 }
    ]
  },
  beauty: {
    id: "beauty",
    label: "Beauty brand",
    category: "Beauty",
    monthlyOrders: 650,
    codPercent: 56,
    rtoPercent: 14,
    ndrPercent: 9,
    averageOrderValue: 899,
    topRiskyPincodes: ["395007", "800001", "226010"],
    courierMix: { Delhivery: 32, Bluedart: 20, Xpressbees: 18, Shiprocket: 12, Ekart: 8, DTDC: 6, Shadowfax: 4 },
    ndrReasonMix: { "Customer not available": 30, "No response on phone": 18, "Door locked": 16, "Incorrect address": 14, "Customer refused delivery": 12, "Cash not ready": 10 },
    skuMix: [
      { sku: "SERUM-VITC", productName: "Vitamin C Serum", price: 699, leakageBias: 0.08 },
      { sku: "KIT-GLOW", productName: "Glow Routine Kit", price: 1499, leakageBias: 0.16 },
      { sku: "LIP-MATTE", productName: "Matte Lip Trio", price: 899, leakageBias: 0.05 },
      { sku: "CREAM-NIGHT", productName: "Repair Night Cream", price: 1199, leakageBias: 0.1 }
    ],
    campaignMix: [
      { name: "Meta Glow Offer", source: "Meta", leakageBias: 0.13 },
      { name: "Influencer Reel", source: "Instagram", leakageBias: 0.09 },
      { name: "Repeat CRM", source: "WhatsApp", leakageBias: -0.08 }
    ]
  },
  accessories: {
    id: "accessories",
    label: "Accessories brand",
    category: "Accessories",
    monthlyOrders: 1000,
    codPercent: 62,
    rtoPercent: 18,
    ndrPercent: 11,
    averageOrderValue: 999,
    topRiskyPincodes: ["110024", "395007", "800001"],
    courierMix: { Shiprocket: 25, Xpressbees: 22, Delhivery: 20, Bluedart: 12, Ekart: 10, DTDC: 7, Shadowfax: 4 },
    ndrReasonMix: { "Customer not available": 26, "Customer refused delivery": 20, "No response on phone": 18, "Incorrect address": 16, "Cash not ready": 12, "Door locked": 8 },
    skuMix: [
      { sku: "WATCH-BLK", productName: "Smart Fitness Watch", price: 2499, leakageBias: 0.21 },
      { sku: "BAG-SLING", productName: "Vegan Sling Bag", price: 1299, leakageBias: 0.08 },
      { sku: "SUN-GLD", productName: "Gold Aviator Sunglasses", price: 899, leakageBias: 0.06 },
      { sku: "JEWEL-SET", productName: "Daily Wear Jewellery Set", price: 999, leakageBias: 0.1 }
    ],
    campaignMix: [
      { name: "Impulse COD Sale", source: "Meta", leakageBias: 0.18 },
      { name: "Creator Picks", source: "Instagram", leakageBias: 0.09 },
      { name: "Brand Search", source: "Google", leakageBias: -0.04 }
    ]
  },
  wellness: {
    id: "wellness",
    label: "Wellness brand",
    category: "Wellness / Ayurveda",
    monthlyOrders: 850,
    codPercent: 58,
    rtoPercent: 16,
    ndrPercent: 10,
    averageOrderValue: 1199,
    topRiskyPincodes: ["226010", "751024", "800001"],
    courierMix: { Delhivery: 26, Shiprocket: 22, Bluedart: 18, Xpressbees: 16, Ekart: 8, DTDC: 6, Shadowfax: 4 },
    ndrReasonMix: { "Customer not available": 25, "Cash not ready": 18, "No response on phone": 18, "Incorrect address": 15, "Customer refused delivery": 14, "Door locked": 10 },
    skuMix: [
      { sku: "HAIR-OIL", productName: "Ayurvedic Hair Oil", price: 799, leakageBias: 0.05 },
      { sku: "SLIM-KIT", productName: "Metabolism Support Kit", price: 1899, leakageBias: 0.2 },
      { sku: "ASHWA-CAPS", productName: "Ashwagandha Capsules", price: 999, leakageBias: 0.08 },
      { sku: "SKIN-COMBO", productName: "Skin Wellness Combo", price: 1499, leakageBias: 0.12 }
    ],
    campaignMix: [
      { name: "Meta Wellness COD", source: "Meta", leakageBias: 0.16 },
      { name: "YouTube Ayurveda", source: "YouTube", leakageBias: 0.08 },
      { name: "Repeat Buyers", source: "WhatsApp", leakageBias: -0.08 }
    ]
  },
  gadget: {
    id: "gadget",
    label: "Gadget brand",
    category: "Gadgets",
    monthlyOrders: 1200,
    codPercent: 66,
    rtoPercent: 24,
    ndrPercent: 15,
    averageOrderValue: 1999,
    topRiskyPincodes: ["395007", "201001", "302001", "800001"],
    courierMix: { Xpressbees: 28, Delhivery: 24, Shiprocket: 16, Ekart: 12, Bluedart: 10, DTDC: 6, Shadowfax: 4 },
    ndrReasonMix: { "Customer refused delivery": 24, "Customer not available": 22, "Cash not ready": 18, "No response on phone": 14, "Incorrect address": 12, "Door locked": 10 },
    skuMix: [
      { sku: "EARBUDS-PRO", productName: "Wireless Earbuds Pro", price: 1999, leakageBias: 0.18 },
      { sku: "WATCH-BLK", productName: "Smart Fitness Watch", price: 2999, leakageBias: 0.2 },
      { sku: "CHARGER-65W", productName: "65W Fast Charger", price: 899, leakageBias: 0.06 },
      { sku: "SPEAKER-MINI", productName: "Mini Bluetooth Speaker", price: 1499, leakageBias: 0.13 }
    ],
    campaignMix: [
      { name: "Meta Gadget COD", source: "Meta", leakageBias: 0.18 },
      { name: "Influencer Tech Drop", source: "Instagram", leakageBias: 0.12 },
      { name: "Google Shopping", source: "Google", leakageBias: -0.03 }
    ]
  }
};

function random(seed: number) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 48271) % 2147483647;
    return value / 2147483647;
  };
}

function pickWeighted<T>(items: Array<[T, number]>, next: () => number) {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = next() * total;
  for (const [item, weight] of items) {
    cursor -= weight;
    if (cursor <= 0) return item;
  }
  return items[items.length - 1][0];
}

function formatDate(index: number) {
  return new Date(Date.UTC(2026, 3, 1 + (index % 30), 4 + (index % 12), 30)).toISOString();
}

function addressFor(index: number, city: string, weak: boolean) {
  if (weak && index % 2 === 0) return { fullAddress: `Near temple, main road, ${city}`, landmark: "" };
  if (weak) return { fullAddress: `Market side ${city}`, landmark: "" };
  return {
    fullAddress: `House ${18 + (index % 90)}, Block ${String.fromCharCode(65 + (index % 6))}, ${city} Residency, Sector ${1 + (index % 12)}`,
    landmark: index % 5 === 0 ? "" : "Near main market"
  };
}

function contextFor(order: Partial<Order>, contextOrders: Partial<Order>[]) {
  const rtoLike = (item: Partial<Order>) => /rto|return to origin/i.test(item.finalStatus || "");
  const activeLike = (item: Partial<Order>) => !/delivered|rto|cancel/i.test(`${item.finalStatus || ""} ${item.shipmentStatus || ""}`);
  const samePincode = contextOrders.filter((item) => item.pincode === order.pincode);
  const sameCourierPincode = contextOrders.filter((item) => item.pincode === order.pincode && item.courier === order.courier);
  const sameSku = contextOrders.filter((item) => item.sku === order.sku);
  const sameCampaign = contextOrders.filter((item) => item.campaignName === order.campaignName);
  const samePhone = contextOrders.filter((item) => item.phone === order.phone);
  return {
    historicalPincodeRtoRate: samePincode.length ? samePincode.filter(rtoLike).length / samePincode.length : 0,
    pincodeSampleSize: samePincode.length,
    courierPincodeRtoRate: sameCourierPincode.length ? sameCourierPincode.filter(rtoLike).length / sameCourierPincode.length : 0,
    courierPincodeSampleSize: sameCourierPincode.length,
    skuRtoRate: sameSku.length ? sameSku.filter(rtoLike).length / sameSku.length : 0,
    skuSampleSize: sameSku.length,
    campaignRtoRate: sameCampaign.length ? sameCampaign.filter(rtoLike).length / sameCampaign.length : 0,
    campaignSampleSize: sameCampaign.length,
    repeatedPhoneCount: samePhone.filter(activeLike).length,
    customerPreviousRto: samePhone.filter(rtoLike).length,
    phonePreviousCancelledOrRto: samePhone.some(rtoLike)
  };
}

export function generateDemoOrders(options: DemoGeneratorOptions = {}) {
  const profile = demoProfiles[options.profileId || "fashion"];
  const count = Math.max(50, options.orderCount || profile.monthlyOrders);
  const next = random(options.seed || 1729 + count + profile.id.length);
  const codPercent = options.codPercent ?? profile.codPercent;
  const rtoTarget = (options.rtoPercent ?? profile.rtoPercent) / 100;
  const ndrTarget = (options.ndrPercent ?? profile.ndrPercent) / 100;
  const riskyClusterCount = Math.max(1, options.riskyPincodeClusterCount || Math.min(4, profile.topRiskyPincodes.length));
  const riskyPincodes = profile.topRiskyPincodes.slice(0, riskyClusterCount);
  const courierSeverity = options.courierIssueSeverity ?? 1;

  const partials: Partial<Order>[] = Array.from({ length: count }, (_, index) => {
    const riskyCluster = next() < 0.36;
    const location = riskyCluster
      ? pincodeDirectory.find((item) => item.pincode === riskyPincodes[index % riskyPincodes.length]) || pincodeDirectory[index % pincodeDirectory.length]
      : pincodeDirectory[index % pincodeDirectory.length];
    const sku = pickWeighted(profile.skuMix.map((item) => [item, 1 + item.leakageBias * 2]), next);
    const campaign = pickWeighted(profile.campaignMix.map((item) => [item, 1 + Math.max(0, item.leakageBias)]), next);
    const courier = pickWeighted(Object.entries(profile.courierMix), next);
    const paymentMode: Order["paymentMode"] = next() < codPercent / 100 ? "COD" : "Prepaid";
    const weakAddress = riskyCluster && next() < 0.38;
    const issueLane = riskyCluster && ["Xpressbees", "Delhivery", "Ekart"].includes(courier);
    const leakageBias =
      (paymentMode === "COD" ? 0.07 : -0.04) +
      (riskyCluster ? 0.11 : 0) +
      (issueLane ? 0.07 * courierSeverity : 0) +
      sku.leakageBias +
      campaign.leakageBias +
      (weakAddress ? 0.08 : 0);
    const rtoProbability = Math.max(0.02, Math.min(0.62, rtoTarget + leakageBias - 0.08));
    const ndrProbability = Math.max(0.02, Math.min(0.45, ndrTarget + leakageBias * 0.55));
    const roll = next();
    const ndrReason = pickWeighted(Object.entries(profile.ndrReasonMix), next) || ndrReasons[index % ndrReasons.length];
    const isCancelled = paymentMode === "COD" && next() < 0.025;
    const finalStatus = isCancelled ? "Cancelled before shipping" : roll < rtoProbability ? "RTO" : roll < rtoProbability + ndrProbability ? "In NDR" : "Delivered";
    const shipmentStatus = finalStatus === "RTO" ? "RTO" : finalStatus === "In NDR" ? "Undelivered" : finalStatus === "Cancelled before shipping" ? "Cancelled" : "Delivered";
    const orderValue = Math.max(299, Math.round((sku.price + (next() - 0.5) * profile.averageOrderValue * 0.18) / 50) * 50);
    const date = formatDate(index);
    const phoneSuffix = 700000000 + (index % Math.max(180, Math.round(count / 4)));
    const address = addressFor(index, location.city, weakAddress);

    return {
      brandId: defaultBrand.id,
      orderId: `${profile.id.slice(0, 3).toUpperCase()}-${String(24001 + index).padStart(5, "0")}`,
      awb: `${courier.slice(0, 2).toUpperCase()}${987650000 + index}`,
      orderDate: date,
      customerName: names[index % names.length],
      phone: `9${String(phoneSuffix).padStart(9, "0")}`,
      email: `customer${index + 1}@example.com`,
      ...address,
      pincode: location.pincode,
      city: location.city,
      state: location.state,
      sku: sku.sku,
      productName: sku.productName,
      quantity: index % 29 === 0 ? 2 : 1,
      orderValue,
      paymentMode,
      courier,
      sourcePlatform: campaign.source === "WhatsApp" ? "WhatsApp" : campaign.source === "Google" ? "Shopify" : "Instagram",
      campaignName: campaign.name,
      utmSource: campaign.source,
      utmMedium: campaign.source === "WhatsApp" ? "crm" : "paid",
      utmCampaign: campaign.name,
      adId: `${campaign.source.slice(0, 3).toUpperCase()}-${1000 + (index % 80)}`,
      storeId: "store-main",
      sourceStoreName: `${profile.category} D2C Store`,
      grossMargin: Math.round(38 + next() * 20),
      discountAmount: paymentMode === "COD" && next() < 0.2 ? 100 : 0,
      customerType: index % 4 === 0 ? "repeat_delivered" : "first_time",
      firstTimeCustomer: index % 4 !== 0,
      shipmentStatus,
      ndrReason: finalStatus === "RTO" || finalStatus === "In NDR" ? ndrReason : "",
      attemptCount: finalStatus === "RTO" ? 2 + (index % 2) : finalStatus === "In NDR" ? 1 + (index % 2) : 0,
      finalStatus
    };
  });

  return partials.map((order, index) => {
    const scored = scoreOrder(order, { settings: defaultBrand, ...contextFor(order, partials) });
    const now = new Date().toISOString();
    return {
      id: `demo-${profile.id}-${index + 1}`,
      brandId: defaultBrand.id,
      confirmationStatus: "unconfirmed",
      actionStatus: "open",
      rawData: {},
      createdAt: now,
      updatedAt: now,
      ...order,
      quantity: order.quantity || 1,
      orderValue: order.orderValue || profile.averageOrderValue,
      paymentMode: order.paymentMode || "Unknown",
      attemptCount: order.attemptCount || 0,
      riskScore: scored.score,
      riskBucket: scored.bucket,
      riskReasons: scored.reasons,
      addressQualityScore: scored.addressQualityScore,
      addressIssues: scored.addressIssues,
      recommendedAction: /delivered/i.test(order.finalStatus || "") ? "no_action" : scored.recommendedAction,
      recommendedActionReason: /delivered/i.test(order.finalStatus || "") ? "No action needed. This order is already delivered." : scored.recommendedActionReason,
      dataQualityWarnings: order.campaignName ? [] : ["Campaign data missing"],
      confidenceLabel: scored.score >= 70 ? "High" : scored.score >= 45 ? "Medium" : "Low"
    } as Order;
  });
}

function buildDemoSavings(orders: Order[], brand: BrandSettings): SavingsEvent[] {
  const now = new Date().toISOString();
  const cancelled = orders.filter((order) => /cancelled before shipping/i.test(order.finalStatus || "")).slice(0, 18);
  const ndr = orders.filter((order) => /in ndr/i.test(order.finalStatus || "")).slice(0, 22);
  const prepaid = orders.filter((order) => order.paymentMode === "COD" && ["High", "Critical"].includes(order.riskBucket)).slice(0, 16);
  return [
    ...cancelled.map((order, index) => ({
      id: `demo-saving-cancel-${index}`,
      brandId: brand.id,
      orderId: order.id,
      sourceFeature: "actions",
      eventType: "cancelled_before_shipping" as const,
      estimatedSaving: cancelledBeforeShippingSaving(brand),
      status: "estimated" as const,
      confidence: "medium" as const,
      calculation: { formula: "forward_shipping_cost + packaging_cost + estimated_cac" },
      createdAt: now
    })),
    ...ndr.map((order, index) => ({
      id: `demo-saving-ndr-${index}`,
      brandId: brand.id,
      orderId: order.id,
      sourceFeature: "ndr",
      eventType: "ndr_rescued_delivered" as const,
      estimatedSaving: estimatedRtoLossPerOrder(brand),
      status: "estimated" as const,
      confidence: "medium" as const,
      calculation: { formula: "estimated RTO loss avoided" },
      createdAt: now
    })),
    ...prepaid.map((order, index) => ({
      id: `demo-saving-prepaid-${index}`,
      brandId: brand.id,
      orderId: order.id,
      sourceFeature: "prepaid",
      eventType: "cod_converted_prepaid" as const,
      estimatedSaving: codConvertedPrepaidSaving(brand),
      status: "estimated" as const,
      confidence: "medium" as const,
      calculation: { formula: "50% estimated RTO risk reduction" },
      createdAt: now
    }))
  ];
}

export function generateDemoWorkspace(options: DemoGeneratorOptions = {}) {
  const profile = demoProfiles[options.profileId || "fashion"];
  const brand: BrandSettings = {
    ...defaultBrand,
    id: `brand-demo-${profile.id}`,
    name: `${profile.label.replace(" brand", "")} Profit Recovery Demo`,
    category: profile.category,
    softwareCost: 14999,
    monthlyOrderLimit: 5000
  };
  const orders = generateDemoOrders(options).map((order) => ({ ...order, brandId: brand.id }));
  const ndrCases = buildNdrCases(orders, [], brand);
  const savingsEvents = buildDemoSavings(orders, brand);
  const imports: ImportRecord[] = [
    {
      id: `demo-import-${profile.id}`,
      brandId: brand.id,
      filename: `generated-${profile.id}-demo.csv`,
      sourceType: "csv",
      rowCount: orders.length,
      successCount: orders.length,
      errorCount: 0,
      created: orders.length,
      updated: 0,
      missingFields: [],
      dataQualityScore: 100,
      analysisReadiness: [
        { area: "RTO/NDR leakage", status: "ready", reason: "Generated demo data includes order, payment, value, and delivery outcome fields." },
        { area: "Pincode and courier analysis", status: "ready", reason: "Generated demo data includes pincode and courier fields." },
        { area: "SKU leakage", status: "ready", reason: "Generated demo data includes SKU and product fields." },
        { area: "Campaign leakage", status: "ready", reason: "Generated demo data includes campaign fields." },
        { area: "Margin-aware profit", status: "limited", reason: "Generated demo data includes gross margin but not every actual fee field." }
      ],
      createdAt: new Date().toISOString()
    }
  ];
  return { profile, brand, orders, ndrCases, savingsEvents, imports };
}

const csvColumns = [
  "order_id",
  "awb",
  "order_date",
  "customer_name",
  "phone",
  "email",
  "full_address",
  "landmark",
  "pincode",
  "city",
  "state",
  "sku",
  "product_name",
  "quantity",
  "order_value",
  "payment_mode",
  "courier",
  "source_platform",
  "campaign_name",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "ad_id",
  "gross_margin",
  "customer_type",
  "shipment_status",
  "ndr_reason",
  "attempt_count",
  "final_status"
];

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

export function ordersToCsv(orders: Order[]) {
  const rows = orders.map((order) => [
    order.orderId,
    order.awb,
    order.orderDate,
    order.customerName,
    order.phone,
    order.email,
    order.fullAddress,
    order.landmark,
    order.pincode,
    order.city,
    order.state,
    order.sku,
    order.productName,
    order.quantity,
    order.orderValue,
    order.paymentMode,
    order.courier,
    order.sourcePlatform,
    order.campaignName,
    order.utmSource,
    order.utmMedium,
    order.utmCampaign,
    order.adId,
    order.grossMargin,
    order.customerType,
    order.shipmentStatus,
    order.ndrReason,
    order.attemptCount,
    order.finalStatus
  ]);
  return [csvColumns.join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
}
