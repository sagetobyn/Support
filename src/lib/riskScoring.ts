import type { BrandSettings, Order, RecommendedAction, RiskBucket } from "@/types/domain";
import { checkAddressQuality } from "@/lib/addressQuality";
import { normalizeNdrReason } from "@/lib/ndr";

export interface RiskScoringContext {
  settings: BrandSettings;
  historicalPincodeRtoRate?: number;
  datasetAverageRtoRate?: number;
  pincodeSampleSize?: number;
  courierRtoRate?: number;
  courierSampleSize?: number;
  customerPreviousRto?: number;
  courierPincodeRtoRate?: number;
  courierPincodeSampleSize?: number;
  skuRtoRate?: number;
  skuSampleSize?: number;
  campaignRtoRate?: number;
  campaignSampleSize?: number;
  repeatedPhoneCount?: number;
  phonePreviousCancelledOrRto?: boolean;
}

export interface RiskScoreResult {
  score: number;
  bucket: RiskBucket;
  reasons: string[];
  recommendedAction: RecommendedAction;
  recommendedActionReason: string;
  addressQualityScore: number;
  addressIssues: string[];
  dataQualityWarnings: string[];
  expectedLeakageEstimate: number;
}

export function bucketForScore(score: number): RiskBucket {
  if (score <= 30) return "Low";
  if (score <= 60) return "Medium";
  if (score <= 80) return "High";
  return "Critical";
}

export function actionForBucket(bucket: RiskBucket, addressIssues: string[]): { action: RecommendedAction; reason: string } {
  if (bucket === "Low") return { action: "ship_normally", reason: "Low-risk order can move without extra friction." };
  if (bucket === "Medium") return { action: "send_cod_confirmation", reason: "Medium-risk COD order should be confirmed on WhatsApp before dispatch." };
  if (bucket === "High" && addressIssues.length) {
    return { action: "request_address_update", reason: "High-risk order has address issues that should be fixed before shipping." };
  }
  if (bucket === "High") return { action: "send_cod_confirmation", reason: "High-risk order needs explicit customer confirmation before dispatch." };
  return { action: "hold_order", reason: "Critical-risk order should be held until customer intent and address are verified." };
}

