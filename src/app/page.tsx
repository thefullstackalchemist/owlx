"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import NewTransactionModal from "@/components/transactions/NewTransactionModal";
import NewRecurringModal from "@/components/transactions/NewRecurringModal";
import type { NewTransactionData } from "@/services/chatService";

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

const stats = [
  { label: "Net Worth",    value: "₹0", change: null, description: "all time",   color: "text-slate-800"  },
  { label: "Income",       value: "₹0", change: null, description: "this month", color: "text-green-600"  },
  { label: "Expenses",     value: "₹0", change: null, description: "this month", color: "text-rose-500"   },
  { label: "Savings Rate", value: "—",  change: null, description: "this month", color: "text-blue-500"   },
];

function StatCard({ label, value, change, color, description }: {
  label: string; value: string; change: number | null; color: string; description: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
      <p className={`font-mono text-2xl font-semibold tabular ${color}`}>{value}</p>
      <div className="mt-2 flex items-center gap-1.5">
        {change === null ? (
          <Minus size={11} className="text-slate-300" />
        ) : change >= 0 ? (
          <TrendingUp size={11} className="text-green-500" />
        ) : (
          <TrendingDown size={11} className="text-rose-500" />
        )}
        <p className="text-[11px] text-slate-400">{description}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [showTxnModal,       setShowTxnModal]       = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  const handleSave = async (data: NewTransactionData) => {
    await fetch("/api/transactions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    setShowTxnModal(false);
  };

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

      {/* Tip */}
      <div className="glass-card rounded-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">Tip</p>
          <p className="text-sm text-slate-600">
            Try asking Owl:{" "}
            <span className="font-medium text-slate-800">&ldquo;Add ₹200 Swiggy spend today&rdquo;</span>
            {" "}or{" "}
            <span className="font-medium text-slate-800">&ldquo;How are my spends this month?&rdquo;</span>
          </p>
        </div>
        <ArrowRight size={16} className="text-slate-300 shrink-0 ml-4" />
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Recent Transactions</h2>
          <Link href="/transactions" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors">
            View all <ArrowRight size={11} />
          </Link>
        </div>
        <div className="glass-card rounded-2xl py-14 flex flex-col items-center justify-center text-center">
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
