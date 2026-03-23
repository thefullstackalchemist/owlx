import { NextRequest, NextResponse } from "next/server";
import { listRecurring, createRecurring } from "@/services/recurringService";

export async function GET() {
  const items = await listRecurring();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const item = await createRecurring(data);
  return NextResponse.json(item, { status: 201 });
}
