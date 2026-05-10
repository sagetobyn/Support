export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAutomationCapabilityMatrix } from "@/features/automation-capabilities";

export async function GET() {
  return NextResponse.json(getAutomationCapabilityMatrix());
}
