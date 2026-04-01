"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { cn } from "@/utils/cn";
import NewTransactionModal from "@/components/transactions/NewTransactionModal";
import NewRecurringModal from "@/components/transactions/NewRecurringModal";
import type { NewTransactionData } from "@/services/chatService";
import { CATEGORY_META, CURRENCY } from "@/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  income:                number;
  expenses:              number;
  netWorth:              number;
  savingsRate:           number | null;
  categoryBreakdown:     { name: string; value: number }[];
  recentTransactions:    {
    _id: string; amount: number; type: string; category: string;
    description: string; date: string; platform?: string;
  }[];
  accountExpenseSeries:  Record<string, string | number>[];
  accountNames:          string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}

// ─── Palettes ─────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b",
  "#f43f5e", "#8b5cf6",
];

// Visually distinguishable palette for overlapping areas
const AREA_COLORS = [
  "#6366f1", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#fb923c", // orange
];

// ─── Account expense area chart ───────────────────────────────────────────────

function AccountExpenseChart({
  series,
  accountNames,
}: {
  series:       Record<string, string | number>[];
  accountNames: string[];
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggle = (name: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  if (!series.length || !accountNames.length) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-slate-400">
        No account expense data this month
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Legend — click to toggle */}
      <div className="flex flex-wrap gap-2">
        {accountNames.map((name, i) => {
          const color  = AREA_COLORS[i % AREA_COLORS.length];
          const active = !hidden.has(name);
          return (
            <button
              key={name}
              onClick={() => toggle(name)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                active
                  ? "border-transparent text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-400"
              )}
              style={active ? { background: color } : {}}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: active ? "rgba(255,255,255,0.6)" : color }}
              />
              {name}
            </button>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {accountNames.map((name, i) => {
              const color = AREA_COLORS[i % AREA_COLORS.length];
              return (
                <linearGradient key={name} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
            width={42}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(255,255,255,0.96)",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: "12px",
              fontSize: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
            formatter={(value, name) => [`${CURRENCY}${Number(value).toLocaleString("en-IN")}`, String(name ?? "")]}
            labelStyle={{ fontWeight: 600, color: "#1e293b", marginBottom: 4 }}
          />
          {accountNames.map((name, i) => {
            if (hidden.has(name)) return null;
            const color = AREA_COLORS[i % AREA_COLORS.length];
            return (
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${i})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: color }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, description, trend }: {
  label: string; value: string; color: string; description: string;
  trend?: "up" | "down" | null;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
      <p className={`font-mono text-2xl font-semibold tabular ${color}`}>{value}</p>
      <div className="mt-2 flex items-center gap-1.5">
        {trend === "up"   && <TrendingUp   size={11} className="text-green-500" />}
        {trend === "down" && <TrendingDown size={11} className="text-rose-500" />}
        {(trend === null || trend === undefined) && <Minus size={11} className="text-slate-300" />}
        <p className="text-[11px] text-slate-400">{description}</p>
      </div>
    </div>
  );
}

// ─── Category chart ───────────────────────────────────────────────────────────

function CategoryChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-slate-400">
        No expense data this month
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${CURRENCY}${fmt(Number(value))}`, ""]}
          contentStyle={{
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: "12px",
            fontSize: "12px",
          }}
        />
        <Legend
          formatter={(value) => {
            const item = data.find((d) => d.name === value);
            const pct  = item ? Math.round((item.value / total) * 100) : 0;
            return (
              <span className="text-[11px] text-slate-600">
                {CATEGORY_META[value]?.emoji ?? "•"} {value} ({pct}%)
              </span>
            );
          }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Recent transaction row ───────────────────────────────────────────────────

function TxnRow({ txn }: { txn: DashboardData["recentTransactions"][0] }) {
  const isIncome  = txn.type === "income";
  const emoji     = CATEGORY_META[txn.category]?.emoji ?? "📦";
  const dateStr   = new Date(txn.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-black/[0.04] last:border-0">
      <div className="w-8 h-8 rounded-xl bg-slate-50 border border-black/[0.06] flex items-center justify-center text-base shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-700 truncate">{txn.description}</p>
        <p className="text-[10px] text-slate-400">{txn.category} · {dateStr}</p>
      </div>
      <p className={cn("text-sm font-mono font-semibold tabular shrink-0",
        isIncome ? "text-emerald-600" : "text-rose-500"
      )}>
        {isIncome ? "+" : "−"}{CURRENCY}{fmt(txn.amount)}
      </p>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [data,               setData]               = useState<DashboardData | null>(null);
  const [showTxnModal,       setShowTxnModal]       = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  const loadDashboard = useCallback(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d: DashboardData) => setData(d))
      .catch(() => {});
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Refresh when a transaction is added (from chat or modal)
  useEffect(() => {
    window.addEventListener("owl:transaction:created", loadDashboard);
    return () => window.removeEventListener("owl:transaction:created", loadDashboard);
  }, [loadDashboard]);

  const handleSave = async (d: NewTransactionData) => {
    await fetch("/api/transactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    setShowTxnModal(false);
    loadDashboard();
    window.dispatchEvent(new CustomEvent("owl:transaction:created"));
  };

  const income      = data?.income      ?? 0;
  const expenses    = data?.expenses    ?? 0;
  const netWorth    = data?.netWorth    ?? 0;
  const savingsRate = data?.savingsRate ?? null;

  const stats = [
    {
      label: "Net Worth",
      value: `${CURRENCY}${fmt(netWorth)}`,
      color: "text-slate-800",
      description: "account balances",
      trend: null as "up" | "down" | null,
    },
    {
      label: "Income",
      value: `${CURRENCY}${fmt(income)}`,
      color: "text-emerald-600",
      description: "this month",
      trend: null as "up" | "down" | null,
    },
    {
      label: "Expenses",
      value: `${CURRENCY}${fmt(expenses)}`,
      color: "text-rose-500",
      description: "this month",
      trend: null as "up" | "down" | null,
    },
    {
      label: "Savings Rate",
      value: savingsRate !== null ? `${savingsRate}%` : "—",
      color: savingsRate !== null && savingsRate >= 20 ? "text-emerald-600" : "text-blue-500",
      description: "this month",
      trend: null as "up" | "down" | null,
    },
  ];

  return (
    <div className="flex flex-col gap-8 p-8 w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1.5 tracking-wide">{formatDate()}</p>
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-800">
            {greeting()} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">Here&apos;s your wealth snapshot</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRecurringModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-100 transition-colors"
          >
            <Plus size={13} strokeWidth={2.5} />
            New Recurring
          </button>
          <button
            onClick={() => setShowTxnModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-600 hover:shadow-md"
          >
            <Plus size={13} strokeWidth={2.5} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-5 gap-6">
        {/* Category pie */}
        <div className="col-span-2 glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Expenses by category
          </p>
          <CategoryChart data={data?.categoryBreakdown ?? []} />
        </div>

        {/* Recent transactions */}
        <div className="col-span-3 glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recent Transactions
            </p>
            <Link href="/transactions" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {!data || data.recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-3xl mb-3">🦉</p>
              <p className="text-sm font-medium text-slate-600">No transactions yet</p>
              <p className="text-xs text-slate-400 mt-1">Start tracking to see them here</p>
              <button
                onClick={() => setShowTxnModal(true)}
                className="mt-4 text-xs text-blue-500 hover:underline flex items-center gap-1"
              >
                Add first transaction <ArrowRight size={11} />
              </button>
            </div>
          ) : (
            <div>
              {data.recentTransactions.map((t) => <TxnRow key={t._id} txn={t} />)}
            </div>
          )}
        </div>
      </div>

      {/* Account expense area chart */}
      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Expenses by account —{" "}
          {new Date().toLocaleDateString("en-IN", { month: "long" })} MTD
        </p>
        <AccountExpenseChart
          series={data?.accountExpenseSeries ?? []}
          accountNames={data?.accountNames ?? []}
        />
      </div>

      {showTxnModal && (
        <NewTransactionModal
          onClose={() => setShowTxnModal(false)}
          onSave={handleSave}
        />
      )}

      {showRecurringModal && (
        <NewRecurringModal
          onClose={() => setShowRecurringModal(false)}
          onSave={() => {}}
        />
      )}
    </div>
  );
}
