import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Account } from "@/models/Account";
import { Card } from "@/models/Card";
import { Wallet } from "@/models/Wallet";
import { getPeriodRange } from "@/services/transactions";

/** Returns the balance delta for an account given a transaction type */
function balanceDelta(type: string, amount: number): number {
  if (type === "income")  return +amount;
  if (type === "expense") return -amount;
  return 0;
}

/** Resolves an ID to its source collection and updates balance accordingly */
async function applyBalanceDelta(sourceId: string, txnType: string, amount: number) {
  const delta = balanceDelta(txnType, amount);
  if (delta === 0) return "Account";

  // Try Card first
  const card = await Card.findById(sourceId).lean();
  if (card) {
    if (card.type === "debit_card" && card.parentId) {
      await Account.findByIdAndUpdate(card.parentId, { $inc: { balance: delta } });
    } else if (card.type === "credit_card") {
      await Card.findByIdAndUpdate(sourceId, { $inc: { balance: delta } });
    }
    return "Card";
  }

  // Try Wallet
  const wallet = await Wallet.findById(sourceId).lean();
  if (wallet) {
    await Wallet.findByIdAndUpdate(sourceId, { $inc: { balance: delta } });
    return "Wallet";
  }

  // Fall back to Account (savings / current / upi)
  const acct = await Account.findById(sourceId).lean();
  if (acct) {
    if (acct.type === "savings" || acct.type === "current" || acct.type === "wallet") {
      await Account.findByIdAndUpdate(sourceId, { $inc: { balance: delta } });
    } else if ((acct.type === "debit_card" || acct.type === "upi") && acct.parentId) {
      await Account.findByIdAndUpdate(acct.parentId, { $inc: { balance: delta } });
    } else if (acct.type === "credit_card") {
      await Account.findByIdAndUpdate(sourceId, { $inc: { balance: delta } });
    }
  }
  return "Account";
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

  let accountRef: "Account" | "Card" | "Wallet" = "Account";
  if (body.accountId) {
    accountRef = await applyBalanceDelta(body.accountId, body.type, body.amount) as typeof accountRef;
  }

  const txn = await Transaction.create({
    date:           new Date(body.date),
    amount:         body.amount,
    type:           body.type,
    category:       body.category,
    description:    body.description,
    platform:       body.platform       || undefined,
    accountId:      body.accountId      || undefined,
    accountRef,
    needsRepayment: body.needsRepayment ?? false,
  });

  return NextResponse.json(txn, { status: 201 });
}
