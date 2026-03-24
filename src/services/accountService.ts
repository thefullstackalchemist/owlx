import { connectDB } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import { Card } from "@/models/Card";
import type { AccountType, CardNetwork, UpiApp } from "@/models/Account";

export interface AccountData {
  name:         string;
  bank:         string;
  type:         AccountType;
  parentId?:    string;
  lastFour?:    string;
  network?:     CardNetwork;
  upiId?:       string;
  upiApp?:      UpiApp;
  balance?:     number;
  creditLimit?: number;
  color?:       string;
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
    parentId: data.parentId ?? undefined,
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
  // Soft-delete linked UPI handles (in accounts collection) and cards (in cards collection)
  await Promise.all([
    Account.updateMany({ parentId: id }, { $set: { active: false } }),
    Card.updateMany({ parentId: id }, { $set: { active: false } }),
  ]);
  return Account.findByIdAndUpdate(id, { $set: { active: false } });
}

export function defaultColor(type: AccountType): string {
  const map: Record<AccountType, string> = {
    savings:     "#6366f1",
    current:     "#0ea5e9",
    credit_card: "#f43f5e",
    debit_card:  "#10b981",
    upi:         "#8b5cf6",
    wallet:      "#f59e0b",
  };
  return map[type] ?? "#6366f1";
}
