export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { IntegrationRepository } from "@/features/integrations";
import { z } from "zod";

const integrationRepo = new IntegrationRepository();

const patchSchema = z.object({
  status: z.enum(["active", "paused"]).optional(),
  credentials: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  void request;
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = user.user_metadata?.brandId as string | undefined;
  if (!brandId) return NextResponse.json({ error: "Brand context missing" }, { status: 400 });

  const integration = await integrationRepo.getById(brandId, id);
  if (!integration) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ integration });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = user.user_metadata?.brandId as string | undefined;
  if (!brandId) return NextResponse.json({ error: "Brand context missing" }, { status: 400 });

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.errors }, { status: 400 });
  }

  const integration = await integrationRepo.updateStatus(brandId, id, {
    ...(parsed.data.status && { status: parsed.data.status }),
    ...(parsed.data.credentials && { credentials: parsed.data.credentials as never }),
  });

  return NextResponse.json({ integration });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  void request;
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = user.user_metadata?.brandId as string | undefined;
  if (!brandId) return NextResponse.json({ error: "Brand context missing" }, { status: 400 });

  await integrationRepo.delete(brandId, id);
  return NextResponse.json({ success: true });
}
