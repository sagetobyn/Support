export const dynamic = "force-dynamic";

// Receives Shiprocket NDR webhook events.
// Shiprocket sends POST with JSON payload containing AWB, status, and NDR reason.
// Configure in Shiprocket Settings → Webhooks → NDR Alerts.
// Delivery URL: <this url>?brandId=<brandId>

import { NextResponse } from "next/server";
import { IntegrationRepository, getAdapter, syncIntegration } from "@/features/integrations";

const integrationRepo = new IntegrationRepository();

export async function POST(request: Request) {
  const url = new URL(request.url);
  const brandId = url.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required in webhook URL" }, { status: 400 });

  // Shiprocket doesn't sign NDR webhooks with HMAC in the standard plan.
  // On receipt, trigger a full sync so we pull the latest NDR list with context.
  const integrations = await integrationRepo.listByBrand(brandId);
  const srIntegration = integrations.find((i) => i.type === "shiprocket");
  if (!srIntegration) return NextResponse.json({ error: "No Shiprocket integration found" }, { status: 404 });

  const adapter = getAdapter("shiprocket");
  const result = await syncIntegration({ brandId, integrationId: srIntegration.id, adapter });

  return NextResponse.json({ received: true, ingested: result.ordersIngested });
}
