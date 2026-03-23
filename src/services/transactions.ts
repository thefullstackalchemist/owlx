import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";

export interface TransactionFilters {
  period?: "this_month" | "last_month" | "this_year" | "last_7_days" | "all" | null;
  category?: string | null;
  type?: "income" | "expense" | "transfer" | null;
}

export function getPeriodRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  switch (period) {
    case "today":
      return { start: new Date(y, m, d, 0, 0, 0, 0), end: new Date(y, m, d, 23, 59, 59, 999) };
    case "this_week": {
      const day   = now.getDay();
      const start = new Date(y, m, d - day, 0, 0, 0, 0);
      const end   = new Date(y, m, d - day + 6, 23, 59, 59, 999);
      return { start, end };
    }
    case "this_month":
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59, 999) };
    case "last_month":
      return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59, 999) };
    case "this_year":
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59, 999) };
    case "last_7_days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    }
    default:
      return { start: new Date(0), end: new Date() };
  }
}

export async function queryTransactions(filters: TransactionFilters) {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (filters.period && filters.period !== "all") {
    const { start, end } = getPeriodRange(filters.period);
    query.date = { $gte: start, $lte: end };
  }

  if (filters.category) {
    query.category = { $regex: filters.category, $options: "i" };
  }

  if (filters.type) {
    query.type = filters.type;
  }

  const txns = await Transaction.find(query).sort({ date: -1 }).limit(100).lean();
  return txns;
}

export function formatTransactionsForAI(txns: Awaited<ReturnType<typeof queryTransactions>>) {
  if (!txns.length) return "No transactions found for this query.";

  const total = txns.reduce((sum, t) => sum + t.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const t of txns) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }

  const categoryBreakdown = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => `  ${cat}: ₹${amt.toLocaleString("en-IN")}`)
    .join("\n");

  const lines = txns
    .slice(0, 15)
    .map((t) => `${new Date(t.date).toLocaleDateString("en-IN")} | ${t.type} | ${t.category} | ${t.description} | ₹${t.amount}`)
    .join("\n");

  return `Found ${txns.length} transaction(s). Total: ₹${total.toLocaleString("en-IN")}

Category breakdown:
${categoryBreakdown}

Recent entries:
${lines}`;
}
