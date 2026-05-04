import type { BrandSettings } from "@/types/domain";
import { publishEvent } from "@/shared/events";

export function updateBrandSettings(current: BrandSettings, patch: Partial<BrandSettings>) {
  const updated = { ...current, ...patch };
  publishEvent({
    type: "brand.updated",
    sourceFeature: "brand",
    entityType: "brand",
    entityId: updated.id,
    payload: { changedFields: Object.keys(patch), brand: updated }
  });
  return updated;
}

export function starterMultiBrandMessage() {
  return "Multi-brand support is available in Pro.";
}

