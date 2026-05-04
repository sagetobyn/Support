import type { NdrCase, Order } from "@/types/domain";
import { isPrepaidConversionCandidate } from "@/lib/profitRecovery";

export const actionableGroupLabels = [
  "Confirm risky COD",
  "Fix weak address",
  "Push prepaid offer",
  "Hold high-risk order",
  "Rescue NDR",
  "Request reattempt",
  "Call customer",
  "Mark RTO / cancel",
  "Review courier issue"
] as const;

export function isDeliveredNoAction(order: Pick<Order, "finalStatus" | "recommendedAction">) {
  return /delivered/i.test(order.finalStatus || "") && order.recommendedAction === "no_action";
}

export function isRtoFinal(order: Pick<Order, "finalStatus">) {
  return /rto|return to origin/i.test(order.finalStatus || "");
}

export function isNdrOrder(order: Pick<Order, "shipmentStatus" | "ndrReason" | "finalStatus">) {
  return Boolean(
    order.ndrReason ||
      /ndr|undelivered|failed|exception/i.test(order.shipmentStatus || "") ||
      /in[_\s-]?ndr/i.test(order.finalStatus || "")
  );
}

export function buildActionGroups(orders: Order[], ndrCases: NdrCase[]) {
  const groups: Record<(typeof actionableGroupLabels)[number], Order[]> = {
    "Confirm risky COD": [],
    "Fix weak address": [],
    "Push prepaid offer": [],
    "Hold high-risk order": [],
    "Rescue NDR": [],
    "Request reattempt": [],
    "Call customer": [],
    "Mark RTO / cancel": [],
    "Review courier issue": []
  };

  for (const order of orders.filter((item) => item.actionStatus !== "done")) {
    if (isDeliveredNoAction(order)) continue;
    if (isRtoFinal(order) && !["mark_rto", "rto_loss_recorded", "escalate_to_ops"].includes(order.recommendedAction)) continue;

    const ndr = ndrCases.find((item) => item.orderId === order.id);
    if (ndr) {
      if (ndr.state === "reattempt_requested" || order.recommendedAction === "request_reattempt") groups["Request reattempt"].push(order);
      else if (order.recommendedAction === "call_customer") groups["Call customer"].push(order);
      else if (["mark_rto", "mark_cancelled", "rto_loss_recorded"].includes(order.recommendedAction)) groups["Mark RTO / cancel"].push(order);
      else if (["courier_fake_attempt", "out_of_delivery_area"].includes(ndr.ndrReasonNormalized)) groups["Review courier issue"].push(order);
      else groups["Rescue NDR"].push(order);
      continue;
    }

    if (isPrepaidConversionCandidate(order)) groups["Push prepaid offer"].push(order);
    if (order.recommendedAction === "send_cod_confirmation") groups["Confirm risky COD"].push(order);
    else if (order.recommendedAction === "request_address_update" || order.addressIssues.length) groups["Fix weak address"].push(order);
    else if (order.recommendedAction === "hold_order") groups["Hold high-risk order"].push(order);
    else if (order.recommendedAction === "call_customer") groups["Call customer"].push(order);
    else if (order.recommendedAction === "mark_rto" || order.recommendedAction === "mark_cancelled" || order.recommendedAction === "rto_loss_recorded") groups["Mark RTO / cancel"].push(order);
    else if (order.recommendedAction !== "ship_normally" && order.recommendedAction !== "no_action") groups["Review courier issue"].push(order);
  }

  return groups;
}