export function scoreOrder(order: Partial<Order>, context: RiskScoringContext): RiskScoreResult {
  let score = 0;
  const reasons: string[] = [];
  const address = checkAddressQuality(order);
  const dataQualityWarnings = [
    !order.phone ? "missing phone" : "",
    !order.pincode ? "missing pincode" : "",
    !order.orderValue ? "missing order value" : "",
    order.paymentMode === "Unknown" ? "missing payment mode" : "",
    !order.courier ? "missing courier" : "",
    !order.finalStatus ? "missing final status" : ""
  ].filter(Boolean);
  const finalStatus = (order.finalStatus || "").toLowerCase();
  const shipmentStatus = (order.shipmentStatus || "").toLowerCase();

  if (/delivered/.test(finalStatus)) {
    return {
      score: 0,
      bucket: "Low",
      reasons: ["Delivered order has no pending risk action"],
      recommendedAction: "no_action",
      recommendedActionReason: "Order is delivered, so no RTO rescue action is needed.",
      addressQualityScore: address.score,
      addressIssues: address.issues,
      dataQualityWarnings,
      expectedLeakageEstimate: 0
    };
  }

  if (/rto|return to origin/.test(finalStatus)) {
    return {
      score: 100,
      bucket: "Critical",
      reasons: ["RTO order has confirmed loss"],
      recommendedAction: "rto_loss_recorded",
      recommendedActionReason: "Order is already RTO and should be reflected in leakage and savings reporting.",
      addressQualityScore: address.score,
      addressIssues: address.issues,
      dataQualityWarnings,
      expectedLeakageEstimate: context.settings.forwardShippingCost + context.settings.returnShippingCost + context.settings.packagingCost + context.settings.estimatedCac + context.settings.codFee + (context.settings.supportOpsCost || 0)
    };
  }

  if (order.paymentMode === "COD") {
    score += 25;
    reasons.push("COD order (+25)");
  }

  if (order.paymentMode === "COD" && !order.phone) {
    score += 10;
    reasons.push("Phone missing for COD (+10)");
  }

  const fullAddress = [order.fullAddress, order.addressLine1, order.addressLine2].filter(Boolean).join(" ").trim();
  if (!fullAddress) {
    score += 20;
    reasons.push("Missing address (+20)");
  } else if (fullAddress.length < 35) {
    score += 15;
    reasons.push("Address length below 35 characters (+15)");
  }

  if (!order.landmark) {
    score += 10;
    reasons.push("Missing landmark (+10)");
  }

  if (!order.pincode || !/^[1-9]\d{5}$/.test(order.pincode)) {
    score += 15;
    reasons.push("Invalid pincode (+15)");
  }

  const pincodeRto = context.historicalPincodeRtoRate || 0;
  if (pincodeRto > 0.3) {
    score += 20;
    reasons.push("Pincode RTO rate above 30% (+20)");
  } else if (context.datasetAverageRtoRate !== undefined && pincodeRto > context.datasetAverageRtoRate) {
    score += 10;
    reasons.push("Pincode RTO rate above dataset average (+10)");
  }

  if ((context.customerPreviousRto || 0) > 0) {
    score += 25;
    reasons.push("Customer has previous RTO (+25)");
  }

  if (order.paymentMode === "COD" && (order.orderValue || 0) >= 3999) {
    score += 20;
    reasons.push("COD order value above ₹3,999 (+20)");
  } else if (order.paymentMode === "COD" && (order.orderValue || 0) >= 2499) {
    score += 15;
    reasons.push("COD order value above ₹2,499 (+15)");
  } else if (order.paymentMode === "COD" && (order.orderValue || 0) >= 1499) {
    score += 10;
    reasons.push("COD order value above ₹1,499 (+10)");
  } else if (order.paymentMode === "COD" && (order.orderValue || 0) >= 999) {
    score += 5;
    reasons.push("COD order value above ₹999 (+5)");
  }

  const courierRto = context.courierPincodeRtoRate || 0;
  if ((context.courierSampleSize || 0) && (context.courierRtoRate || 0) > 0.25) {
    score += 15;
    reasons.push("Courier RTO rate above 25% (+15)");
  } else if (context.datasetAverageRtoRate !== undefined && (context.courierRtoRate || 0) > context.datasetAverageRtoRate + 0.1) {
    score += 10;
    reasons.push("Courier RTO rate above dataset average by 10 points (+10)");
  }

  if (courierRto > 0.3 && (context.courierPincodeSampleSize || 0) >= 10) {
    score += 20;
    reasons.push("Courier+pincode RTO above 30% with sample >= 10 (+20)");
  } else if (courierRto > 0.3) {
    score += 8;
    reasons.push("Courier+pincode RTO above 30% but low sample (+8)");
  }

  if ((context.skuRtoRate || 0) > 0.35 && (context.skuSampleSize || 0) >= 10) {
    score += 20;
    reasons.push("SKU RTO rate above 35% (+20)");
  } else if ((context.skuRtoRate || 0) > 0.25 && (context.skuSampleSize || 0) >= 10) {
    score += 15;
    reasons.push("SKU RTO rate above 25% (+15)");
  } else if ((context.skuSampleSize || 0) > 0 && (context.skuSampleSize || 0) < 10) {
    dataQualityWarnings.push("SKU has low sample size");
  }

  if ((context.repeatedPhoneCount || 0) > 1) {
    score += 15;
    reasons.push("Same phone has multiple recent orders (+15)");
  }

  if ((context.campaignRtoRate || 0) > 0.3 && (context.campaignSampleSize || 0) >= 20) {
    score += 15;
    reasons.push("Campaign RTO above 30% (+15)");
  }

  if (context.phonePreviousCancelledOrRto) {
    score += 25;
    reasons.push("Same phone has previous cancelled/RTO order (+25)");
  }

  if (order.ndrReason || /ndr|undelivered|failed|exception/.test(shipmentStatus) || /in ndr/.test(finalStatus)) {
    const ndr = normalizeNdrReason(order.ndrReason || order.shipmentStatus || order.finalStatus);
    const ndrPoints: Record<string, number> = {
      customer_refused: 25,
      wrong_address: 20,
      customer_unavailable: 10,
      phone_unreachable: 15,
      payment_issue: 10,
      door_locked: 10
    };
    const points = ndrPoints[ndr.normalizedReason] || 8;
    score += points;
    reasons.push(`NDR reason ${ndr.normalizedReason} (+${points})`);
  }

  if ((order.attemptCount || 0) >= 3) {
    score += 20;
    reasons.push("Attempt count >= 3 (+20)");
  } else if ((order.attemptCount || 0) >= 2) {
    score += 10;
    reasons.push("Attempt count >= 2 (+10)");
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const bucket = bucketForScore(finalScore);
  let action = actionForBucket(bucket, address.issues);
  if (order.paymentMode === "COD" && ["High", "Critical"].includes(bucket) && (order.orderValue || 0) >= (context.settings.prepaidOpportunityHighValueThreshold || 1499)) {
    action = { action: "convert_to_prepaid", reason: "High-risk, high-value COD order should receive a prepaid incentive offer." };
  }
  if (bucket === "Critical" && order.paymentMode === "COD") {
    action = { action: "hold_order", reason: "Critical-risk COD order should be held until customer intent and address are verified." };
  }
  if (order.ndrReason || /ndr|undelivered|failed|exception/.test(shipmentStatus) || /in ndr/.test(finalStatus)) {
    const ndr = normalizeNdrReason(order.ndrReason || order.shipmentStatus || order.finalStatus);
    if (ndr.normalizedReason === "wrong_address") {
      action = { action: "request_address_update", reason: "NDR reason is wrong address, so collect corrected address before reattempt." };
    } else if (ndr.normalizedReason === "customer_unavailable" || ndr.normalizedReason === "door_locked") {
      action = { action: "request_reattempt", reason: "Customer was unavailable, so request a reattempt slot." };
    } else if (ndr.normalizedReason === "customer_refused") {
      action = { action: "call_customer", reason: "Customer refused delivery, so call before cancelling or reattempting." };
    } else if (ndr.normalizedReason === "phone_unreachable") {
      action = { action: "call_customer", reason: "Courier could not reach customer, so call or collect alternate phone." };
    } else {
      action = { action: ndr.recommendedAction, reason: ndr.recommendedMessage };
    }
  }

  const lossPerRto = context.settings.forwardShippingCost + context.settings.returnShippingCost + context.settings.packagingCost + context.settings.estimatedCac + context.settings.codFee + (context.settings.supportOpsCost || 0);
  return {
    score: finalScore,
    bucket,
    reasons: reasons.length ? reasons : ["No major risk signals"],
    recommendedAction: action.action,
    recommendedActionReason: action.reason,
    addressQualityScore: address.score,
    addressIssues: address.issues,
    dataQualityWarnings,
    expectedLeakageEstimate: Math.round(lossPerRto * (finalScore / 100) * (order.paymentMode === "COD" ? 1 : 0.65))
  };
}
