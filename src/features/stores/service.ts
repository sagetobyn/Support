import type { Order, Store, StorePlatform } from "@/types/domain";
import { publishEvent } from "@/shared/events";

export const proStoreLimit = 3;
export const proStoreLimitMessage = "Pro includes up to 3 stores. Multi-brand and larger store portfolios are available in Scale.";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function createMainStore(brandId: string, storeName = "Main store"): Store {
  const now = new Date().toISOString();
  return { id: id("store"), brandId, storeName, platform: "Manual CSV", defaultCurrency: "INR", active: true, createdAt: now, updatedAt: now };
}

export function addStore(stores: Store[], input: { brandId: string; storeName: string; platform?: StorePlatform; url?: string }) {
  if (stores.filter((store) => store.active).length >= proStoreLimit) return { stores, warning: proStoreLimitMessage };
  const now = new Date().toISOString();
  const store: Store = { id: id("store"), brandId: input.brandId, storeName: input.storeName, platform: input.platform || "Manual CSV", url: input.url, defaultCurrency: "INR", active: true, createdAt: now, updatedAt: now };
  publishEvent({ type: "store.created", sourceFeature: "stores", entityType: "store", entityId: store.id, payload: { storeName: store.storeName } });
  return { stores: [store, ...stores], store };
}

export function updateStore(stores: Store[], storeId: string, patch: Partial<Omit<Store, "id" | "brandId" | "createdAt">>) {
  const next = stores.map((store) => (store.id === storeId ? { ...store, ...patch, updatedAt: new Date().toISOString() } : store));
  publishEvent({ type: "store.updated", sourceFeature: "stores", entityType: "store", entityId: storeId, payload: patch });
  return next;
}

export function deactivateStore(stores: Store[], storeId: string) {
  return updateStore(stores, storeId, { active: false });
}

export function filterOrdersByStore(orders: Order[], storeId?: string) {
  if (!storeId || storeId === "all") return orders;
  return orders.filter((order) => order.storeId === storeId);
}
