import { NextRequest, NextResponse } from "next/server";
import { updateCard, deleteCard } from "@/services/cardService";
import type { CardData } from "@/services/cardService";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as Partial<CardData>;
  const updated = await updateCard(id, body);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteCard(id);
  return NextResponse.json({ ok: true });
}
