export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAutomationInbox } from "@/features/automation-runtime";

export async function GET() {
  return NextResponse.json(getAutomationInbox());
}
