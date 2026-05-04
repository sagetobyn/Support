import type { BrandSettings, NdrCase, Order } from "@/types/domain";
import { defaultTemplateForStarter, queueMockMessage } from "@/features/messaging";

export function queueMessageForAction(brand: BrandSettings, order: Order, ndrCase?: NdrCase) {
  return queueMockMessage({ brand, order, ndrCase, templateType: defaultTemplateForStarter(order, ndrCase) });
}

