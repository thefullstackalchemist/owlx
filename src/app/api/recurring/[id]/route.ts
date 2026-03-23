import { NextRequest, NextResponse } from "next/server";
import { updateRecurring, deleteRecurring } from "@/services/recurringService";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const item = await updateRecurring(id, data);
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteRecurring(id);
  return NextResponse.json({ ok: true });
}
