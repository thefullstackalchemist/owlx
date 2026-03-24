import { connectDB } from "@/lib/mongodb";
import { SavingsBucket } from "@/models/SavingsBucket";
import { Account } from "@/models/Account";
import type { BucketOperation } from "./chatService";

// ─── List buckets for AI context injection ────────────────────────────────────

export async function listBucketsForAI(): Promise<string> {
  await connectDB();
  const buckets = await SavingsBucket.find({ active: true }).lean();
  if (!buckets.length) return "";
  return buckets.map((b) => b.name).join(", ");
}

// ─── Execute a bucket operation (add / remove funds) ─────────────────────────

export interface BucketOpResult {
  ok:         boolean;
  bucketName: string;
  amount:     number;
  direction:  "add" | "remove";
  newBalance?: number;
  error?:     string;
}

export async function executeBucketOperation(op: BucketOperation): Promise<BucketOpResult> {
  await connectDB();

  // Fuzzy-match bucket by name (case-insensitive substring)
  const buckets = await SavingsBucket.find({ active: true }).lean();
  const match = buckets.find((b) =>
    b.name.toLowerCase().includes(op.bucketName.toLowerCase()) ||
    op.bucketName.toLowerCase().includes(b.name.toLowerCase())
  );

  if (!match) {
    return { ok: false, bucketName: op.bucketName, amount: op.amount, direction: op.direction,
      error: `No bucket found matching "${op.bucketName}"` };
  }

  const delta = op.direction === "add" ? op.amount : -op.amount;

  const updated = await Account.findByIdAndUpdate(
    match.accountId,
    { $inc: { balance: delta } },
    { new: true }
  ).lean();

  if (!updated) {
    return { ok: false, bucketName: match.name, amount: op.amount, direction: op.direction,
      error: "Linked account not found" };
  }

  return {
    ok:         true,
    bucketName: match.name,
    amount:     op.amount,
    direction:  op.direction,
    newBalance: updated.balance ?? 0,
  };
}
