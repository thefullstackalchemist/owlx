import { connectDB } from "@/lib/mongodb";
import { RecurringTransaction, type Frequency } from "@/models/RecurringTransaction";
import { Transaction } from "@/models/Transaction";
import type { TransactionCategory } from "@/constants";

export interface RecurringData {
  amount:      number;
  type:        "income" | "expense" | "transfer";
  category:    TransactionCategory;
  description: string;
  platform?:   string;
  frequency:   Frequency;
  nextDue:     string; // ISO date string
}

function advanceDate(date: Date, frequency: Frequency): Date {
  const d = new Date(date);
  switch (frequency) {
    case "daily":   d.setDate(d.getDate() + 1);       break;
    case "weekly":  d.setDate(d.getDate() + 7);       break;
    case "monthly": d.setMonth(d.getMonth() + 1);     break;
    case "yearly":  d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

export async function listRecurring() {
  await connectDB();
  return RecurringTransaction.find().sort({ nextDue: 1 }).lean();
}

export async function createRecurring(data: RecurringData) {
  await connectDB();
  return RecurringTransaction.create({
    ...data,
    nextDue: new Date(data.nextDue),
  });
}

export async function updateRecurring(id: string, data: Partial<RecurringData>) {
  await connectDB();
  const update: Record<string, unknown> = { ...data };
  if (data.nextDue) update.nextDue = new Date(data.nextDue);
  return RecurringTransaction.findByIdAndUpdate(id, { $set: update }, { new: true });
}

export async function deleteRecurring(id: string) {
  await connectDB();
  return RecurringTransaction.findByIdAndDelete(id);
}

export async function runRecurring(id: string) {
  await connectDB();
  const rec = await RecurringTransaction.findById(id);
  if (!rec) throw new Error("Recurring transaction not found");

  const transaction = await Transaction.create({
    date:        rec.nextDue,
    amount:      rec.amount,
    type:        rec.type,
    category:    rec.category,
    description: rec.description,
    platform:    rec.platform,
  });

  rec.nextDue = advanceDate(rec.nextDue, rec.frequency);
  await rec.save();

  return { transaction, nextDue: rec.nextDue };
}
