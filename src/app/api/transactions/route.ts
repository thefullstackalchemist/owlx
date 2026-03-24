import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Account } from "@/models/Account";
import { getPeriodRange } from "@/services/transactions";

/** Returns the balance delta for an account given a transaction type */
function balanceDelta(type: string, amount: number): number {
  if (type === "income")  return +amount;
  if (type === "expense") return -amount;
  return 0; // transfer — direction unclear without two accounts
}

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

  const accountId = searchParams.get("accountId");
  if (accountId) query.accountId = accountId;

  const txns = await Transaction.find(query)
    .sort({ date: -1 })
    .populate("accountId", "name bank type lastFour isCredit color")
    .lean();
  return NextResponse.json(txns);
}

export async function POST(req: NextRequest) {
  await connectDB();

  const body = await req.json() as {
    amount:          number;
    type:            "income" | "expense" | "transfer";
    category:        string;
    description:     string;
    date:            string;
    platform?:       string;
    accountId?:      string;
    needsRepayment?: boolean;
  };

  const txn = await Transaction.create({
    date:           new Date(body.date),
    amount:         body.amount,
    type:           body.type,
    category:       body.category,
    description:    body.description,
    platform:       body.platform       || undefined,
    accountId:      body.accountId      || undefined,
    needsRepayment: body.needsRepayment ?? false,
  });

  // Update account balance if a source account was specified
  if (body.accountId) {
    const delta = balanceDelta(body.type, body.amount);
    if (delta !== 0) {
      await Account.findByIdAndUpdate(body.accountId, { $inc: { balance: delta } });
    }
  }

  return NextResponse.json(txn, { status: 201 });
}
