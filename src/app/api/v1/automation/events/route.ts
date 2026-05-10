export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAutomationEvent } from "@/features/automation-runtime";

const automationEventSchema = z.object({
  taskId: z.string().min(1),
  eventType: z.enum(["created", "approved", "executed", "failed", "blocked", "learning_recorded"]),
  actor: z.enum(["system", "seller", "ops", "finance", "cx", "growth"]).optional(),
  status: z.enum([
    "recommended",
    "drafted",
    "awaiting_approval",
    "approved",
    "scheduled",
    "executing",
    "executed",
    "failed",
    "reverted",
    "blocked",
    "manual"
  ]).optional(),
  message: z.string().optional(),
  rawPayload: z.record(z.unknown()).optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = automationEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const result = recordAutomationEvent(parsed.data);
  return NextResponse.json(result, { status: result.accepted ? 201 : 202 });
}
