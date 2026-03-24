import { connectDB } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import type { AccountType } from "@/models/Account";

export interface AccountData {
  name:      string;
  bank:      string;
  type:      AccountType;
  lastFour?: string;
  color?:    string;
}

const CREDIT_TYPES: AccountType[] = ["credit_card"];

export async function listAccounts() {
  await connectDB();
  return Account.find({ active: true }).sort({ createdAt: 1 }).lean();
}

export async function createAccount(data: AccountData) {
  await connectDB();
  return Account.create({
    ...data,
    isCredit: CREDIT_TYPES.includes(data.type),
    color:    data.color ?? defaultColor(data.type),
  });
}

export async function updateAccount(id: string, data: Partial<AccountData>) {
  await connectDB();
  const update: Record<string, unknown> = { ...data };
  if (data.type) update.isCredit = CREDIT_TYPES.includes(data.type);
  return Account.findByIdAndUpdate(id, { $set: update }, { new: true });
}

export async function deleteAccount(id: string) {
  await connectDB();
  return Account.findByIdAndUpdate(id, { $set: { active: false } });
}

function defaultColor(type: AccountType): string {
  const map: Record<AccountType, string> = {
    savings:     "#6366f1",
    current:     "#0ea5e9",
    credit_card: "#f43f5e",
    debit_card:  "#10b981",
    wallet:      "#f59e0b",
    upi:         "#8b5cf6",
  };
  return map[type] ?? "#6366f1";
}
