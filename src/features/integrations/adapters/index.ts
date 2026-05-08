import type { IntegrationAdapter, IntegrationType } from "../types";
import { ShopifyAdapter } from "./shopify.adapter";
import { WooCommerceAdapter } from "./woocommerce.adapter";
import { AmazonAdapter } from "./amazon.adapter";
import { FlipkartAdapter } from "./flipkart.adapter";
import { MeeshoAdapter } from "./meesho.adapter";
import { DelhiveryAdapter } from "./delhivery.adapter";
import { ShiprocketAdapter } from "./shiprocket.adapter";
import { NimbusPostAdapter } from "./nimbuspost.adapter";
import { XpressBeesAdapter } from "./xpressbees.adapter";
import { EcomExpressAdapter } from "./ecomexpress.adapter";
import { BluedartAdapter } from "./bluedart.adapter";

const registry: Record<IntegrationType, IntegrationAdapter> = {
  shopify: new ShopifyAdapter(),
  woocommerce: new WooCommerceAdapter(),
  amazon: new AmazonAdapter(),
  flipkart: new FlipkartAdapter(),
  meesho: new MeeshoAdapter(),
  delhivery: new DelhiveryAdapter(),
  shiprocket: new ShiprocketAdapter(),
  nimbuspost: new NimbusPostAdapter(),
  xpressbees: new XpressBeesAdapter(),
  ecomexpress: new EcomExpressAdapter(),
  bluedart: new BluedartAdapter(),
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
  NimbusPostAdapter,
  XpressBeesAdapter,
  EcomExpressAdapter,
  BluedartAdapter,
};
export { verifyShopifyWebhook } from "./shopify.adapter";
export { verifyWooWebhook } from "./woocommerce.adapter";
