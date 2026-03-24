import { connectDB } from "@/lib/mongodb";
import { Wallet } from "@/models/Wallet";

export interface WalletData {
  name:     string;
  balance?: number;
  color?:   string;
}

export async function listWallets() {
  await connectDB();
  return Wallet.find({ active: true }).sort({ createdAt: 1 }).lean();
}

export async function createWallet(data: WalletData) {
  await connectDB();
  return Wallet.create({
    name:    data.name,
    balance: data.balance ?? 0,
    color:   data.color ?? "#f59e0b",
  });
}

export async function updateWallet(id: string, data: Partial<WalletData>) {
  await connectDB();
  return Wallet.findByIdAndUpdate(id, { $set: data }, { new: true });
}

export async function deleteWallet(id: string) {
  await connectDB();
  return Wallet.findByIdAndUpdate(id, { $set: { active: false } });
}
