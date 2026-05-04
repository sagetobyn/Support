import type { Order } from "@/types/domain";
import { publishEvent } from "@/shared/events";

export function upsertOrders(existingOrders: Order[], incomingOrders: Order[]) {
  const incomingKeys = new Set(incomingOrders.map((order) => `${order.orderId}|${order.awb || ""}`));
  const retained = existingOrders.filter((order) => !incomingKeys.has(`${order.orderId}|${order.awb || ""}`));
  for (const order of incomingOrders) {
    publishEvent({
      type: existingOrders.some((item) => item.id === order.id) ? "order.updated" : "order.created",
      sourceFeature: "orders",
      entityType: "order",
      entityId: order.id,
      payload: { orderId: order.orderId, awb: order.awb }
    });
  }
  return [...retained, ...incomingOrders];
}

export function countStarterOrders(orders: Order[]) {
  return orders.length;
}

