import type { BrandSettings, Message, Order, SavingsEvent } from "@/types/domain";
import { totalEstimatedMessagingCost } from "@/lib/messaging";

export interface RoiSummary {
  totalOrders: number;
  codOrders: number;
  prepaidOrders: number;
  totalRto: number;
  rtoRate: number;
  codRtoRate: number;
  ndrCases: number;
  ndrsContacted: number;
  ndrsResponded: number;
  ndrsRescued: number;
  deliveredAfterNdr: number;
  cancelledBeforeShipping: number;
  addressCorrected: number;
  convertedToPrepaid: number;
  estimatedRtoLoss: number;
  estimatedSavings: number;
  softwareCost: number;
  estimatedMessagingCost: number;
  netBenefit: number;
  savingsOpportunity10: number;
  savingsOpportunity20: number;
  savingsOpportunity30: number;
  lowSampleSize: boolean;
}

export function estimatedRtoLossPerOrder(settings: BrandSettings) {
  return settings.forwardShippingCost + settings.returnShippingCost + settings.packagingCost + settings.estimatedCac + settings.codFee + (settings.supportOpsCost || 0);
}

export function cancelledBeforeShippingSaving(settings: BrandSettings) {
  return settings.forwardShippingCost + settings.packagingCost + settings.estimatedCac;
}

export function ndrRescuedDeliveredSaving(settings: BrandSettings) {
  return estimatedRtoLossPerOrder(settings);
}

export function addressCorrectedDeliveredSaving(settings: BrandSettings) {
  return estimatedRtoLossPerOrder(settings);
}

export function codConvertedPrepaidSaving(settings: BrandSettings) {
  return Math.round(estimatedRtoLossPerOrder(settings) * 0.5);
}

export function calculateRoi(orders: Order[], savingsEvents: SavingsEvent[], settings: BrandSettings, messages: Message[] = []): RoiSummary {
  const codOrders = orders.filter((order) => order.paymentMode === "COD");
  const rtoOrders = orders.filter((order) => /rto|return to origin/i.test(order.finalStatus || ""));
  const codRto = codOrders.filter((order) => /rto|return to origin/i.test(order.finalStatus || ""));
  const ndrOrders = orders.filter((order) => order.ndrReason || /ndr|undelivered|failed/i.test(order.shipmentStatus || ""));

  const estimatedRtoLoss = rtoOrders.length * estimatedRtoLossPerOrder(settings);
  const estimatedSavings = savingsEvents.filter((event) => event.eventType !== "rto_loss_recorded").reduce((sum, event) => sum + event.estimatedSaving, 0);
  const estimatedMessagingCost = totalEstimatedMessagingCost(messages);
  const monthlyOpportunityBase = Math.max(estimatedRtoLoss, orders.length * estimatedRtoLossPerOrder(settings) * 0.18);

  return {
    totalOrders: orders.length,
    codOrders: codOrders.length,
    prepaidOrders: orders.filter((order) => order.paymentMode === "Prepaid").length,
    totalRto: rtoOrders.length,
    rtoRate: orders.length ? rtoOrders.length / orders.length : 0,
    codRtoRate: codOrders.length ? codRto.length / codOrders.length : 0,
    ndrCases: ndrOrders.length,
    ndrsContacted: savingsEvents.filter((event) => event.eventType === "ndr_rescued_delivered").length,
    ndrsResponded: orders.filter((order) => order.customerResponseStatus === "responded").length,
    ndrsRescued: savingsEvents.filter((event) => event.eventType === "ndr_rescued_delivered").length,
    deliveredAfterNdr: orders.filter((order) => /delivered/i.test(order.finalStatus || "") && order.ndrReason).length,
    cancelledBeforeShipping: savingsEvents.filter((event) => event.eventType === "cancelled_before_shipping").length,
    addressCorrected: savingsEvents.filter((event) => event.eventType === "address_corrected_delivered").length,
    convertedToPrepaid: savingsEvents.filter((event) => event.eventType === "cod_converted_prepaid").length,
    estimatedRtoLoss,
    estimatedSavings,
    softwareCost: settings.softwareCost,
    estimatedMessagingCost,
    netBenefit: estimatedSavings - settings.softwareCost - estimatedMessagingCost,
    savingsOpportunity10: monthlyOpportunityBase * 0.1,
    savingsOpportunity20: monthlyOpportunityBase * 0.2,
    savingsOpportunity30: monthlyOpportunityBase * 0.3,
    lowSampleSize: orders.length < 50
  };
}
