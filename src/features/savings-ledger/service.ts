import type { BrandSettings, Message, Order, SavingsEvent, Store } from "@/types/domain";
import { totalEstimatedMessagingCost } from "@/lib/messaging";

export function updateSavingEvent(events: SavingsEvent[], id: string, patch: Partial<Pick<SavingsEvent, "estimatedSaving" | "actualSaving" | "status" | "note">>) {
  return events.map((event) => (event.id === id ? { ...event, ...patch } : event));
}

export function savingsProofStatus(event: SavingsEvent) {
  if (event.status === "verified") {
    return {
      label: "Verified",
      tone: "success" as const,
      detail: "Use this in founder and finance reviews."
    };
  }
  if (event.status === "rejected") {
    return {
      label: "Rejected",
      tone: "danger" as const,
      detail: "Excluded from savings proof."
    };
  }
  if (event.status === "adjusted") {
    return {
      label: "Adjusted",
      tone: "warning" as const,
      detail: "Reviewed, but confirm the final amount."
    };
  }
  return {
    label: "Estimated",
    tone: "neutral" as const,
    detail: "Directional until verified against outcome evidence."
  };
}

export function calculateSavingsLedger(events: SavingsEvent[], messages: Message[], brand: BrandSettings, orders: Order[] = [], stores: Store[] = []) {
  const estimatedSavings = events.filter((event) => event.status !== "rejected").reduce((sum, event) => sum + event.estimatedSaving, 0);
  const verifiedSavings = events.filter((event) => event.status === "verified").reduce((sum, event) => sum + (event.actualSaving ?? event.estimatedSaving), 0);
  const rejectedSavings = events.filter((event) => event.status === "rejected").reduce((sum, event) => sum + event.estimatedSaving, 0);
  const estimatedEventCount = events.filter((event) => !event.status || event.status === "estimated").length;
  const verifiedEventCount = events.filter((event) => event.status === "verified").length;
  const rejectedEventCount = events.filter((event) => event.status === "rejected").length;
  const proofRate = events.length ? Math.round((verifiedEventCount / events.length) * 100) : 0;
  const messagingCost = totalEstimatedMessagingCost(messages);
  const softwareCost = brand.softwareCost;
  const by = (key: (event: SavingsEvent) => string) =>
    events.reduce<Record<string, number>>((acc, event) => {
      const bucket = key(event);
      acc[bucket] = (acc[bucket] || 0) + event.estimatedSaving;
      return acc;
    }, {});
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const storeName = (event: SavingsEvent) => {
    const order = event.orderId ? orderById.get(event.orderId) : undefined;
    return stores.find((store) => store.id === order?.storeId)?.storeName || order?.sourceStoreName || "Main store";
  };
  return {
    estimatedSavings,
    verifiedSavings,
    rejectedSavings,
    messagingCost,
    softwareCost,
    netEstimatedBenefit: estimatedSavings - messagingCost - softwareCost,
    netVerifiedBenefit: verifiedSavings - messagingCost - softwareCost,
    estimatedEventCount,
    verifiedEventCount,
    rejectedEventCount,
    proofRate,
    savingsByFeature: by((event) => event.sourceFeature || "manual"),
    savingsByEventType: by((event) => event.eventType),
    savingsByStore: by(storeName),
    savingsByWeek: by((event) => new Date(event.createdAt).toISOString().slice(0, 10))
  };
}
