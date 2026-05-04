import type { BrandSettings, Order } from "@/types/domain";
import { createPrepaidOpportunity } from "@/features/prepaid";

export function runOrderToPrepaid(order: Order, brand: BrandSettings) {
  return createPrepaidOpportunity(order, brand);
}
