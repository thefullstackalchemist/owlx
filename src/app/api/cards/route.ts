import { NextRequest, NextResponse } from "next/server";
import { listCards, createCard } from "@/services/cardService";
import type { CardData } from "@/services/cardService";

export async function GET() {
  const cards = await listCards();
  return NextResponse.json(cards);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CardData;
    const card = await createCard(body);
    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    console.error("[cards POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
