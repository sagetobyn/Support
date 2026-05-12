import type { BrandSettings, Order, SavingsEvent } from "@/types/domain";
import { scoreOrder } from "@/lib/riskScoring";
import { cancelledBeforeShippingSaving, codConvertedPrepaidSaving, estimatedRtoLossPerOrder } from "@/lib/roi";

export const defaultBrand: BrandSettings = {
  id: "brand-nazrana",
  name: "Nazrana Streetwear",
  category: "Fashion",
  currency: "INR",
  monthlyOrderLimit: 500,
  defaultLanguage: "hinglish",
  forwardShippingCost: 70,
  returnShippingCost: 75,
  packagingCost: 25,
  estimatedCac: 180,
  codFee: 25,
  supportOpsCost: 20,
  grossMarginPercent: 45,
  softwareCost: 2999,
  prepaidOpportunityMinOrderValue: 999,
  prepaidOpportunityHighValueThreshold: 1499,
  prepaidIncentiveFlatAmount: 50,
  prepaidIncentivePercent: 3,
  prepaidMaxIncentive: 150,
  prepaidMarginGuardrailPercent: 10,
  ndrSlaHours: 12,
  ndrCriticalHours: 24,
  highValueNdrThreshold: 1499,
  maxContactAttemptsPerNdr: 3,
  whatsappProviderMode: "mock",
  messageCostMarketing: 0.78,
  messageCostUtility: 0.11,
  messageCostService: 0,
  contactCapPerOrder: 3,
  contactCapPerDayPerCustomer: 2,
  allowCodHoldRecommendations: true,
  allowPrepaidOnlyRecommendations: true,
  allowCourierSwitchRecommendations: true,
  requireHumanApprovalForCriticalActions: true,
  riskThresholdMedium: 31,
  riskThresholdHigh: 61,
  riskThresholdCritical: 81,
  courierPlatforms: ["Shiprocket", "Delhivery", "Xpressbees", "Bluedart", "DTDC", "Ekart", "Shadowfax"],
  whatsappSender: "mock"
};

const cities = [
  ["Ghaziabad", "Uttar Pradesh", "201001"],
  ["Delhi", "Delhi", "110024"],
  ["Bengaluru", "Karnataka", "560095"],
  ["Ahmedabad", "Gujarat", "380015"],
  ["Jaipur", "Rajasthan", "302001"],
  ["Pune", "Maharashtra", "411045"],
  ["Kolkata", "West Bengal", "700016"],
  ["Lucknow", "Uttar Pradesh", "226010"],
  ["Indore", "Madhya Pradesh", "452010"],
  ["Surat", "Gujarat", "395007"]
] as const;

const products = [
  ["TSH-BLK-L", "Oversized Black Tee", 799],
  ["SNEAK-WHT-8", "White Sneakers", 1999],
  ["HOOD-GRN-M", "Green Hoodie", 1299],
  ["DRESS-RED-S", "Red Summer Dress", 2499],
  ["WATCH-BLK", "Smart Fitness Watch", 3999],
  ["KURTI-BLU-M", "Blue Printed Kurti", 1299],
  ["SERUM-VITC", "Vitamin C Serum", 499],
  ["EARBUDS-PRO", "Wireless Earbuds Pro", 1999]
] as const;

const couriers = ["Shiprocket", "Delhivery", "Xpressbees", "Bluedart", "DTDC", "Ekart", "Shadowfax"];
const names = ["Rahul Sharma", "Pooja Verma", "Amit Khan", "Sneha Iyer", "Kiran Patel", "Meena Kumari", "Devansh Rao", "Farhan Ali"];
const ndrReasons = ["Customer not available", "Incorrect address", "No response on phone", "Door locked", "Customer refused delivery", "Cash not ready"];

function statusFor(index: number, paymentMode: "COD" | "Prepaid") {
  if (index % 23 === 0) return { shipmentStatus: "Cancelled", finalStatus: "Cancelled before shipping", ndrReason: "" };
  if (paymentMode === "COD" && index % 5 === 0) return { shipmentStatus: "RTO", finalStatus: "RTO", ndrReason: ndrReasons[index % ndrReasons.length] };
  if (paymentMode === "Prepaid" && index % 13 === 0) return { shipmentStatus: "RTO", finalStatus: "RTO", ndrReason: ndrReasons[index % ndrReasons.length] };
  if (index % 7 === 0 || index % 11 === 0) return { shipmentStatus: "Undelivered", finalStatus: "In NDR", ndrReason: ndrReasons[index % ndrReasons.length] };
  if (index % 6 === 0) return { shipmentStatus: "In Transit", finalStatus: "In Transit", ndrReason: "" };
  return { shipmentStatus: "Delivered", finalStatus: "Delivered", ndrReason: "" };
}

function addressFor(index: number, city: string) {
  if (index % 11 === 0) return { fullAddress: `Near mandir ${city}`, landmark: "" };
  if (index % 13 === 0) return { fullAddress: `Main road only market ${city}`, landmark: "" };
  return {
    fullAddress: `House ${20 + index}, Block ${String.fromCharCode(65 + (index % 5))}, ${city} Residency, Sector ${1 + (index % 9)}`,
    landmark: index % 4 === 0 ? "" : "Near main market"
  };
}

