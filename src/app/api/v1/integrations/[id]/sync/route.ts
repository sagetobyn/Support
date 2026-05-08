export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { IntegrationRepository, SOURCE_TYPES, getAdapter, syncIntegration } from "@/features/integrations";
import type { SourceType } from "@/features/integrations";

const integrationRepo = new IntegrationRepository();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  void request;
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = user.user_metadata?.brandId as string | undefined;
  if (!brandId) return NextResponse.json({ error: "Brand context missing" }, { status: 400 });

  const integration = await integrationRepo.getById(brandId, id);
  if (!integration) return NextResponse.json({ error: "Integration not found" }, { status: 404 });

  if (!SOURCE_TYPES.includes(integration.type as SourceType)) {
    return NextResponse.json({ error: `Sync is only supported for order-source integrations, not "${integration.type}"` }, { status: 400 });
  }
  const adapter = getAdapter(integration.type as SourceType);
  const since = integration.lastSyncAt ? new Date(integration.lastSyncAt) : undefined;

  const result = await syncIntegration({ brandId, integrationId: id, adapter, since });

  return NextResponse.json({ result });
}
