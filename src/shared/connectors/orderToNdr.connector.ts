import type { NdrCase, Order } from "@/types/domain";
import { detectNdrCases } from "@/features/ndr";

export function detectNdrFromOrders(orders: Order[], existingCases: NdrCase[] = []) {
  return detectNdrCases(orders, existingCases);
}

