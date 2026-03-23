import { NextRequest, NextResponse } from "next/server";
import { runRecurring } from "@/services/recurringService";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await runRecurring(id);
  return NextResponse.json(result);
}
