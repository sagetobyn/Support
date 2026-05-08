import type { IntegrationAdapter, IntegrationType } from "../types";
import { ShopifyAdapter } from "./shopify.adapter";
import { WooCommerceAdapter } from "./woocommerce.adapter";
import { DelhiveryAdapter } from "./delhivery.adapter";
import { ShiprocketAdapter } from "./shiprocket.adapter";

const registry: Record<IntegrationType, IntegrationAdapter> = {
  shopify: new ShopifyAdapter(),
  woocommerce: new WooCommerceAdapter(),
  delhivery: new DelhiveryAdapter(),
  shiprocket: new ShiprocketAdapter(),
};

export function getAdapter(type: IntegrationType): IntegrationAdapter {
  return registry[type];
}

export { ShopifyAdapter, WooCommerceAdapter, DelhiveryAdapter, ShiprocketAdapter };
export { verifyShopifyWebhook } from "./shopify.adapter";
export { verifyWooWebhook } from "./woocommerce.adapter";
