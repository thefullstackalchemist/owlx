import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Account } from "@/models/Account";
import mongoose from "mongoose";

// ─── GET /api/dashboard ───────────────────────────────────────────────────────

export async function GET() {
  await connectDB();

  const now = new Date();
  // All date boundaries in UTC so they align with how "YYYY-MM-DD" strings
  // are stored (new Date("2026-03-24") → midnight UTC).
  const utcY = now.getUTCFullYear();
  const utcM = now.getUTCMonth();
  const utcD = now.getUTCDate();

  const monthStart = new Date(Date.UTC(utcY, utcM, 1));
  const monthEnd   = new Date(Date.UTC(utcY, utcM, utcD, 23, 59, 59, 999)); // end of today

  const [monthlyAgg, netWorthAgg, recent, accountExpenseAgg] = await Promise.all([
    // ── Monthly totals + category breakdown ────────────────────────────────
    Transaction.aggregate([
      { $match: { date: { $gte: monthStart, $lte: monthEnd } } },
      {
        $group: {
          _id:        "$type",
          total:      { $sum: "$amount" },
          byCategory: { $push: { category: "$category", amount: "$amount" } },
        },
      },
    ]),

    // ── Net worth ──────────────────────────────────────────────────────────
    Account.aggregate([
      { $match: { active: true } },
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ]),

    // ── Last 5 transactions ────────────────────────────────────────────────
    Transaction.find().sort({ date: -1 }).limit(5).lean(),

    // ── Daily expenses per account (MTD) ───────────────────────────────────
    Transaction.aggregate([
      {
        $match: {
          type:      "expense",
          date:      { $gte: monthStart, $lte: monthEnd },
          accountId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            day:       { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            accountId: "$accountId",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]),
  ]);

  // ── Monthly stats ──────────────────────────────────────────────────────────
  let income   = 0;
  let expenses = 0;
  const categoryMap: Record<string, number> = {};

  for (const row of monthlyAgg) {
    if (row._id === "income")  income   = row.total;
    if (row._id === "expense") expenses = row.total;
    if (row._id === "expense") {
      for (const e of row.byCategory as { category: string; amount: number }[]) {
        categoryMap[e.category] = (categoryMap[e.category] ?? 0) + e.amount;
      }
    }
  }

  const netWorth    = netWorthAgg[0]?.total ?? 0;
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : null;

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // ── Build area chart series ────────────────────────────────────────────────
  // Collect unique account IDs from the aggregation result
  const accountIdSet = new Set<string>(
    accountExpenseAgg.map((r: { _id: { accountId: mongoose.Types.ObjectId } }) =>
      r._id.accountId.toString()
    )
  );

  // Fetch account display labels (name + last four if present)
  const accountDocs = await Account.find(
    { _id: { $in: Array.from(accountIdSet) } },
    { name: 1, lastFour: 1, type: 1 }
  ).lean();

  const accountLabel = (doc: { name: string; lastFour?: string }) =>
    doc.lastFour ? `${doc.name} ···· ${doc.lastFour}` : doc.name;

  const idToLabel: Record<string, string> = {};
  for (const doc of accountDocs) {
    idToLabel[doc._id.toString()] = accountLabel(doc);
  }

  // Generate every UTC date in the MTD window as "YYYY-MM-DD" strings.
  // Step in whole UTC days (86400 s) so there's no local-timezone drift.
  const allDays: string[] = [];
  for (
    let ms = monthStart.getTime();
    ms <= monthEnd.getTime();
    ms += 86_400_000
  ) {
    allDays.push(new Date(ms).toISOString().split("T")[0]); // always UTC "YYYY-MM-DD"
  }

  // Build a lookup: UTC-day-string → accountLabel → amount
  const dayAccountMap: Record<string, Record<string, number>> = {};
  for (const row of accountExpenseAgg as { _id: { day: string; accountId: mongoose.Types.ObjectId }; total: number }[]) {
    const day   = row._id.day; // already UTC YYYY-MM-DD from $dateToString
    const label = idToLabel[row._id.accountId.toString()];
    if (!label) continue;
    if (!dayAccountMap[day]) dayAccountMap[day] = {};
    dayAccountMap[day][label] = (dayAccountMap[day][label] ?? 0) + row.total;
  }

  const accountNames = Object.values(idToLabel);

  const accountExpenseSeries = allDays.map((day) => {
    // Parse as UTC (append Z) so display label matches the stored UTC date
    const displayDate = new Date(day + "T00:00:00Z").toLocaleDateString("en-IN", {
      day: "numeric",
    });
    const entry: Record<string, string | number> = { date: displayDate };
    for (const label of accountNames) {
      entry[label] = dayAccountMap[day]?.[label] ?? 0;
    }
    return entry;
  });

  return NextResponse.json({
    income,
    expenses,
    netWorth,
    savingsRate,
    categoryBreakdown,
    recentTransactions: recent,
    accountExpenseSeries,
    accountNames,
  });
}
