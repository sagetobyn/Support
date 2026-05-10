export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { approveAutomationTask } from "@/features/automation-runtime";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const approved = approveAutomationTask(id);

  if (!approved) {
    return NextResponse.json({ error: "Automation task not found" }, { status: 404 });
  }

  return NextResponse.json(approved);
}
