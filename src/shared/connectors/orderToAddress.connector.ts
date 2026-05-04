import type { Order } from "@/types/domain";
import { checkAddressQuality } from "@/features/address";

export function runOrderToAddress(order: Order) {
  return checkAddressQuality(order);
}
