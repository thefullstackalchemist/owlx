import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Account } from "@/models/Account";
import { Card } from "@/models/Card";
import { Wallet } from "@/models/Wallet";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const body = await req.json();
  const allowed = ["description", "category", "type", "amount", "date", "platform", "needsRepayment", "needsReview"];
  const update: Record<string, unknown> = {};

  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const txn = await Transaction.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(txn);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const txn = await Transaction.findById(id).lean();

  if (txn) {
    await Transaction.findByIdAndDelete(id);

    if (txn.accountId) {
      let reverseDelta = 0;
      if (txn.type === "income")  reverseDelta = -txn.amount;
      if (txn.type === "expense") reverseDelta = +txn.amount;

      if (reverseDelta !== 0) {
        const sourceId  = txn.accountId.toString();
        const accountRef = (txn as { accountRef?: string }).accountRef ?? "Account";

        if (accountRef === "Card") {
          const card = await Card.findById(sourceId).lean();
          if (card) {
            if (card.type === "debit_card" && card.parentId) {
              await Account.findByIdAndUpdate(card.parentId, { $inc: { balance: reverseDelta } });
            } else if (card.type === "credit_card") {
              await Card.findByIdAndUpdate(sourceId, { $inc: { balance: reverseDelta } });
            }
          }
        } else if (accountRef === "Wallet") {
          await Wallet.findByIdAndUpdate(sourceId, { $inc: { balance: reverseDelta } });
        } else {
          // Account (savings / current / upi / legacy)
          const acct = await Account.findById(sourceId).lean();
          if (acct) {
            if (acct.type === "savings" || acct.type === "current" || acct.type === "wallet") {
              await Account.findByIdAndUpdate(sourceId, { $inc: { balance: reverseDelta } });
            } else if ((acct.type === "debit_card" || acct.type === "upi") && acct.parentId) {
              await Account.findByIdAndUpdate(acct.parentId, { $inc: { balance: reverseDelta } });
            } else if (acct.type === "credit_card") {
              await Account.findByIdAndUpdate(sourceId, { $inc: { balance: reverseDelta } });
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
