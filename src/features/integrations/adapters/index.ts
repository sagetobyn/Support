import type { IntegrationAdapter, IntegrationType } from "../types";
import { ShopifyAdapter } from "./shopify.adapter";
import { WooCommerceAdapter } from "./woocommerce.adapter";
import { AmazonAdapter } from "./amazon.adapter";
import { FlipkartAdapter } from "./flipkart.adapter";
import { MeeshoAdapter } from "./meesho.adapter";
import { DelhiveryAdapter } from "./delhivery.adapter";
import { ShiprocketAdapter } from "./shiprocket.adapter";

const registry: Record<IntegrationType, IntegrationAdapter> = {
  shopify: new ShopifyAdapter(),
  woocommerce: new WooCommerceAdapter(),
  amazon: new AmazonAdapter(),
  flipkart: new FlipkartAdapter(),
  meesho: new MeeshoAdapter(),
  delhivery: new DelhiveryAdapter(),
  shiprocket: new ShiprocketAdapter(),
};

export function getAdapter(type: IntegrationType): IntegrationAdapter {
  return registry[type];
}

export {
  ShopifyAdapter,
  WooCommerceAdapter,
  AmazonAdapter,
  FlipkartAdapter,
  MeeshoAdapter,
  DelhiveryAdapter,
  ShiprocketAdapter,
};
export { verifyShopifyWebhook } from "./shopify.adapter";
export { verifyWooWebhook } from "./woocommerce.adapter";
