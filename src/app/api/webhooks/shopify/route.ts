export const dynamic = "force-dynamic";

// Receives Shopify webhook events (orders/create, orders/updated, fulfillments/create).
// Shopify sends HMAC-SHA256 in X-Shopify-Hmac-Sha256.
// Register this URL in the Shopify Partner Dashboard or via API:
//   POST /admin/api/2024-10/webhooks.json
//   { webhook: { topic: "orders/create", address: "<this url>", format: "json" } }

import { NextResponse } from "next/server";
import { verifyShopifyWebhook, getAdapter, IntegrationRepository, syncIntegration } from "@/features/integrations";
import type { ShopifyCredentials } from "@/features/integrations";

const integrationRepo = new IntegrationRepository();

export async function POST(request: Request) {
  const shopDomain = request.headers.get("x-shopify-shop-domain") ?? "";
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256") ?? "";
  const body = await request.text();

  // Find the integration whose shopUrl matches the incoming domain
  // We search across all integrations — in production scope this by a brand lookup if you have multi-tenant domains
  // For now we use a simple query: find integrations of type=shopify (requires a custom query or a cache)
  // Simplified: derive brandId from a query param ?brandId= (seller registers webhook with their brandId appended)
  const url = new URL(request.url);
  const brandId = url.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required in webhook URL" }, { status: 400 });

  const integrations = await integrationRepo.listByBrand(brandId);
  const shopifyIntegration = integrations.find((i) => i.type === "shopify");
  if (!shopifyIntegration) return NextResponse.json({ error: "No Shopify integration found" }, { status: 404 });

  const credentials = await integrationRepo.getCredentials(brandId, shopifyIntegration.id) as ShopifyCredentials | null;
  if (!credentials?.webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
  }

  const valid = await verifyShopifyWebhook(body, hmacHeader, credentials.webhookSecret);
  if (!valid) {
    // Verify the domain also matches as a secondary check
    if (shopDomain && !shopDomain.includes(credentials.shopUrl)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
  }

  const adapter = getAdapter("shopify");
  await syncIntegration({ brandId, integrationId: shopifyIntegration.id, adapter });

  return NextResponse.json({ received: true });
}
