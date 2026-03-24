import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Account } from "@/models/Account";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  // Fetch before deleting so we can reverse the balance effect
  const txn = await Transaction.findById(id).lean();

  if (txn) {
    await Transaction.findByIdAndDelete(id);

    if (txn.accountId) {
      let reverseDelta = 0;
      if (txn.type === "income")  reverseDelta = -txn.amount;
      if (txn.type === "expense") reverseDelta = +txn.amount;
      if (reverseDelta !== 0) {
        await Account.findByIdAndUpdate(txn.accountId, { $inc: { balance: reverseDelta } });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
