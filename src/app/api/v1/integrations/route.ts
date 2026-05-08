export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { IntegrationRepository } from "@/features/integrations";
import { z } from "zod";

const integrationRepo = new IntegrationRepository();

const createSchema = z.object({
  type: z.enum(["shopify", "woocommerce", "amazon", "flipkart", "meesho", "delhivery", "shiprocket", "nimbuspost", "xpressbees", "ecomexpress", "bluedart"]),
  label: z.string().optional(),
  credentials: z.record(z.string(), z.unknown()),
});

export async function GET(request: Request) {
  void request;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = user.user_metadata?.brandId as string | undefined;
  if (!brandId) return NextResponse.json({ error: "Brand context missing" }, { status: 400 });

  const integrations = await integrationRepo.listByBrand(brandId);
  return NextResponse.json({ integrations });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = user.user_metadata?.brandId as string | undefined;
  if (!brandId) return NextResponse.json({ error: "Brand context missing" }, { status: 400 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.errors }, { status: 400 });
  }

  const integration = await integrationRepo.create(brandId, {
    type: parsed.data.type,
    label: parsed.data.label,
    credentials: parsed.data.credentials as never,
  });

  return NextResponse.json({ integration }, { status: 201 });
}
