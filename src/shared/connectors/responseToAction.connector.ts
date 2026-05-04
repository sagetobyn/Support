import type { CustomerIntent, Order } from "@/types/domain";
import { nextActionAfterResponse } from "@/features/responses";

export function mapResponseToNextAction(order: Order, intent: CustomerIntent) {
  return nextActionAfterResponse(order, intent);
}

