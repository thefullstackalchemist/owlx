import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { getPeriodRange } from "@/services/transactions";

export async function GET(req: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const query: Record<string, unknown> = {};

  const dateFrom = searchParams.get("dateFrom");
  const dateTo   = searchParams.get("dateTo");
  const period   = searchParams.get("period");

  if (dateFrom || dateTo) {
    query.date = {
      ...(dateFrom ? { $gte: new Date(dateFrom) } : {}),
      ...(dateTo   ? { $lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) } : {}),
    };
  } else if (period && period !== "all") {
    const { start, end } = getPeriodRange(period);
    query.date = { $gte: start, $lte: end };
  }

  const category = searchParams.get("category");
  if (category) query.category = category;

  const type = searchParams.get("type");
  if (type) query.type = type;

  const txns = await Transaction.find(query).sort({ date: -1 }).lean();
  return NextResponse.json(txns);
}

export async function POST(req: NextRequest) {
  await connectDB();

  const body = await req.json() as {
    amount: number;
    type: "income" | "expense" | "transfer";
    category: string;
    description: string;
    date: string;
    platform?: string;
  };

  const txn = await Transaction.create({
    date:        new Date(body.date),
    amount:      body.amount,
    type:        body.type,
    category:    body.category,
    description: body.description,
    platform:    body.platform || undefined,
  });

  return NextResponse.json(txn, { status: 201 });
}
