import type { BrandSettings, Message, Order, SavingsEvent, Store } from "@/types/domain";
import { totalEstimatedMessagingCost } from "@/lib/messaging";

export function updateSavingEvent(events: SavingsEvent[], id: string, patch: Partial<Pick<SavingsEvent, "estimatedSaving" | "actualSaving" | "status" | "note">>) {
  return events.map((event) => (event.id === id ? { ...event, ...patch } : event));
}

export function calculateSavingsLedger(events: SavingsEvent[], messages: Message[], brand: BrandSettings, orders: Order[] = [], stores: Store[] = []) {
  const estimatedSavings = events.filter((event) => event.status !== "rejected").reduce((sum, event) => sum + event.estimatedSaving, 0);
  const verifiedSavings = events.filter((event) => event.status === "verified").reduce((sum, event) => sum + (event.actualSaving ?? event.estimatedSaving), 0);
  const rejectedSavings = events.filter((event) => event.status === "rejected").reduce((sum, event) => sum + event.estimatedSaving, 0);
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
    savingsByFeature: by((event) => event.sourceFeature || "manual"),
    savingsByEventType: by((event) => event.eventType),
    savingsByStore: by(storeName),
    savingsByWeek: by((event) => new Date(event.createdAt).toISOString().slice(0, 10))
  };
}