function buildSeedOrders(): Order[] {
  const partials = Array.from({ length: 160 }, (_, index) => {
    const city = cities[index % cities.length];
    const product = products[index % products.length];
    const paymentMode: Order["paymentMode"] = index % 4 === 0 ? "Prepaid" : "COD";
    const status = statusFor(index + 1, paymentMode);
    const address = addressFor(index + 1, city[0]);
    const date = new Date(Date.UTC(2026, 3, 1 + (index % 28), 5, 30)).toISOString();
    return {
      orderId: `NS-${3001 + index}`,
      awb: `${couriers[index % couriers.length].slice(0, 2).toUpperCase()}${987650000 + index}`,
      orderDate: date,
      customerName: names[index % names.length],
      phone: `9${String(800000000 + (index % 95)).padStart(9, "0")}`,
      email: `customer${index + 1}@example.com`,
      ...address,
      pincode: city[2],
      city: city[0],
      state: city[1],
      sku: product[0],
      productName: product[1],
      quantity: index % 19 === 0 ? 2 : 1,
      orderValue: product[2],
      paymentMode,
      courier: couriers[index % couriers.length],
      sourcePlatform: index % 3 === 0 ? "Instagram" : "Shopify",
      campaignName: index % 3 === 0 ? "Meta COD Scale" : "",
      attemptCount: status.ndrReason ? 1 + (index % 2) : 0,
      ...status
    };
  });

  return partials.map((order, index) => {
    const samePincode = partials.filter((item) => item.pincode === order.pincode);
    const pincodeRto = samePincode.filter((item) => /rto/i.test(item.finalStatus)).length / samePincode.length;
    const sameCourierPincode = partials.filter((item) => item.pincode === order.pincode && item.courier === order.courier);
    const courierPincodeRtoRate = sameCourierPincode.filter((item) => /rto/i.test(item.finalStatus)).length / sameCourierPincode.length;
    const samePhone = partials.filter((item) => item.phone === order.phone);
    const scored = scoreOrder(order, {
      settings: defaultBrand,
      historicalPincodeRtoRate: pincodeRto,
      courierPincodeRtoRate,
      repeatedPhoneCount: samePhone.length,
      customerPreviousRto: samePhone.filter((item) => /rto/i.test(item.finalStatus)).length,
      phonePreviousCancelledOrRto: samePhone.some((item) => /rto|cancel/i.test(item.finalStatus))
    });
    const now = new Date().toISOString();
    return {
      id: `order-${index + 1}`,
      brandId: defaultBrand.id,
      confirmationStatus: "unconfirmed",
      rawData: {},
      createdAt: now,
      updatedAt: now,
      ...order,
      riskScore: scored.score,
      riskBucket: scored.bucket,
      riskReasons: scored.reasons,
      addressQualityScore: scored.addressQualityScore,
      addressIssues: scored.addressIssues,
      recommendedAction: scored.recommendedAction,
      recommendedActionReason: scored.recommendedActionReason,
      actionStatus: "open"
    } as Order;
  });
}

export const seedOrders: Order[] = buildSeedOrders();

export const seedSavingsEvents: SavingsEvent[] = [
  ...seedOrders
    .filter((order) => /cancelled before shipping/i.test(order.finalStatus || ""))
    .slice(0, 8)
    .map((order, index) => ({
      id: `saving-cancel-${index}`,
      brandId: defaultBrand.id,
      orderId: order.id,
      eventType: "cancelled_before_shipping" as const,
      estimatedSaving: cancelledBeforeShippingSaving(defaultBrand),
      calculation: { formula: "forward_shipping_cost + packaging_cost + estimated_cac" },
      createdAt: new Date().toISOString()
    })),
  ...seedOrders
    .filter((order) => /in ndr/i.test(order.finalStatus || ""))
    .slice(0, 10)
    .map((order, index) => ({
      id: `saving-ndr-${index}`,
      brandId: defaultBrand.id,
      orderId: order.id,
      eventType: "ndr_rescued_delivered" as const,
      estimatedSaving: estimatedRtoLossPerOrder(defaultBrand),
      calculation: { formula: "forward_shipping_cost + return_shipping_cost + packaging_cost + estimated_cac + cod_fee + support_ops_cost" },
      createdAt: new Date().toISOString()
    })),
  ...seedOrders
    .filter((order) => order.paymentMode === "COD")
    .slice(0, 5)
    .map((order, index) => ({
      id: `saving-prepaid-${index}`,
      brandId: defaultBrand.id,
      orderId: order.id,
      eventType: "cod_converted_prepaid" as const,
      estimatedSaving: codConvertedPrepaidSaving(defaultBrand),
      calculation: { formula: "35% of estimated RTO loss as risk reduction" },
      createdAt: new Date().toISOString()
    }))
];
