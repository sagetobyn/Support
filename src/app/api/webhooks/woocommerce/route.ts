export const dynamic = "force-dynamic";

// Receives WooCommerce webhook events (order.created, order.updated).
// WooCommerce signs with HMAC-SHA256 in X-WC-Webhook-Signature.
// Register in WooCommerce → Settings → Advanced → Webhooks.
// Delivery URL: <this url>?brandId=<brandId>

import { NextResponse } from "next/server";
import { verifyWooWebhook, getAdapter, IntegrationRepository, syncIntegration } from "@/features/integrations";
import type { WooCommerceCredentials } from "@/features/integrations";

const integrationRepo = new IntegrationRepository();

export async function POST(request: Request) {
  const signatureHeader = request.headers.get("x-wc-webhook-signature") ?? "";
  const body = await request.text();

  const url = new URL(request.url);
  const brandId = url.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required in webhook URL" }, { status: 400 });

  const integrations = await integrationRepo.listByBrand(brandId);
  const wooIntegration = integrations.find((i) => i.type === "woocommerce");
  if (!wooIntegration) return NextResponse.json({ error: "No WooCommerce integration found" }, { status: 404 });

  const credentials = await integrationRepo.getCredentials(brandId, wooIntegration.id) as WooCommerceCredentials | null;
  if (credentials?.webhookSecret) {
    const valid = await verifyWooWebhook(body, signatureHeader, credentials.webhookSecret);
    if (!valid) return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const adapter = getAdapter("woocommerce");
  await syncIntegration({ brandId, integrationId: wooIntegration.id, adapter });

  return NextResponse.json({ received: true });
}
